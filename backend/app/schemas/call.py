import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class CallCreate(BaseModel):
    name: str
    description: str | None = None
    expected_fields: dict[str, Any] = {}
    return_schema: dict[str, Any] = {}
    system_prompt: str | None = None


class CallUpdate(BaseModel):
    name: str
    description: str | None = None
    expected_fields: dict[str, Any] = {}
    return_schema: dict[str, Any] = {}
    system_prompt: str | None = None


class CallResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    expected_fields: dict[str, Any]
    return_schema: dict[str, Any]
    system_prompt: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
