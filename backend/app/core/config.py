"""Application configuration."""

import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API settings
    API_V1_PREFIX: str = "/api"

    # CORS settings
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:3001"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from string or list."""
        if isinstance(v, str):
            # Split by comma and strip whitespace
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Data directory for local file storage
    DATA_DIR: str = os.getenv("DATA_DIR", "./data")

    # Redis settings
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # Database settings (Postgres - for future use)
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/forecastly"
    
    # Supabase settings
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # Stripe settings (TEST MODE ONLY)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_ID: str = ""
    FRONTEND_URL: str = "http://localhost:3000"  # For Stripe redirect URLs

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
