from app.core.config import settings
from app.services.llm.base import BaseLLMProvider
from app.services.llm.groq import GroqProvider
from app.services.llm.openrouter import OpenRouterProvider


def get_llm_provider(provider: str = settings.llm_provider, model: str | None = None) -> BaseLLMProvider:
    providers = {"groq": GroqProvider, "openrouter": OpenRouterProvider}
    cls = providers.get(provider)
    if cls is None:
        raise ValueError(f"Unknown LLM provider: {provider}")
    return cls(model=model or settings.llm_model)
