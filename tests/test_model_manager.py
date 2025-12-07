"""Tests for model manager and forecasting models."""
import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Import models (may fail if dependencies not installed)
try:
    from backend.app.ml.model_manager import (
        ARIMAForecaster,
        ETSForecaster,
        XGBoostForecaster,
        ModelManager,
        infer_frequency
    )
    MODELS_AVAILABLE = True
except ImportError as e:
    MODELS_AVAILABLE = False
    IMPORT_ERROR = str(e)


@pytest.fixture
def sample_time_series():
    """Create a sample time series for testing."""
    dates = pd.date_range(start='2023-01-01', periods=50, freq='D')
    # Simple trend + noise
    values = np.linspace(100, 150, 50) + np.random.normal(0, 5, 50)
    df = pd.DataFrame({'y': values}, index=dates)
    return df


@pytest.fixture
def sample_time_series_weekly():
    """Create a weekly time series."""
    dates = pd.date_range(start='2023-01-01', periods=20, freq='W')
    values = np.linspace(100, 150, 20) + np.random.normal(0, 5, 20)
    df = pd.DataFrame({'y': values}, index=dates)
    return df


@pytest.mark.skipif(not MODELS_AVAILABLE, reason=f"Models not available: {IMPORT_ERROR}")
def test_infer_frequency_daily(sample_time_series):
    """Test frequency inference for daily data."""
    freq = infer_frequency(sample_time_series.index)
    assert freq in ['D', '1D'] or 'day' in str(freq).lower()


@pytest.mark.skipif(not MODELS_AVAILABLE, reason=f"Models not available: {IMPORT_ERROR}")
def test_infer_frequency_weekly(sample_time_series_weekly):
    """Test frequency inference for weekly data."""
    freq = infer_frequency(sample_time_series_weekly.index)
    assert freq in ['W', 'W-SUN', 'W-MON'] or 'week' in str(freq).lower()


@pytest.mark.skipif(not MODELS_AVAILABLE, reason=f"Models not available: {IMPORT_ERROR}")
def test_arima_forecaster_fit_predict(sample_time_series):
    """Test ARIMA forecaster fit and predict."""
    model = ARIMAForecaster()
    model.fit(sample_time_series, target_column='y')
    
    # Should have metrics after evaluation
    metrics = model.evaluate()
    assert isinstance(metrics, dict)
    
    # Generate predictions
    result = model.predict(horizon=7)
    assert 'forecast' in result
    assert len(result['forecast']) == 7


@pytest.mark.skipif(not MODELS_AVAILABLE, reason=f"Models not available: {IMPORT_ERROR}")
def test_ets_forecaster_fit_predict(sample_time_series):
    """Test ETS forecaster fit and predict."""
    model = ETSForecaster()
    model.fit(sample_time_series, target_column='y')
    
    metrics = model.evaluate()
    assert isinstance(metrics, dict)
    
    result = model.predict(horizon=7)
    assert 'forecast' in result
    assert len(result['forecast']) == 7


@pytest.mark.skipif(not MODELS_AVAILABLE, reason=f"Models not available: {IMPORT_ERROR}")
def test_xgboost_forecaster_fit_predict(sample_time_series):
    """Test XGBoost forecaster fit and predict."""
    try:
        model = XGBoostForecaster(n_lags=5, n_estimators=10)
        model.fit(sample_time_series, target_column='y')
        
        metrics = model.evaluate()
        assert isinstance(metrics, dict)
        
        result = model.predict(horizon=7)
        assert 'forecast' in result
        assert len(result['forecast']) == 7
    except ImportError:
        pytest.skip("XGBoost not available")


@pytest.mark.skipif(not MODELS_AVAILABLE, reason=f"Models not available: {IMPORT_ERROR}")
def test_model_manager_fit_all(sample_time_series):
    """Test ModelManager fit_all method."""
    manager = ModelManager()
    fitted_models = manager.fit_all(sample_time_series, target_column='y')
    
    assert len(fitted_models) > 0
    assert all(isinstance(m, (ARIMAForecaster, ETSForecaster, XGBoostForecaster)) 
               for m in fitted_models.values())


@pytest.mark.skipif(not MODELS_AVAILABLE, reason=f"Models not available: {IMPORT_ERROR}")
def test_model_manager_compare_models(sample_time_series):
    """Test model comparison."""
    manager = ModelManager()
    fitted_models = manager.fit_all(sample_time_series, target_column='y')
    
    metrics = manager.compare_models(fitted_models)
    assert isinstance(metrics, dict)
    assert len(metrics) == len(fitted_models)


@pytest.mark.skipif(not MODELS_AVAILABLE, reason=f"Models not available: {IMPORT_ERROR}")
def test_model_manager_select_best(sample_time_series):
    """Test best model selection."""
    manager = ModelManager()
    fitted_models = manager.fit_all(sample_time_series, target_column='y')
    
    metrics = manager.compare_models(fitted_models)
    best_model = manager.select_best_model(metrics)
    
    assert best_model in fitted_models.keys()

