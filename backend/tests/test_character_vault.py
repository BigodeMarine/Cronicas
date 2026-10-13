"""Isolamento, anexos e fluxos do cofre com autenticação real e arquivos temporários."""
import os
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET_KEY", "test-only-key-for-isolated-journal-suite")

from io import BytesIO
import pytest
from PIL import Image
from pypdf import PdfWriter
from sqlalchemy import event
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.character import CharacterFile
from test_shared_journal import api, table


def image(fmt="PNG", color="green"):
    output = BytesIO()
    Image.new("RGB", (16, 16), color).save(output, format=fmt)
    return output.getvalue()


def pdf():
    output = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.write(output)
    return output.getvalue()


@pytest.fixture
def vault(api, table, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "character_storage_dir", tmp_path / "private")
    cid, _, master, pid, player, outsider = table
    api.post(f'/campaigns/{cid}/participants', headers=master, json={'email': 'jogador@example.com'})
    r = api.post('/characters', headers=player, json={'name': 'Lyra', 'system': 'Tormenta20'})
    assert r.status_code == 201, r.text
    char = r.json()['id']
    r = api.post(f'/characters/{char}/participations', headers=player, json={'project_id': cid})
    assert r.status_code == 201, r.text
    return {'char': char, 'base': f'/characters/{char}', 'part': r.json()['id'], 'campaign': cid, 'player': player, 'master': master, 'outsider': outsider, 'dir': tmp_path / 'private'}


def files(v):
    return list(v['dir'].iterdir()) if v['dir'].exists() else []


def test_character_crud_search_pagination_and_owner(api, vault):
    v = vault
    base, player = v['base'], v['player']
    assert api.get('/characters').status_code == 401
    for h in (v['master'], v['outsider']):
        assert api.get(base, headers=h).status_code == 404
        assert api.put(base, headers=h, json={'name': 'Roubo'}).status_code == 404
        assert api.delete(base, headers=h).status_code == 404
        assert api.get('/characters', headers=h).json()['total'] == 0
    assert api.post('/characters', headers=player, json={'name': '   '}).status_code == 422
    assert api.post('/characters', headers=player, json={'name': 'Teste', 'user_id': 999}).status_code == 422
    assert api.put(base, headers=player, json={'name': 'Lyra nova', 'system': 'D&D', 'status': 'retired', 'history': 'Uma história.'}).status_code == 200
    assert api.get('/characters?status=retired&system=D%26D&q=LYRA', headers=player).json()['total'] == 1
    assert api.get('/characters?q=ausente', headers=player).json()['total'] == 0
    assert api.get('/characters/systems', headers=player).json() == ['D&D']
    api.post('/characters', headers=player, json={'name': 'Segunda'})
    r = api.get('/characters?limit=1&offset=1', headers=player).json()
    assert r['total'] == 2 and len(r['items']) == 1 and r['offset'] == 1
    assert api.get('/characters?limit=101', headers=player).status_code == 422
    assert api.delete(base, headers=player).status_code == 204
    assert api.get(base, headers=player).status_code == 404


def test_links_require_owner_and_current_campaign_access(api, vault):
    v = vault
    base = v['base']
    path = base+f"/participations/{v['part']}"
    assert api.post(base+'/participations', headers=v['player'], json={'project_id': v['campaign']}).status_code == 409
    for h in (v['master'], v['outsider']):
        assert api.get(path, headers=h).status_code == 404
        assert api.post(base+'/participations', headers=h, json={'project_id': v['campaign']}).status_code == 404
    private = api.post('/campaigns', headers=v['outsider'], json={'name': 'Privada'}).json()['id']
    assert api.post(base+'/participations', headers=v['player'], json={'project_id': private}).status_code == 404
    for url in ('javascript:alert(1)', 'data:text/html,teste', 'file:///tmp/test', 'https://user:pass@example.com'):
        assert api.put(path, headers=v['player'], json={'external_url': url}).status_code == 422
    assert api.put(path, headers=v['player'], json={'external_url': 'https://example.com/ficha'}).json()['external_url'] == 'https://example.com/ficha'
    # O ID do jogador varia; encontre-o através da conta autenticada.
    uid = api.get('/auth/me', headers=v['player']).json()['id']
    api.delete(f"/campaigns/{v['campaign']}/participants/{uid}", headers=v['master'])
    assert api.get(path, headers=v['player']).status_code == 404
    assert api.get(base+'/participations', headers=v['player']).json()['items'] == []
    assert api.get(base, headers=v['player']).status_code == 200


