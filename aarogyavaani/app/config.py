"""
AarogyaVaani configuration module.
Loads settings from environment variables with sensible defaults.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# --- Qdrant ---
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")

# --- Embedding model (HuggingFace Inference API) ---
HF_API_URL = os.getenv(
    "HF_API_URL",
    "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct",
)
# Single key fallback (kept for backward compat)
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "1024"))


# --- Qdrant collection names ---
KNOWLEDGE_COLLECTION = os.getenv("KNOWLEDGE_COLLECTION", "health_knowledge_base")
MEMORY_COLLECTION = os.getenv("MEMORY_COLLECTION", "user_memory")

# --- Vapi ---
# Private API key used for backend-initiated outbound calls.
VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
VAPI_ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID", "")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID", "")

# --- App metadata ---
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
APP_SERVICE_NAME = "aarogyavaani-backend"

# --- Server ---
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# --- Security ---
VAPI_SECRET = os.getenv("VAPI_SECRET", "")
CRON_SECRET = os.getenv("CRON_SECRET", "")

# --- Google Gemini ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# --- Deployment ---
SERVER_URL = os.getenv("SERVER_URL", f"http://localhost:{PORT}")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
FRONTEND_PREVIEW_ORIGIN_REGEX = os.getenv(
    "FRONTEND_PREVIEW_ORIGIN_REGEX",
    r"https://aarogyavaani-app(-[a-z0-9]+)?\.vercel\.app",
)
CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "")
