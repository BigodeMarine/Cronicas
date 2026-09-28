from sqlalchemy.orm import Session
from app.models.project_member import ProjectMember
from app.models.notification import Notification
from app.models.project import Project
from app.models.user import User

"""
Busca um membro específico dentro de um projeto.
"""
def get_project_member(
    db: Session,
    project_id: int,
    user_id: int,
) -> ProjectMember | None:

    return (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )

"""
Adiciona um usuário como membro de um projeto.
"""
def add_project_member(
    db: Session,
    project_id: int,
    user_id: int,
    role: str,
) -> ProjectMember:
    
    project = db.get(Project, project_id)

    member = ProjectMember(
        project_id=project_id,
        user_id=user_id,
        role=role,
    )

    db.add(member)
    if project:
        notification = Notification(
            user_id=user_id,
            message=f"Você foi adicionado ao projeto {project.name}.",
        )

    db.add(notification)
    db.commit()
    db.refresh(member)

    return member

"""
Retorna todos os membros de um projeto junto com o nome do usuário.
"""
def get_project_members(
    db: Session,
    project_id: int,
) -> list[dict]:

    members = (
        db.query(ProjectMember, User.name)
        .join(User, User.id == ProjectMember.user_id)
        .filter(ProjectMember.project_id == project_id)
        .all()
    )

    return [
        {
            "id": member.id,
            "project_id": member.project_id,
            "user_id": member.user_id,
            "name": name,
            "role": member.role,
        }
        for member, name in members
    ]

"""
Remove um usuário de um projeto.
"""
def remove_project_member(
    db: Session,
    member: ProjectMember,
) -> None:

    db.delete(member)
    db.commit()