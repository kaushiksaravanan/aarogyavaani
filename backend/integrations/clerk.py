from .env import get_env


def get_clerk_config() -> dict:
    return {
        "publishable_key": get_env("CLERK_PUBLISHABLE_KEY", ""),
        "secret_key": get_env("CLERK_SECRET_KEY", ""),
    }
