"""Entidades privadas do cofre; campanhas continuam sendo projects."""
from datetime import date, datetime, timezone
from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, ForeignKeyConstraint, Index, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


def now():
    return datetime.now(timezone.utc)


class Character(Base):
    __tablename__ = "characters"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    system: Mapped[str] = mapped_column(String(100), default="")
    history: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda c: c.get_current_parameters()["created_at"], onupdate=now)
    participations = relationship("CharacterParticipation", back_populates="character", cascade="all, delete-orphan")
    files = relationship("CharacterFile", foreign_keys="CharacterFile.character_id", back_populates="character", cascade="all, delete-orphan")
    __table_args__ = (CheckConstraint("status IN ('active', 'retired', 'dead')", name="ck_character_status"),)

    @property
    def portrait(self):
        return next((f for f in self.files if f.kind == "portrait"), None)

    @property
    def sheet(self):
        return next((f for f in self.files if f.kind == "sheet" and f.participation_id is None), None)


class CharacterParticipation(Base):
    __tablename__ = "character_participations"
    id: Mapped[int] = mapped_column(primary_key=True)
    character_id: Mapped[int] = mapped_column(ForeignKey("characters.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    external_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    character = relationship("Character", back_populates="participations")
    project = relationship("Project", back_populates="character_participations")
    files = relationship("CharacterFile", foreign_keys="CharacterFile.participation_id", back_populates="participation", cascade="all, delete-orphan")
    notes = relationship("CharacterNote", back_populates="participation", cascade="all, delete-orphan")
    __table_args__ = (
        UniqueConstraint("character_id", "project_id", name="uq_character_campaign"),
        UniqueConstraint("id", "character_id", name="uq_participation_character"),
    )

    @property
    def campaign_name(self):
        return self.project.name

    @property
    def sheet(self):
        return next(iter(self.files), None)


class CharacterFile(Base):
    __tablename__ = "character_files"
    id: Mapped[int] = mapped_column(primary_key=True)
    character_id: Mapped[int] = mapped_column(ForeignKey("characters.id", ondelete="CASCADE"), index=True)
    participation_id: Mapped[int | None] = mapped_column(nullable=True)
    kind: Mapped[str] = mapped_column(String(20))
    storage_key: Mapped[str] = mapped_column(String(40), unique=True)
    filename: Mapped[str] = mapped_column(String(255))
    media_type: Mapped[str] = mapped_column(String(50))
    size: Mapped[int] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    character = relationship("Character", foreign_keys=[character_id], back_populates="files")
    participation = relationship("CharacterParticipation", foreign_keys=[participation_id], back_populates="files")
    __table_args__ = (
        ForeignKeyConstraint(["participation_id", "character_id"], ["character_participations.id", "character_participations.character_id"], ondelete="CASCADE", name="fk_file_participation_character"),
        CheckConstraint("kind IN ('portrait', 'sheet') AND (participation_id IS NULL OR kind = 'sheet')", name="ck_character_file_scope"),
        CheckConstraint("size > 0", name="ck_character_file_size"),
        Index("uq_character_general_file", "character_id", "kind", unique=True, postgresql_where=text("participation_id IS NULL"), sqlite_where=text("participation_id IS NULL")),
        Index("uq_participation_sheet", "participation_id", unique=True, postgresql_where=text("participation_id IS NOT NULL"), sqlite_where=text("participation_id IS NOT NULL")),
    )


class CharacterNote(Base):
    __tablename__ = "character_notes"
    id: Mapped[int] = mapped_column(primary_key=True)
    participation_id: Mapped[int] = mapped_column(ForeignKey("character_participations.id", ondelete="CASCADE"), index=True)
    session_id: Mapped[int | None] = mapped_column(ForeignKey("campaign_sessions.id", ondelete="SET NULL"), nullable=True)
    session_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    title: Mapped[str] = mapped_column(String(150))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda c: c.get_current_parameters()["created_at"], onupdate=now)
    participation = relationship("CharacterParticipation", back_populates="notes")
