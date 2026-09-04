from typing import TYPE_CHECKING
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
if TYPE_CHECKING:
    from app.models.comment import Comment
    from app.models.notification import Notification
    from app.models.project import Project
    from app.models.project_member import ProjectMember
    from app.models.task import Task

"""
Representa um usuário cadastrado no ForgeHub.
"""
class User(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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
    projects: Mapped[list["Project"]] = relationship(
        "Project",
        back_populates="owner",
    )

    project_memberships: Mapped[list["ProjectMember"]] = relationship(
        "ProjectMember",
        back_populates="user",
    )

    assigned_tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="assignee",
    )

    comments: Mapped[list["Comment"]] = relationship(
        "Comment",
        back_populates="user",
    )

    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="user",
    )
