from pydantic import BaseModel


class ValidateRequest(BaseModel):
    api_token: str
    project: str
    call: str
    prompt: str
    """Client prompt to validate"""


class ValidateResponse(BaseModel):
    valid: bool
    missing: list[str]
    extracted: dict
    suggested_reply: str | None = None
    confidence: float
