from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.db.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest


async def register(data: RegisterRequest, db: AsyncSession) -> User:
    user_repo = UserRepository(db)
    org_repo = OrganizationRepository(db)

    existing = await user_repo.get_by_email(data.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    org = await org_repo.create(data.organization_name)
    user = await user_repo.create(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        org_id=org.id,
    )
    await db.commit()
    await db.refresh(user)
    return user


async def login(email: str, password: str, db: AsyncSession) -> User:
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    return user
