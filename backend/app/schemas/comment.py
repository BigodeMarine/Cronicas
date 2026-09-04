from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

"""
Dados necessários para criar um comentário.
"""
class CommentCreate(BaseModel):
    
    content: str = Field(
        min_length=1,
        max_length=2000,
    )

"""
Dados retornados pela API sobre um comentário.
"""
class CommentResponse(BaseModel):

    id: int
    task_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
