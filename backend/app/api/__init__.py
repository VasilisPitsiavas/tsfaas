"""API routes package."""
from fastapi import APIRouter

from app.api import upload, forecast

router = APIRouter()

router.include_router(upload.router, prefix="/upload", tags=["upload"])
router.include_router(forecast.router, prefix="/forecast", tags=["forecast"])

