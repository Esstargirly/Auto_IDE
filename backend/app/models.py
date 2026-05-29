import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    github_token = Column(String, nullable=True)
    usage_credits = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)  # UUID or human-readable ID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    project_type = Column(String, default="web app")  # web app, mobile app, API, SaaS, landing page, AI app
    
    # PENDING, PLANNING, BUILDING, TESTING, DEPLOYING, SUCCESS, FAILED
    status = Column(String, default="PENDING")
    
    repository_url = Column(String, nullable=True)
    deployment_url = Column(String, nullable=True)
    preview_port = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="projects")
    steps = relationship("TaskStep", back_populates="project", cascade="all, delete-orphan")
    logs = relationship("BuildLog", back_populates="project", cascade="all, delete-orphan")

class TaskStep(Base):
    __tablename__ = "task_steps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # PENDING, ACTIVE, COMPLETED, FAILED
    status = Column(String, default="PENDING")
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="steps")

class BuildLog(Base):
    __tablename__ = "build_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    
    # INFO, STDOUT, STDERR, AI_THOUGHT
    log_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="logs")
