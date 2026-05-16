from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.api_token import ApiToken
    from app.db.models.project import Project
    from app.db.models.user import User


class Organization(Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    llm_model: Mapped[str] = mapped_column(String(255), nullable=False, default="google/gemini-2.0-flash-lite-001")

    users: Mapped[list["User"]] = relationship(back_populates="organization")
    projects: Mapped[list["Project"]] = relationship(back_populates="organization")
    api_tokens: Mapped[list["ApiToken"]] = relationship(back_populates="organization")
