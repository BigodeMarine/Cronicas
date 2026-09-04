from typing import TYPE_CHECKING
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User

"""
Representa a participação de um usuário em um projeto.
"""
class ProjectMember(Base):
    

    __tablename__ = "project_members"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


    # ORM
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="members",
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="project_memberships",
    )

    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "user_id",
            name="uq_project_member",
        ),
    )
