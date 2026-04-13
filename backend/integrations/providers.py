from .env import get_env, has_env


def provider_status() -> dict:
    return {
        "supabase": {
            "url": has_env("SUPABASE_URL"),
            "anon_key": has_env("SUPABASE_ANON_KEY"),
            "service_key": has_env("SUPABASE_SERVICE_ROLE_KEY"),
        },
        "clerk": {
            "publishable_key": has_env("CLERK_PUBLISHABLE_KEY"),
            "secret_key": has_env("CLERK_SECRET_KEY"),
        },
        "paddle": {
            "api_key": has_env("PADDLE_API_KEY"),
            "price_id": has_env("PADDLE_PRICE_ID"),
        },
        "neon": {
            "database_url": has_env("NEON_DATABASE_URL"),
            "api_key": has_env("NEON_DB_API_KEY"),
        },
        "tinybird": {
            "api_key": has_env("TINYBIRD_API_KEY"),
        },
        "gemini": {
            "api_key": has_env("GEMINI_API_KEY"),
        },
        "openrouter": {
            "api_key": has_env("OPENROUTER_API_KEY"),
        },
        "github": {
            "token": has_env("GITHUB_TOKEN"),
        },
    }


def starter_env_map() -> dict:
    return {
        "supabase_url": get_env("SUPABASE_URL"),
        "supabase_anon_key": get_env("SUPABASE_ANON_KEY"),
        "clerk_publishable_key": get_env("CLERK_PUBLISHABLE_KEY"),
        "paddle_environment": get_env("PADDLE_ENV", "sandbox"),
        "neon_database_url": get_env("NEON_DATABASE_URL"),
    }
