"""
AarogyaVaani — Document Ingestion Pipeline
Reads .md files from knowledge_base/{hindi,english,kannada}/,
chunks them, embeds with multilingual-e5-large-instruct,
and upserts into the Qdrant `health_knowledge_base` collection.

Usage:
    python ingest_documents.py
    python ingest_documents.py --knowledge-base ../knowledge_base
    python ingest_documents.py --batch-size 100
"""

import argparse
import os
import re
import sys
import time
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

# Graceful tqdm fallback
try:
    from tqdm import tqdm
except ImportError:
    # Minimal shim that just iterates without a progress bar
    def tqdm(iterable, **kwargs):  # type: ignore[misc]
        return iterable


load_dotenv()

# ── Defaults ─────────────────────────────────────────────────────────

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "health_knowledge_base"
MODEL_NAME = "intfloat/multilingual-e5-large-instruct"
BATCH_SIZE = 50
CHUNK_TARGET_WORDS = 500
LANG_MAP = {"hindi": "hi", "english": "en", "kannada": "kn"}

# ── Frontmatter parser ───────────────────────────────────────────────

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    """
    Extract YAML-style frontmatter from the top of a markdown file.
    Returns (metadata_dict, remaining_body).
    Only handles simple `key: value` pairs — no nested YAML.
    """
    match = _FRONTMATTER_RE.match(text)
    if not match:
        return {}, text

    meta: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            meta[key.strip().lower()] = value.strip().strip('"').strip("'")

    body = text[match.end() :]
    return meta, body


# ── Chunking ─────────────────────────────────────────────────────────


def chunk_text(text: str, target_words: int = CHUNK_TARGET_WORDS) -> list[str]:
    """
    Split text into chunks of roughly `target_words` words.

    Strategy:
      1. Split on double-newlines (paragraph boundaries).
      2. Greedily merge paragraphs until the word budget is hit.
      3. If a single paragraph exceeds the budget, split it by sentences /
         word count.
    """
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks: list[str] = []
    current: list[str] = []
    current_words = 0

    for para in paragraphs:
        para_words = len(para.split())

        # If adding this paragraph stays within budget, accumulate
        if current_words + para_words <= target_words:
            current.append(para)
            current_words += para_words
            continue

        # Flush what we have so far
        if current:
            chunks.append("\n\n".join(current))
            current = []
            current_words = 0

        # Oversized single paragraph — split by word count
        if para_words > target_words:
            words = para.split()
            for i in range(0, len(words), target_words):
                chunk_words = words[i : i + target_words]
                chunks.append(" ".join(chunk_words))
        else:
            current.append(para)
            current_words = para_words

    # Don't forget the tail
    if current:
        chunks.append("\n\n".join(current))

    return [c for c in chunks if c.strip()]


# ── Embedding helper ─────────────────────────────────────────────────


def embed_passages(model: SentenceTransformer, texts: list[str]) -> list[list[float]]:
    """Embed a list of passages with the E5 'passage: ' prefix."""
    prefixed = [f"passage: {t}" for t in texts]
    embeddings = model.encode(
        prefixed, show_progress_bar=False, normalize_embeddings=True
    )
    return embeddings.tolist()


# ── Qdrant helpers ───────────────────────────────────────────────────


def get_client() -> QdrantClient:
    if not QDRANT_URL:
        print("ERROR: QDRANT_URL is not set. Add it to your .env file.")
        sys.exit(1)

    kwargs: dict = {"url": QDRANT_URL, "timeout": 60}
    if QDRANT_API_KEY:
        kwargs["api_key"] = QDRANT_API_KEY

    try:
        client = QdrantClient(**kwargs)
        client.get_collection(COLLECTION_NAME)
        return client
    except Exception as exc:
        print(f"ERROR: Cannot reach Qdrant or collection '{COLLECTION_NAME}' missing.")
        print(f"  {exc}")
        print("  Run setup_qdrant.py first.")
        sys.exit(1)


def upsert_batch(
    client: QdrantClient,
    points: list[models.PointStruct],
) -> None:
    """Upsert a batch of points into the collection."""
    client.upsert(collection_name=COLLECTION_NAME, points=points, wait=True)


