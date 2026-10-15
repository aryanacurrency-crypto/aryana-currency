"""add vip fields and settings

Revision ID: b6922deb25ff
Revises: 5eaef8cebc91
Create Date: 2026-10-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b6922deb25ff'
down_revision: Union[str, None] = '5eaef8cebc91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ═══════════════════════════════════════════════
    # platform_settings: افزودن فیلدهای VIP
    # ═══════════════════════════════════════════════
    op.add_column(
        'platform_settings',
        sa.Column('vip_commission_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false'))
    )
    op.add_column(
        'platform_settings',
        sa.Column('vip_level1_commission_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default=sa.text('10'))
    )
    op.add_column(
        'platform_settings',
        sa.Column('vip_level2_commission_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default=sa.text('15'))
    )
    op.add_column(
        'platform_settings',
        sa.Column('vip_level3_commission_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default=sa.text('20'))
    )

    # ═══════════════════════════════════════════════
    # users: افزودن فیلدهای VIP
    # ═══════════════════════════════════════════════
    op.add_column(
        'users',
        sa.Column('is_vip', sa.Boolean(), nullable=False, server_default=sa.text('false'))
    )
    op.add_column(
        'users',
        sa.Column('vip_level', sa.Integer(), nullable=False, server_default=sa.text('0'))
    )
    op.add_column(
        'users',
        sa.Column('vip_since', sa.DateTime(timezone=True), nullable=True)
    )

    # ═══════════════════════════════════════════════
    # wheel_audit_logs: admin_id قابل null بشه
    # ═══════════════════════════════════════════════
    op.alter_column(
        'wheel_audit_logs',
        'admin_id',
        existing_type=sa.Integer(),
        nullable=True
    )


def downgrade() -> None:
    # users
    op.drop_column('users', 'vip_since')
    op.drop_column('users', 'vip_level')
    op.drop_column('users', 'is_vip')

    # platform_settings
    op.drop_column('platform_settings', 'vip_level3_commission_percent')
    op.drop_column('platform_settings', 'vip_level2_commission_percent')
    op.drop_column('platform_settings', 'vip_level1_commission_percent')
    op.drop_column('platform_settings', 'vip_commission_enabled')