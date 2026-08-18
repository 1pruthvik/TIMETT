"""add student count to sections

Revision ID: 817907ce867c
Revises: 48735e97c095
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "817907ce867c"
down_revision: Union[str, Sequence[str], None] = "48735e97c095"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sections",
        sa.Column(
            "student_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )


def downgrade() -> None:
    op.drop_column("sections", "student_count")
