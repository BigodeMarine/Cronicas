"""Contratos do cofre: IDs de proprietário nunca são aceitos como entrada."""
from datetime import date, datetime
from typing import Annotated, Generic, Literal, TypeVar
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator
from urllib.parse import urlsplit

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    offset: int
    limit: int


class CharacterInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Name
    system: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] = ""
    history: str | None = Field(default=None, max_length=50000)
    status: Literal["active", "retired", "dead"] = "active"


class FileInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    media_type: str
    size: int
    created_at: datetime


class CharacterResponse(CharacterInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    portrait: FileInfo | None
    sheet: FileInfo | None


class ParticipationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    external_url: str | None = Field(default=None, max_length=2048)

    @field_validator("external_url")
    @classmethod
    def validate_link(cls, value):
        if not value or not value.strip():
            return None
        value = value.strip()
        try:
            parts = urlsplit(value)
            if parts.scheme.lower() not in ("http", "https") or not parts.hostname or parts.username or parts.password or any(ord(c) < 33 for c in value):
                raise ValueError
            _ = parts.port
        except ValueError:
            raise ValueError("Use um link HTTP/HTTPS válido, sem credenciais.")
        return value


class ParticipationInput(ParticipationUpdate):
    project_id: int = Field(gt=0)


class ParticipationResponse(ParticipationUpdate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    character_id: int
    project_id: int
    campaign_name: str
    created_at: datetime
    sheet: FileInfo | None


class NoteInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Name
    content: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50000)]
    session_id: int | None = Field(default=None, gt=0)
    session_date: date | None = None


class NoteResponse(NoteInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    participation_id: int
    created_at: datetime
    updated_at: datetime
