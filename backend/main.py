"""
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router

# Create FastAPI app instance (ONLY ONE instance)
app = FastAPI(
    title="Forecastly API",
    description="Time Series Forecasting as a Service",
    version="0.1.0",
)

# CORS middleware - Apply IMMEDIATELY after creating the app (BEFORE all routes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tsfaas-forecastly.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
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
    return {
        "status": "ok",
        "cors": "configured",
        "allowed_origin": "https://tsfaas-forecastly.vercel.app"
    }
