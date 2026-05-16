import json
import time
import uuid

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_db, get_redis
from app.core.security import verify_password
from app.repositories.api_token_repository import ApiTokenRepository
from app.repositories.call_repository import CallRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.project_repository import ProjectRepository
from app.schemas.validate import ValidateRequest, ValidateResponse
from app.services.llm.factory import get_llm_provider
from app.services.llm.prompt import build_system_prompt

router = APIRouter(prefix="/v1", tags=["validate"])

_TOKEN_CACHE_TTL = 300  # 5 min
_CALL_CACHE_TTL = 300
_RATE_WINDOW = 60  # seconds
_RATE_LIMIT = settings.rate_limit_per_minute


def _token_cache_key(raw_token: str) -> str:
    return f"token_auth:{raw_token[:16]}"


def _call_cache_key(project_slug: str, call_slug: str) -> str:
    return f"call:{project_slug}:{call_slug}"


def _rate_key(token_id: str) -> str:
    return f"rate:{token_id}"


async def _authenticate_token(
    raw_token: str,
    redis: aioredis.Redis,
    db: AsyncSession,
) -> tuple[uuid.UUID, uuid.UUID]:
    """Return (org_id, token_id). Raises 401 on failure."""
    cache_key = _token_cache_key(raw_token)
    cached = await redis.get(cache_key)
    if cached:
        data = json.loads(cached)
        return uuid.UUID(data["org_id"]), uuid.UUID(data["token_id"])

    repo = ApiTokenRepository(db)
    rows = await repo.get_active_tokens_for_verify()
    for row in rows:
        if verify_password(raw_token, row.token_hash):
            await redis.setex(
                cache_key,
                _TOKEN_CACHE_TTL,
                json.dumps({"org_id": str(row.org_id), "token_id": str(row.id)}),
            )
            return row.org_id, row.id

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API token")


async def _check_rate_limit(token_id: uuid.UUID, redis: aioredis.Redis, response: Response) -> None:
    key = _rate_key(str(token_id))
    now = time.time()
    window_start = now - _RATE_WINDOW

    async with redis.pipeline(transaction=True) as pipe:
        pipe.zremrangebyscore(key, "-inf", window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, _RATE_WINDOW)
        results = await pipe.execute()

    count = results[2]
    remaining = max(0, _RATE_LIMIT - count)
    reset_at = int(now) + _RATE_WINDOW

    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_at)

    if count > _RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": str(reset_at)},
        )



@router.post("/validate", response_model=ValidateResponse)
async def validate_message(
    body: ValidateRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> ValidateResponse:
    org_id, token_id = await _authenticate_token(body.api_token, redis, db)

    await _check_rate_limit(token_id, redis, response)

    call_key = _call_cache_key(body.project, body.call)
    cached_call = await redis.get(call_key)
    if cached_call:
        call_data = json.loads(cached_call)
        if call_data.get("org_id") != str(org_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="call_not_found")

        class _CachedCall:
            description = call_data["description"]
            expected_fields = call_data["expected_fields"]
            return_schema = call_data["return_schema"]
            system_prompt = call_data["system_prompt"]

        call_obj = _CachedCall()
    else:
        project_repo = ProjectRepository(db)
        project = await project_repo.get_by_slug(org_id, body.project)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "call_not_found", "message": f"No call '{body.call}' in project '{body.project}'"},
            )

        call_repo = CallRepository(db)
        call_obj = await call_repo.get_by_slug(org_id, project.id, body.call)
        if not call_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "call_not_found", "message": f"No call '{body.call}' in project '{body.project}'"},
            )

        await redis.setex(
            call_key,
            _CALL_CACHE_TTL,
            json.dumps({
                "org_id": str(org_id),
                "description": call_obj.description,
                "expected_fields": call_obj.expected_fields,
                "return_schema": call_obj.return_schema,
                "system_prompt": call_obj.system_prompt,
            }),
        )

    system_prompt = build_system_prompt(call_obj)

    org_repo = OrganizationRepository(db)
    org = await org_repo.get_by_id(org_id)
    llm = get_llm_provider(model=org.llm_model if org else None)
    result = await llm.validate(system_prompt, body.prompt)

    token_repo = ApiTokenRepository(db)
    await token_repo.touch(token_id)
    await db.commit()

    return ValidateResponse(**result)
