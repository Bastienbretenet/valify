"""org llm_model

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-16
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("llm_model", sa.String(255), nullable=False, server_default="google/gemini-2.0-flash-001"),
    )


def downgrade() -> None:
    op.drop_column("organizations", "llm_model")
