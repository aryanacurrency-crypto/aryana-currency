"""add platform_settings

Revision ID: 12b098fe8b79
Revises: 9a1a386ce752
Create Date: 2026-10-12 18:58:37.854302

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12b098fe8b79'
down_revision: Union[str, None] = '9a1a386ce752'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # ═══════════════════════════════════════
    #  password_reset_tokens (اگه هنوز ساخته نشده)
    # ═══════════════════════════════════════
    op.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(128) NOT NULL UNIQUE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_token
        ON password_reset_tokens (token)
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_user_id
        ON password_reset_tokens (user_id)
    """)

    # ═══════════════════════════════════════
    #  platform_settings
    # ═══════════════════════════════════════
    op.execute("""
        CREATE TABLE IF NOT EXISTS platform_settings (
            id SERIAL PRIMARY KEY,
            contact_phone VARCHAR(50),
            contact_email VARCHAR(255),
            contact_address VARCHAR(255),
            contact_telegram VARCHAR(100),
            contact_whatsapp VARCHAR(50),
            hesab_pay_number VARCHAR(50),
            hesab_pay_holder VARCHAR(120),
            usdt_wallet_trc20 VARCHAR(120),
            usdt_wallet_bep20 VARCHAR(120),
            usdt_wallet_erc20 VARCHAR(120),
            min_deposit_usdt NUMERIC(20, 8) NOT NULL DEFAULT 10,
            min_withdraw_usdt NUMERIC(20, 8) NOT NULL DEFAULT 10,
            min_withdraw_afn NUMERIC(20, 2) NOT NULL DEFAULT 500,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
        )
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP TABLE IF EXISTS platform_settings")
    op.execute("DROP TABLE IF EXISTS password_reset_tokens")