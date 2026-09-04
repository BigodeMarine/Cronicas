from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas import TaskCreate, TaskResponse
from app.services.task_service import (
    create_task,
    delete_task,
    get_project_tasks,
    get_task_by_id,
    is_valid_assignee,
    update_task,
)


router = APIRouter(
    prefix="/projects/{project_id}/tasks",
    tags=["Tasks"],
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
Cria uma tarefa dentro de um projeto do usuário autenticado.
"""
@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    project_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    
    get_owned_project(db, project_id, current_user)

    if not is_valid_assignee(
        db,
        project_id,
        task_data.assignee_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O usuário responsável deve ser membro do projeto.",
        )

    return create_task(
        db,
        project_id,
        task_data,
        current_user,
    )

"""
Lista as tarefas de um projeto pertencente ao usuário autenticado.
"""
@router.get(
    "",
    response_model=list[TaskResponse],
)
def list_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TaskResponse]:
    
    get_owned_project(db, project_id, current_user)

    return get_project_tasks(db, project_id)

"""
Retorna uma tarefa específica de um projeto.
"""
@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    
    get_owned_project(db, project_id, current_user)

    task = get_task_by_id(
        db,
        task_id,
        project_id,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada.",
        )

    return task

"""
Atualiza uma tarefa pertencente ao projeto do usuário autenticado.
"""
@router.put(
    "/{task_id}",
    response_model=TaskResponse,
)
def update(
    project_id: int,
    task_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    
    get_owned_project(db, project_id, current_user)

    task = get_task_by_id(
        db,
        task_id,
        project_id,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada.",
        )

    if not is_valid_assignee(
        db,
        project_id,
        task_data.assignee_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O usuário responsável deve ser membro do projeto.",
        )

    return update_task(
        db,
        task,
        task_data,
    )

"""
Remove uma tarefa pertencente ao projeto do usuário autenticado.
"""
@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    
    get_owned_project(db, project_id, current_user)

    task = get_task_by_id(
        db,
        task_id,
        project_id,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada.",
        )

    delete_task(db, task)