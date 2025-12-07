"""Application configuration (deprecated - use app.core.config instead)."""
# Backward compatibility: re-export from core.config
from app.core.config import settings, DATA_DIR

__all__ = ["settings", "DATA_DIR"]

