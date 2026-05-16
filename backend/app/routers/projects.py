from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.db.models.user import User
from app.schemas.call import CallCreate, CallResponse, CallUpdate
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services import call_service, call_test_service, project_service


class CallTestRequest(BaseModel):
    prompt: str
    """Client prompt to validate"""

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.list_projects(current_user.org_id, db)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.create_project(current_user.org_id, data, db)


@router.get("/{slug}", response_model=ProjectResponse)
async def get_project(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.get_project(current_user.org_id, slug, db)


@router.put("/{slug}", response_model=ProjectResponse)
async def update_project(
    slug: str,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.update_project(current_user.org_id, slug, data, db)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await project_service.delete_project(current_user.org_id, slug, db)


# --- Calls nested under projects ---

@router.get("/{project_slug}/calls", response_model=list[CallResponse])
async def list_calls(
    project_slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await call_service.list_calls(current_user.org_id, project_slug, db)


@router.post("/{project_slug}/calls", response_model=CallResponse, status_code=status.HTTP_201_CREATED)
async def create_call(
    project_slug: str,
    data: CallCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await call_service.create_call(current_user.org_id, project_slug, data, db)


@router.get("/{project_slug}/calls/{call_slug}", response_model=CallResponse)
async def get_call(
    project_slug: str,
    call_slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await call_service.get_call(current_user.org_id, project_slug, call_slug, db)


@router.put("/{project_slug}/calls/{call_slug}", response_model=CallResponse)
async def update_call(
    project_slug: str,
    call_slug: str,
    data: CallUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await call_service.update_call(current_user.org_id, project_slug, call_slug, data, db)


@router.delete("/{project_slug}/calls/{call_slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_call(
    project_slug: str,
    call_slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await call_service.delete_call(current_user.org_id, project_slug, call_slug, db)


@router.post("/{project_slug}/calls/{call_slug}/test")
async def test_call(
    project_slug: str,
    call_slug: str,
    data: CallTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await call_test_service.test_call(
        current_user.org_id, project_slug, call_slug, data.prompt, db
    )