# ── File discovery ───────────────────────────────────────────────────


def discover_files(kb_root: Path) -> list[tuple[Path, str]]:
    """
    Walk knowledge_base/{language}/ directories and return a list of
    (file_path, language) tuples for every .md file found.
    """
    files: list[tuple[Path, str]] = []
    for lang in LANG_MAP:
        lang_dir = kb_root / lang
        if not lang_dir.is_dir():
            print(f"  Warning: directory not found — {lang_dir}  (skipping)")
            continue
        md_files = sorted(lang_dir.glob("*.md"))
        for f in md_files:
            files.append((f, LANG_MAP[lang]))
    return files


# ── Main ingestion ───────────────────────────────────────────────────


def ingest(kb_root: Path, batch_size: int = BATCH_SIZE) -> None:
    print("=" * 60)
    print("  AarogyaVaani — Document Ingestion Pipeline")
    print("=" * 60)

    # 1. Discover files
    print(f"\nScanning: {kb_root.resolve()}")
    files = discover_files(kb_root)
    if not files:
        print("No .md files found. Nothing to ingest.")
        return
    print(f"Found {len(files)} file(s) across {list(LANG_MAP.keys())}\n")

    # 2. Load embedding model
    print(f"Loading embedding model: {MODEL_NAME}")
    t0 = time.time()
    model = SentenceTransformer(MODEL_NAME)
    print(f"  Model loaded in {time.time() - t0:.1f}s\n")

    # 3. Connect to Qdrant
    client = get_client()
    print(f"Connected to Qdrant at {QDRANT_URL}")
    print(f"Target collection: {COLLECTION_NAME}\n")

    # 4. Process files
    total_chunks = 0
    batch_buffer: list[models.PointStruct] = []
    files_processed = 0

    for file_path, language in tqdm(files, desc="Ingesting", unit="file"):
        raw_text = file_path.read_text(encoding="utf-8")

        # Parse optional frontmatter
        meta, body = parse_frontmatter(raw_text)
        title = meta.get(
            "title", file_path.stem.replace("_", " ").replace("-", " ").title()
        )
        source = meta.get("source", "local")

        # Chunk the body
        chunks = chunk_text(body)
        if not chunks:
            files_processed += 1
            continue

        # Embed all chunks for this file at once
        embeddings = embed_passages(model, chunks)

        for chunk_text_content, embedding in zip(chunks, embeddings):
            point = models.PointStruct(
                id=str(uuid4()),
                vector=embedding,
                payload={
                    "title": title,
                    "content": chunk_text_content,
                    "language": language,
                    "source": source,
                    "file": file_path.name,
                },
            )
            batch_buffer.append(point)
            total_chunks += 1

            # Flush when batch is full
            if len(batch_buffer) >= batch_size:
                upsert_batch(client, batch_buffer)
                batch_buffer.clear()

        files_processed += 1

        # Progress (printed even without tqdm)
        if files_processed % 5 == 0 or files_processed == len(files):
            print(
                f"  Processed {files_processed}/{len(files)} files, {total_chunks} chunks total"
            )

    # Flush remaining
    if batch_buffer:
        upsert_batch(client, batch_buffer)
        batch_buffer.clear()

    # Summary
    info = client.get_collection(COLLECTION_NAME)
    print("\n" + "=" * 60)
    print(f"  Ingestion complete.")
    print(f"  Files processed : {files_processed}")
    print(f"  Chunks created  : {total_chunks}")
    print(f"  Points in collection: {info.points_count}")
    print("=" * 60)


# ── CLI ──────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest markdown docs into Qdrant")
    parser.add_argument(
        "--knowledge-base",
        type=str,
        default=str(Path(__file__).resolve().parent.parent / "knowledge_base"),
        help="Path to the knowledge_base/ root directory",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=BATCH_SIZE,
        help=f"Qdrant upsert batch size (default: {BATCH_SIZE})",
    )
    args = parser.parse_args()

    kb_path = Path(args.knowledge_base)
    if not kb_path.is_dir():
        print(f"ERROR: Knowledge base directory not found: {kb_path}")
        sys.exit(1)

    ingest(kb_path, batch_size=args.batch_size)


if __name__ == "__main__":
    main()
