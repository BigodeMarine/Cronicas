from pydantic import BaseModel, EmailStr, Field

"""
Dados necessários para autenticar um usuário.
"""
class LoginRequest(BaseModel):

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

"""
Resposta retornada após uma autenticação bem-sucedida.
"""
class TokenResponse(BaseModel):

    access_token: str
    token_type: str = "bearer"
