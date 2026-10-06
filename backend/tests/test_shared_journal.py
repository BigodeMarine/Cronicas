"""Exercise the shared journal with isolated storage and real authentication."""
import os
os.environ.setdefault('DATABASE_URL', 'sqlite://')
os.environ.setdefault('JWT_SECRET_KEY', 'test-only-key-for-isolated-journal-suite')

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database.base import Base
from app.database.session import get_db


@pytest.fixture
def api():
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    @event.listens_for(engine, 'connect')
    def foreign_keys(connection, _):
        connection.execute('PRAGMA foreign_keys=ON')
    Base.metadata.create_all(engine)
    def database():
        with Session(engine) as db:
            yield db
    app.dependency_overrides[get_db] = database
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    engine.dispose()


def account(api, name):
    email = f'{name}@example.com'
    r = api.post('/auth/register', json={'name': name, 'email': email, 'password': 'A-test-password-123'})
    assert r.status_code == 201, r.text
    uid = r.json()['id']
    r = api.post('/auth/login', data={'username': email, 'password': 'A-test-password-123'})
    assert r.status_code == 200
    return uid, {'Authorization': f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def table(api):
    master_id, master = account(api, 'mestre')
    player_id, player = account(api, 'jogador')
    _, outsider = account(api, 'estranho')
    r = api.post('/campaigns', headers=master, json={'name': 'As Ruínas', 'system': 'Tormenta20'})
    assert r.status_code == 201
    cid = r.json()['id']
    return cid, master_id, master, player_id, player, outsider


def test_membership_and_master_permissions(api, table):
    cid, mid, master, pid, player, outsider = table
    base = f'/campaigns/{cid}'
    assert api.get(base).status_code == 401
    assert api.get(base, headers=player).status_code == 404
    assert api.post(base+'/participants', headers=master, json={'email': 'jogador@example.com'}).status_code == 201
    assert api.post(base+'/participants', headers=master, json={'email': 'jogador@example.com'}).status_code == 409
    assert api.get('/campaigns', headers=player).json()[0]['id'] == cid
    assert api.get(base, headers=player).status_code == 200
    people = api.get(base+'/participants', headers=player).json()
    assert {p['user_id'] for p in people} == {mid, pid}
    assert api.put(base, headers=player, json={'name': 'Invadida'}).status_code == 403
    assert api.delete(base, headers=player).status_code == 403
    assert api.post(base+'/participants', headers=player, json={'email': 'estranho@example.com'}).status_code == 403
    for path in ('', '/entries', '/sessions', '/participants'):
        assert api.get(base+path, headers=outsider).status_code == 404
    assert api.delete(base+f'/participants/{mid}', headers=master).status_code == 400
    assert api.delete(base+f'/participants/{pid}', headers=master).status_code == 204
    assert api.get(base, headers=player).status_code == 404
    assert api.get('/campaigns', headers=player).json() == []


def test_shared_entries_and_moderation(api, table):
    cid, _, master, pid, player, outsider = table
    base = f'/campaigns/{cid}'
    api.post(base+'/participants', headers=master, json={'email': 'jogador@example.com'})
    r = api.post(base+'/sessions', headers=master, json={'title': 'A chegada', 'played_on': '2026-10-06', 'summary': 'Um encontro na taverna.'})
    assert r.status_code == 201
    sid = r.json()['id']
    assert api.post(base+'/sessions', headers=player, json={'title': 'Teste', 'played_on': '2026-10-06'}).status_code == 403
    r = api.post(base+'/entries', headers=player, json={'title': 'Minha visão', 'content': 'Encontrei uma pista.', 'session_id': sid})
    assert r.status_code == 201, r.text
    entry = r.json()
    assert entry['created_at'] == entry['updated_at']
    assert entry['author_id'] == pid and entry['author_name'] == 'jogador'
    assert api.get(base+'/entries', headers=master).json()[0]['content'] == 'Encontrei uma pista.'
    r = api.post(base+'/entries', headers=master, json={'title': 'Visão do mestre', 'content': 'O mundo mudou.'})
    master_entry = r.json()['id']
    assert api.put(base+f'/entries/{master_entry}', headers=player, json={'title': 'Alterado', 'content': 'Não autorizado'}).status_code == 403
    assert api.delete(base+f'/entries/{master_entry}', headers=player).status_code == 403
    assert api.put(base+f"/entries/{entry['id']}", headers=player, json={'title': 'Minha visão revisada', 'content': 'Pista secreta.', 'session_id': sid}).status_code == 200
    assert api.delete(base+f"/entries/{entry['id']}", headers=outsider).status_code == 404
    assert api.delete(base+f"/entries/{entry['id']}", headers=master).status_code == 204


def test_session_is_scoped_to_campaign_and_removed_players_lose_access(api, table):
    cid, _, master, pid, player, _ = table
    base = f'/campaigns/{cid}'
    api.post(base+'/participants', headers=master, json={'email': 'jogador@example.com'})
    other = api.post('/campaigns', headers=master, json={'name': 'Outra mesa'}).json()['id']
    sid = api.post(f'/campaigns/{other}/sessions', headers=master, json={'title': 'Outra sessão', 'played_on': '2026-10-06'}).json()['id']
    assert api.post(base+'/entries', headers=player, json={'title': 'Relato', 'content': 'Texto', 'session_id': sid}).status_code == 404
    r = api.post(base+'/entries', headers=player, json={'title': 'Relato livre', 'content': 'Texto'})
    assert r.status_code == 201
    eid = r.json()['id']
    assert api.put(base+f'/entries/{eid}', headers=player, json={'title': 'Relato', 'content': 'Texto', 'session_id': sid}).status_code == 404
    assert api.post(base+'/entries', headers=player, json={'title': 'Relato', 'content': ''}).status_code == 422
    api.delete(base+f'/participants/{pid}', headers=master)
    assert api.get(base+'/entries', headers=player).status_code == 404
    assert api.put(base+f'/entries/{eid}', headers=player, json={'title': 'Relato', 'content': 'Texto'}).status_code == 404
    assert len(api.get(base+'/entries', headers=master).json()) == 1
    assert api.delete(base, headers=master).status_code == 204
    assert api.get(base+'/entries', headers=master).status_code == 404


def test_existing_projects_are_campaigns(api):
    _, master = account(api, 'mestre')
    old = api.post('/projects', headers=master, json={'name': 'Campanha antiga', 'description': 'Mantida'})
    assert old.status_code == 201
    campaigns = api.get('/campaigns', headers=master).json()
    assert campaigns[0]['id'] == old.json()['id']
    assert campaigns[0]['description'] == 'Mantida'
    assert campaigns[0]['system'] == ''


def test_registration_requires_only_email_and_password(api):
    payload = {'email': 'Aventureiro@example.com', 'password': 'A-test-password-123'}
    r = api.post('/auth/register', json=payload)
    assert r.status_code == 201, r.text
    assert r.json()['email'] == 'aventureiro@example.com'
    assert r.json()['name'] == 'Aventureiro'
    assert 'password' not in r.json() and 'password_hash' not in r.json()
    assert api.post('/auth/register', json=payload).status_code == 409
    assert api.post('/auth/register', json={'email': 'short@example.com', 'password': '123'}).status_code == 422
    assert api.post('/auth/login', data={'username': payload['email'], 'password': 'incorrect'}).status_code == 401
    r = api.post('/auth/login', data={'username': payload['email'], 'password': payload['password']})
    assert r.status_code == 200 and r.json()['access_token']
