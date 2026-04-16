"""
Multi-provider embedding router with automatic failover.

Tries providers in priority order. If one fails (rate-limit, down, error),
rotates to the next. Each provider has its own key pool for key-level rotation.

All providers are configured to output 1024-dimension normalised vectors
to match the Qdrant collection schema.

Supported providers:
  - HuggingFace Inference API  (multilingual-e5-large-instruct, 1024d)
  - Mistral AI                 (mistral-embed, 1024d)
  - Cohere                     (embed-multilingual-v3.0, 1024d)
"""

import logging
import os
import time
from dataclasses import dataclass
from threading import Lock
from typing import Optional

import httpx

from app.keypool import KeyPool

logger = logging.getLogger("aarogyavaani.embeddings")

# ---------------------------------------------------------------------------
# Provider definitions
# ---------------------------------------------------------------------------


@dataclass
class _ProviderState:
    name: str
    failures: int = 0
    last_failure: float = 0.0
    cooldown: float = 120.0  # provider-level cooldown (longer than key-level)


class EmbeddingRouter:
    """Routes embedding calls across multiple providers with failover."""

    def __init__(self):
        self._providers: list[dict] = []
        self._provider_states: dict[str, _ProviderState] = {}
        self._lock = Lock()
        self._init_providers()

    def _init_providers(self):
        """Discover available providers from environment variables."""

        # --- HuggingFace ---
        hf_pool = KeyPool.from_env("HF_API_TOKEN", cooldown=60)
        if hf_pool.size > 0 and hf_pool.get():
            self._providers.append(
                {
                    "name": "huggingface",
                    "pool": hf_pool,
                    "embed_fn": self._embed_huggingface,
                }
            )
            self._provider_states["huggingface"] = _ProviderState(name="huggingface")
            logger.info("Provider huggingface: %d key(s)", hf_pool.size)

        # --- Mistral ---
        mistral_keys = []
        for var in ["MISTRAL_API_KEY", "MISTRAL_API_KEY_1", "MISTRAL_API_KEY_2"]:
            val = os.getenv(var, "")
            if val and val not in mistral_keys:
                mistral_keys.append(val)
        if mistral_keys:
            mistral_pool = KeyPool(mistral_keys, cooldown=60)
            self._providers.append(
                {
                    "name": "mistral",
                    "pool": mistral_pool,
                    "embed_fn": self._embed_mistral,
                }
            )
            self._provider_states["mistral"] = _ProviderState(name="mistral")
            logger.info("Provider mistral: %d key(s)", mistral_pool.size)

        # --- Cohere ---
        cohere_keys = []
        for var in ["COHERE_API_KEY", "COHERE_API_KEY_1", "COHERE_API_KEY_2"]:
            val = os.getenv(var, "")
            if val and val not in cohere_keys:
                cohere_keys.append(val)
        if cohere_keys:
            cohere_pool = KeyPool(cohere_keys, cooldown=60)
            self._providers.append(
                {
                    "name": "cohere",
                    "pool": cohere_pool,
                    "embed_fn": self._embed_cohere,
                }
            )
            self._provider_states["cohere"] = _ProviderState(name="cohere")
            logger.info("Provider cohere: %d key(s)", cohere_pool.size)

        # --- Nvidia ---
        nvidia_keys = []
        for var in ["NVIDIA_API_KEY", "NVIDIA_API_KEY_1"]:
            val = os.getenv(var, "")
            if val and val not in nvidia_keys:
                nvidia_keys.append(val)
        if nvidia_keys:
            nvidia_pool = KeyPool(nvidia_keys, cooldown=60)
            self._providers.append(
                {
                    "name": "nvidia",
                    "pool": nvidia_pool,
                    "embed_fn": self._embed_nvidia,
                }
            )
            self._provider_states["nvidia"] = _ProviderState(name="nvidia")
            logger.info("Provider nvidia: %d key(s)", nvidia_pool.size)

        total_keys = sum(p["pool"].size for p in self._providers)
        logger.info(
            "EmbeddingRouter: %d provider(s), %d total key(s)",
            len(self._providers),
            total_keys,
        )

        if not self._providers:
            logger.error("EmbeddingRouter: NO providers configured!")

    def _is_provider_available(self, name: str) -> bool:
        state = self._provider_states.get(name)
        if not state or state.failures == 0:
            return True
        return (time.monotonic() - state.last_failure) > state.cooldown

    def _mark_provider_failure(self, name: str):
        with self._lock:
            state = self._provider_states[name]
            state.failures += 1
            state.last_failure = time.monotonic()
            state.cooldown = min(120 * (2 ** (state.failures - 1)), 900)
            logger.warning(
                "Provider %s failed (%d), cooldown %.0fs",
                name,
                state.failures,
                state.cooldown,
            )

    def _mark_provider_success(self, name: str):
        with self._lock:
            state = self._provider_states[name]
            if state.failures > 0:
                logger.info("Provider %s recovered", name)
            state.failures = 0
            state.last_failure = 0.0

    async def embed(self, text: str, client: httpx.AsyncClient) -> list[float]:
        """Embed text, trying providers in order with failover."""
        errors = []

        for provider in self._providers:
            name = provider["name"]
            if not self._is_provider_available(name):
                continue

            pool: KeyPool = provider["pool"]
            embed_fn = provider["embed_fn"]

            # Try each key in this provider's pool
            for _attempt in range(pool.size + 1):
                key = pool.get()
                try:
                    vector = await embed_fn(client, key, text)
                    pool.report_success(key)
                    self._mark_provider_success(name)
                    return vector
                except _RateLimitError:
                    pool.report_failure(key)
                    errors.append(f"{name}: rate-limited key ...{key[-6:]}")
                    continue
                except _ProviderError as e:
                    pool.report_failure(key)
                    errors.append(f"{name}: {e}")
                    break  # Provider-level error, try next provider
                except httpx.RequestError as e:
                    self._mark_provider_failure(name)
                    errors.append(f"{name}: network error ({e})")
                    break  # Network issue with this provider

            # All keys for this provider exhausted
            self._mark_provider_failure(name)

        raise RuntimeError(f"All embedding providers exhausted: {'; '.join(errors)}")

    # --- Provider implementations ---

    @staticmethod
    def _normalise(vector: list[float]) -> list[float]:
        norm = sum(x * x for x in vector) ** 0.5
        if norm > 0:
            return [x / norm for x in vector]
        return vector

    async def _embed_huggingface(
        self, client: httpx.AsyncClient, key: str, text: str
    ) -> list[float]:
        url = os.getenv(
            "HF_API_URL",
            "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct",
        )
        headers = {"Content-Type": "application/json"}
        if key:
            headers["Authorization"] = f"Bearer {key}"

        resp = await client.post(
            url,
            json={"inputs": text, "options": {"wait_for_model": True}},
            headers=headers,
        )
        if resp.status_code in (429, 401, 403, 503):
            raise _RateLimitError(f"HF {resp.status_code}")
        if resp.status_code >= 400:
            raise _ProviderError(f"HF {resp.status_code}: {resp.text[:200]}")

        vector = resp.json()
        if isinstance(vector[0], list):
            vector = vector[0]
        return self._normalise(vector)

    async def _embed_mistral(
        self, client: httpx.AsyncClient, key: str, text: str
    ) -> list[float]:
        resp = await client.post(
            "https://api.mistral.ai/v1/embeddings",
            json={"model": "mistral-embed", "input": [text]},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
        )
        if resp.status_code in (429, 401, 403, 503):
            raise _RateLimitError(f"Mistral {resp.status_code}")
        if resp.status_code >= 400:
            raise _ProviderError(f"Mistral {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        vector = data["data"][0]["embedding"]
        # Mistral embed is 1024d — matches our collection
        return self._normalise(vector)

    async def _embed_cohere(
        self, client: httpx.AsyncClient, key: str, text: str
    ) -> list[float]:
        # Determine input_type from prefix
        input_type = "search_query"
        if text.startswith("passage:"):
            input_type = "search_document"
            text = text[len("passage:") :].strip()
        elif text.startswith("query:"):
            text = text[len("query:") :].strip()

        resp = await client.post(
            "https://api.cohere.com/v1/embed",
            json={
                "model": "embed-multilingual-v3.0",
                "texts": [text],
                "input_type": input_type,
                "truncate": "END",
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
        )
        if resp.status_code in (429, 401, 403, 503):
            raise _RateLimitError(f"Cohere {resp.status_code}")
        if resp.status_code >= 400:
            raise _ProviderError(f"Cohere {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        vector = data["embeddings"][0]
        # Cohere embed-multilingual-v3.0 is 1024d — matches
        return self._normalise(vector)

    async def _embed_nvidia(
        self, client: httpx.AsyncClient, key: str, text: str
    ) -> list[float]:
        # Clean prefix for nvidia
        clean_text = text
        if clean_text.startswith("query:") or clean_text.startswith("passage:"):
            clean_text = clean_text.split(":", 1)[1].strip()

        resp = await client.post(
            "https://integrate.api.nvidia.com/v1/embeddings",
            json={
                "model": "nvidia/nv-embedqa-e5-v5",
                "input": [clean_text],
                "input_type": "query" if text.startswith("query:") else "passage",
                "encoding_format": "float",
                "truncate": "END",
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
        )
        if resp.status_code in (429, 401, 403, 503):
            raise _RateLimitError(f"Nvidia {resp.status_code}")
        if resp.status_code >= 400:
            raise _ProviderError(f"Nvidia {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        vector = data["data"][0]["embedding"]
        # NV-EmbedQA-E5-V5 is 1024d
        return self._normalise(vector)


# Internal exception types for flow control
class _RateLimitError(Exception):
    pass


class _ProviderError(Exception):
    pass


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
_router: Optional[EmbeddingRouter] = None


def get_embedding_router() -> EmbeddingRouter:
    global _router
    if _router is None:
        _router = EmbeddingRouter()
    return _router
