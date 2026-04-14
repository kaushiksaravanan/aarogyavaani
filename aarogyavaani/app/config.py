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

# --- Embedding model ---
EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL", "intfloat/multilingual-e5-large-instruct"
)
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "1024"))

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
