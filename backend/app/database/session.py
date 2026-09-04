from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from app.core.config import settings

# Cria a conexão principal com o banco de dados.
engine = create_engine(
    settings.database_url,
)

# Cria uma fábrica de sessões para acessar o banco.
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autocommit=False,
    autoflush=False,
)

"""
Fornece uma sessão do banco de dados para cada requisição.
"""
def get_db():

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
