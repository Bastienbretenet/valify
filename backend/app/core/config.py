from typing import Annotated

from pydantic import BeforeValidator
from pydantic_settings import BaseSettings, NoDecode


def _split_csv(v: object) -> list[str] | object:
    if isinstance(v, str):
        return [o.strip() for o in v.split(",") if o.strip()]
    return v


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    jwt_secret: str
    jwt_expire_days: int = 7
    groq_api_key: str = ""
    openrouter_api_key: str = ""
    app_url: str = "http://localhost:3000"
    cookie_domain: str = ""
    cors_origins: Annotated[list[str], NoDecode, BeforeValidator(_split_csv)] = [
        "http://localhost:3000"
    ]
    llm_provider: str = "groq"
    llm_model: str = "llama-3.1-8b-instant"
    llm_max_tokens: int = 300
    llm_temperature: float = 0
    rate_limit_per_minute: int = 100
    debug: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
