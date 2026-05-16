import secrets
import uuid

import bcrypt
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.api_token import ApiToken
from app.db.models.organization import Organization
from app.repositories.api_token_repository import ApiTokenRepository
from app.repositories.organization_repository import OrganizationRepository


async def list_tokens(org_id: uuid.UUID, db: AsyncSession) -> list[ApiToken]:
    repo = ApiTokenRepository(db)
    return await repo.get_by_org(org_id)


async def create_token(org_id: uuid.UUID, name: str, db: AsyncSession) -> tuple[ApiToken, str]:
    raw = "sk_live_" + secrets.token_urlsafe(32)
    token_hash = bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()
    repo = ApiTokenRepository(db)
    token = await repo.create(org_id=org_id, name=name, token_hash=token_hash)
    await db.commit()
    await db.refresh(token)
    return token, raw


async def delete_token(org_id: uuid.UUID, token_id: uuid.UUID, db: AsyncSession) -> bool:
    repo = ApiTokenRepository(db)
    token = await repo.get_by_id(org_id, token_id)
    if not token:
        return False
    await repo.deactivate(token)
    await db.commit()
    return True


async def get_org_settings(org_id: uuid.UUID, db: AsyncSession) -> Organization:
    repo = OrganizationRepository(db)
    org = await repo.get_by_id(org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


async def update_org_settings(org_id: uuid.UUID, llm_model: str, db: AsyncSession) -> Organization:
    repo = OrganizationRepository(db)
    org = await repo.update_llm_model(org_id, llm_model)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    await db.commit()
    return org
