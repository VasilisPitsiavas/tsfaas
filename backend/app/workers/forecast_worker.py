"""Background worker for processing forecast jobs with full export support."""

from typing import Dict, Any, Optional
import os
import json
import tempfile
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings("ignore")

from app.ml.model_manager import ModelManager
from app.ml.preprocessing import load_and_prepare_timeseries
from app.storage.supabase_storage import download_from_supabase_storage, upload_to_supabase_storage
from app.utils.auth import get_supabase_client

# Chart generation (optional, skip if matplotlib not available)
try:
    import matplotlib

    matplotlib.use("Agg")  # Non-interactive backend
    import matplotlib.pyplot as plt

    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False


def process_forecast_job(job_id: str, forecast_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a forecast job in the background.
    Fetches job from Supabase, downloads file from Supabase Storage,
    processes forecast, uploads results, and updates job record.

    Args:
        job_id: Upload job ID
        forecast_config: Forecast configuration dictionary

    Returns:
        Forecast results including predictions and metrics
    """
    forecast_id = forecast_config.get("forecast_id", "unknown")
    supabase = get_supabase_client()
    temp_file = None

    try:
        # Fetch job from Supabase jobs table
        job_response = supabase.table("jobs").select("*").eq("id", job_id).execute()
        
        if not job_response.data or len(job_response.data) == 0:
            raise ValueError(f"Job not found: {job_id}")
        
        job = job_response.data[0]
        user_id = job.get("user_id")
        input_file_path = job.get("input_file_path")
        
        if not input_file_path:
            raise ValueError(f"Job {job_id} has no input_file_path")
        
        # Update job status to "processing"
        supabase.table("jobs").update({"status": "processing"}).eq("id", job_id).execute()
        
        # Download file from Supabase Storage
        try:
            file_bytes = download_from_supabase_storage(input_file_path)
        except Exception as e:
            raise ValueError(f"Failed to download file from storage: {str(e)}")
        
        # Save to temporary file for processing
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.csv', delete=False) as tmp:
            tmp.write(file_bytes)
            temp_file = tmp.name
            file_path = temp_file

        # Load and prepare time series
        time_column = forecast_config["time_column"]
        target_column = forecast_config["target_column"]

        df = load_and_prepare_timeseries(
            path=file_path, time_col=time_column, target_col=target_column, parse_dates=True
        )

        # Determine model to use
        model_choice = forecast_config.get("model", "auto")

        # Fit models
        model_manager = ModelManager()
        horizon = forecast_config.get("horizon", 14)

        # Generate forecast dates (same for all models)
        last_date = df.index[-1]
        freq = pd.infer_freq(df.index) or "D"
        forecast_dates = pd.date_range(
            start=last_date + pd.Timedelta(days=1), periods=horizon, freq=freq
        )

        # Store all models' predictions and metrics
        all_models_results = {}
        best_model_name = None

        if model_choice == "auto":
            # Fit all models and select best
            fitted_models = model_manager.fit_all(
                data=df, target_column="y", exogenous=forecast_config.get("exogenous")
            )

            if not fitted_models:
                raise ValueError("No models could be fitted")

            metrics = model_manager.compare_models(fitted_models)
            best_model_name = model_manager.select_best_model(metrics)

            # Generate predictions for ALL models
            for model_name, model in fitted_models.items():
                try:
                    pred_result = model.predict(horizon=horizon, return_conf_int=True)
                    all_models_results[model_name] = {
                        "predictions": (
                            pred_result["forecast"].tolist()
                            if hasattr(pred_result["forecast"], "tolist")
                            else list(pred_result["forecast"])
                        ),
                        "lower_bound": (
                            pred_result.get("lower").tolist()
                            if pred_result.get("lower") is not None
                            and hasattr(pred_result.get("lower"), "tolist")
                            else (
                                list(pred_result.get("lower"))
                                if pred_result.get("lower") is not None
                                else None
                            )
                        ),
                        "upper_bound": (
                            pred_result.get("upper").tolist()
                            if pred_result.get("upper") is not None
                            and hasattr(pred_result.get("upper"), "tolist")
                            else (
                                list(pred_result.get("upper"))
                                if pred_result.get("upper") is not None
                                else None
                            )
                        ),
                        "metrics": metrics.get(model_name, {}),
                    }
                except Exception as e:
                    warnings.warn(f"Failed to generate predictions for {model_name}: {e}")
                    continue

            best_model = fitted_models[best_model_name]
        else:
            # Fit specific model
            if model_choice not in model_manager.models:
                raise ValueError(f"Model '{model_choice}' not available")

            model = model_manager.models[model_choice]
            model.fit(df, target_column="y", exogenous=forecast_config.get("exogenous"))
            model.evaluate()
            best_model_name = model_choice
            best_model = model
            metrics = {best_model_name: model.get_metrics()}

            # Generate predictions for the selected model
            pred_result = best_model.predict(horizon=horizon, return_conf_int=True)
            all_models_results[best_model_name] = {
                "predictions": (
                    pred_result["forecast"].tolist()
                    if hasattr(pred_result["forecast"], "tolist")
                    else list(pred_result["forecast"])
                ),
                "lower_bound": (
                    pred_result.get("lower").tolist()
                    if pred_result.get("lower") is not None
                    and hasattr(pred_result.get("lower"), "tolist")
                    else (
                        list(pred_result.get("lower"))
                        if pred_result.get("lower") is not None
                        else None
                    )
                ),
                "upper_bound": (
                    pred_result.get("upper").tolist()
                    if pred_result.get("upper") is not None
                    and hasattr(pred_result.get("upper"), "tolist")
                    else (
                        list(pred_result.get("upper"))
                        if pred_result.get("upper") is not None
                        else None
                    )
                ),
                "metrics": metrics.get(best_model_name, {}),
            }

        # Use best model's predictions for the main forecast
        best_model_result = all_models_results[best_model_name]
        predictions = np.array(best_model_result["predictions"])
        lower_bound = (
            np.array(best_model_result["lower_bound"]) if best_model_result["lower_bound"] else None
        )
        upper_bound = (
            np.array(best_model_result["upper_bound"]) if best_model_result["upper_bound"] else None
        )

        # Create forecast DataFrame
        forecast_df = pd.DataFrame({"date": forecast_dates, "forecast": predictions})

        if lower_bound is not None:
            forecast_df["lower"] = lower_bound
        if upper_bound is not None:
            forecast_df["upper"] = upper_bound

        # Export CSV to temp file, then upload to Supabase Storage
        csv_temp = None
        chart_temp = None
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as tmp:
                forecast_df.to_csv(tmp.name, index=False)
                csv_temp = tmp.name
            
            # Upload CSV to Supabase Storage
            csv_storage_path = f"{user_id}/{job_id}/forecast.csv"
            with open(csv_temp, 'rb') as f:
                csv_bytes = f.read()
            upload_to_supabase_storage(csv_bytes, csv_storage_path)
        except Exception as e:
            warnings.warn(f"Failed to save forecast CSV: {e}")
            csv_storage_path = None
        finally:
            if csv_temp and os.path.exists(csv_temp):
                os.unlink(csv_temp)

        # Generate chart (if matplotlib available)
        chart_storage_path = None
        if MATPLOTLIB_AVAILABLE:
            try:
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                    chart_temp = tmp.name
                    _generate_forecast_chart(
                        historical=df,
                        forecast_df=forecast_df,
                        target_column="y",
                        output_path=chart_temp,
                    )
                
                # Upload chart to Supabase Storage
                chart_storage_path = f"{user_id}/{job_id}/forecast.png"
                with open(chart_temp, 'rb') as f:
                    chart_bytes = f.read()
                upload_to_supabase_storage(chart_bytes, chart_storage_path)
            except Exception as e:
                warnings.warn(f"Failed to generate chart: {e}")
            finally:
                if chart_temp and os.path.exists(chart_temp):
                    os.unlink(chart_temp)

        # Prepare historical data for charting
        # Note: after preprocessing, target column is renamed to "y"
        historical_data = []
        for idx, (date, value) in enumerate(df["y"].items()):
            historical_data.append(
                {
                    "date": date.isoformat() if hasattr(date, "isoformat") else str(date),
                    "actual": float(value) if pd.notna(value) else None,
                    "is_forecast": False,
                }
            )

        # Generate insights
        insights = _generate_insights(
            historical=df["y"],
            forecast_df=forecast_df,
            metrics=metrics,
            best_model=best_model_name,
            confidence_lower=lower_bound,
            confidence_upper=upper_bound,
        )

        # Prepare results
        results = {
            "forecast_id": forecast_id,
            "job_id": job_id,
            "user_id": user_id,
            "model_used": best_model_name,
            "predictions": (
                predictions.tolist() if hasattr(predictions, "tolist") else list(predictions)
            ),
            "forecast_dates": [d.isoformat() for d in forecast_dates],
            "lower_bound": (
                lower_bound.tolist()
                if lower_bound is not None and hasattr(lower_bound, "tolist")
                else (list(lower_bound) if lower_bound is not None else None)
            ),
            "upper_bound": (
                upper_bound.tolist()
                if upper_bound is not None and hasattr(upper_bound, "tolist")
                else (list(upper_bound) if upper_bound is not None else None)
            ),
            "metrics": metrics,
            "all_models": all_models_results,  # All models' predictions and metrics
            "historical_data": historical_data,  # Historical data for charting
            "insights": insights,  # Plain-English insights
            "historical_data_points": len(df),
            "forecast_horizon": horizon,
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
        }

        # Upload results JSON to Supabase Storage
        output_storage_path = f"{user_id}/{job_id}/output.json"
        results_json = json.dumps(results, indent=2, default=str)
        upload_to_supabase_storage(results_json.encode('utf-8'), output_storage_path)

        # Update job record in Supabase
        supabase.table("jobs").update({
            "status": "completed",
            "output_file_path": output_storage_path,
            "forecast_id": forecast_id,
            "model_used": best_model_name,
            "metrics": json.dumps(metrics),
        }).eq("id", job_id).execute()

        return results

    except Exception as e:
        import traceback

        error_trace = traceback.format_exc()
        
        # Get user_id and job_id for error handling
        try:
            supabase = get_supabase_client()
            job_response = supabase.table("jobs").select("user_id").eq("id", job_id).execute()
            if job_response.data and len(job_response.data) > 0:
                user_id = job_response.data[0].get("user_id")
            else:
                user_id = None
        except Exception:
            user_id = None

        error_result = {
            "forecast_id": forecast_id,
            "job_id": job_id,
            "status": "failed",
            "error": str(e),
            "error_trace": error_trace,
            "failed_at": datetime.utcnow().isoformat(),
        }

        # Update job record with error status
        try:
            supabase = get_supabase_client()
            supabase.table("jobs").update({
                "status": "failed",
                "error_message": str(e),
            }).eq("id", job_id).execute()
        except Exception:
            pass

        # Clean up temp file if it exists
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception:
                pass

        return error_result


def _generate_forecast_chart(
    historical: pd.DataFrame, forecast_df: pd.DataFrame, target_column: str, output_path: str
) -> None:
    """
    Generate a forecast visualization chart.

    Args:
        historical: Historical data DataFrame with datetime index
        forecast_df: Forecast DataFrame with 'date', 'forecast', 'lower', 'upper' columns
        target_column: Name of target column in historical data
        output_path: Path to save the chart
    """
    plt.figure(figsize=(12, 6))

    # Plot historical data
    plt.plot(
        historical.index, historical[target_column], label="Historical", color="blue", linewidth=2
    )

    # Plot forecast
    forecast_dates = pd.to_datetime(forecast_df["date"])
    plt.plot(
        forecast_dates,
        forecast_df["forecast"],
        label="Forecast",
        color="red",
        linewidth=2,
        linestyle="--",
    )

    # Plot confidence intervals if available
    if "lower" in forecast_df.columns and "upper" in forecast_df.columns:
        plt.fill_between(
            forecast_dates,
            forecast_df["lower"],
            forecast_df["upper"],
            alpha=0.3,
            color="red",
            label="Confidence Interval",
        )

    # Add vertical line separating historical and forecast
    last_historical_date = historical.index[-1]
    plt.axvline(x=last_historical_date, color="gray", linestyle=":", alpha=0.7)

    plt.xlabel("Date")
    plt.ylabel("Value")
    plt.title("Time Series Forecast")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    # Save chart
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close()


def _generate_insights(
    historical: pd.Series,
    forecast_df: pd.DataFrame,
    metrics: Dict[str, Dict[str, float]],
    best_model: str,
    confidence_lower: Optional[np.ndarray] = None,
    confidence_upper: Optional[np.ndarray] = None,
) -> str:
    """
    Generate plain-English insights about the forecast.

    Args:
        historical: Historical time series data
        forecast_df: Forecast DataFrame
        metrics: Dictionary of model metrics
        best_model: Name of best performing model
        confidence_lower: Lower confidence bounds
        confidence_upper: Upper confidence bounds

    Returns:
        Plain-English insights string
    """
    insights_parts = []

    # 1. Trend Direction
    if len(historical) >= 2:
        recent_trend = (
            historical.iloc[-10:].mean() - historical.iloc[-20:-10].mean()
            if len(historical) >= 20
            else historical.iloc[-1] - historical.iloc[0]
        )
        forecast_trend = (
            forecast_df["forecast"].iloc[-1] - forecast_df["forecast"].iloc[0]
            if len(forecast_df) > 1
            else 0
        )

        if recent_trend > 0 and forecast_trend > 0:
            trend_desc = "upward trend"
        elif recent_trend < 0 and forecast_trend < 0:
            trend_desc = "downward trend"
        elif forecast_trend > 0:
            trend_desc = "recovery to upward trend"
        elif forecast_trend < 0:
            trend_desc = "shift to downward trend"
        else:
            trend_desc = "stable trend"

        insights_parts.append(
            f"📈 **Trend Direction:** The data shows a {trend_desc}. The forecast continues this pattern."
        )

    # 2. Seasonality Strength
    if len(historical) >= 14:
        # Simple seasonality detection using autocorrelation
        try:
            # Use pandas autocorr to detect seasonality
            autocorr_values = []
            max_lag = min(14, len(historical) // 2)
            for lag in range(1, max_lag + 1):
                try:
                    corr = historical.autocorr(lag=lag)
                    if pd.notna(corr):
                        autocorr_values.append(abs(corr))
                except:
                    continue

            max_autocorr = max(autocorr_values) if autocorr_values else 0

            if max_autocorr > 0.5:
                seasonality_desc = "strong seasonal patterns"
            elif max_autocorr > 0.3:
                seasonality_desc = "moderate seasonal patterns"
            else:
                seasonality_desc = "weak or no seasonal patterns"

            insights_parts.append(
                f"🔄 **Seasonality:** {seasonality_desc.capitalize()} detected in the historical data."
            )
        except Exception:
            # Fallback: simple variance-based detection
            if len(historical) >= 7:
                weekly_variance = (
                    historical.iloc[-7:].std() / historical.mean() if historical.mean() != 0 else 0
                )
                if weekly_variance > 0.2:
                    insights_parts.append(
                        f"🔄 **Seasonality:** Moderate seasonal patterns detected in the data."
                    )
                else:
                    insights_parts.append(
                        f"🔄 **Seasonality:** Weak or no seasonal patterns detected."
                    )

    # 3. Forecast Confidence Width
    if confidence_lower is not None and confidence_upper is not None:
        avg_width = np.mean(confidence_upper - confidence_lower)
        avg_value = np.mean(forecast_df["forecast"])
        relative_width = (avg_width / avg_value * 100) if avg_value != 0 else 0

        if relative_width < 10:
            confidence_desc = "high confidence"
        elif relative_width < 25:
            confidence_desc = "moderate confidence"
        else:
            confidence_desc = "lower confidence"

        insights_parts.append(
            f"🎯 **Forecast Confidence:** {confidence_desc.capitalize()} with an average confidence interval width of {relative_width:.1f}%."
        )

    # 4. Model Reliability Note
    best_metrics = metrics.get(best_model, {})
    rmse = best_metrics.get("rmse", 0)
    mae = best_metrics.get("mae", 0)

    if rmse > 0:
        avg_value = historical.mean()
        relative_error = (rmse / avg_value * 100) if avg_value != 0 else 0

        if relative_error < 5:
            reliability_desc = "highly reliable"
        elif relative_error < 15:
            reliability_desc = "reliable"
        else:
            reliability_desc = "moderately reliable"

        model_display_name = best_model.upper() if best_model else "Selected"
        insights_parts.append(
            f"✅ **Model Reliability:** The {model_display_name} model shows {reliability_desc} performance with a {relative_error:.1f}% average error."
        )

    # Add model comparison note if multiple models
    if len(metrics) > 1:
        model_names = ", ".join([m.upper() for m in metrics.keys()])
        insights_parts.append(
            f"🔬 **Model Comparison:** Compared {model_names}. {best_model.upper()} was selected as the best performing model."
        )

    return (
        "\n\n".join(insights_parts)
        if insights_parts
        else "Forecast analysis completed successfully."
    )
