"""Supabase Storage utilities for file operations."""

from typing import Optional, BinaryIO
import io
from supabase import Client
from app.utils.auth import get_supabase_client
from app.core.config import settings


def get_storage_bucket() -> str:
    """Get the storage bucket name."""
    return "forecast-uploads"


def upload_to_supabase_storage(
    file_bytes: bytes,
    storage_path: str,
    bucket: Optional[str] = None
) -> str:
    """
    Upload file bytes to Supabase Storage.
    
    Args:
        file_bytes: File content as bytes
        storage_path: Path in storage (e.g., "{user_id}/{job_id}/input.csv")
        bucket: Bucket name (defaults to "forecast-uploads")
    
    Returns:
        Storage path
    """
    supabase = get_supabase_client()
    bucket_name = bucket or get_storage_bucket()
    
    # Upload file
    supabase.storage.from_(bucket_name).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "text/csv", "upsert": "true"}
    )
    
    return storage_path


def download_from_supabase_storage(
    storage_path: str,
    bucket: Optional[str] = None
) -> bytes:
    """
    Download file from Supabase Storage.
    
    Args:
        storage_path: Path in storage (e.g., "{user_id}/{job_id}/input.csv")
        bucket: Bucket name (defaults to "forecast-uploads")
    
    Returns:
        File content as bytes
    """
    supabase = get_supabase_client()
    bucket_name = bucket or get_storage_bucket()
    
    # Download file
    response = supabase.storage.from_(bucket_name).download(storage_path)
    
    return response


def get_public_url(
    storage_path: str,
    bucket: Optional[str] = None,
    expires_in: int = 3600
) -> Optional[str]:
    """
    Get public URL for a file in Supabase Storage.
    
    Args:
        storage_path: Path in storage
        bucket: Bucket name (defaults to "forecast-uploads")
        expires_in: URL expiration time in seconds
    
    Returns:
        Public URL or None if not available
    """
    try:
        supabase = get_supabase_client()
        bucket_name = bucket or get_storage_bucket()
        
        # Get public URL
        response = supabase.storage.from_(bucket_name).get_public_url(
            path=storage_path
        )
        return response
    except Exception:
        return None


def delete_from_supabase_storage(
    storage_path: str,
    bucket: Optional[str] = None
) -> bool:
    """
    Delete file from Supabase Storage.
    
    Args:
        storage_path: Path in storage
        bucket: Bucket name (defaults to "forecast-uploads")
    
    Returns:
        True if deletion was successful
    """
    try:
        supabase = get_supabase_client()
        bucket_name = bucket or get_storage_bucket()
        
        supabase.storage.from_(bucket_name).remove([storage_path])
        return True
    except Exception:
        return False

