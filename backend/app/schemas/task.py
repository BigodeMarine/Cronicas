from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict

"""
Define os estados possíveis para uma tarefa.
"""
class TaskStatus(str, Enum):

    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"

"""
Define os níveis de prioridade disponíveis para uma tarefa.
"""
class TaskPriority(str, Enum):

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

"""
Schema utilizado para criação de uma tarefa.
"""
class TaskCreate(BaseModel):

    title: str
    description: str | None = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    assignee_id: int | None = None

"""
Schema utilizado para retornar os dados de uma tarefa.
"""
class TaskResponse(BaseModel):

    id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    project_id: int
    assignee_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)