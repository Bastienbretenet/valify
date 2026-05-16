from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.core.security import COOKIE_NAME, create_token
from app.db.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

_COOKIE_OPTS = {
    "key": COOKIE_NAME,
    "httponly": True,
    "samesite": "lax" if settings.debug else "none",
    "secure": not settings.debug,
    **({"domain": settings.cookie_domain} if settings.cookie_domain else {}),
}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register(data, db)
    token = create_token(str(user.id), str(user.org_id))
    response.set_cookie(value=token, **_COOKIE_OPTS)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=UserResponse)
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await auth_service.login(data.email, data.password, db)
    token = create_token(str(user.id), str(user.org_id))
    response.set_cookie(value=token, **_COOKIE_OPTS)
    return UserResponse.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(
        COOKIE_NAME,
        samesite="lax" if settings.debug else "none",
        secure=not settings.debug,
        domain=settings.cookie_domain or None,
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
