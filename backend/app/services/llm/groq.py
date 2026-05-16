import json

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.services.llm.base import BaseLLMProvider

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqProvider(BaseLLMProvider):
    async def validate(self, system_prompt: str, user_message: str) -> dict:
        raw = await self._call(system_prompt, user_message)
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            pass

        retry_prompt = f"Return valid JSON only: {system_prompt}"
        raw = await self._call(retry_prompt, user_message)
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="LLM returned invalid JSON after retry",
            )

    async def _call(self, system_prompt: str, user_message: str) -> str:
        payload = {
            "model": self.model,
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_tokens,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                _GROQ_URL,
                json=payload,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
