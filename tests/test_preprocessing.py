# tests/test_preprocessing.py
from backend.app.ml.preprocessing import analyze_csv_preview, load_and_prepare_timeseries
import os
import pandas as pd

# Get the project root directory (parent of tests/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAMPLE_CSV = os.path.join(PROJECT_ROOT, "sample_data", "ecommerce_sales.csv")

def test_analyze_preview_exists():
    assert os.path.exists(SAMPLE_CSV)
    analysis = analyze_csv_preview(SAMPLE_CSV, nrows=5)
    assert "columns" in analysis
    assert isinstance(analysis["preview"], list)
    assert len(analysis["preview"]) > 0
    # expect at least one time candidate or a column containing 'date' in name
    time_candidates = analysis.get("time_candidates", [])
    assert isinstance(time_candidates, list)

def test_load_and_prepare_timeseries_basic():
    # try to load full csv (one of your sample CSVs must contain 'date' and 'sales')
    df = load_and_prepare_timeseries(SAMPLE_CSV, time_col="date", target_col="sales")
    assert not df.empty
    assert "y" in df.columns
    assert pd.api.types.is_datetime64_any_dtype(df.index)