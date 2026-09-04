from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas import ProjectCreate, ProjectResponse
from app.services.project_service import (
    create_project,
    get_project_by_id,
    get_user_projects,
    update_project,
    delete_project,
)


router = APIRouter(prefix="/projects", tags=["Projects"])

"""
Cria um novo projeto para o usuário autenticado.
"""
@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:

    return create_project(db, project_data, current_user)

"""
Lista os projetos pertencentes ao usuário autenticado.
"""
@router.get(
    "",
    response_model=list[ProjectResponse],
)
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectResponse]:

    return get_user_projects(db, current_user)

"""
Retorna um projeto específico do usuário autenticado.
"""
@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:

    project = get_project_by_id(db, project_id, current_user)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado.",
        )

    return project

@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update(
    project_id: int,
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """
    Atualiza um projeto pertencente ao usuário autenticado.
    """

    project = get_project_by_id(db, project_id, current_user)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado.",
        )

    return update_project(db, project, project_data)

"""
Remove um projeto pertencente ao usuário autenticado.
"""
@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:

    project = get_project_by_id(db, project_id, current_user)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado.",
        )

    delete_project(db, project)