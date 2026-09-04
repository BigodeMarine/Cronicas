from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.notification import Notification

"""
Retorna todas as notificações de um usuário.
"""
def get_user_notifications(
    db: Session,
    user_id: int,
) -> list[Notification]:

    result = db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )

    return list(result.scalars().all())

"""
Busca uma notificação pelo seu ID.
"""
def get_notification_by_id(
    db: Session,
    notification_id: int,
) -> Notification | None:

    return db.get(Notification, notification_id)

"""
Marca uma notificação como lida.
"""
def mark_notification_as_read(
    db: Session,
    notification: Notification,
) -> Notification:

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification

"""
Remove uma notificação do banco de dados.
"""
def delete_notification(
    db: Session,
    notification: Notification,
) -> None:

    db.delete(notification)
    db.commit()