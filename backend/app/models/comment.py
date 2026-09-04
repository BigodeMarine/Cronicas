from typing import TYPE_CHECKING
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.user import User

"""
Representa um comentário feito por um usuário em uma tarefa.
"""
class Comment(Base):

    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ORM
    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="comments",
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="comments",
    )
