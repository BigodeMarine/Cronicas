"""CRUD privado do cofre: propriedade e acesso à campanha são verificados em cada rota."""
from datetime import datetime, timezone
from typing import Literal
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models import User, Project, ProjectMember, CampaignSession
from app.models.character import Character, CharacterParticipation, CharacterFile, CharacterNote
from app.schemas.character import CharacterInput, CharacterResponse, FileInfo, ParticipationInput, ParticipationUpdate, ParticipationResponse, NoteInput, NoteResponse, Page
from app.services.character_storage import get_character_storage, validate_upload, PrivateFileStorage

router = APIRouter(prefix="/characters", tags=["Cofre de Personagens"])


def owned_character(db, character_id, user, lock=False):
    query = db.query(Character).filter_by(id=character_id, owner_id=user.id)
    if lock:
        query = query.with_for_update()
    character = query.first()
    if not character:
        raise HTTPException(404, "Personagem não encontrado.")
    return character


def accessible_campaigns(db, user):
    membership = db.query(ProjectMember.project_id).filter_by(user_id=user.id)
    return db.query(Project).filter(or_(Project.owner_id == user.id, Project.id.in_(membership)))


def owned_participation(db, character_id, participation_id, user):
    owned_character(db, character_id, user)
    participation = db.query(CharacterParticipation).filter_by(id=participation_id, character_id=character_id).first()
    if not participation or not accessible_campaigns(db, user).filter(Project.id == participation.project_id).first():
        raise HTTPException(404, "Participação não encontrada ou campanha sem acesso.")
    return participation


def commit(db, obj=None):
    if obj is not None:
        db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Registro duplicado ou referência que não está mais disponível.")
    if obj is not None:
        db.refresh(obj)
    return obj


def page(query, offset, limit):
    return {"items": query.offset(offset).limit(limit).all(), "total": query.order_by(None).count(), "offset": offset, "limit": limit}


@router.get("", response_model=Page[CharacterResponse])
def list_characters(q: str = Query("", max_length=150), system: str | None = Query(None, max_length=100), status: Literal["active", "retired", "dead"] | None = None, offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Character).options(selectinload(Character.files)).filter_by(owner_id=user.id)
    if q.strip():
        # Escape curingas para que a busca por nome seja literal.
        term = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = query.filter(Character.name.ilike(f"%{term}%", escape="\\"))
    if system is not None:
        query = query.filter(Character.system == system)
    if status:
        query = query.filter(Character.status == status)
    return page(query.order_by(Character.updated_at.desc(), Character.id.desc()), offset, limit)


