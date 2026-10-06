from fastapi import FastAPI
from app.core.config import settings
from app.api.routes.auth import router as auth_router
from app.api.routes.projects import router as projects_router
from app.api.routes.project_members import router as project_members_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.comments import router as comments_router
from app.api.routes.notifications import router as notifications_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.campaigns import router as campaigns_router

# Cria a instância principal da aplicação FastAPI.
app = FastAPI(
    title=settings.app_name,
    description="Diário de RPG compartilhado: campanhas, sessões e relatos da mesa.",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(project_members_router)
app.include_router(tasks_router)
app.include_router(comments_router)
app.include_router(notifications_router)
app.include_router(campaigns_router)

@app.get("/")
def root():
    return {
        "message": "ForgeHub API is running!"
    }
