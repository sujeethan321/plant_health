import os
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
DATABASE_URL = os.environ["DATABASE_URL"]
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

# Accept the existing key name as well as the standard environment variable.
GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or os.getenv("Gemini_api_key") or "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
