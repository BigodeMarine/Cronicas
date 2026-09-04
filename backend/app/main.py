from fastapi import FastAPI
from app.core.config import settings
from app.api.routes.auth import router as auth_router
from app.api.routes.projects import router as projects_router
from app.api.routes.project_members import router as project_members_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.comments import router as comments_router
from app.api.routes.notifications import router as notifications_router

# Cria a instância principal da aplicação FastAPI.
app = FastAPI(
    title=settings.app_name,
    description="API para gerenciamento de projetos e tarefas.",
    version=settings.app_version,
)
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(project_members_router)
app.include_router(tasks_router)
app.include_router(comments_router)
app.include_router(notifications_router)

@app.get("/")
def root():
    return {
        "message": "ForgeHub API is running!"
    }