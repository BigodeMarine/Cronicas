from sqlalchemy.orm import Session
from app.models.comment import Comment
from app.models.user import User
from app.schemas import CommentCreate

"""
Cria um comentário associado à tarefa e ao usuário autenticado.
"""
def create_comment(
    db: Session,
    task_id: int,
    comment_data: CommentCreate,
    current_user: User,
) -> Comment:

    comment = Comment(
        content=comment_data.content,
        task_id=task_id,
        user_id=current_user.id,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return comment

"""
Retorna todos os comentários de uma tarefa.
"""
def get_task_comments(
    db: Session,
    task_id: int,
) -> list[Comment]:

    return (
        db.query(Comment)
        .filter(Comment.task_id == task_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

"""
Busca um comentário pelo seu ID.
"""
def get_comment_by_id(
    db: Session,
    comment_id: int,
) -> Comment | None:

    return db.get(Comment, comment_id)

"""
Atualiza o conteúdo de um comentário.
"""
def update_comment(
    db: Session,
    comment: Comment,
    comment_data: CommentCreate,
) -> Comment:

    comment.content = comment_data.content

    db.commit()
    db.refresh(comment)

    return comment

"""
Remove um comentário do banco de dados.
"""
def delete_comment(
    db: Session,
    comment: Comment,
) -> None:

    db.delete(comment)
    db.commit()