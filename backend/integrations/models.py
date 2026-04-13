from .env import get_env


def get_model_provider_keys() -> dict:
    return {
        "gemini": get_env("GEMINI_API_KEY", ""),
        "openrouter": get_env("OPENROUTER_API_KEY", ""),
        "huggingface": get_env("HUGGINGFACE_API_KEY", ""),
        "mistral": get_env("MISTRAL_API_KEY", ""),
        "cohere": get_env("COHERE_API_KEY", ""),
        "groq": get_env("GROQ_API_KEY", ""),
        "nvidia": get_env("NVIDIA_API_KEY", ""),
        "cerebras": get_env("CEREBRAS_API_KEY", ""),
    }
