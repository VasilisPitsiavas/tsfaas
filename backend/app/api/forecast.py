"""Forecast API endpoints with validation and security."""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional
import os
import uuid
import re
import json

from app.queue.job_queue import enqueue_forecast_job, get_job_status, get_job_result
from app.core.config import DATA_DIR
from app.utils.auth import require_auth

router = APIRouter()


def sanitize_job_id(job_id: str) -> str:
    """
    Sanitize job_id to prevent path traversal attacks.

    Args:
        job_id: Job identifier

    Returns:
        Sanitized job_id
    """
    # Remove any path traversal attempts
    job_id = re.sub(r"[./\\]", "", job_id)
    # Only allow alphanumeric, hyphens, underscores
    job_id = re.sub(r"[^a-zA-Z0-9_-]", "", job_id)
    return job_id


def validate_job_exists(job_id: str) -> bool:
    """
    Validate that a job exists in Supabase.

    Args:
        job_id: Job identifier

    Returns:
        True if job exists and is valid
    """
    try:
        sanitized_id = sanitize_job_id(job_id)
        if sanitized_id != job_id:
            return False  # Job ID was modified, reject
        
        from app.utils.auth import get_supabase_client
        supabase = get_supabase_client()
        
        response = supabase.table("jobs").select("id").eq("id", sanitized_id).execute()
        return response.data is not None and len(response.data) > 0
    except Exception:
        return False


class ForecastRequest(BaseModel):
    """Forecast request model."""

    job_id: str = Field(..., description="Upload job ID")
    time_column: str = Field(..., description="Time column name")
    target_column: str = Field(..., description="Target column name for forecasting")
    exogenous: Optional[List[str]] = Field(default=None, description="Optional exogenous columns")
    horizon: int = Field(default=14, ge=1, le=365, description="Forecast horizon (1-365)")
    model: str = Field(default="auto", description="Model to use: auto, arima, ets, xgboost")

    @validator("job_id")
    def validate_job_id(cls, v):
        """Validate and sanitize job_id."""
        sanitized = sanitize_job_id(v)
        if sanitized != v:
            raise ValueError("Invalid job_id format")

        # Check if job exists
        if not validate_job_exists(sanitized):
            raise ValueError("Job not found or invalid")

        return sanitized

    @validator("model")
    def validate_model(cls, v):
        """Validate model name."""
        allowed = ["auto", "arima", "ets", "xgboost"]
        if v.lower() not in allowed:
            raise ValueError(f"Model must be one of: {', '.join(allowed)}")
        return v.lower()

    @validator("time_column", "target_column")
    def validate_column_names(cls, v):
        """Validate column names to prevent injection."""
        # Only allow alphanumeric, underscores, hyphens, spaces
        if not re.match(r"^[a-zA-Z0-9_\- ]+$", v):
            raise ValueError("Invalid column name format")
        return v


class ForecastResponse(BaseModel):
    """Forecast response model."""

    job_id: str
    forecast_id: str
    status: str  # "queued", "processing", "completed", "failed"
    message: Optional[str] = None


