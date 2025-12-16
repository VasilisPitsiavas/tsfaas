# backend/app/api/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
import os
import json
from typing import Dict, Any, List
from ..ml.preprocessing import analyze_csv_preview
from ..storage.storage import save_file, get_presigned_url_if_needed
from ..core.config import DATA_DIR
from ..utils.auth import require_auth

router = APIRouter()

# Ensure DATA_DIR exists
os.makedirs(DATA_DIR, exist_ok=True)


@router.post("")
async def upload_csv(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
) -> JSONResponse:
    """
    Accept CSV upload, store it, return job_id, detected columns and preview rows.
    Requires authentication.
    """
    # Require authentication
    user = await require_auth(authorization)
    user_id = user["id"]

    filename = file.filename
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for now.")

    job_id = str(uuid.uuid4())
    # create a job-specific folder
    job_folder = os.path.join(DATA_DIR, job_id)
    os.makedirs(job_folder, exist_ok=True)
    file_path = os.path.join(job_folder, filename)

    # save file bytes - delegate to storage layer (supports S3 / local)
    file_bytes = await file.read()
    save_file(file_path, file_bytes)  # storage.save_file must accept (path, bytes)

    # run light-weight analysis on a preview of the CSV
    try:
        analysis = analyze_csv_preview(file_path, nrows=10)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze CSV: {str(e)}")

    # minimal job metadata (you can replace with DB later)
    metadata = {
        "job_id": job_id,
        "user_id": user_id,  # Attach user_id to job
        "original_filename": filename,
        "file_path": file_path,
        "columns": analysis.get("columns", []),
        "time_candidates": analysis.get("time_candidates", []),
        "preview": analysis.get("preview", []),
    }

    # save metadata to a json file for later retrieval by /forecast endpoint or worker
    meta_path = os.path.join(job_folder, "metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Optionally return a presigned URL for download/preview (if using S3)
    presigned_url = None
    try:
        presigned_url = get_presigned_url_if_needed(file_path)
    except Exception:
        presigned_url = None

    response = {
        "job_id": job_id,
        "columns": metadata["columns"],
        "time_candidates": metadata["time_candidates"],
        "preview": metadata["preview"],
        "file_url": presigned_url,
    }

    return JSONResponse(response)


@router.get("/{job_id}")
async def get_upload_info(
    job_id: str,
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Get information about an uploaded CSV file.
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

    job_folder = os.path.join(DATA_DIR, sanitized_id)
    metadata_path = os.path.join(job_folder, "metadata.json")

    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Upload not found")

    with open(metadata_path, "r") as f:
        metadata = json.load(f)

    # Verify job ownership
    job_user_id = metadata.get("user_id")
    if job_user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "job_id": sanitized_id,
        "columns": metadata.get("columns", []),
        "time_candidates": metadata.get("time_candidates", []),
        "preview": metadata.get("preview", []),
    }
