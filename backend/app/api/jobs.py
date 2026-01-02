"""Jobs listing API endpoint."""

from fastapi import APIRouter, HTTPException, Header
from typing import List, Dict, Any, Optional
import os
import json
import re
from datetime import datetime

from app.queue.job_queue import get_job_status
from app.utils.auth import require_auth, get_supabase_client

router = APIRouter()


def sanitize_job_id(job_id: str) -> str:
    """Sanitize job_id to prevent path traversal attacks."""
    job_id = re.sub(r"[./\\]", "", job_id)
    job_id = re.sub(r"[^a-zA-Z0-9_-]", "", job_id)
    return job_id


@router.get("")
async def list_jobs(
    limit: int = 50,
    offset: int = 0,
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    List forecast jobs for the authenticated user.

    Args:
        limit: Maximum number of jobs to return (default: 50, max: 100)
        offset: Number of jobs to skip (for pagination)
        authorization: Authorization header with Bearer token

    Returns:
        List of jobs with metadata and status (user-scoped)
    """
    # Require authentication
    user = await require_auth(authorization)
    user_id = user["id"]

    if limit > 100:
        limit = 100
    if limit < 1:
        limit = 50
    if offset < 0:
        offset = 0

    # Fetch jobs from Supabase
    supabase = get_supabase_client()
    try:
        # Query jobs for this user, ordered by created_at descending
        response = supabase.table("jobs").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        jobs = []
        for job in response.data:
            job_id = job.get("id")
            status = job.get("status", "pending")
            forecast_id = job.get("forecast_id")
            model_used = job.get("model_used")
            created_at = job.get("created_at")
            
            # Parse JSON fields
            columns = []
            try:
                columns_str = job.get("columns")
                if columns_str:
                    columns = json.loads(columns_str) if isinstance(columns_str, str) else columns_str
            except Exception:
                pass
            
            # Extract filename from input_file_path if available
            file_name = "unknown.csv"
            input_file_path = job.get("input_file_path", "")
            if input_file_path:
                # Path format: {user_id}/{job_id}/input.csv
                parts = input_file_path.split("/")
                if len(parts) >= 3:
                    # Try to get original filename from path or use default
                    file_name = parts[-1] if parts[-1] != "input.csv" else "uploaded_file.csv"
            
            # Check RQ status if forecast_id exists and status is pending/processing
            if forecast_id and status in ["pending", "processing"]:
                try:
                    rq_status = get_job_status(forecast_id)
                    if rq_status:
                        rq_status_str = rq_status.get("status", "")
                        if rq_status_str in ["queued", "started"]:
                            status = "processing"
                        elif rq_status_str == "finished":
                            status = "completed"
                        elif rq_status_str == "failed":
                            status = "failed"
                except Exception:
                    pass
            
            # Map status to frontend expected values
            # Supabase: "pending" -> Frontend: "uploaded"
            if status == "pending":
                status = "uploaded"
            
            job_info = {
                "job_id": job_id,
                "file_name": file_name,
                "status": status,
                "columns": columns,
                "created_at": created_at,
                "forecast_id": forecast_id,
                "target_column": None,  # Not stored in jobs table
                "model_used": model_used,
            }
            
            jobs.append(job_info)
            
    except Exception as e:
        # If Supabase query fails, return empty list
        return {"jobs": [], "total": 0, "limit": limit, "offset": offset, "error": str(e)}

    # Apply pagination
    total = len(jobs)
    paginated_jobs = jobs[offset : offset + limit]

    return {"jobs": paginated_jobs, "total": total, "limit": limit, "offset": offset}


@router.get("/{job_id}")
async def get_job(
    job_id: str,
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Get detailed information about a specific job.
    Requires authentication and verifies job ownership.

    Args:
        job_id: Job identifier
        authorization: Authorization header with Bearer token

    Returns:
        Job information including metadata and status
    """
    # Require authentication
    user = await require_auth(authorization)
    user_id = user["id"]

    sanitized_id = sanitize_job_id(job_id)

    if sanitized_id != job_id:
        raise HTTPException(status_code=400, detail="Invalid job_id format")

    # Fetch job from Supabase
    supabase = get_supabase_client()
    try:
        response = supabase.table("jobs").select("*").eq("id", sanitized_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = response.data[0]
        
        # Verify job ownership
        job_user_id = job.get("user_id")
        if job_user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        status = job.get("status", "pending")
        forecast_id = job.get("forecast_id")
        model_used = job.get("model_used")
        
        # Parse JSON fields
        columns = []
        time_candidates = []
        preview = []
        metrics = None
        
        try:
            columns_str = job.get("columns")
            if columns_str:
                columns = json.loads(columns_str) if isinstance(columns_str, str) else columns_str
        except Exception:
            pass
        
        try:
            time_candidates_str = job.get("time_candidates")
            if time_candidates_str:
                time_candidates = json.loads(time_candidates_str) if isinstance(time_candidates_str, str) else time_candidates_str
        except Exception:
            pass
        
        try:
            preview_str = job.get("preview")
            if preview_str:
                preview = json.loads(preview_str) if isinstance(preview_str, str) else preview_str
        except Exception:
            pass
        
        try:
            metrics_data = job.get("metrics")
            if metrics_data:
                metrics = metrics_data if isinstance(metrics_data, dict) else json.loads(metrics_data) if isinstance(metrics_data, str) else None
        except Exception:
            pass
        
        # Map status to frontend expected values
        if status == "pending":
            status = "uploaded"
        
        # Check RQ status if forecast_id exists
        if forecast_id and status in ["pending", "processing"]:
            try:
                rq_status = get_job_status(forecast_id)
                if rq_status:
                    rq_status_str = rq_status.get("status", "")
                    if rq_status_str in ["queued", "started"]:
                        status = "processing"
                    elif rq_status_str == "finished":
                        status = "completed"
                    elif rq_status_str == "failed":
                        status = "failed"
            except Exception:
                pass
        
        # Extract filename from input_file_path
        file_name = "unknown.csv"
        input_file_path = job.get("input_file_path", "")
        if input_file_path:
            parts = input_file_path.split("/")
            if len(parts) >= 3:
                file_name = parts[-1] if parts[-1] != "input.csv" else "uploaded_file.csv"
        
        return {
            "job_id": sanitized_id,
            "file_name": file_name,
            "status": status,
            "columns": columns,
            "time_candidates": time_candidates,
            "preview": preview,
            "created_at": job.get("created_at"),
            "forecast_id": forecast_id,
            "model_used": model_used,
            "metrics": metrics,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading job: {str(e)}")
