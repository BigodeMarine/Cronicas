from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.user import User
from app.schemas import ProjectCreate

"""
Cria um novo projeto associado ao usuário autenticado.
"""
def create_project(
    db: Session,
    project_data: ProjectCreate,
    current_user: User,
) -> Project:

    project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project

"""
Retorna todos os projetos pertencentes ao usuário autenticado.
"""
def get_user_projects(
    db: Session,
    current_user: User,
) -> list[Project]:
  
    return (
        db.query(Project)
        .filter(Project.owner_id == current_user.id)
        .all()
    )

"""
Busca um projeto pelo ID garantindo que pertença ao usuário autenticado.
"""
def get_project_by_id(
    db: Session,
    project_id: int,
    current_user: User,
) -> Project | None:

    return (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
        .first()
    )

"""
Atualiza os dados de um projeto existente.
"""
def update_project(
    db: Session,
    project: Project,
    project_data: ProjectCreate,
) -> Project:

    project.name = project_data.name
    project.description = project_data.description

    db.commit()
    db.refresh(project)

    return project

"""
Remove um projeto do banco de dados.
"""
def delete_project(
    db: Session,
    project: Project,
) -> None:

    db.delete(project)
    db.commit()