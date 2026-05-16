import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.api_token import ApiToken


class ApiTokenRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_active_tokens_for_verify(self) -> list[ApiToken]:
        result = await self._db.execute(
            select(ApiToken.id, ApiToken.org_id, ApiToken.token_hash)
            .where(ApiToken.is_active == True)  # noqa: E712
        )
        return list(result.all())

    async def get_by_org(self, org_id: uuid.UUID) -> list[ApiToken]:
        result = await self._db.execute(
            select(ApiToken)
            .where(ApiToken.org_id == org_id, ApiToken.is_active == True)  # noqa: E712
            .order_by(ApiToken.created_at)
        )
        return list(result.scalars().all())

    async def get_by_id(self, org_id: uuid.UUID, token_id: uuid.UUID) -> ApiToken | None:
        result = await self._db.execute(
            select(ApiToken).where(ApiToken.org_id == org_id, ApiToken.id == token_id)
        )
        return result.scalar_one_or_none()

    async def create(self, org_id: uuid.UUID, name: str, token_hash: str) -> ApiToken:
        token = ApiToken(org_id=org_id, name=name, token_hash=token_hash)
        self._db.add(token)
        await self._db.flush()
        return token

    async def touch(self, token_id: uuid.UUID) -> None:
        result = await self._db.execute(
            select(ApiToken).where(ApiToken.id == token_id)
        )
        token = result.scalar_one_or_none()
        if token:
            token.last_used_at = datetime.now(timezone.utc)
            await self._db.flush()

    async def deactivate(self, token: ApiToken) -> None:
        token.is_active = False
        await self._db.flush()
