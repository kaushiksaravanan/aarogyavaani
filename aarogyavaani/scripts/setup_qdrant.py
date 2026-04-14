"""
AarogyaVaani — Qdrant Collection Setup
Creates two collections:
  1. health_knowledge_base  (medical knowledge, multilingual)
  2. user_memory            (per-user conversation memory)

Vector model: multilingual-e5-large-instruct (dim=1024, COSINE)

Usage:
    python setup_qdrant.py
"""

import os
import sys

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

VECTOR_SIZE = 1024  # multilingual-e5-large-instruct
DISTANCE = models.Distance.COSINE

# ── Collection definitions ───────────────────────────────────────────

COLLECTIONS = {
    "health_knowledge_base": {
        "description": "Multilingual medical knowledge base (Hindi, English, Kannada)",
        "payload_indexes": [
            ("language", models.PayloadSchemaType.KEYWORD),
            ("source", models.PayloadSchemaType.KEYWORD),
            ("title", models.PayloadSchemaType.KEYWORD),
        ],
    },
    "user_memory": {
        "description": "Per-user conversation memory and health context",
        "payload_indexes": [
            ("user_phone", models.PayloadSchemaType.KEYWORD),
            ("timestamp", models.PayloadSchemaType.KEYWORD),
        ],
    },
}


def confirm(prompt: str) -> bool:
    """Prompt the user for y/n confirmation."""
    while True:
        answer = input(f"{prompt} [y/n]: ").strip().lower()
        if answer in ("y", "yes"):
            return True
        if answer in ("n", "no"):
            return False
        print("  Please enter y or n.")


def get_client() -> QdrantClient:
    """Build and return a QdrantClient, validating env vars first."""
    if not QDRANT_URL:
        print("ERROR: QDRANT_URL is not set. Add it to your .env file.")
        sys.exit(1)

    kwargs: dict = {"url": QDRANT_URL, "timeout": 30}
    if QDRANT_API_KEY:
        kwargs["api_key"] = QDRANT_API_KEY

    try:
        client = QdrantClient(**kwargs)
        # Quick connectivity check
        client.get_collections()
        return client
    except Exception as exc:
        print(f"ERROR: Could not connect to Qdrant at {QDRANT_URL}")
        print(f"  {exc}")
        sys.exit(1)


def collection_exists(client: QdrantClient, name: str) -> bool:
    """Return True if the collection already exists."""
    try:
        client.get_collection(name)
        return True
    except (UnexpectedResponse, Exception):
        return False


def create_collection(client: QdrantClient, name: str, cfg: dict) -> None:
    """Create a single collection with its vector config and payload indexes."""
    print(f"\n── Creating collection: {name}")
    print(f"   {cfg['description']}")

    client.create_collection(
        collection_name=name,
        vectors_config=models.VectorParams(
            size=VECTOR_SIZE,
            distance=DISTANCE,
        ),
        # Reasonable defaults for write-heavy ingestion
        optimizers_config=models.OptimizersConfigDiff(
            indexing_threshold=20_000,
        ),
    )

    for field_name, schema_type in cfg["payload_indexes"]:
        client.create_payload_index(
            collection_name=name,
            field_name=field_name,
            field_schema=schema_type,
        )
        print(f"   + payload index: {field_name} ({schema_type.name})")

    print(f"   Collection '{name}' created successfully.")


def setup() -> None:
    """Main setup routine."""
    print("=" * 60)
    print("  AarogyaVaani — Qdrant Collection Setup")
    print("=" * 60)

    client = get_client()
    print(f"Connected to Qdrant at {QDRANT_URL}")

    existing = {c.name for c in client.get_collections().collections}
    print(f"Existing collections: {existing or '(none)'}\n")

    for name, cfg in COLLECTIONS.items():
        if name in existing:
            print(f"Collection '{name}' already exists.")
            if confirm(f"  Drop and recreate '{name}'?"):
                client.delete_collection(name)
                print(f"  Deleted '{name}'.")
                create_collection(client, name, cfg)
            else:
                print(f"  Skipping '{name}'.")
        else:
            if confirm(f"Create collection '{name}'?"):
                create_collection(client, name, cfg)
            else:
                print(f"  Skipping '{name}'.")

    # Final summary
    print("\n" + "=" * 60)
    print("  Setup complete. Current collections:")
    for c in client.get_collections().collections:
        info = client.get_collection(c.name)
        print(f"    - {c.name}  (vectors: {info.points_count})")
    print("=" * 60)


if __name__ == "__main__":
    setup()
