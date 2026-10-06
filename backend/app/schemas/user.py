from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

"""
Campos compartilhados entre criação e resposta de usuário.
"""
class UserBase(BaseModel):
    
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

"""
Dados necessários para criar um novo usuário.
"""
class UserCreate(BaseModel):
    email: EmailStr
    # Preserve compatibility with existing clients; the book only asks for email/password.
    name: str | None = Field(default=None, min_length=2, max_length=100)

    password: str = Field(
        min_length=8,
        max_length=128,
    )

"""
Dados públicos retornados pela API, A senha nunca deve ser retornada ao cliente.
"""
class UserResponse(UserBase):

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
