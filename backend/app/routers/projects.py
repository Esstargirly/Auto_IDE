import asyncio
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Project, TaskStep, BuildLog
from app.schemas import ProjectCreate, ProjectResponse, ProjectListResponse
from app.routers.auth import get_current_user
from app.models import User
from app.queue import redis_queue
from app.agent.orchestrator import orchestrator
from app.services.sandbox import sandbox_service

logger = logging.getLogger("projects")
router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project_id = str(uuid.uuid4())[:8]  # Simple clean id
    
    new_project = Project(
        id=project_id,
        user_id=current_user.id,
        name=data.name,
        prompt=data.prompt,
        project_type=data.project_type,
        status="PENDING"
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    # 1. Structure the steps list in the database via the Orchestrator
    plan_ok = orchestrator.plan_project(db, project_id, data.prompt)
    if not plan_ok:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate project structure checklist"
        )
        
    # 2. Enqueue the task into the background execution worker queue
    redis_queue.enqueue_project_build(project_id)
    
    # Refresh to include task steps in the response DTO
    db.refresh(new_project)
    return new_project

@router.get("", response_model=List[ProjectListResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.created_at.desc()).all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.get("/{project_id}/files")
def get_project_files(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    files = sandbox_service.list_files(project_id)
    return {"files": files}

@router.get("/{project_id}/file")
def get_file_content(
    project_id: str,
    path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    content = sandbox_service.read_file(project_id, path)
    return {"content": content, "path": path}

@router.websocket("/{project_id}/logs")
async def websocket_logs(websocket: WebSocket, project_id: str, db: Session = Depends(get_db)):
    """High-performance log streaming WebSocket. Sends active steps state and terminal logs in real-time."""
    await websocket.accept()
    logger.info(f"WebSocket client connected to project logs: {project_id}")
    
    last_log_id = 0
    
    try:
        while True:
            # 1. Fetch any logs created since last iteration
            logs = (
                db.query(BuildLog)
                .filter(BuildLog.project_id == project_id, BuildLog.id > last_log_id)
                .order_by(BuildLog.id.asc())
                .all()
            )
            
            # Send new logs
            for log in logs:
                await websocket.send_json({
                    "event": "log",
                    "data": {
                        "log_type": log.log_type,
                        "message": log.message,
                        "timestamp": log.created_at.isoformat()
                    }
                })
                last_log_id = log.id

            # 2. Fetch current status of all steps to update active checklists
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                steps_data = []
                for step in project.steps:
                    steps_data.append({
                        "step_number": step.step_number,
                        "title": step.title,
                        "description": step.description,
                        "status": step.status
                    })
                
                await websocket.send_json({
                    "event": "status",
                    "data": {
                        "project_status": project.status,
                        "repository_url": project.repository_url,
                        "deployment_url": project.deployment_url,
                        "steps": steps_data
                    }
                })

                # If build finished (success or failed), stream one final check and break connection safely
                if project.status in ["SUCCESS", "FAILED"]:
                    # Wait briefly to let remaining logs transmit
                    await asyncio.sleep(2)
                    await websocket.send_json({"event": "finished", "data": {"status": project.status}})
                    break

            # Sleep 1 second before querying new logs to save database traffic
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected from project logs: {project_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass
