import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.organization import Organization


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    return re.sub(r"-+", "-", slug)


class OrganizationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, name: str) -> Organization:
        org = Organization(name=name, slug=_slugify(name))
        self._db.add(org)
        await self._db.flush()
        return org

    async def get_by_id(self, org_id: uuid.UUID) -> Organization | None:
        result = await self._db.execute(select(Organization).where(Organization.id == org_id))
        return result.scalar_one_or_none()

    async def update_llm_model(self, org_id: uuid.UUID, llm_model: str) -> Organization | None:
        org = await self.get_by_id(org_id)
        if not org:
            return None
        org.llm_model = llm_model
        await self._db.flush()
        return org
