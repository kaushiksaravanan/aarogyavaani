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

# --- Key pools (loaded lazily to avoid import-time side effects) ---
_hf_pool = None


def get_hf_key_pool():
    """Lazy-init HuggingFace key pool from HF_API_TOKEN, HF_API_TOKEN_1, ..."""
    global _hf_pool
    if _hf_pool is None:
        from app.keypool import KeyPool  # noqa: local import to avoid circular

        _hf_pool = KeyPool.from_env("HF_API_TOKEN", cooldown=60)
    return _hf_pool


# --- Qdrant collection names ---
KNOWLEDGE_COLLECTION = os.getenv("KNOWLEDGE_COLLECTION", "health_knowledge_base")
MEMORY_COLLECTION = os.getenv("MEMORY_COLLECTION", "user_memory")

# --- Vapi ---
VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")

# --- App metadata ---
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
APP_SERVICE_NAME = "aarogyavaani-backend"

# --- Server ---
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# --- Security ---
VAPI_SECRET = os.getenv("VAPI_SECRET", "")

# --- Deployment ---
SERVER_URL = os.getenv("SERVER_URL", f"http://localhost:{PORT}")
