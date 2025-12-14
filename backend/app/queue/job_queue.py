"""Job queue management using Redis and RQ."""

from typing import Dict, Any, Optional
from rq import Queue
from rq.job import Job
from redis import Redis

from app.core.config import settings


def get_redis_connection() -> Redis:
    """
    Get Redis connection.

    Returns:
        Redis connection instance
    """
    return Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=False,  # RQ needs bytes
    )


def get_queue(name: str = "forecast") -> Queue:
    """
    Get RQ queue instance.

    Args:
        name: Queue name

    Returns:
        RQ Queue instance
    """
    redis_conn = get_redis_connection()
    return Queue(name, connection=redis_conn, default_timeout=settings.JOB_TIMEOUT)


def enqueue_forecast_job(job_id: str, forecast_config: Dict[str, Any]) -> str:
    """
    Enqueue a forecast job.

    Args:
        job_id: Upload job ID
        forecast_config: Forecast configuration

    Returns:
        RQ Job ID (forecast_id)
    """
    from app.workers.forecast_worker import process_forecast_job

    queue = get_queue()

    # Add job_id to config
    forecast_config["job_id"] = job_id

    # Generate forecast_id (use RQ job ID)
    job = queue.enqueue(
        process_forecast_job,
        job_id,
        forecast_config,
        job_timeout=settings.JOB_TIMEOUT,
        result_ttl=3600 * 24,  # Keep results for 24 hours
        failure_ttl=3600 * 24,
    )

    return job.id


def get_job_status(forecast_id: str) -> Optional[Dict[str, Any]]:
    """
    Get status of a background job.

    Args:
        forecast_id: RQ Job ID

    Returns:
        Job status information
    """
    try:
        queue = get_queue()
        job = Job.fetch(forecast_id, connection=queue.connection)

        status_info = {
            "status": job.get_status(),
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "ended_at": job.ended_at.isoformat() if job.ended_at else None,
            "exc_info": str(job.exc_info) if job.exc_info else None,
        }

        return status_info
    except Exception:
        return None


def get_job_result(forecast_id: str) -> Optional[Dict[str, Any]]:
    """
    Get result of a completed job.

    Args:
        forecast_id: RQ Job ID

    Returns:
        Job result if available
    """
    try:
        queue = get_queue()
        job = Job.fetch(forecast_id, connection=queue.connection)

        if job.is_finished:
            return job.result
        elif job.is_failed:
            return {"status": "failed", "error": str(job.exc_info)}
        else:
            return None
    except Exception:
        return None
