import os
from typing import Optional


def get_env(name: str, default: Optional[str] = None) -> Optional[str]:
    return os.getenv(name, default)


def has_env(name: str) -> bool:
    value = os.getenv(name)
    return bool(value and value.strip())
