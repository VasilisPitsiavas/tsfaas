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

# CORS middleware - Apply IMMEDIATELY after creating the app (BEFORE all routes)
# Read allowed origins from environment variable CORS_ORIGINS
# Format: comma-separated list, e.g., "https://domain1.com,https://domain2.com"
cors_origins = settings.CORS_ORIGINS
if isinstance(cors_origins, str):
    # Split comma-separated string into list
    cors_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],  # Allow all headers for file uploads (mobile browsers send various headers)
    expose_headers=["*"],
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


@app.get("/test-cors")
async def test_cors():
    """Test endpoint to verify CORS headers are being sent."""
    cors_origins = settings.CORS_ORIGINS
    if isinstance(cors_origins, str):
        cors_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
    return {
        "status": "ok",
        "cors": "configured",
        "allowed_origins": cors_origins if isinstance(cors_origins, list) else [cors_origins]
    }
