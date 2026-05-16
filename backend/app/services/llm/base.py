from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):
    def __init__(self, model: str) -> None:
        self.model = model

    @abstractmethod
    async def validate(self, system_prompt: str, user_message: str) -> dict:
        ...

    async def validate_debug(self, system_prompt: str, user_message: str) -> dict:
        result = await self.validate(system_prompt, user_message)
        return {"ok": True, "result": result, "system_prompt": system_prompt, "user_message": user_message}
