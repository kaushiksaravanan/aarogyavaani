from .env import get_env


def get_paddle_config() -> dict:
    return {
        "api_key": get_env("PADDLE_API_KEY", ""),
        "environment": get_env("PADDLE_ENV", "sandbox"),
        "price_id": get_env("PADDLE_PRICE_ID", ""),
    }
