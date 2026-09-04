from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool
from app.core.config import settings
from app.database.base import Base
from app.models import User, Project, ProjectMember, Task, Notification, Comment

# Configuração principal do Alembic.
config = context.config

# Configura o sistema de logging definido pelo Alembic.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Metadata dos models SQLAlchemy.
target_metadata = Base.metadata

"""
Executa as migrations sem estabelecer uma conexão direta com o banco de dados.
"""
def run_migrations_offline() -> None:
   
    url = settings.database_url

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

"""
Executa as migrations utilizando uma conexão ativa com o banco de dados PostgreSQL.
"""
def run_migrations_online() -> None:
    
    configuration = config.get_section(config.config_ini_section)

    configuration["sqlalchemy.url"] = settings.database_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


# Define qual modo de execução será utilizado.
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
