"""
API key pool with automatic rotation on rate-limit / auth errors.

Keys are loaded from environment variables. When a request fails with
429 (rate limit) or 403/401 (quota exhausted), the pool rotates to
the next available key. Keys that fail are put on a cooldown timer
and retried after the cooldown expires.

Usage:
    pool = KeyPool.from_env("HF_API_TOKEN")  # loads HF_API_TOKEN, HF_API_TOKEN_2, ...
    key = pool.get()          # get current best key
    pool.report_success(key)  # worked fine
    pool.report_failure(key)  # got rate-limited, rotate
"""

import logging
import os
import time
from dataclasses import dataclass, field
from threading import Lock

logger = logging.getLogger("aarogyavaani.keypool")

# How long (seconds) to cool down a key after a rate-limit hit
DEFAULT_COOLDOWN = 60


@dataclass
class _KeyState:
    key: str
    failures: int = 0
    last_failure: float = 0.0
    cooldown: float = DEFAULT_COOLDOWN


class KeyPool:
    """Thread-safe round-robin key pool with cooldown on failure."""

    def __init__(self, keys: list[str], cooldown: float = DEFAULT_COOLDOWN):
        if not keys:
            raise ValueError("KeyPool requires at least one key")

        seen: set[str] = set()
        deduped: list[str] = []
        for k in keys:
            k = k.strip()
            if k and k not in seen:
                deduped.append(k)
                seen.add(k)

        if not deduped:
            raise ValueError("KeyPool: all provided keys are empty")

        self._states: list[_KeyState] = [
            _KeyState(key=k, cooldown=cooldown) for k in deduped
        ]
        self._index = 0
        self._lock = Lock()
        logger.info("KeyPool initialised with %d key(s)", len(self._states))

    @classmethod
    def from_env(cls, prefix: str, cooldown: float = DEFAULT_COOLDOWN) -> "KeyPool":
        """Load keys from env vars matching a prefix pattern.

        Looks for:  PREFIX, PREFIX_1, PREFIX_2, ... PREFIX_20
        Example:    HF_API_TOKEN, HF_API_TOKEN_1, HF_API_TOKEN_2
        """
        keys: list[str] = []

        # Primary key (no suffix)
        val = os.getenv(prefix, "")
        if val:
            keys.append(val)

        # Numbered variants
        for i in range(1, 21):
            for pattern in [f"{prefix}_{i}", f"{prefix}{i}"]:
                val = os.getenv(pattern, "")
                if val and val not in keys:
                    keys.append(val)

        if not keys:
            logger.warning("KeyPool.from_env(%s): no keys found", prefix)
            return cls([""], cooldown=cooldown)  # empty key = unauthenticated

        logger.info("KeyPool.from_env(%s): loaded %d key(s)", prefix, len(keys))
        return cls(keys, cooldown=cooldown)

    def get(self) -> str:
        """Return the current best key (skip cooled-down ones)."""
        with self._lock:
            now = time.monotonic()
            n = len(self._states)

            # Try each key starting from current index
            for offset in range(n):
                idx = (self._index + offset) % n
                state = self._states[idx]
                elapsed = now - state.last_failure

                if state.failures == 0 or elapsed > state.cooldown:
                    # Key is available
                    self._index = idx
                    return state.key

            # All keys are on cooldown — return the one closest to recovery
            best = min(self._states, key=lambda s: s.cooldown - (now - s.last_failure))
            logger.warning(
                "KeyPool: all %d keys on cooldown, using least-recent failure", n
            )
            return best.key

    def report_success(self, key: str) -> None:
        """Mark a key as healthy — reset its failure counter."""
        with self._lock:
            for state in self._states:
                if state.key == key:
                    if state.failures > 0:
                        logger.info("KeyPool: key ...%s recovered", key[-6:])
                    state.failures = 0
                    state.last_failure = 0.0
                    break

    def report_failure(self, key: str) -> None:
        """Mark a key as rate-limited — put it on cooldown and rotate."""
        with self._lock:
            for i, state in enumerate(self._states):
                if state.key == key:
                    state.failures += 1
                    state.last_failure = time.monotonic()
                    # Exponential backoff: 60s, 120s, 240s, max 600s
                    state.cooldown = min(
                        DEFAULT_COOLDOWN * (2 ** (state.failures - 1)), 600
                    )
                    logger.warning(
                        "KeyPool: key ...%s failed (%d), cooldown %.0fs, rotating",
                        key[-6:],
                        state.failures,
                        state.cooldown,
                    )
                    # Advance index past this key
                    self._index = (i + 1) % len(self._states)
                    break

    @property
    def size(self) -> int:
        return len(self._states)

    @property
    def active_count(self) -> int:
        """Number of keys not currently on cooldown."""
        now = time.monotonic()
        return sum(
            1
            for s in self._states
            if s.failures == 0 or (now - s.last_failure) > s.cooldown
        )
