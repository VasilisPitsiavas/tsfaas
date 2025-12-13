"""API routes package."""
from fastapi import APIRouter

from app.api import upload, forecast, jobs

router = APIRouter()

router.include_router(upload.router, prefix="/upload", tags=["upload"])
router.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])

