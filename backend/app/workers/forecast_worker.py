"""Background worker for processing forecast jobs with full export support."""

from typing import Dict, Any, Optional
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings("ignore")

from app.ml.model_manager import ModelManager
from app.ml.preprocessing import load_and_prepare_timeseries
from app.storage.storage import get_file_from_storage
from app.core.config import DATA_DIR

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
    Writes result.json, forecast.csv, and forecast.png (if matplotlib available).

    Args:
        job_id: Upload job ID
        forecast_config: Forecast configuration dictionary

    Returns:
        Forecast results including predictions and metrics
    """
    job_folder = os.path.join(DATA_DIR, job_id)
    forecast_id = forecast_config.get("forecast_id", "unknown")

    try:
        # Load job metadata to get file path
        metadata_path = os.path.join(job_folder, "metadata.json")

        if not os.path.exists(metadata_path):
            raise ValueError(f"Job metadata not found for job_id: {job_id}")

        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        file_path = metadata.get("file_path")
        if not file_path or not os.path.exists(file_path):
            # Try to get from storage
            file_path = get_file_from_storage(job_id)

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

        # Save model artifact
        model_path = os.path.join(job_folder, f"model_{best_model_name}.pkl")
        try:
            model_manager.save_model(best_model, model_path)
        except Exception as e:
            warnings.warn(f"Failed to save model artifact: {e}")

        # Create forecast DataFrame
        forecast_df = pd.DataFrame({"date": forecast_dates, "forecast": predictions})

        if lower_bound is not None:
            forecast_df["lower"] = lower_bound
        if upper_bound is not None:
            forecast_df["upper"] = upper_bound

        # Export CSV
        csv_path = os.path.join(job_folder, "forecast.csv")
        forecast_df.to_csv(csv_path, index=False)

        # Generate chart (if matplotlib available)
        chart_path = None
        if MATPLOTLIB_AVAILABLE:
            try:
                chart_path = os.path.join(job_folder, "forecast.png")
                _generate_forecast_chart(
                    historical=df,
                    forecast_df=forecast_df,
                    target_column="y",
                    output_path=chart_path,
                )
            except Exception as e:
                warnings.warn(f"Failed to generate chart: {e}")

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
            "csv_path": csv_path,
            "chart_path": chart_path,
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
        }

        # Save results JSON
        results_path = os.path.join(job_folder, "results.json")
        with open(results_path, "w") as f:
            json.dump(results, f, indent=2, default=str)

        return results

    except Exception as e:
        import traceback

        error_trace = traceback.format_exc()

        error_result = {
            "forecast_id": forecast_id,
            "job_id": job_id,
            "status": "failed",
            "error": str(e),
            "error_trace": error_trace,
            "failed_at": datetime.utcnow().isoformat(),
        }

        # Save error result
        try:
            error_path = os.path.join(job_folder, "error.json")
            with open(error_path, "w") as f:
                json.dump(error_result, f, indent=2)
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
