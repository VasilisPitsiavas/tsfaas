"""Complete model manager with ARIMA, ETS, and XGBoost implementations."""

import pickle
import os
from typing import Dict, List, Tuple, Optional
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
import warnings

# Model imports
try:
    from pmdarima import auto_arima

    PMDARIMA_AVAILABLE = True
except ImportError:
    PMDARIMA_AVAILABLE = False
    warnings.warn("pmdarima not available, ARIMA will use statsmodels")

from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing

try:
    import xgboost as xgb

    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    warnings.warn("xgboost not available")


def infer_frequency(ts_index: pd.DatetimeIndex) -> str:
    """
    Infer frequency from datetime index with fallback logic.

    Args:
        ts_index: DatetimeIndex of the time series

    Returns:
        Frequency string (e.g., 'D', 'H', 'W', 'M')
    """
    # Try inferred_freq first
    if ts_index.inferred_freq is not None:
        return ts_index.inferred_freq

    # Try pd.infer_freq()
    freq = pd.infer_freq(ts_index)
    if freq is not None:
        return freq

    # Fallback: calculate median difference and map to frequency
    if len(ts_index) < 2:
        return "D"  # Default to daily

    diffs = ts_index.to_series().diff().dropna()
    median_diff_seconds = diffs.median().total_seconds()

    # Map seconds to frequency codes
    if median_diff_seconds < 60:
        return "min"  # minutes
    elif median_diff_seconds < 3600:
        return "H"  # hourly
    elif median_diff_seconds < 86400:
        return "D"  # daily
    elif median_diff_seconds < 604800:
        return "W"  # weekly
    elif median_diff_seconds < 2592000:
        return "M"  # monthly
    else:
        return "D"  # Default to daily


class ARIMAForecaster:
    """ARIMA/AutoARIMA forecasting model with confidence intervals."""

    def __init__(self):
        self.model = None
        self.fitted_model = None
        self.metrics = {}
        self.training_data = None
        self.freq = None

    def fit(
        self, data: pd.DataFrame, target_column: str = "y", exogenous: Optional[List[str]] = None
    ):
        """Fit ARIMA model to data."""
        if target_column not in data.columns:
            raise ValueError(f"Target column '{target_column}' not found")

        y = data[target_column].dropna()
        self.training_data = y
        self.freq = infer_frequency(y.index)

        # Use auto_arima if available, else manual ARIMA
        if PMDARIMA_AVAILABLE and len(y) > 10:
            try:
                self.model = auto_arima(
                    y,
                    seasonal=False,
                    stepwise=True,
                    suppress_warnings=True,
                    error_action="ignore",
                    max_p=5,
                    max_d=2,
                    max_q=5,
                    trace=False,
                )
                self.fitted_model = self.model
            except Exception as e:
                warnings.warn(f"AutoARIMA failed: {e}, falling back to manual ARIMA")
                self.model = ARIMA(y, order=(1, 1, 1)).fit()
                self.fitted_model = self.model
        else:
            # Manual ARIMA with simple order
            try:
                self.model = ARIMA(y, order=(1, 1, 1)).fit()
                self.fitted_model = self.model
            except Exception as e:
                raise ValueError(f"ARIMA fitting failed: {e}")

    def predict(self, horizon: int, return_conf_int: bool = True) -> Dict[str, np.ndarray]:
        """
        Generate ARIMA predictions with optional confidence intervals.

        Returns:
            Dictionary with 'forecast', 'lower', 'upper' arrays
        """
        if self.fitted_model is None:
            raise ValueError("Model must be fitted before prediction")

        if return_conf_int:
            try:
                forecast_result = self.fitted_model.get_forecast(steps=horizon)
                forecast = forecast_result.predicted_mean.values
                conf_int = forecast_result.conf_int()
                lower = conf_int.iloc[:, 0].values
                upper = conf_int.iloc[:, 1].values
                return {"forecast": forecast, "lower": lower, "upper": upper}
            except Exception:
                # Fallback to simple prediction without confidence intervals
                forecast = self.fitted_model.forecast(steps=horizon)
                return {
                    "forecast": forecast.values if hasattr(forecast, "values") else forecast,
                    "lower": None,
                    "upper": None,
                }
        else:
            forecast = self.fitted_model.forecast(steps=horizon)
            return {
                "forecast": forecast.values if hasattr(forecast, "values") else forecast,
                "lower": None,
                "upper": None,
            }

    def evaluate(self, test_data: Optional[pd.Series] = None) -> Dict[str, float]:
        """Evaluate model on training data or test data."""
        if self.fitted_model is None:
            return {}

        # Use training data if test_data not provided
        if test_data is None:
            test_data = self.training_data

        # Generate predictions for evaluation
        if len(test_data) > 0:
            try:
                pred = self.fitted_model.fittedvalues
                if len(pred) > 0 and len(test_data) == len(pred):
                    mae = mean_absolute_error(test_data, pred)
                    rmse = np.sqrt(mean_squared_error(test_data, pred))
                    self.metrics = {"mae": float(mae), "rmse": float(rmse)}
            except Exception:
                # If fittedvalues not available, use AIC as proxy
                try:
                    aic = self.fitted_model.aic if hasattr(self.fitted_model, "aic") else None
                    self.metrics = {"aic": float(aic)} if aic else {}
                except Exception:
                    self.metrics = {}

        return self.metrics

    def get_metrics(self) -> Dict[str, float]:
        """Get model performance metrics."""
        return self.metrics


