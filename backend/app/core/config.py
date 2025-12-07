"""Application configuration."""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API settings
    API_V1_PREFIX: str = "/api"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Data directory for local file storage
    DATA_DIR: str = os.getenv("DATA_DIR", "./data")
    
    # Redis settings
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Database settings (Postgres - for future use)
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/forecastly"
    
    # Storage settings (MinIO/S3)
    STORAGE_ENDPOINT: str = "http://minio:9000"
    STORAGE_ACCESS_KEY: str = "minioadmin"
    STORAGE_SECRET_KEY: str = "minioadmin"
    STORAGE_BUCKET: str = "forecastly-uploads"
    STORAGE_USE_SSL: bool = False
    
    # Job settings
    JOB_TIMEOUT: int = 3600  # 1 hour in seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Export DATA_DIR as a module-level constant for convenience
DATA_DIR = settings.DATA_DIR

