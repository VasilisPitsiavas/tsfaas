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


def test_upload_endpoint_accepts_csv(client: TestClient):
    """Test upload endpoint accepts CSV files."""
    csv_content = b"date,sales\n2023-01-01,100\n2023-01-02,120"
    response = client.post("/api/upload", files={"file": ("test.csv", csv_content, "text/csv")})
    # Should return 200 with job_id and columns
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert "columns" in data


def test_forecast_endpoint_validates_input(client: TestClient):
    """Test forecast endpoint validates input properly."""
    # Test with invalid job_id format (should return 422 validation error)
    response = client.post("/api/forecast", json={
        "job_id": "invalid-job-id-format!",
        "time_column": "date",
        "target_column": "sales",
        "horizon": 14,
        "model": "auto"
    })
    # Should return 422 (validation error) for invalid job_id format
    assert response.status_code == 422

