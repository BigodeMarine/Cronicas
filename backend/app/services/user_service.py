from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate

"""
Busca um usuário pelo endereço de e-mail, retorna o usuário encontrado ou None caso não exista.
"""
def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:

    statement = select(User).where(User.email == email.lower())

    return db.scalar(statement)

"""
Cria um novo usuário,a senha recebida é transformada em hash antes de ser armazenada no banco de dados.
"""
def create_user(
    db: Session,
    user_data: UserCreate,
) -> User:

    user = User(
        name=user_data.name,
        email=str(user_data.email).lower(),
        password_hash=hash_password(user_data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