@router.post("", response_model=ForecastResponse)
async def create_forecast(
    request: ForecastRequest,
    authorization: Optional[str] = Header(None)
) -> ForecastResponse:
    """
    Create a new forecast job.
    Requires authentication and verifies job ownership.

    Args:
        request: Forecast configuration
        authorization: Authorization header with Bearer token

    Returns:
        Forecast job information
    """
    # Require authentication
    user = await require_auth(authorization)
    user_id = user["id"]

    try:
        # Fetch job from Supabase to validate columns and verify ownership
        from app.utils.auth import get_supabase_client
        supabase = get_supabase_client()
        
        job_response = supabase.table("jobs").select("*").eq("id", request.job_id).execute()
        
        if not job_response.data or len(job_response.data) == 0:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = job_response.data[0]
        
        # Verify job ownership
        job_user_id = job.get("user_id")
        if job_user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Parse columns from JSON string
        import json
        available_columns = json.loads(job.get("columns", "[]"))

        # Validate columns exist
        if request.time_column not in available_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Time column '{request.time_column}' not found in uploaded CSV",
            )

        if request.target_column not in available_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{request.target_column}' not found in uploaded CSV",
            )

        if request.exogenous:
            missing = [col for col in request.exogenous if col not in available_columns]
            if missing:
                raise HTTPException(
                    status_code=400, detail=f"Exogenous columns not found: {', '.join(missing)}"
                )
        
        # Prepare forecast config (worker will fetch job from Supabase)
        forecast_config = {
            "time_column": request.time_column,
            "target_column": request.target_column,
            "exogenous": request.exogenous or [],
            "horizon": request.horizon,
            "model": request.model,
            "forecast_id": None,  # Will be set by queue
            "user_id": user_id,  # Include user_id for ownership verification
        }

        # Enqueue job
        forecast_id = enqueue_forecast_job(request.job_id, forecast_config)

        # Update config with forecast_id
        forecast_config["forecast_id"] = forecast_id

        return ForecastResponse(
            job_id=request.job_id,
            forecast_id=forecast_id,
            status="queued",
            message="Forecast job queued successfully",
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create forecast job: {str(e)}")


@router.get("/{forecast_id}")
async def get_forecast(
    forecast_id: str,
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Get forecast results.
    Requires authentication and verifies job ownership.

    Args:
        forecast_id: Unique identifier for the forecast (RQ Job ID)
        authorization: Authorization header with Bearer token

    Returns:
        Forecast results including predictions, metrics, and charts
    """
    # Require authentication
    user = await require_auth(authorization)
    user_id = user["id"]

    # Sanitize forecast_id
    forecast_id = sanitize_job_id(forecast_id)

    # Try to get result from RQ
    result = get_job_result(forecast_id)

    # If result not in RQ cache, fetch from Supabase Storage
    if result is None:
        # Find job by forecast_id in Supabase jobs table
        from app.utils.auth import get_supabase_client
        supabase = get_supabase_client()
        
        try:
            job_response = supabase.table("jobs").select("*").eq("forecast_id", forecast_id).execute()
            
            if not job_response.data or len(job_response.data) == 0:
                raise HTTPException(status_code=404, detail="Forecast not found")
            
            job = job_response.data[0]
            job_user_id = job.get("user_id")
            
            # Verify ownership
            if job_user_id != user_id:
                raise HTTPException(status_code=403, detail="Access denied")
            
            # Check if job is completed
            job_status = job.get("status")
            if job_status != "completed":
                raise HTTPException(status_code=404, detail=f"Forecast not completed. Status: {job_status}")
            
            # Download results from Supabase Storage
            output_file_path = job.get("output_file_path")
            if not output_file_path:
                raise HTTPException(status_code=404, detail="Forecast results not found")
            
            from app.storage.supabase_storage import download_from_supabase_storage
            results_bytes = download_from_supabase_storage(output_file_path)
            result = json.loads(results_bytes.decode('utf-8'))
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch forecast results: {str(e)}")
    else:
        # Result came from RQ cache - verify ownership
        result_job_id = result.get("job_id")
        if result_job_id:
            # Verify ownership from Supabase jobs table
            from app.utils.auth import get_supabase_client
            supabase = get_supabase_client()
            
            try:
                job_response = supabase.table("jobs").select("user_id").eq("id", result_job_id).execute()
                if job_response.data and len(job_response.data) > 0:
                    job_user_id = job_response.data[0].get("user_id")
                    if job_user_id != user_id:
                        raise HTTPException(status_code=403, detail="Access denied")
                else:
                    raise HTTPException(status_code=404, detail="Job not found")
            except HTTPException:
                raise
            except Exception:
                # Fallback: check user_id in result
                result_user_id = result.get("user_id")
                if result_user_id and result_user_id != user_id:
                    raise HTTPException(status_code=403, detail="Access denied")
        else:
            raise HTTPException(status_code=500, detail="Invalid result format: missing job_id")

    if isinstance(result, dict) and result.get("status") == "failed":
        raise HTTPException(status_code=500, detail=result.get("error", "Forecast failed"))

    # Ensure result is a dict
    if not isinstance(result, dict):
        raise HTTPException(status_code=500, detail=f"Invalid result format: {type(result)}")

    return result


@router.get("/{forecast_id}/status")
async def get_forecast_status(
    forecast_id: str,
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Get forecast job status.
    Requires authentication and verifies job ownership.

    Args:
        forecast_id: Unique identifier for the forecast (RQ Job ID)
        authorization: Authorization header with Bearer token

    Returns:
        Status information
    """
    # Require authentication
    user = await require_auth(authorization)
    user_id = user["id"]

    forecast_id = sanitize_job_id(forecast_id)

    status_info = get_job_status(forecast_id)

    if status_info is None:
        raise HTTPException(status_code=404, detail="Forecast job not found")

    return status_info
