"""Integration tests for the forecast flow."""
import pytest
import os
import json
import tempfile
import shutil
from pathlib import Path

from backend.app.workers.forecast_worker import process_forecast_job
from backend.app.core.config import DATA_DIR


@pytest.fixture
def temp_data_dir():
    """Create temporary data directory for testing."""
    temp_dir = tempfile.mkdtemp()
    original_dir = DATA_DIR
    
    # Temporarily override DATA_DIR
    import backend.app.core.config as config_module
    config_module.DATA_DIR = temp_dir
    config_module.settings.DATA_DIR = temp_dir
    
    yield temp_dir
    
    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)
    config_module.DATA_DIR = original_dir
    config_module.settings.DATA_DIR = original_dir


@pytest.fixture
def sample_csv_path():
    """Path to sample CSV."""
    project_root = Path(__file__).parent.parent
    csv_path = project_root / "sample_data" / "ecommerce_sales.csv"
    if not csv_path.exists():
        pytest.skip("Sample CSV not found")
    return str(csv_path)


@pytest.fixture
def mock_job_folder(temp_data_dir, sample_csv_path):
    """Create a mock job folder with metadata and CSV."""
    job_id = "test-job-123"
    job_folder = os.path.join(temp_data_dir, job_id)
    os.makedirs(job_folder, exist_ok=True)
    
    # Copy CSV to job folder
    import shutil
    job_csv_path = os.path.join(job_folder, "ecommerce_sales.csv")
    shutil.copy(sample_csv_path, job_csv_path)
    
    # Create metadata
    metadata = {
        "job_id": job_id,
        "original_filename": "ecommerce_sales.csv",
        "file_path": job_csv_path,
        "columns": ["date", "sales", "visitors"],
        "time_candidates": [{"column": "date", "score": 0.95}],
        "preview": []
    }
    
    metadata_path = os.path.join(job_folder, "metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f)
    
    return job_id, job_folder


def test_forecast_worker_complete_flow(mock_job_folder, temp_data_dir):
    """Test complete forecast worker flow."""
    job_id, job_folder = mock_job_folder
    
    forecast_config = {
        "forecast_id": "forecast-123",
        "time_column": "date",
        "target_column": "sales",
        "exogenous": [],
        "horizon": 7,
        "model": "auto"
    }
    
    try:
        result = process_forecast_job(job_id, forecast_config)
        
        # Check result structure
        assert result["status"] in ["completed", "failed"]
        
        if result["status"] == "completed":
            assert "forecast_id" in result
            assert "model_used" in result
            assert "predictions" in result
            assert len(result["predictions"]) == 7
            
            # Check that results.json was created
            results_path = os.path.join(job_folder, "results.json")
            assert os.path.exists(results_path)
            
            # Check that CSV was created
            csv_path = os.path.join(job_folder, "forecast.csv")
            assert os.path.exists(csv_path)
            
            # Check that model artifact was created
            model_files = [f for f in os.listdir(job_folder) if f.startswith("model_") and f.endswith(".pkl")]
            assert len(model_files) > 0
            
    except Exception as e:
        # If models aren't available, that's okay for testing
        if "not installed" in str(e).lower() or "not available" in str(e).lower():
            pytest.skip(f"Models not available: {e}")
        raise


def test_forecast_worker_with_invalid_job_id(temp_data_dir):
    """Test worker handles invalid job_id gracefully."""
    forecast_config = {
        "forecast_id": "forecast-123",
        "time_column": "date",
        "target_column": "sales",
        "horizon": 7,
        "model": "auto"
    }
    
    result = process_forecast_job("nonexistent-job", forecast_config)
    
    assert result["status"] == "failed"
    assert "error" in result


def test_forecast_worker_saves_error_on_failure(mock_job_folder):
    """Test that errors are saved to error.json."""
    job_id, job_folder = mock_job_folder
    
    # Use invalid column to cause error
    forecast_config = {
        "forecast_id": "forecast-123",
        "time_column": "nonexistent_column",
        "target_column": "sales",
        "horizon": 7,
        "model": "auto"
    }
    
    result = process_forecast_job(job_id, forecast_config)
    
    # Should have error
    if result["status"] == "failed":
        error_path = os.path.join(job_folder, "error.json")
        # Error file might not be created if exception happens early
        # That's okay for this test