@router.get("/systems", response_model=list[str])
def character_systems(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [row[0] for row in db.query(Character.system).filter_by(owner_id=user.id).filter(Character.system != "").distinct().order_by(Character.system)]


@router.post("", response_model=CharacterResponse, status_code=201)
def create_character(data: CharacterInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return commit(db, Character(owner_id=user.id, **data.model_dump()))


@router.get("/{character_id}", response_model=CharacterResponse)
def get_character(character_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return owned_character(db, character_id, user)


@router.put("/{character_id}", response_model=CharacterResponse)
def update_character(character_id: int, data: CharacterInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    character = owned_character(db, character_id, user, lock=True)
    for key, value in data.model_dump().items():
        setattr(character, key, value)
    return commit(db, character)


@router.delete("/{character_id}", status_code=204)
def delete_character(character_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(owned_character(db, character_id, user, lock=True))
    commit(db)


@router.get("/{character_id}/participations", response_model=Page[ParticipationResponse])
def list_participations(character_id: int, offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    owned_character(db, character_id, user)
    projects = accessible_campaigns(db, user).with_entities(Project.id)
    query = db.query(CharacterParticipation).options(selectinload(CharacterParticipation.files), selectinload(CharacterParticipation.project)).filter(CharacterParticipation.character_id == character_id, CharacterParticipation.project_id.in_(projects))
    return page(query.order_by(CharacterParticipation.id.desc()), offset, limit)


@router.post("/{character_id}/participations", response_model=ParticipationResponse, status_code=201)
def create_participation(character_id: int, data: ParticipationInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    owned_character(db, character_id, user, lock=True)
    if not accessible_campaigns(db, user).filter(Project.id == data.project_id).first():
        raise HTTPException(404, "Campanha não encontrada ou sem acesso.")
    return commit(db, CharacterParticipation(character_id=character_id, **data.model_dump()))


@router.get("/{character_id}/participations/{participation_id}", response_model=ParticipationResponse)
def get_participation(character_id: int, participation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return owned_participation(db, character_id, participation_id, user)


@router.put("/{character_id}/participations/{participation_id}", response_model=ParticipationResponse)
def update_participation(character_id: int, participation_id: int, data: ParticipationUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    participation = owned_participation(db, character_id, participation_id, user)
    participation.external_url = data.external_url
    return commit(db, participation)


@router.delete("/{character_id}/participations/{participation_id}", status_code=204)
def delete_participation(character_id: int, participation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(owned_participation(db, character_id, participation_id, user))
    commit(db)


def note_in_participation(db, character_id, participation_id, note_id, user):
    owned_participation(db, character_id, participation_id, user)
    note = db.query(CharacterNote).filter_by(id=note_id, participation_id=participation_id).first()
    if not note:
        raise HTTPException(404, "Anotação não encontrada.")
    return note


def validate_session(db, participation, session_id):
    if session_id is not None and not db.query(CampaignSession).filter_by(id=session_id, project_id=participation.project_id).first():
        raise HTTPException(422, "A sessão deve pertencer à campanha vinculada.")


@router.get("/{character_id}/participations/{participation_id}/notes", response_model=Page[NoteResponse])
def list_notes(character_id: int, participation_id: int, offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    owned_participation(db, character_id, participation_id, user)
    return page(db.query(CharacterNote).filter_by(participation_id=participation_id).order_by(CharacterNote.updated_at.desc(), CharacterNote.id.desc()), offset, limit)


@router.post("/{character_id}/participations/{participation_id}/notes", response_model=NoteResponse, status_code=201)
def create_note(character_id: int, participation_id: int, data: NoteInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    participation = owned_participation(db, character_id, participation_id, user)
    validate_session(db, participation, data.session_id)
    return commit(db, CharacterNote(participation_id=participation_id, **data.model_dump()))


@router.get("/{character_id}/participations/{participation_id}/notes/{note_id}", response_model=NoteResponse)
def get_note(character_id: int, participation_id: int, note_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return note_in_participation(db, character_id, participation_id, note_id, user)


@router.put("/{character_id}/participations/{participation_id}/notes/{note_id}", response_model=NoteResponse)
def update_note(character_id: int, participation_id: int, note_id: int, data: NoteInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note = note_in_participation(db, character_id, participation_id, note_id, user)
    validate_session(db, note.participation, data.session_id)
    for key, value in data.model_dump().items():
        setattr(note, key, value)
    return commit(db, note)


@router.delete("/{character_id}/participations/{participation_id}/notes/{note_id}", status_code=204)
def delete_note(character_id: int, participation_id: int, note_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(note_in_participation(db, character_id, participation_id, note_id, user))
    commit(db)


def file_scope(db, character_id, participation_id, kind, user, lock=False):
    owned_character(db, character_id, user, lock=lock)
    if participation_id is not None:
        owned_participation(db, character_id, participation_id, user)
    return db.query(CharacterFile).filter_by(character_id=character_id, participation_id=participation_id, kind=kind).first()


def store_upload(db, user, storage, character_id, participation_id, kind, file):
    character = owned_character(db, character_id, user, lock=True)
    old = file_scope(db, character_id, participation_id, kind, user, lock=True)
    limit = (5 if kind == "portrait" else 10) * 1024 * 1024
    try:
        data = file.file.read(limit + 1)
        extension, media_type = validate_upload(data, file.filename or "", file.content_type, kind == "portrait")
    finally:
        file.file.close()
    try:
        key = storage.write(data, extension)
    except OSError:
        raise HTTPException(503, "Armazenamento indisponível. Tente novamente.")
    db.info["vault_storage"] = storage
    db.info.setdefault("vault_new_keys", set()).add(key)
    record = old or CharacterFile(character_id=character_id, participation_id=participation_id, kind=kind)
    if old:
        db.info.setdefault("vault_delete_keys", set()).add(old.storage_key)
    record.storage_key, record.filename, record.media_type, record.size = key, file.filename, media_type, len(data)
    record.created_at = datetime.now(timezone.utc)
    character.updated_at = record.created_at
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        storage.delete(key)
        raise HTTPException(409, "Outra operação atualizou este arquivo. Tente novamente.")
    except Exception:
        db.rollback()
        storage.delete(key)
        raise
    db.refresh(record)
    return record


def download_file(db, user, storage, character_id, participation_id, kind):
    record = file_scope(db, character_id, participation_id, kind, user)
    if not record:
        raise HTTPException(404, "Arquivo não encontrado.")
    try:
        source = storage.open(record.storage_key)
    except (OSError, ValueError):
        raise HTTPException(404, "Arquivo não disponível no armazenamento.")
    def chunks():
        try:
            while data := source.read(64 * 1024):
                yield data
        finally:
            source.close()
    disposition = "inline" if kind == "portrait" else "attachment"
    return StreamingResponse(chunks(), media_type=record.media_type, headers={"Content-Disposition": f"{disposition}; filename*=UTF-8''{quote(record.filename)}", "Content-Length": str(record.size), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})


def remove_file(db, user, character_id, participation_id, kind):
    record = file_scope(db, character_id, participation_id, kind, user, lock=True)
    if not record:
        raise HTTPException(404, "Arquivo não encontrado.")
    db.delete(record)
    commit(db)


@router.post("/{character_id}/portrait", response_model=FileInfo)
def upload_portrait(character_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user), storage: PrivateFileStorage = Depends(get_character_storage)):
    return store_upload(db, user, storage, character_id, None, "portrait", file)


@router.get("/{character_id}/portrait")
def portrait_download(character_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user), storage: PrivateFileStorage = Depends(get_character_storage)):
    return download_file(db, user, storage, character_id, None, "portrait")


@router.delete("/{character_id}/portrait", status_code=204)
def portrait_delete(character_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    remove_file(db, user, character_id, None, "portrait")


@router.post("/{character_id}/sheet", response_model=FileInfo)
def upload_sheet(character_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user), storage: PrivateFileStorage = Depends(get_character_storage)):
    return store_upload(db, user, storage, character_id, None, "sheet", file)


@router.get("/{character_id}/sheet")
def sheet_download(character_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user), storage: PrivateFileStorage = Depends(get_character_storage)):
    return download_file(db, user, storage, character_id, None, "sheet")


@router.delete("/{character_id}/sheet", status_code=204)
def sheet_delete(character_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    remove_file(db, user, character_id, None, "sheet")


@router.post("/{character_id}/participations/{participation_id}/sheet", response_model=FileInfo)
def upload_participation_sheet(character_id: int, participation_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user), storage: PrivateFileStorage = Depends(get_character_storage)):
    return store_upload(db, user, storage, character_id, participation_id, "sheet", file)


@router.get("/{character_id}/participations/{participation_id}/sheet")
def participation_sheet_download(character_id: int, participation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user), storage: PrivateFileStorage = Depends(get_character_storage)):
    return download_file(db, user, storage, character_id, participation_id, "sheet")


@router.delete("/{character_id}/participations/{participation_id}/sheet", status_code=204)
def participation_sheet_delete(character_id: int, participation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    remove_file(db, user, character_id, participation_id, "sheet")
