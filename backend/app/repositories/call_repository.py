import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.call import Call
from app.db.models.project import Project


class CallRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_by_project(self, org_id: uuid.UUID, project_id: uuid.UUID) -> list[Call]:
        result = await self._db.execute(
            select(Call)
            .join(Project, Call.project_id == Project.id)
            .where(Project.org_id == org_id, Call.project_id == project_id)
            .order_by(Call.created_at)
        )
        return list(result.scalars().all())

    async def get_by_slug(self, org_id: uuid.UUID, project_id: uuid.UUID, slug: str) -> Call | None:
        result = await self._db.execute(
            select(Call)
            .join(Project, Call.project_id == Project.id)
            .where(Project.org_id == org_id, Call.project_id == project_id, Call.slug == slug)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        project_id: uuid.UUID,
        name: str,
        slug: str,
        description: str | None,
        expected_fields: dict[str, Any],
        return_schema: dict[str, Any],
        system_prompt: str | None,
    ) -> Call:
        call = Call(
            project_id=project_id,
            name=name,
            slug=slug,
            description=description,
            expected_fields=expected_fields,
            return_schema=return_schema,
            system_prompt=system_prompt,
        )
        self._db.add(call)
        await self._db.flush()
        return call

    async def update(
        self,
        call: Call,
        name: str,
        slug: str,
        description: str | None,
        expected_fields: dict[str, Any],
        return_schema: dict[str, Any],
        system_prompt: str | None,
    ) -> Call:
        call.name = name
        call.slug = slug
        call.description = description
        call.expected_fields = expected_fields
        call.return_schema = return_schema
        call.system_prompt = system_prompt
        await self._db.flush()
        return call

    async def delete(self, call: Call) -> None:
        await self._db.delete(call)
        await self._db.flush()
