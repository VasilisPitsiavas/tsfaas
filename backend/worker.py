"""
RQ worker entry point for background job processing.
Run with: rq worker --url redis://redis:6379 forecast
"""
import sys
from rq import Worker, Queue, Connection
from redis import Redis

from app.core.config import settings

if __name__ == "__main__":
    redis_conn = Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB
    )
    
    with Connection(redis_conn):
        worker = Worker(['forecast'])
        worker.work()

