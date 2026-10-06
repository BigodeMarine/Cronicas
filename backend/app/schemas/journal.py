from datetime import date, datetime
from typing import Annotated
from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints


class CampaignInput(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=10000)
    system: str = Field(default="", max_length=100)


class CampaignResponse(CampaignInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime


class SessionInput(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    played_on: date
    summary: str = Field(default="", max_length=20000)


class SessionResponse(SessionInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int


class EntryInput(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    content: str = Field(min_length=1, max_length=50000)
    session_id: int | None = None


class EntryCommentInput(BaseModel):
    content: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]


class EntryCommentResponse(EntryCommentInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entry_id: int
    author_id: int
    author_name: str
    created_at: datetime
    updated_at: datetime


class EntryResponse(EntryInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    author_id: int
    author_name: str
    created_at: datetime
    updated_at: datetime
    comments: list[EntryCommentResponse] = Field(default_factory=list)


class ParticipantInput(BaseModel):
    email: EmailStr
