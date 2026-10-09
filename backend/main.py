"""Compatibility entry point for running Uvicorn from either directory."""

if __package__:
    from .app.main import app
else:
    from app.main import app
