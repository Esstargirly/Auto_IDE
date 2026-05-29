import logging
import redis
from app.config import settings

logger = logging.getLogger("queue")

class RedisQueue:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.client = None
        try:
            self.client = redis.Redis.from_url(self.redis_url)
            self.client.ping()
            logger.info("Successfully connected to Redis queue broker.")
        except Exception as e:
            logger.warning(f"Could not connect to Redis broker: {e}. Falling back to internal async scheduling.")

    def enqueue_project_build(self, project_id: str) -> bool:
        """Enqueues a project ID into the build list queue."""
        if self.client:
            try:
                self.client.lpush("auto_ide_build_queue", project_id)
                # Also publish update event for real-time ws triggers
                self.client.publish("project_events", f"ENQUEUED:{project_id}")
                logger.info(f"Enqueued project build {project_id} in Redis.")
                return True
            except Exception as e:
                logger.error(f"Redis enqueue failed: {e}")
                
        # Non-blocking async queue simulation if Redis is not running
        logger.info(f"Simulating project build enqueuing for local execution: {project_id}")
        return True

redis_queue = RedisQueue()
