from .env import get_env


def get_supabase_config() -> dict:
    return {
        "url": get_env("SUPABASE_URL", ""),
        "anon_key": get_env("SUPABASE_ANON_KEY", ""),
        "service_role_key": get_env("SUPABASE_SERVICE_ROLE_KEY", ""),
    }
