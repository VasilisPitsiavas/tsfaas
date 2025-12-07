"""Tests for API endpoints."""
import pytest
from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Test root endpoint returns health status."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_endpoint(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_upload_endpoint_not_implemented(client: TestClient):
    """Test upload endpoint returns 501 (not implemented)."""
    # TODO: Update when upload is implemented
    response = client.post("/api/upload", files={"file": ("test.csv", b"test")})
    assert response.status_code == 501


def test_forecast_endpoint_not_implemented(client: TestClient):
    """Test forecast endpoint returns 501 (not implemented)."""
    # TODO: Update when forecast is implemented
    response = client.post("/api/forecast", json={
        "job_id": "test-id",
        "time_column": "date",
        "target_column": "sales",
        "horizon": 14,
        "model": "auto"
    })
    assert response.status_code == 501

