import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.project import Project


class ProjectRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_by_org(self, org_id: uuid.UUID) -> list[Project]:
        result = await self._db.execute(
            select(Project).where(Project.org_id == org_id).order_by(Project.created_at)
        )
        return list(result.scalars().all())

    async def get_by_slug(self, org_id: uuid.UUID, slug: str) -> Project | None:
        result = await self._db.execute(
            select(Project).where(Project.org_id == org_id, Project.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, org_id: uuid.UUID, project_id: uuid.UUID) -> Project | None:
        result = await self._db.execute(
            select(Project).where(Project.org_id == org_id, Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def create(self, org_id: uuid.UUID, name: str, slug: str, description: str | None) -> Project:
        project = Project(org_id=org_id, name=name, slug=slug, description=description)
        self._db.add(project)
        await self._db.flush()
        return project

    async def update(self, project: Project, name: str, slug: str, description: str | None) -> Project:
        project.name = name
        project.slug = slug
        project.description = description
        await self._db.flush()
        return project

    async def delete(self, project: Project) -> None:
        await self._db.delete(project)
        await self._db.flush()
