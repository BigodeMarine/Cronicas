from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas import ProjectMemberCreate, ProjectMemberResponse
from app.services.project_member_service import (
    add_project_member,
    get_project_member,
    get_project_members,
    remove_project_member,
)


router = APIRouter(
    prefix="/projects/{project_id}/members",
    tags=["Project Members"],
)

"""
Busca um projeto garantindo que o usuário autenticado seja o proprietário.
"""
def get_owned_project(
    db: Session,
    project_id: int,
    current_user: User,
) -> Project:

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado.",
        )

    return project

"""
Adiciona um usuário ao projeto do proprietário autenticado.
"""
@router.post(
    "",
    response_model=ProjectMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    project_id: int,
    member_data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectMemberResponse:

    get_owned_project(db, project_id, current_user)

    user = db.get(User, member_data.user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    existing_member = get_project_member(
        db,
        project_id,
        member_data.user_id,
    )

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Usuário já é membro deste projeto.",
        )

    return add_project_member(
        db,
        project_id,
        member_data.user_id,
         member_data.role,
    )

"""
Lista os membros de um projeto pertencente ao usuário autenticado.
"""
@router.get(
    "",
    response_model=list[ProjectMemberResponse],
)
def list_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectMemberResponse]:

    get_owned_project(db, project_id, current_user)

    return get_project_members(db, project_id)

"""
Remove um usuário de um projeto pertencente ao proprietário autenticado.
"""
@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:

    get_owned_project(db, project_id, current_user)

    member = get_project_member(db, project_id, user_id)

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro não encontrado.",
        )

    remove_project_member(db, member)