class ETSForecaster:
    """Exponential Smoothing (ETS) forecasting model."""

    def __init__(self):
        self.model = None
        self.metrics = {}
        self.training_data = None
        self.freq = None

    def fit(
        self, data: pd.DataFrame, target_column: str = "y", exogenous: Optional[List[str]] = None
    ):
        """Fit ETS model to data."""
        if target_column not in data.columns:
            raise ValueError(f"Target column '{target_column}' not found")

        y = data[target_column].dropna()
        self.training_data = y
        self.freq = infer_frequency(y.index)

        try:
            # Try additive model first
            self.model = ExponentialSmoothing(
                y, seasonal_periods=None, trend="add", seasonal=None
            ).fit()
        except Exception:
            try:
                # Fallback to simple exponential smoothing
                self.model = ExponentialSmoothing(y, trend=None, seasonal=None).fit()
            except Exception as e:
                raise ValueError(f"ETS fitting failed: {e}")

    def predict(self, horizon: int, return_conf_int: bool = True) -> Dict[str, np.ndarray]:
        """Generate ETS predictions."""
        if self.model is None:
            raise ValueError("Model must be fitted before prediction")

        forecast = self.model.forecast(steps=horizon)
        # ETS doesn't provide confidence intervals in statsmodels easily
        return {
            "forecast": forecast.values if hasattr(forecast, "values") else forecast,
            "lower": None,
            "upper": None,
        }

    def evaluate(self, test_data: Optional[pd.Series] = None) -> Dict[str, float]:
        """Evaluate model."""
        if self.model is None:
            return {}

        if test_data is None:
            test_data = self.training_data

        try:
            pred = self.model.fittedvalues
            if len(pred) > 0 and len(test_data) == len(pred):
                mae = mean_absolute_error(test_data, pred)
                rmse = np.sqrt(mean_squared_error(test_data, pred))
                self.metrics = {"mae": float(mae), "rmse": float(rmse)}
        except Exception:
            try:
                aic = self.model.aic if hasattr(self.model, "aic") else None
                self.metrics = {"aic": float(aic)} if aic else {}
            except Exception:
                self.metrics = {}

        return self.metrics

    def get_metrics(self) -> Dict[str, float]:
        return self.metrics


