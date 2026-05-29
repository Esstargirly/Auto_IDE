import time
import logging
from app.config import settings
from app.database import SessionLocal
from app.models import Project
from app.agent.orchestrator import orchestrator
from app.queue import redis_queue

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("worker")

class BackgroundWorker:
    def __init__(self):
        self.running = True
        logger.info("Initializing Autonomous Cloud IDE Background Task Worker...")
        self.recover_interrupted_builds()

    def recover_interrupted_builds(self):
        """Scans the Postgres database on startup for building projects that got interrupted."""
        logger.info("Running self-healing workflow recovery checks...")
        db = SessionLocal()
        try:
            # Find projects stuck in BUILDING or DEPLOYING states
            interrupted = db.query(Project).filter(
                Project.status.in_(["BUILDING", "DEPLOYING"])
            ).all()

            if interrupted:
                logger.info(f"Detected {len(interrupted)} interrupted project builds! Recovering workflows...")
                for project in interrupted:
                    logger.info(f"Recovering project {project.id} ({project.name}) - Resetting status to PENDING")
                    project.status = "PENDING"
                    db.commit()
                    # Re-enqueue in Redis queue
                    redis_queue.enqueue_project_build(project.id)
            else:
                logger.info("No interrupted build sequences found. Workspace healthy.")
        except Exception as e:
            logger.error(f"Error during self-healing workflow check: {e}")
        finally:
            db.close()

    def process_build(self, project_id: str):
        """Processes a single popped project build."""
        logger.info(f"Starting build worker process thread for project: {project_id}")
        try:
            success = orchestrator.execute_project(project_id)
            if success:
                logger.info(f"Successfully processed build for project {project_id}")
            else:
                logger.warning(f"Build failed or completed with errors for project {project_id}")
        except Exception as e:
            logger.error(f"Error processing project {project_id}: {e}")

    def run(self):
        """Starts the blocking pop or polling build listener loop."""
        logger.info("Background build worker process started and polling for incoming tasks...")
        
        while self.running:
            project_id = None
            
            # 1. Try to fetch from Redis blocking queue
            if redis_queue.client:
                try:
                    # Blocking pop with 2 seconds timeout
                    res = redis_queue.client.brpop("auto_ide_build_queue", timeout=2)
                    if res:
                        # returns (queue_name, value)
                        project_id = res[1].decode("utf-8")
                except Exception as e:
                    logger.error(f"Redis pop failed: {e}. Falling back to database polling.")
            
            # 2. Database polling fallback if Redis not connected or returned empty
            if not project_id:
                db = SessionLocal()
                try:
                    # Find next pending build
                    pending_project = db.query(Project).filter(Project.status == "PENDING").first()
                    if pending_project:
                        project_id = pending_project.id
                        # Lock in DB by setting status immediately
                        pending_project.status = "BUILDING"
                        db.commit()
                except Exception as e:
                    logger.error(f"Database build polling error: {e}")
                finally:
                    db.close()

            # 3. If project found, execute build sequence
            if project_id:
                self.process_build(project_id)
            else:
                # Rest if no jobs are enqueued
                time.sleep(1)

if __name__ == "__main__":
    worker = BackgroundWorker()
    try:
        worker.run()
    except KeyboardInterrupt:
        logger.info("Gracefully stopping background workers.")
        worker.running = False