def test_notes_are_private_and_sessions_are_scoped(api, vault):
    v = vault
    path = v['base']+f"/participations/{v['part']}/notes"
    sid = api.post(f"/campaigns/{v['campaign']}/sessions", headers=v['master'], json={'title': 'Sessão um', 'played_on': '2026-10-13'}).json()['id']
    note = api.post(path, headers=v['player'], json={'title': 'Segredo', 'content': 'Só eu posso ler.', 'session_id': sid}).json()
    assert note['content'] == 'Só eu posso ler.'
    nid = note['id']
    for h in (v['master'], v['outsider']):
        assert api.get(path, headers=h).status_code == 404
        assert api.get(path+f'/{nid}', headers=h).status_code == 404
        assert api.put(path+f'/{nid}', headers=h, json={'title': 'Roubo', 'content': 'X'}).status_code == 404
        assert api.delete(path+f'/{nid}', headers=h).status_code == 404
    other = api.post('/campaigns', headers=v['player'], json={'name': 'Outra'}).json()['id']
    other_sid = api.post(f'/campaigns/{other}/sessions', headers=v['player'], json={'title': 'Outra sessão', 'played_on': '2026-10-13'}).json()['id']
    assert api.post(path, headers=v['player'], json={'title': 'Erro', 'content': 'Texto', 'session_id': other_sid}).status_code == 422
    assert api.put(path+f'/{nid}', headers=v['player'], json={'title': 'Novo', 'content': 'Privado', 'session_date': '2026-10-13'}).status_code == 200
    assert api.get(path+'?limit=1', headers=v['player']).json()['total'] == 1
    assert api.delete(path+f'/{nid}', headers=v['player']).status_code == 204
    assert api.get(path, headers=v['player']).json()['total'] == 0


def test_general_and_campaign_sheets_are_independent_and_private(api, vault):
    v = vault
    other = api.post('/campaigns', headers=v['player'], json={'name': 'Segunda campanha'}).json()['id']
    part2 = api.post(v['base']+'/participations', headers=v['player'], json={'project_id': other}).json()['id']
    paths = [v['base']+'/sheet', v['base']+f"/participations/{v['part']}/sheet", v['base']+f'/participations/{part2}/sheet']
    blobs = [pdf(), image(), image('JPEG')]
    filenames = [('geral.pdf', 'application/pdf'), ('mesa.png', 'image/png'), ('outra.jpeg', 'image/jpeg')]
    for path, data, (name, mime) in zip(paths, blobs, filenames):
        r = api.post(path, headers=v['player'], files={'file': (name, data, mime)})
        assert r.status_code == 200, r.text
        assert 'storage_key' not in r.json()
    assert len(files(v)) == 3
    for path, data in zip(paths, blobs):
        assert api.get(path, headers=v['player']).content == data
        for h in (v['master'], v['outsider']):
            assert api.get(path, headers=h).status_code == 404
            assert api.delete(path, headers=h).status_code == 404
            assert api.post(path, headers=h, files={'file': ('novo.pdf', pdf(), 'application/pdf')}).status_code == 404
        assert api.get(path).status_code == 401
    assert api.get(paths[0], headers=v['player']).headers['x-content-type-options'] == 'nosniff'
    previous = set(files(v))
    assert api.post(paths[0], headers=v['player'], files={'file': ('nova.png', image(color='red'), 'image/png')}).status_code == 200
    assert len(files(v)) == 3 and len(previous - set(files(v))) == 1
    assert api.get(paths[1], headers=v['player']).content == blobs[1]
    assert api.delete(v['base']+f'/participations/{part2}', headers=v['player']).status_code == 204
    assert len(files(v)) == 2
    assert api.delete(v['base'], headers=v['player']).status_code == 204
    assert files(v) == []


@pytest.mark.parametrize('filename,data,mime', [
    ('bad.svg', b'<svg/>', 'image/svg+xml'),
    ('bad.html', b'<html>abc</html>', 'text/html'),
    ('bad.exe', b'MZ123', 'application/octet-stream'),
    ('fake.png', b'<html>abc</html>', 'image/png'),
    ('fake.pdf', b'%PDF-1.7\nnot a real PDF', 'application/pdf'),
    ('wrong.jpg', image(), 'image/jpeg'),
    ('empty.pdf', b'', 'application/pdf'),
    ('../escape.png', image(), 'image/png'),
    ('mime.png', image(), 'text/html'),
])
def test_invalid_uploads_do_not_create_files(api, vault, filename, data, mime):
    r = api.post(vault['base']+'/sheet', headers=vault['player'], files={'file': (filename, data, mime)})
    assert r.status_code == 422, r.text
    assert files(vault) == []


def test_portrait_limits_replacement_and_revoked_access(api, vault):
    v = vault
    portrait = v['base']+'/portrait'
    assert api.post(portrait, headers=v['player'], files={'file': ('portrait.pdf', pdf(), 'application/pdf')}).status_code == 422
    assert api.post(portrait, headers=v['player'], files={'file': ('big.png', b'x'*(5*1024*1024+1), 'image/png')}).status_code == 413
    assert api.post(v['base']+'/sheet', headers=v['player'], files={'file': ('big.pdf', b'x'*(10*1024*1024+1), 'application/pdf')}).status_code == 413
    assert api.post(portrait, headers=v['player'], files={'file': ('portrait.png', image(), 'image/png')}).status_code == 200
    assert api.get(portrait, headers=v['player']).status_code == 200
    assert api.get(portrait, headers=v['master']).status_code == 404
    part_sheet = v['base']+f"/participations/{v['part']}/sheet"
    api.post(part_sheet, headers=v['player'], files={'file': ('mesa.pdf', pdf(), 'application/pdf')})
    uid = api.get('/auth/me', headers=v['player']).json()['id']
    api.delete(f"/campaigns/{v['campaign']}/participants/{uid}", headers=v['master'])
    assert api.get(part_sheet, headers=v['player']).status_code == 404
    assert api.delete(part_sheet, headers=v['player']).status_code == 404
    assert api.get(portrait, headers=v['player']).status_code == 200
    api.delete(v['base'], headers=v['player'])
    assert files(v) == []


def test_failed_transaction_cleans_new_upload_and_keeps_old_file(api, vault):
    v = vault
    path = v['base']+'/sheet'
    api.post(path, headers=v['player'], files={'file': ('old.pdf', pdf(), 'application/pdf')})
    original = set(files(v))
    def fail_commit(session):
        if any(isinstance(o, CharacterFile) for o in session.new | session.dirty):
            raise RuntimeError('falha simulada de persistência')
    event.listen(Session, 'before_commit', fail_commit)
    try:
        with pytest.raises(RuntimeError):
            api.post(path, headers=v['player'], files={'file': ('new.png', image(), 'image/png')})
    finally:
        event.remove(Session, 'before_commit', fail_commit)
    assert set(files(v)) == original
    assert api.get(path, headers=v['player']).content == pdf()


def test_campaign_deletion_cleans_specific_sheets_but_keeps_character(api, vault):
    v = vault
    path = v['base']+f"/participations/{v['part']}/sheet"
    api.post(path, headers=v['player'], files={'file': ('mesa.pdf', pdf(), 'application/pdf')})
    api.post(v['base']+'/sheet', headers=v['player'], files={'file': ('geral.pdf', pdf(), 'application/pdf')})
    assert len(files(v)) == 2
    assert api.delete(f"/campaigns/{v['campaign']}", headers=v['master']).status_code == 204
    assert len(files(v)) == 1
    assert api.get(v['base'], headers=v['player']).status_code == 200
    assert api.get(v['base']+'/sheet', headers=v['player']).status_code == 200
