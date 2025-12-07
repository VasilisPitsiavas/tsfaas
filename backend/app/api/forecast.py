"""Forecast API endpoints with validation and security."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional
import os
import uuid
import re

from app.queue.job_queue import enqueue_forecast_job, get_job_status, get_job_result
from app.core.config import DATA_DIR


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
    job_id = re.sub(r'[./\\]', '', job_id)
    # Only allow alphanumeric, hyphens, underscores
    job_id = re.sub(r'[^a-zA-Z0-9_-]', '', job_id)
    return job_id


def validate_job_exists(job_id: str) -> bool:
    """
    Validate that a job exists and metadata is accessible.
    
    Args:
        job_id: Job identifier
        
    Returns:
        True if job exists and is valid
    """
    sanitized_id = sanitize_job_id(job_id)
    if sanitized_id != job_id:
        return False  # Job ID was modified, reject
    
    job_folder = os.path.join(DATA_DIR, sanitized_id)
    metadata_path = os.path.join(job_folder, "metadata.json")
    return os.path.exists(metadata_path)


class ForecastRequest(BaseModel):
    """Forecast request model."""
    job_id: str = Field(..., description="Upload job ID")
    time_column: str = Field(..., description="Time column name")
    target_column: str = Field(..., description="Target column name for forecasting")
    exogenous: Optional[List[str]] = Field(default=None, description="Optional exogenous columns")
    horizon: int = Field(default=14, ge=1, le=365, description="Forecast horizon (1-365)")
    model: str = Field(default="auto", description="Model to use: auto, arima, ets, xgboost")
    
    @validator('job_id')
    def validate_job_id(cls, v):
        """Validate and sanitize job_id."""
        sanitized = sanitize_job_id(v)
        if sanitized != v:
            raise ValueError("Invalid job_id format")
        
        # Check if job exists
        if not validate_job_exists(sanitized):
            raise ValueError("Job not found or invalid")
        
        return sanitized
    
    @validator('model')
    def validate_model(cls, v):
        """Validate model name."""
        allowed = ['auto', 'arima', 'ets', 'xgboost']
        if v.lower() not in allowed:
            raise ValueError(f"Model must be one of: {', '.join(allowed)}")
        return v.lower()
    
    @validator('time_column', 'target_column')
    def validate_column_names(cls, v):
        """Validate column names to prevent injection."""
        # Only allow alphanumeric, underscores, hyphens, spaces
        if not re.match(r'^[a-zA-Z0-9_\- ]+$', v):
            raise ValueError("Invalid column name format")
        return v


class ForecastResponse(BaseModel):
    """Forecast response model."""
    job_id: str
    forecast_id: str
    status: str  # "queued", "processing", "completed", "failed"
    message: Optional[str] = None


@router.post("", response_model=ForecastResponse)
async def create_forecast(request: ForecastRequest) -> ForecastResponse:
    """
    Create a new forecast job.
    
    Args:
        request: Forecast configuration
        
    Returns:
        Forecast job information
    """
    try:
        # Load metadata to validate columns exist
        job_folder = os.path.join(DATA_DIR, request.job_id)
        metadata_path = os.path.join(job_folder, "metadata.json")
        
        import json
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        available_columns = metadata.get('columns', [])
        
        # Validate columns exist
        if request.time_column not in available_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Time column '{request.time_column}' not found in uploaded CSV"
            )
        
        if request.target_column not in available_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{request.target_column}' not found in uploaded CSV"
            )
        
        if request.exogenous:
            missing = [col for col in request.exogenous if col not in available_columns]
            if missing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Exogenous columns not found: {', '.join(missing)}"
                )
        
        # Prepare forecast config
        forecast_config = {
            'time_column': request.time_column,
            'target_column': request.target_column,
            'exogenous': request.exogenous or [],
            'horizon': request.horizon,
            'model': request.model,
            'forecast_id': None  # Will be set by queue
        }
        
        # Enqueue job
        forecast_id = enqueue_forecast_job(request.job_id, forecast_config)
        
        # Update config with forecast_id
        forecast_config['forecast_id'] = forecast_id
        
        return ForecastResponse(
            job_id=request.job_id,
            forecast_id=forecast_id,
            status="queued",
            message="Forecast job queued successfully"
        )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create forecast job: {str(e)}")


@router.get("/{forecast_id}")
async def get_forecast(forecast_id: str) -> Dict[str, Any]:
    """
    Get forecast results.
    
    Args:
        forecast_id: Unique identifier for the forecast (RQ Job ID)
        
    Returns:
        Forecast results including predictions, metrics, and charts
    """
    # Sanitize forecast_id
    forecast_id = sanitize_job_id(forecast_id)
    
    # Try to get result from RQ
    result = get_job_result(forecast_id)
    
    if result is None:
        # Check if results exist in file system (fallback)
        # This happens if job completed but RQ result expired
        try:
            import json
            # Forecast_id is RQ job ID, but we need to find the job_id
            # For now, try to load from any job folder that has this forecast_id
            # In production, you'd want a mapping table
            results_path = None
            if os.path.exists(DATA_DIR):
                for folder in os.listdir(DATA_DIR):
                    job_folder = os.path.join(DATA_DIR, folder)
                    result_file = os.path.join(job_folder, "results.json")
                    if os.path.exists(result_file):
                        with open(result_file, 'r') as f:
                            data = json.load(f)
                            if data.get('forecast_id') == forecast_id:
                                results_path = result_file
                                result = data
                                break
            
            if results_path is None:
                raise HTTPException(status_code=404, detail="Forecast not found")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=404, detail="Forecast not found")
    
    if isinstance(result, dict) and result.get('status') == 'failed':
        raise HTTPException(status_code=500, detail=result.get('error', 'Forecast failed'))
    
    return result


@router.get("/{forecast_id}/status")
async def get_forecast_status(forecast_id: str) -> Dict[str, Any]:
    """
    Get forecast job status.
    
    Args:
        forecast_id: Unique identifier for the forecast (RQ Job ID)
        
    Returns:
        Status information
    """
    forecast_id = sanitize_job_id(forecast_id)
    
    status_info = get_job_status(forecast_id)
    
    if status_info is None:
        raise HTTPException(status_code=404, detail="Forecast job not found")
    
    return status_info
