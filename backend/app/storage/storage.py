"""Storage utilities for S3/MinIO file operations."""
from typing import BinaryIO, Optional
import os
import boto3
from botocore.client import Config

from app.core.config import settings


def get_s3_client():
    """
    Get configured S3 client (works with MinIO).
    
    Returns:
        Configured boto3 S3 client
    """
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.STORAGE_ENDPOINT,
        aws_access_key_id=settings.STORAGE_ACCESS_KEY,
        aws_secret_access_key=settings.STORAGE_SECRET_KEY,
        config=Config(signature_version='s3v4'),
        use_ssl=settings.STORAGE_USE_SSL
    )
    return s3_client


def save_file(path: str, file_bytes: bytes) -> None:
    """
    Save file bytes to storage (local filesystem or S3/MinIO).
    
    Args:
        path: Local file path or S3 object key
        file_bytes: File content as bytes
    """
    # For local development: use filesystem
    # For production: use S3/MinIO
    
    # Check if using S3/MinIO (if path doesn't start with / or ./)
    if settings.STORAGE_ENDPOINT and not path.startswith(('/', './')):
        # Upload to S3/MinIO
        s3_client = get_s3_client()
        s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET,
            Key=path,
            Body=file_bytes
        )
    else:
        # Save to local filesystem
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb') as f:
            f.write(file_bytes)


def get_presigned_url_if_needed(path: str, expiration: int = 3600) -> Optional[str]:
    """
    Get presigned URL for S3/MinIO objects, or None for local files.
    
    Args:
        path: Object key or file path
        expiration: URL expiration time in seconds
        
    Returns:
        Presigned URL string if using S3/MinIO, None for local files
    """
    # If using S3/MinIO and path is not a local filesystem path
    if settings.STORAGE_ENDPOINT and not path.startswith(('/', './')):
        try:
            s3_client = get_s3_client()
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.STORAGE_BUCKET, 'Key': path},
                ExpiresIn=expiration
            )
            return url
        except Exception:
            return None
    # For local development, return None (no presigned URL needed)
    return None


def get_file_from_storage(object_key: str) -> str:
    """
    Retrieve a file path from storage.
    For local files, returns the path directly.
    For S3/MinIO, downloads to temp location and returns path.
    
    Args:
        object_key: Key/path of the object in storage
        
    Returns:
        Local file path to the downloaded file
    """
    # If using S3/MinIO
    if settings.STORAGE_ENDPOINT and not object_key.startswith(('/', './')):
        # Download from S3/MinIO to temp location
        import tempfile
        s3_client = get_s3_client()
        temp_path = os.path.join(tempfile.gettempdir(), os.path.basename(object_key))
        s3_client.download_file(
            settings.STORAGE_BUCKET,
            object_key,
            temp_path
        )
        return temp_path
    else:
        # Local file - return path as-is
        return object_key


def delete_file(object_key: str) -> bool:
    """
    Delete a file from S3/MinIO storage or local filesystem.
    
    Args:
        object_key: Key/path of the object in storage
        
    Returns:
        True if deletion was successful
    """
    try:
        if settings.STORAGE_ENDPOINT and not object_key.startswith(('/', './')):
            # Delete from S3/MinIO
            s3_client = get_s3_client()
            s3_client.delete_object(
                Bucket=settings.STORAGE_BUCKET,
                Key=object_key
            )
        else:
            # Delete from local filesystem
            if os.path.exists(object_key):
                os.remove(object_key)
        return True
    except Exception:
        return False


def upload_file(file_obj: BinaryIO, object_key: str) -> str:
    """
    Upload a file to S3/MinIO storage (legacy method, use save_file instead).
    
    Args:
        file_obj: File-like object to upload
        object_key: Key/path for the object in storage
        
    Returns:
        URL or identifier of uploaded file
    """
    file_bytes = file_obj.read()
    save_file(object_key, file_bytes)
    return object_key
