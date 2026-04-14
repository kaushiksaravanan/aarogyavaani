"""
AarogyaVaani — Quick Search Test
Embeds a query and searches both health_knowledge_base and user_memory.

Usage:
    python test_search.py
    python test_search.py "diabetes symptoms in Hindi"
    python test_search.py "pregnancy care tips" --user test_user --top 10
"""

import argparse
import os
import sys

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from sentence_transformers import SentenceTransformer

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

MODEL_NAME = "intfloat/multilingual-e5-large-instruct"
DEFAULT_QUERY = "diabetes symptoms in Hindi"
DEFAULT_USER = "test_user"


def get_client() -> QdrantClient:
    if not QDRANT_URL:
        print("ERROR: QDRANT_URL is not set. Add it to your .env file.")
        sys.exit(1)

    kwargs: dict = {"url": QDRANT_URL, "timeout": 30}
    if QDRANT_API_KEY:
        kwargs["api_key"] = QDRANT_API_KEY

    try:
        client = QdrantClient(**kwargs)
        client.get_collections()
        return client
    except Exception as exc:
        print(f"ERROR: Cannot reach Qdrant at {QDRANT_URL}")
        print(f"  {exc}")
        sys.exit(1)


def embed_query(model: SentenceTransformer, text: str) -> list[float]:
    """Embed a query with the E5 'query: ' prefix."""
    embedding = model.encode(f"query: {text}", normalize_embeddings=True)
    return embedding.tolist()


def collection_exists(client: QdrantClient, name: str) -> bool:
    try:
        client.get_collection(name)
        return True
    except (UnexpectedResponse, Exception):
        return False


def search_knowledge_base(
    client: QdrantClient,
    query_vector: list[float],
    top_k: int = 5,
) -> None:
    """Search health_knowledge_base and print results."""
    collection = "health_knowledge_base"
    print(f"\n{'─' * 60}")
    print(f"  Searching: {collection}  (top {top_k})")
    print(f"{'─' * 60}")

    if not collection_exists(client, collection):
        print(f"  Collection '{collection}' does not exist. Run setup_qdrant.py first.")
        return

    results = client.query_points(
        collection_name=collection,
        query=query_vector,
        limit=top_k,
        with_payload=True,
    )

    if not results.points:
        print("  No results found.")
        return

    for i, point in enumerate(results.points, 1):
        payload = point.payload or {}
        title = payload.get("title", "—")
        language = payload.get("language", "—")
        source = payload.get("source", "—")
        content = payload.get("content", "")
        snippet = content[:200].replace("\n", " ")
        if len(content) > 200:
            snippet += "..."

        print(f"\n  [{i}]  score: {point.score:.4f}")
        print(f"       title:    {title}")
        print(f"       language: {language}")
        print(f"       source:   {source}")
        print(f"       content:  {snippet}")


def search_user_memory(
    client: QdrantClient,
    query_vector: list[float],
    user_id: str,
    top_k: int = 5,
) -> None:
    """Search user_memory filtered by user_phone and print results."""
    collection = "user_memory"
    print(f"\n{'─' * 60}")
    print(f"  Searching: {collection}  (user: {user_id}, top {top_k})")
    print(f"{'─' * 60}")

    if not collection_exists(client, collection):
        print(f"  Collection '{collection}' does not exist. Run setup_qdrant.py first.")
        return

    from qdrant_client.http import models

    results = client.query_points(
        collection_name=collection,
        query=query_vector,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="user_phone",
                    match=models.MatchValue(value=user_id),
                ),
            ]
        ),
        limit=top_k,
        with_payload=True,
    )

    if not results.points:
        print("  No memories found for this user.")
        return

    for i, point in enumerate(results.points, 1):
        payload = point.payload or {}
        timestamp = payload.get("timestamp", "—")
        content = payload.get("summary", payload.get("content", ""))
        snippet = content[:200].replace("\n", " ")
        if len(content) > 200:
            snippet += "..."

        print(f"\n  [{i}]  score: {point.score:.4f}")
        print(f"       timestamp: {timestamp}")
        print(f"       content:   {snippet}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test search against AarogyaVaani Qdrant collections"
    )
    parser.add_argument(
        "query",
        nargs="?",
        default=DEFAULT_QUERY,
        help=f'Search query (default: "{DEFAULT_QUERY}")',
    )
    parser.add_argument(
        "--user",
        default=DEFAULT_USER,
        help=f'User ID for memory search (default: "{DEFAULT_USER}")',
    )
    parser.add_argument(
        "--top",
        type=int,
        default=5,
        help="Number of results to return (default: 5)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("  AarogyaVaani — Search Test")
    print("=" * 60)
    print(f"  Query : {args.query}")
    print(f"  User  : {args.user}")
    print(f"  Top-K : {args.top}")

    # Load model
    print(f"\nLoading model: {MODEL_NAME} ...")
    model = SentenceTransformer(MODEL_NAME)

    # Embed the query
    query_vector = embed_query(model, args.query)
    print(f"Query embedded (dim={len(query_vector)})")

    # Connect
    client = get_client()
    print(f"Connected to Qdrant at {QDRANT_URL}")

    # Run searches
    search_knowledge_base(client, query_vector, top_k=args.top)
    search_user_memory(client, query_vector, user_id=args.user, top_k=args.top)

    print(f"\n{'=' * 60}")
    print("  Done.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
