"""
RQ worker entry point for background job processing.
"""

import sys
from rq import Worker, Queue, Connection
from redis import Redis

from app.core.config import settings

if __name__ == "__main__":
    connection_params = {
        "host": settings.REDIS_HOST,
        "port": settings.REDIS_PORT,
        "db": settings.REDIS_DB,
        "decode_responses": False,  # RQ needs bytes
    }
    
    # Add password if provided
    if settings.REDIS_PASSWORD:
        connection_params["password"] = settings.REDIS_PASSWORD
    
    redis_conn = Redis(**connection_params)

    print(f"Starting RQ worker connected to {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    print(f"Listening on queue: forecast")

    with Connection(redis_conn):
        worker = Worker(["forecast"], default_result_ttl=3600 * 24)
        worker.work()
