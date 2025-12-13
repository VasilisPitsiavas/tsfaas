"""Jobs listing API endpoint."""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import os
import json
import re
from datetime import datetime

from app.core.config import DATA_DIR
from app.queue.job_queue import get_job_status

router = APIRouter()


def sanitize_job_id(job_id: str) -> str:
    """Sanitize job_id to prevent path traversal attacks."""
    job_id = re.sub(r'[./\\]', '', job_id)
    job_id = re.sub(r'[^a-zA-Z0-9_-]', '', job_id)
    return job_id


@router.get("")
async def list_jobs(limit: int = 50, offset: int = 0) -> Dict[str, Any]:
    """
    List all forecast jobs.
    
    Args:
        limit: Maximum number of jobs to return (default: 50, max: 100)
        offset: Number of jobs to skip (for pagination)
        
    Returns:
        List of jobs with metadata and status
    """
    if limit > 100:
        limit = 100
    if limit < 1:
        limit = 50
    if offset < 0:
        offset = 0
    
    jobs = []
    
    if not os.path.exists(DATA_DIR):
        return {
            "jobs": [],
            "total": 0,
            "limit": limit,
            "offset": offset
        }
    
    # Scan all job folders
    for folder_name in os.listdir(DATA_DIR):
        job_folder = os.path.join(DATA_DIR, folder_name)
        
        # Skip if not a directory
        if not os.path.isdir(job_folder):
            continue
        
        # Skip if folder name doesn't look like a UUID
        if len(folder_name) != 36:  # UUID length
            continue
        
        metadata_path = os.path.join(job_folder, "metadata.json")
        if not os.path.exists(metadata_path):
            continue
        
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            job_id = metadata.get("job_id", folder_name)
            
            # Try to get forecast status if results exist
            results_path = os.path.join(job_folder, "results.json")
            error_path = os.path.join(job_folder, "error.json")
            
            status = "uploaded"
            forecast_id = None
            target_column = None
            model_used = None
            created_at = None
            
            # Check if there's a forecast result
            if os.path.exists(results_path):
                try:
                    with open(results_path, 'r') as f:
                        results = json.load(f)
                    status = "completed"
                    forecast_id = results.get("forecast_id")
                    model_used = results.get("model_used")
                    created_at = results.get("completed_at")
                except Exception:
                    pass
            
            # Check if there's an error
            elif os.path.exists(error_path):
                try:
                    with open(error_path, 'r') as f:
                        error_data = json.load(f)
                    status = "failed"
                    created_at = error_data.get("failed_at")
                except Exception:
                    pass
            
            # Try to get created_at from metadata or folder mtime
            if not created_at:
                try:
                    created_at = datetime.fromtimestamp(os.path.getmtime(metadata_path)).isoformat()
                except Exception:
                    created_at = datetime.now().isoformat()
            
            # Build job info
            job_info = {
                "job_id": job_id,
                "file_name": metadata.get("original_filename", "unknown.csv"),
                "status": status,
                "columns": metadata.get("columns", []),
                "created_at": created_at,
                "forecast_id": forecast_id,
                "target_column": target_column,
                "model_used": model_used
            }
            
            jobs.append(job_info)
            
        except Exception as e:
            # Skip jobs that can't be read
            continue
    
    # Sort by created_at descending (newest first)
    jobs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Apply pagination
    total = len(jobs)
    paginated_jobs = jobs[offset:offset + limit]
    
    return {
        "jobs": paginated_jobs,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/{job_id}")
async def get_job(job_id: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific job.
    
    Args:
        job_id: Job identifier
        
    Returns:
        Job information including metadata and status
    """
    sanitized_id = sanitize_job_id(job_id)
    
    if sanitized_id != job_id:
        raise HTTPException(status_code=400, detail="Invalid job_id format")
    
    job_folder = os.path.join(DATA_DIR, sanitized_id)
    metadata_path = os.path.join(job_folder, "metadata.json")
    
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Job not found")
    
    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Get status and forecast info
        results_path = os.path.join(job_folder, "results.json")
        error_path = os.path.join(job_folder, "error.json")
        
        status = "uploaded"
        forecast_id = None
        model_used = None
        metrics = None
        
        if os.path.exists(results_path):
            try:
                with open(results_path, 'r') as f:
                    results = json.load(f)
                status = "completed"
                forecast_id = results.get("forecast_id")
                model_used = results.get("model_used")
                metrics = results.get("metrics")
            except Exception:
                pass
        elif os.path.exists(error_path):
            status = "failed"
        
        # Try to get forecast status from RQ if forecast_id exists
        if forecast_id:
            try:
                rq_status = get_job_status(forecast_id)
                if rq_status:
                    rq_status_str = rq_status.get("status", "")
                    if rq_status_str in ["queued", "started"]:
                        status = "processing"
            except Exception:
                pass
        
        return {
            "job_id": sanitized_id,
            "file_name": metadata.get("original_filename"),
            "status": status,
            "columns": metadata.get("columns", []),
            "time_candidates": metadata.get("time_candidates", []),
            "preview": metadata.get("preview", []),
            "created_at": datetime.fromtimestamp(os.path.getmtime(metadata_path)).isoformat(),
            "forecast_id": forecast_id,
            "model_used": model_used,
            "metrics": metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading job: {str(e)}")
