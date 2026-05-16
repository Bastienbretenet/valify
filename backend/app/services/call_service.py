import re
import uuid
from typing import TYPE_CHECKING

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.call import Call
from app.repositories.call_repository import CallRepository
from app.repositories.project_repository import ProjectRepository
from app.schemas.call import CallCreate, CallUpdate

if TYPE_CHECKING:
    from app.db.models.project import Project


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-") or "call"


async def _get_project_or_404(org_id: uuid.UUID, project_slug: str, db: AsyncSession) -> "Project":
    repo = ProjectRepository(db)
    project = await repo.get_by_slug(org_id, project_slug)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def list_calls(org_id: uuid.UUID, project_slug: str, db: AsyncSession) -> list[Call]:
    project = await _get_project_or_404(org_id, project_slug, db)
    repo = CallRepository(db)
    return await repo.list_by_project(org_id, project.id)


async def get_call(org_id: uuid.UUID, project_slug: str, call_slug: str, db: AsyncSession) -> Call:
    project = await _get_project_or_404(org_id, project_slug, db)
    repo = CallRepository(db)
    call = await repo.get_by_slug(org_id, project.id, call_slug)
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
    return call


async def create_call(org_id: uuid.UUID, project_slug: str, data: CallCreate, db: AsyncSession) -> Call:
    project = await _get_project_or_404(org_id, project_slug, db)
    repo = CallRepository(db)
    base_slug = _slugify(data.name)
    slug = base_slug
    n = 1
    while await repo.get_by_slug(org_id, project.id, slug):
        slug = f"{base_slug}-{n}"
        n += 1
    call = await repo.create(
        project.id, data.name, slug, data.description,
        data.expected_fields, data.return_schema, data.system_prompt,
    )
    await db.commit()
    await db.refresh(call)
    return call


async def update_call(
    org_id: uuid.UUID, project_slug: str, call_slug: str, data: CallUpdate, db: AsyncSession
) -> Call:
    project = await _get_project_or_404(org_id, project_slug, db)
    repo = CallRepository(db)
    call = await repo.get_by_slug(org_id, project.id, call_slug)
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
    call = await repo.update(
        call, data.name, call_slug, data.description,
        data.expected_fields, data.return_schema, data.system_prompt,
    )
    await db.commit()
    await db.refresh(call)
    return call


async def delete_call(org_id: uuid.UUID, project_slug: str, call_slug: str, db: AsyncSession) -> None:
    project = await _get_project_or_404(org_id, project_slug, db)
    repo = CallRepository(db)
    call = await repo.get_by_slug(org_id, project.id, call_slug)
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
    await repo.delete(call)
    await db.commit()
