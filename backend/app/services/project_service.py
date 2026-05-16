import re
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.project import Project
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-") or "project"


async def list_projects(org_id: uuid.UUID, db: AsyncSession) -> list[Project]:
    repo = ProjectRepository(db)
    return await repo.list_by_org(org_id)


async def get_project(org_id: uuid.UUID, slug: str, db: AsyncSession) -> Project:
    repo = ProjectRepository(db)
    project = await repo.get_by_slug(org_id, slug)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def create_project(org_id: uuid.UUID, data: ProjectCreate, db: AsyncSession) -> Project:
    repo = ProjectRepository(db)
    base_slug = _slugify(data.name)
    slug = base_slug
    n = 1
    while await repo.get_by_slug(org_id, slug):
        slug = f"{base_slug}-{n}"
        n += 1
    project = await repo.create(org_id, data.name, slug, data.description)
    await db.commit()
    await db.refresh(project)
    return project


async def update_project(org_id: uuid.UUID, slug: str, data: ProjectUpdate, db: AsyncSession) -> Project:
    repo = ProjectRepository(db)
    project = await repo.get_by_slug(org_id, slug)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project = await repo.update(project, data.name, slug, data.description)
    await db.commit()
    await db.refresh(project)
    return project


async def delete_project(org_id: uuid.UUID, slug: str, db: AsyncSession) -> None:
    repo = ProjectRepository(db)
    project = await repo.get_by_slug(org_id, slug)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    await repo.delete(project)
    await db.commit()
