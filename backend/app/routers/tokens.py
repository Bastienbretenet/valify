import uuid
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.db.models.user import User
from app.services import token_service

router = APIRouter(prefix="/tokens", tags=["tokens"])

LLM_MODELS = [
    "mistralai/ministral-8b-2512",
    "google/gemini-2.0-flash-lite-001"
]


class OrgSettings(BaseModel):
    llm_model: str


class OrgSettingsResponse(BaseModel):
    llm_model: str


@router.get("/settings", response_model=OrgSettingsResponse)
async def get_org_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrgSettingsResponse:
    org = await token_service.get_org_settings(user.org_id, db)
    return OrgSettingsResponse(llm_model=org.llm_model)


@router.patch("/settings", response_model=OrgSettingsResponse)
async def update_org_settings(
    body: OrgSettings,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrgSettingsResponse:
    if body.llm_model not in LLM_MODELS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid model. Allowed: {LLM_MODELS}")
    org = await token_service.update_org_settings(user.org_id, body.llm_model, db)
    return OrgSettingsResponse(llm_model=org.llm_model)


class TokenOut(BaseModel):
    id: uuid.UUID
    name: str
    last_used_at: datetime | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenCreated(TokenOut):
    token: str


class TokenCreate(BaseModel):
    name: str


@router.get("", response_model=list[TokenOut])
async def list_tokens(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await token_service.list_tokens(user.org_id, db)


@router.post("", response_model=TokenCreated, status_code=status.HTTP_201_CREATED)
async def create_token(
    body: TokenCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token, raw = await token_service.create_token(user.org_id, body.name, db)
    return TokenCreated(
        id=token.id,
        name=token.name,
        last_used_at=token.last_used_at,
        is_active=token.is_active,
        created_at=token.created_at,
        token=raw,
    )


@router.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_token(
    token_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await token_service.delete_token(user.org_id, token_id, db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")
