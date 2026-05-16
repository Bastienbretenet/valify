import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.call_repository import CallRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.project_repository import ProjectRepository
from app.services.llm.factory import get_llm_provider
from app.services.llm.prompt import build_system_prompt


async def test_call(
    org_id: uuid.UUID,
    project_slug: str,
    call_slug: str,
    prompt: str,
    db: AsyncSession,
) -> dict:
    org_repo = OrganizationRepository(db)
    org = await org_repo.get_by_id(org_id)

    project_repo = ProjectRepository(db)
    project = await project_repo.get_by_slug(org_id, project_slug)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    call_repo = CallRepository(db)
    call = await call_repo.get_by_slug(org_id, project.id, call_slug)
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")

    system_prompt = build_system_prompt(call)
    llm_model = org.llm_model if org else None
    llm = get_llm_provider(model=llm_model)
    return await llm.validate_debug(system_prompt, prompt)
