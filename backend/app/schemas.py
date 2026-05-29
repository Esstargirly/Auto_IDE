from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# User Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    usage_credits: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Task step schemas
class TaskStepResponse(BaseModel):
    id: int
    project_id: str
    step_number: int
    title: str
    description: Optional[str] = None
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Build Log schemas
class BuildLogResponse(BaseModel):
    id: int
    project_id: str
    log_type: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

# Project schemas
class ProjectCreate(BaseModel):
    name: str
    prompt: str
    project_type: str = "web app"

class ProjectResponse(BaseModel):
    id: str
    name: str
    prompt: str
    project_type: str
    status: str
    repository_url: Optional[str] = None
    deployment_url: Optional[str] = None
    preview_port: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    steps: List[TaskStepResponse] = []
    
    class Config:
        from_attributes = True

class ProjectListResponse(BaseModel):
    id: str
    name: str
    project_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
