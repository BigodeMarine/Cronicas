from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models import Project, ProjectMember, User, CampaignSession, JournalEntry
from app.schemas.journal import CampaignInput, CampaignResponse, SessionInput, SessionResponse, EntryInput, EntryResponse, ParticipantInput
from app.services.project_member_service import get_project_members

router = APIRouter(prefix="/campaigns", tags=["Diário de RPG"])


def accessible(db: Session, campaign_id: int, user: User, master: bool = False) -> Project:
    campaign = db.get(Project, campaign_id)
    member = db.query(ProjectMember).filter_by(project_id=campaign_id, user_id=user.id).first()
    if not campaign or (campaign.owner_id != user.id and not member):
        raise HTTPException(404, "Campanha não encontrada.")
    if master and campaign.owner_id != user.id:
        raise HTTPException(403, "Somente o mestre pode realizar esta ação.")
    return campaign


def save(db: Session, obj):
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("", response_model=list[CampaignResponse])
def list_campaigns(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    memberships = db.query(ProjectMember.project_id).filter(ProjectMember.user_id == user.id)
    return db.query(Project).filter(or_(Project.owner_id == user.id, Project.id.in_(memberships))).order_by(Project.created_at.desc(), Project.id.desc()).all()


@router.post("", response_model=CampaignResponse, status_code=201)
def create_campaign(data: CampaignInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return save(db, Project(**data.model_dump(), owner_id=user.id))


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return accessible(db, campaign_id, user)


@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(campaign_id: int, data: CampaignInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = accessible(db, campaign_id, user, master=True)
    for key, value in data.model_dump().items():
        setattr(campaign, key, value)
    return save(db, campaign)


@router.delete("/{campaign_id}", status_code=204)
def delete_campaign(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(accessible(db, campaign_id, user, master=True))
    db.commit()


@router.get("/{campaign_id}/participants")
def participants(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = accessible(db, campaign_id, user)
    owner = db.get(User, campaign.owner_id)
    return [{"user_id": owner.id, "name": owner.name, "role": "MASTER"}] + [
        {"user_id": m["user_id"], "name": m["name"], "role": "PLAYER"}
        for m in get_project_members(db, campaign_id) if m["user_id"] != owner.id
    ]


@router.post("/{campaign_id}/participants", status_code=201)
def add_participant(campaign_id: int, data: ParticipantInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = accessible(db, campaign_id, user, master=True)
    participant = db.query(User).filter(User.email == str(data.email).lower(), User.is_active.is_(True)).first()
    if not participant:
        raise HTTPException(404, "Não há uma conta ativa com este e-mail. Peça ao jogador para se cadastrar primeiro.")
    if participant.id == campaign.owner_id or db.query(ProjectMember).filter_by(project_id=campaign_id, user_id=participant.id).first():
        raise HTTPException(409, "Esta pessoa já participa da campanha.")
    save(db, ProjectMember(project_id=campaign_id, user_id=participant.id, role="PLAYER"))
    return {"user_id": participant.id, "name": participant.name, "role": "PLAYER"}


@router.delete("/{campaign_id}/participants/{user_id}", status_code=204)
def remove_participant(campaign_id: int, user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = accessible(db, campaign_id, user, master=True)
    if user_id == campaign.owner_id:
        raise HTTPException(400, "O mestre não pode ser removido.")
    member = db.query(ProjectMember).filter_by(project_id=campaign_id, user_id=user_id).first()
    if not member:
        raise HTTPException(404, "Participante não encontrado.")
    db.delete(member)
    db.commit()


@router.get("/{campaign_id}/sessions", response_model=list[SessionResponse])
def sessions(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    accessible(db, campaign_id, user)
    return db.query(CampaignSession).filter_by(project_id=campaign_id).order_by(CampaignSession.played_on.desc(), CampaignSession.id.desc()).all()


@router.post("/{campaign_id}/sessions", response_model=SessionResponse, status_code=201)
def create_session(campaign_id: int, data: SessionInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    accessible(db, campaign_id, user, master=True)
    return save(db, CampaignSession(project_id=campaign_id, **data.model_dump()))


def session_for(db, campaign_id, session_id):
    session = db.query(CampaignSession).filter_by(id=session_id, project_id=campaign_id).first()
    if not session:
        raise HTTPException(404, "Sessão não encontrada nesta campanha.")
    return session


@router.put("/{campaign_id}/sessions/{session_id}", response_model=SessionResponse)
def update_session(campaign_id: int, session_id: int, data: SessionInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    accessible(db, campaign_id, user, master=True)
    session = session_for(db, campaign_id, session_id)
    for key, value in data.model_dump().items():
        setattr(session, key, value)
    return save(db, session)


@router.get("/{campaign_id}/entries", response_model=list[EntryResponse])
def entries(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    accessible(db, campaign_id, user)
    return db.query(JournalEntry).filter_by(project_id=campaign_id).order_by(JournalEntry.created_at.desc(), JournalEntry.id.desc()).all()


@router.post("/{campaign_id}/entries", response_model=EntryResponse, status_code=201)
def create_entry(campaign_id: int, data: EntryInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    accessible(db, campaign_id, user)
    if data.session_id is not None:
        session_for(db, campaign_id, data.session_id)
    return save(db, JournalEntry(project_id=campaign_id, author_id=user.id, **data.model_dump()))


def editable_entry(db, campaign_id, entry_id, user):
    campaign = accessible(db, campaign_id, user)
    entry = db.query(JournalEntry).filter_by(id=entry_id, project_id=campaign_id).first()
    if not entry:
        raise HTTPException(404, "Relato não encontrado.")
    if entry.author_id != user.id and campaign.owner_id != user.id:
        raise HTTPException(403, "Você só pode alterar seus próprios relatos.")
    return entry


@router.put("/{campaign_id}/entries/{entry_id}", response_model=EntryResponse)
def update_entry(campaign_id: int, entry_id: int, data: EntryInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    entry = editable_entry(db, campaign_id, entry_id, user)
    if data.session_id is not None:
        session_for(db, campaign_id, data.session_id)
    for key, value in data.model_dump().items():
        setattr(entry, key, value)
    return save(db, entry)


@router.delete("/{campaign_id}/entries/{entry_id}", status_code=204)
def delete_entry(campaign_id: int, entry_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(editable_entry(db, campaign_id, entry_id, user))
    db.commit()
