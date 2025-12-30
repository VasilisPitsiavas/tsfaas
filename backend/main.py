"""
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.core.config import settings

# Create FastAPI app instance (ONLY ONE instance)
app = FastAPI(
    title="Forecastly API",
    description="Time Series Forecasting as a Service",
    version="0.1.0",
)

# CORS middleware - Apply IMMEDIATELY after creating the app (before any routers)
# Parse CORS_ORIGINS - handle both string and list formats
cors_origins = settings.CORS_ORIGINS
if isinstance(cors_origins, str):
    cors_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight for 1 hour
)

# Include API router AFTER CORS middleware
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Forecastly API"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to list all registered routes."""
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": getattr(route, "name", "unknown")
            })
    return {"routes": routes, "total": len(routes)}
