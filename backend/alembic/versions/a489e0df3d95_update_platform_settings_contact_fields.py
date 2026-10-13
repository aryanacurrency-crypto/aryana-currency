"""update platform settings contact fields

Revision ID: a489e0df3d95
Revises: 12b098fe8b79
Create Date: 2026-10-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a489e0df3d95'
down_revision: Union[str, None] = '12b098fe8b79'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # حذف فیلدهای قدیمی
    op.execute("ALTER TABLE platform_settings DROP COLUMN IF EXISTS contact_phone")
    op.execute("ALTER TABLE platform_settings DROP COLUMN IF EXISTS contact_whatsapp")
    op.execute("ALTER TABLE platform_settings DROP COLUMN IF EXISTS contact_telegram")

    # اضافه کردن فیلدهای جدید
    op.execute("""
        ALTER TABLE platform_settings
        ADD COLUMN IF NOT EXISTS contact_telegram_channel VARCHAR(255)
    """)
    op.execute("""
        ALTER TABLE platform_settings
        ADD COLUMN IF NOT EXISTS contact_telegram_support VARCHAR(100)
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE platform_settings DROP COLUMN IF EXISTS contact_telegram_support")
    op.execute("ALTER TABLE platform_settings DROP COLUMN IF EXISTS contact_telegram_channel")

    op.execute("""
        ALTER TABLE platform_settings
        ADD COLUMN IF NOT EXISTS contact_telegram VARCHAR(100)
    """)
    op.execute("""
        ALTER TABLE platform_settings
        ADD COLUMN IF NOT EXISTS contact_whatsapp VARCHAR(50)
    """)
    op.execute("""
        ALTER TABLE platform_settings
        ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)
    """)