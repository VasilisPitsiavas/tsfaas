"""Pytest configuration and fixtures."""
import sys
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    """FastAPI test client fixture."""
    return TestClient(app)


@pytest.fixture
def sample_csv_data():
    """Sample CSV data for testing."""
    return """date,sales,visitors
2023-01-01,100,50
2023-01-02,120,55
2023-01-03,110,52
2023-01-04,130,60
2023-01-05,125,58
"""

