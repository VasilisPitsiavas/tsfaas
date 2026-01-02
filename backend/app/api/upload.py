# backend/app/api/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
import tempfile
import os
import json
from typing import Dict, Any, List
from ..ml.preprocessing import analyze_csv_preview
from ..storage.supabase_storage import upload_to_supabase_storage, get_public_url
from ..utils.auth import require_auth, get_supabase_client

router = APIRouter()


@router.post("")
async def upload_csv(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
) -> JSONResponse:
    """
    Accept CSV upload, store it in Supabase Storage, create job record, return job_id, detected columns and preview rows.
    Requires authentication.
    """
    # Require authentication
    user = await require_auth(authorization)
    user_id = user["id"]

    filename = file.filename
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for now.")

    job_id = str(uuid.uuid4())
    
    # Read file bytes
    file_bytes = await file.read()
    
    # Upload to Supabase Storage: {user_id}/{job_id}/input.csv
    storage_path = f"{user_id}/{job_id}/input.csv"
    try:
        upload_to_supabase_storage(file_bytes, storage_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file to storage: {str(e)}")

    # Run light-weight analysis on a preview of the CSV
    # Save to temp file for analysis
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.csv', delete=False) as tmp:
            tmp.write(file_bytes)
            temp_file = tmp.name
        
        analysis = analyze_csv_preview(temp_file, nrows=10)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze CSV: {str(e)}")
    finally:
        # Clean up temp file
        if temp_file and os.path.exists(temp_file):
            os.unlink(temp_file)

    # Create job record in Supabase "jobs" table
    supabase = get_supabase_client()
    try:
        job_record = {
            "id": job_id,
            "user_id": user_id,
            "status": "pending",
            "input_file_path": storage_path,
            "columns": json.dumps(analysis.get("columns", [])),  # Store as JSON string
            "time_candidates": json.dumps(analysis.get("time_candidates", [])),
            "preview": json.dumps(analysis.get("preview", [])),
        }
        
        supabase.table("jobs").insert(job_record).execute()
    except Exception as e:
        # If job creation fails, try to clean up uploaded file
        try:
            from ..storage.supabase_storage import delete_from_supabase_storage
            delete_from_supabase_storage(storage_path)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to create job record: {str(e)}")

    # Get public URL for preview (optional)
    file_url = get_public_url(storage_path)

    response = {
        "job_id": job_id,
        "columns": analysis.get("columns", []),
        "time_candidates": analysis.get("time_candidates", []),
        "preview": analysis.get("preview", []),
        "file_url": file_url,
    }

    return JSONResponse(response)


@router.get("/{job_id}")
async def get_upload_info(
    job_id: str,
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Get information about an uploaded CSV file from Supabase jobs table.
    Requires authentication and verifies job ownership.

    Args:
        job_id: Unique identifier for the upload
        authorization: Authorization header with Bearer token

    Returns:
        Upload information including columns and preview
    """
    # Require authentication
    user = await require_auth(authorization)
    user_id = user["id"]

    import re

    # Sanitize job_id
    sanitized_id = re.sub(r"[./\\]", "", job_id)

    # Fetch job from Supabase
    supabase = get_supabase_client()
    try:
        response = supabase.table("jobs").select("*").eq("id", sanitized_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        job = response.data[0]
        
        # Verify job ownership
        job_user_id = job.get("user_id")
        if job_user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Parse JSON fields
        columns = json.loads(job.get("columns", "[]"))
        time_candidates = json.loads(job.get("time_candidates", "[]"))
        preview = json.loads(job.get("preview", "[]"))
        
        return {
            "job_id": sanitized_id,
            "columns": columns,
            "time_candidates": time_candidates,
            "preview": preview,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch job: {str(e)}")
