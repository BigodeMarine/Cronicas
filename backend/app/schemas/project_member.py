from pydantic import BaseModel, ConfigDict

"""
Schema utilizado para adicionar um usuário a um projeto.
"""
class ProjectMemberCreate(BaseModel):
    
    user_id: int
    role: str

"""
Schema utilizado para retornar um membro de projeto.
"""
class ProjectMemberResponse(BaseModel):

    id: int
    project_id: int
    user_id: int
    role: str

    model_config = ConfigDict(from_attributes=True)