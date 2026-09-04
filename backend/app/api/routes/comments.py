from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas import CommentCreate, CommentResponse
from app.services.comment_service import (
    create_comment,
    delete_comment,
    get_comment_by_id,
    get_task_comments,
    update_comment,
)


router = APIRouter(
    prefix="/tasks/{task_id}/comments",
    tags=["Comments"],
)

"""
Busca uma tarefa pelo ID ou retorna erro 404.
"""
def get_task_or_404(
    db: Session,
    task_id: int,
) -> Task:

    task = db.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada.",
        )

    return task

"""
Cria um comentário na tarefa para o usuário autenticado.
"""
@router.post(
    "",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    task_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentResponse:

    get_task_or_404(db, task_id)

    return create_comment(
        db,
        task_id,
        comment_data,
        current_user,
    )

"""
Lista os comentários de uma tarefa.
"""
@router.get(
    "",
    response_model=list[CommentResponse],
)
def list_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CommentResponse]:

    get_task_or_404(db, task_id)

    return get_task_comments(db, task_id)

"""
Atualiza um comentário pertencente ao usuário autenticado.
"""
@router.put(
    "/{comment_id}",
    response_model=CommentResponse,
)
def update(
    task_id: int,
    comment_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentResponse:

    get_task_or_404(db, task_id)

    comment = get_comment_by_id(db, comment_id)

    if not comment or comment.task_id != task_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentário não encontrado.",
        )

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode editar este comentário.",
        )

    return update_comment(db, comment, comment_data)

"""
Remove um comentário pertencente ao usuário autenticado.
"""
@router.delete(
    "/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:

    get_task_or_404(db, task_id)

    comment = get_comment_by_id(db, comment_id)

    if not comment or comment.task_id != task_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentário não encontrado.",
        )

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode excluir este comentário.",
        )

    delete_comment(db, comment)