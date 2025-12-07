"""Background worker for processing forecast jobs."""
from typing import Dict, Any
import os
import json
from rq import Job

from app.ml.models import ModelManager
from app.ml.preprocessing import load_and_prepare_timeseries
from app.storage.storage import get_file_from_storage
from app.core.config import DATA_DIR


def process_forecast_job(job_id: str, forecast_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a forecast job in the background.
    
    Args:
        job_id: Upload job ID
        forecast_config: Forecast configuration dictionary
        
    Returns:
        Forecast results including predictions and metrics
    """
    try:
        # Load job metadata to get file path
        job_folder = os.path.join(DATA_DIR, job_id)
        metadata_path = os.path.join(job_folder, "metadata.json")
        
        if not os.path.exists(metadata_path):
            raise ValueError(f"Job metadata not found for job_id: {job_id}")
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        file_path = metadata.get("file_path")
        if not file_path or not os.path.exists(file_path):
            # Try to get from storage
            file_path = get_file_from_storage(job_id)
        
        # Load and prepare time series using the preprocessing function
        time_column = forecast_config["time_column"]
        target_column = forecast_config["target_column"]
        
        df = load_and_prepare_timeseries(
            path=file_path,
            time_col=time_column,
            target_col=target_column,
            parse_dates=True
        )
        
        # Fit models
        model_manager = ModelManager()
        fitted_models = model_manager.fit_all(
            data=df,
            target_column="y",  # load_and_prepare_timeseries returns column named 'y'
            exogenous=forecast_config.get("exogenous")
        )
        
        # Compare models
        metrics = model_manager.compare_models(fitted_models)
        
        # Select best model
        best_model_name = model_manager.select_best_model(metrics)
        best_model = fitted_models[best_model_name]
        
        # Generate predictions
        horizon = forecast_config.get("horizon", 14)
        predictions = best_model.predict(horizon=horizon)
        
        # Prepare results
        results = {
            "forecast_id": forecast_config.get("forecast_id"),
            "job_id": job_id,
            "model_used": best_model_name,
            "predictions": predictions.tolist() if hasattr(predictions, 'tolist') else list(predictions),
            "metrics": metrics,
            "status": "completed"
        }
        
        # Save results to job folder
        results_path = os.path.join(job_folder, "results.json")
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        return results
        
    except Exception as e:
        error_result = {
            "forecast_id": forecast_config.get("forecast_id"),
            "job_id": job_id,
            "status": "failed",
            "error": str(e)
        }
        
        # Save error result
        try:
            job_folder = os.path.join(DATA_DIR, job_id)
            error_path = os.path.join(job_folder, "error.json")
            with open(error_path, 'w') as f:
                json.dump(error_result, f, indent=2)
        except Exception:
            pass
        
        return error_result