class XGBoostForecaster:
    """XGBoost forecasting model with lag features."""

    def __init__(self, n_lags: int = 7, max_depth: int = 3, n_estimators: int = 100):
        self.model = None
        self.metrics = {}
        self.training_data = None
        self.n_lags = n_lags
        self.max_depth = max_depth
        self.n_estimators = n_estimators
        self.feature_names = None

    def _create_lag_features(
        self, y: pd.Series, exogenous: Optional[pd.DataFrame] = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Create lag features for XGBoost."""
        lag_features = []
        target_values = []

        for i in range(self.n_lags, len(y)):
            # Lag features
            lag_vals = y.iloc[i - self.n_lags : i].values
            features = lag_vals.tolist()

            # Add exogenous if available
            if exogenous is not None and i < len(exogenous):
                exog_vals = exogenous.iloc[i].values
                features.extend(exog_vals.tolist())

            lag_features.append(features)
            target_values.append(y.iloc[i])

        return np.array(lag_features), np.array(target_values)

    def fit(
        self, data: pd.DataFrame, target_column: str = "y", exogenous: Optional[List[str]] = None
    ):
        """Fit XGBoost model with lag features."""
        if not XGBOOST_AVAILABLE:
            raise ImportError("xgboost is not installed")

        if target_column not in data.columns:
            raise ValueError(f"Target column '{target_column}' not found")

        y = data[target_column].dropna()
        self.training_data = y

        # Prepare exogenous features
        exog_df = None
        if exogenous and len(exogenous) > 0:
            exog_cols = [col for col in exogenous if col in data.columns]
            if exog_cols:
                exog_df = data[exog_cols]

        # Create features
        X, y_target = self._create_lag_features(y, exog_df)

        if len(X) == 0:
            raise ValueError("Not enough data to create lag features")

        # Train XGBoost
        self.model = xgb.XGBRegressor(
            max_depth=self.max_depth,
            n_estimators=self.n_estimators,
            random_state=42,
            tree_method="hist",  # Memory efficient
        )
        self.model.fit(X, y_target)

    def predict(self, horizon: int, return_conf_int: bool = True) -> Dict[str, np.ndarray]:
        """Generate XGBoost predictions recursively."""
        if self.model is None:
            raise ValueError("Model must be fitted before prediction")

        if self.training_data is None or len(self.training_data) < self.n_lags:
            raise ValueError("Not enough training data for prediction")

        # Recursive prediction
        predictions = []
        last_values = list(self.training_data.iloc[-self.n_lags :].values)

        for _ in range(horizon):
            features = np.array([last_values[-self.n_lags :]])
            pred = self.model.predict(features)[0]
            predictions.append(pred)
            last_values.append(pred)
            last_values = last_values[-self.n_lags :]

        return {
            "forecast": np.array(predictions),
            "lower": None,  # XGBoost doesn't provide confidence intervals easily
            "upper": None,
        }

    def evaluate(self, test_data: Optional[pd.Series] = None) -> Dict[str, float]:
        """Evaluate model."""
        if self.model is None:
            return {}

        if test_data is None:
            # Evaluate on training data
            y = self.training_data
            exog_df = None
            X, y_target = self._create_lag_features(y, exog_df)
            if len(X) > 0:
                pred = self.model.predict(X)
                mae = mean_absolute_error(y_target, pred)
                rmse = np.sqrt(mean_squared_error(y_target, pred))
                self.metrics = {"mae": float(mae), "rmse": float(rmse)}

        return self.metrics

    def get_metrics(self) -> Dict[str, float]:
        return self.metrics


class ModelManager:
    """Manages multiple forecasting models and selects the best one."""

    def __init__(self):
        self.models = {
            "arima": ARIMAForecaster(),
            "ets": ETSForecaster(),
            "xgboost": XGBoostForecaster() if XGBOOST_AVAILABLE else None,
        }
        # Remove None models
        self.models = {k: v for k, v in self.models.items() if v is not None}

    def fit_all(
        self, data: pd.DataFrame, target_column: str = "y", exogenous: Optional[List[str]] = None
    ) -> Dict[str, any]:
        """
        Fit all available models to the data.

        Returns:
            Dictionary of fitted models
        """
        fitted_models = {}

        for name, model in self.models.items():
            try:
                model.fit(data, target_column=target_column, exogenous=exogenous)
                model.evaluate()  # Evaluate on training data
                fitted_models[name] = model
            except Exception as e:
                warnings.warn(f"Model {name} failed to fit: {e}")
                continue

        return fitted_models

    def compare_models(self, fitted_models: Dict[str, any]) -> Dict[str, Dict[str, float]]:
        """
        Compare model performance metrics.

        Returns:
            Dictionary mapping model names to their metrics
        """
        metrics_dict = {}

        for name, model in fitted_models.items():
            metrics = model.get_metrics()
            metrics_dict[name] = metrics

        return metrics_dict

    def select_best_model(self, model_metrics: Dict[str, Dict[str, float]]) -> str:
        """
        Select the best model based on RMSE (or MAE if RMSE not available).

        Returns:
            Name of the best model
        """
        if not model_metrics:
            return "arima"  # Default

        best_model = None
        best_score = float("inf")

        for name, metrics in model_metrics.items():
            # Prefer RMSE, fallback to MAE, then AIC
            score = metrics.get("rmse", metrics.get("mae", metrics.get("aic", float("inf"))))
            if score < best_score:
                best_score = score
                best_model = name

        return best_model or "arima"

    def save_model(self, model: any, filepath: str) -> None:
        """Save a model to disk using pickle."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "wb") as f:
            pickle.dump(model, f)

    def load_model(self, filepath: str) -> any:
        """Load a model from disk."""
        with open(filepath, "rb") as f:
            return pickle.load(f)
