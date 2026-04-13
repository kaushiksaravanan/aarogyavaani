from .env import get_env


def get_neon_config() -> dict:
    return {
        "database_url": get_env("NEON_DATABASE_URL", ""),
        "api_key": get_env("NEON_DB_API_KEY", ""),
    }
