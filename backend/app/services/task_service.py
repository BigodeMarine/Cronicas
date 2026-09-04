from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task
from app.models.user import User
from app.schemas import TaskCreate

"""
O proprietário do projeto também pode ser atribuído à tarefa, mesmo que não esteja cadastrado como membro.
"""
def is_valid_assignee(
    db: Session,
    project_id: int,
    assignee_id: int | None,
) -> bool:
    
    if assignee_id is None:
        return True

    project = db.get(Project, project_id)

    if project is None:
        return False

    if project.owner_id == assignee_id:
        return True

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == assignee_id,
        )
        .first()
    )

    return member is not None

"""
Quando a tarefa possui um responsável, uma notificação é criada automaticamente para esse usuário.
"""
def create_task(
    db: Session,
    project_id: int,
    task_data: TaskCreate,
    current_user: User,
) -> Task:
   
    task = Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        project_id=project_id,
        assignee_id=task_data.assignee_id,
    )

    db.add(task)
    db.flush()

    if task.assignee_id is not None:
        notification = Notification(
            user_id=task.assignee_id,
            task_id=task.id,
            message=f"Você foi atribuído à tarefa: {task.title}.",
        )
        db.add(notification)

    db.commit()
    db.refresh(task)

    return task

"""
Retorna todas as tarefas pertencentes a um projeto.
"""
def get_project_tasks(
    db: Session,
    project_id: int,
) -> list[Task]:
    
    return (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .order_by(Task.id)
        .all()
    )

"""
Busca uma tarefa específica dentro de um projeto.
"""
def get_task_by_id(
    db: Session,
    task_id: int,
    project_id: int,
) -> Task | None:
   
    return (
        db.query(Task)
        .filter(
            Task.id == task_id,
            Task.project_id == project_id,
        )
        .first()
    )

"""
Quando o responsável da tarefa é alterado, uma nova notificação é criada para o novo responsável.
"""
def update_task(
    db: Session,
    task: Task,
    task_data: TaskCreate,
) -> Task:
    
    previous_assignee_id = task.assignee_id

    task.title = task_data.title
    task.description = task_data.description
    task.status = task_data.status
    task.priority = task_data.priority
    task.assignee_id = task_data.assignee_id

    db.flush()

    if (
        task.assignee_id is not None
        and task.assignee_id != previous_assignee_id
    ):
        notification = Notification(
            user_id=task.assignee_id,
            task_id=task.id,
            message=f"Você foi atribuído à tarefa: {task.title}.",
        )
        db.add(notification)

    db.commit()
    db.refresh(task)

    return task

"""
Remove uma tarefa do banco de dados.
"""
def delete_task(
    db: Session,
    task: Task,
) -> None:
    
    db.delete(task)
    db.commit()