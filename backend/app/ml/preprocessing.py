# backend/app/ml/preprocessing.py
import pandas as pd
from typing import Dict, Any, List, Tuple
from dateutil.parser import parse as date_parse
import numpy as np
import csv

def read_csv_head(path: str, nrows: int = 10) -> pd.DataFrame:
    """Read small portion of CSV safely using pandas (infer datetime later)."""
    # Use low_memory to avoid dtype warnings on large files
    return pd.read_csv(path, nrows=nrows, low_memory=False)

def detect_time_columns(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Heuristic detection of time-like columns.
    Returns list of candidates with confidence scores.
    """
    candidates = []
    for col in df.columns:
        series = df[col].dropna()
        # skip numeric-only columns
        # but we try to parse if any string-like
        score = 0.0
        # if dtype is datetime-like
        if pd.api.types.is_datetime64_any_dtype(series):
            score += 0.9
        # if dtype is object, try parsing a sample
        elif pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series):
            sample = series.astype(str).head(5).tolist()
            parsed = 0
            for v in sample:
                try:
                    _ = date_parse(v)
                    parsed += 1
                except Exception:
                    pass
            score += (parsed / max(1, len(sample))) * 0.8
        # numeric temporal columns (e.g., unix timestamps)
        elif pd.api.types.is_integer_dtype(series) or pd.api.types.is_float_dtype(series):
            # check magnitude typical of unix timestamp (seconds or ms)
            mean_val = series.head(5).astype(float).abs().mean() if not series.empty else 0
            if 1e9 < mean_val < 1e13:  # plausible unix timestamp
                score += 0.7
        # small boost if column name contains date/time keywords
        name = col.lower()
        if any(k in name for k in ("date", "time", "timestamp", "day", "month", "year")):
            score += 0.15

        if score > 0:
            candidates.append({"column": col, "score": round(float(score), 2)})

    # sort by score desc
    candidates_sorted = sorted(candidates, key=lambda x: x["score"], reverse=True)
    return candidates_sorted

def analyze_csv_preview(path: str, nrows: int = 10) -> Dict[str, Any]:
    """
    Read the CSV head and return:
      - list of columns
      - time column candidates with confidence
      - small preview (list of dict rows)
    """
    df = read_csv_head(path, nrows=nrows)
    cols = df.columns.tolist()
    time_candidates = detect_time_columns(df)
    # convert preview to json serializable
    preview = df.fillna("").head(nrows).to_dict(orient="records")
    return {"columns": cols, "time_candidates": time_candidates, "preview": preview}

# Additional helper: parse full CSV and return cleaned ts dataframe
def load_and_prepare_timeseries(path: str, time_col: str, target_col: str, freq: str = None,
                                resample_rule: str = None, parse_dates: bool = True) -> pd.DataFrame:
    """
    Load full csv, parse time_col, set index to datetime, select target_col, handle missing values.
    - freq: optional frequency hint like 'D' or 'W'
    - resample_rule: if provided, resample with sum/mean (use 'sum' or 'mean' or callable)
    Returns a DataFrame with datetime index and a single column 'y'.
    """
    df = pd.read_csv(path, low_memory=False)
    if parse_dates:
        try:
            df[time_col] = pd.to_datetime(df[time_col], infer_datetime_format=True, errors='coerce')
        except Exception:
            # fallback to custom parsing per row
            df[time_col] = df[time_col].apply(lambda v: date_parse(str(v)) if pd.notnull(v) else pd.NaT)

    df = df.dropna(subset=[time_col])
    df = df.set_index(time_col)
    # sort by index
    df = df.sort_index()
    # select target
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in CSV.")
    y = df[[target_col]].rename(columns={target_col: "y"})

    # optional resample
    if resample_rule:
        if resample_rule.lower() in ("sum", "mean"):
            agg = resample_rule.lower()
            y = getattr(y.resample(freq), agg)()
        else:
            # custom: if resample_rule is callable or other string, ignore for now
            pass

    # fill or interpolate missing values (simple)
    if y.index.hasnans:
        y = y.dropna()
    if y.empty:
        raise ValueError("After preprocessing the time series is empty.")
    return y