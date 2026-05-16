import json
import re
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.services.llm.base import BaseLLMProvider

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def _extract_json(raw: str | None) -> dict[str, Any]:
    if not raw:
        raise ValueError("Empty response from LLM")
    stripped = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE).strip()
    return json.loads(stripped)


class OpenRouterProvider(BaseLLMProvider):
    async def validate(self, system_prompt: str, user_message: str) -> dict:
        raw = await self._call(system_prompt, user_message)
        try:
            return _extract_json(raw)
        except (json.JSONDecodeError, ValueError):
            pass

        retry_prompt = (
            "Your previous response was not valid JSON. "
            "Respond with ONLY a raw JSON object, no markdown, no explanation, no code blocks.\n"
            + system_prompt
        )
        raw = await self._call(retry_prompt, user_message)
        try:
            return _extract_json(raw)
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="LLM returned invalid JSON after retry",
            )

    async def validate_debug(self, system_prompt: str, user_message: str) -> dict:
        attempts = []

        raw1 = await self._call(system_prompt, user_message)
        attempt1: dict = {"prompt": system_prompt, "user_message": user_message, "raw_response": raw1}
        try:
            result = _extract_json(raw1)
            return result
        except (json.JSONDecodeError, ValueError) as e:
            attempt1["parsed"] = False
            attempt1["parse_error"] = str(e)
        attempts.append(attempt1)

        retry_prompt = (
            "Your previous response was not valid JSON. "
            "Respond with ONLY a raw JSON object, no markdown, no explanation, no code blocks.\n"
            + system_prompt
        )
        raw2 = await self._call(retry_prompt, user_message)
        attempt2: dict = {"prompt": retry_prompt, "user_message": user_message, "raw_response": raw2}
        try:
            result = _extract_json(raw2)
            return result
        except (json.JSONDecodeError, ValueError) as e:
            attempt2["parsed"] = False
            attempt2["parse_error"] = str(e)
        attempts.append(attempt2)

        return {"_debug_error": "LLM returned invalid JSON after retry", "_attempts": attempts}

    async def _call(self, system_prompt: str, user_message: str) -> str:
        payload = {
            "model": self.model,
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_tokens,
            "sort": "latency",
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                _OPENROUTER_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "HTTP-Referer": settings.app_url,
                    "X-Title": "Valify",
                },
            )
        if not resp.is_success:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenRouter error {resp.status_code}: {resp.text}",
            )
        body = resp.json()
        content = body["choices"][0]["message"]["content"]
        if not content:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenRouter returned empty content: {body}",
            )
        return content
