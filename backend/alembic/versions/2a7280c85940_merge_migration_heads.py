"""merge migration heads

Revision ID: 2a7280c85940
Revises: 46b0f5503975, 817907ce867c
Create Date: 2026-08-18 01:27:09.728298

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a7280c85940'
down_revision: Union[str, Sequence[str], None] = ('46b0f5503975', '817907ce867c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
