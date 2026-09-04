from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

"""
Campos compartilhados entre criação e resposta de projeto.
"""
class ProjectBase(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=150,
    )

    description: str | None = None

"""
Dados necessários para criar um projeto.
"""
class ProjectCreate(ProjectBase):
    
    pass

"""
Dados retornados pela API sobre um projeto.
"""
class ProjectResponse(ProjectBase):
    
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
