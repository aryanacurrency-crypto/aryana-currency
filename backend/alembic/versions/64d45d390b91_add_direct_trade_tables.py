"""add direct trade tables

Revision ID: 64d45d390b91
Revises: a489e0df3d95
Create Date: 2026-10-14 11:03:06.550802

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '64d45d390b91'
down_revision: Union[str, None] = 'a489e0df3d95'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ═══════════════════════════════════════════════════
    #            Direct Trade Tables
    # ═══════════════════════════════════════════════════

    # --- direct_trade_ads ---
    op.create_table(
        'direct_trade_ads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('side', sa.Enum('SELL', 'BUY', name='directtradeadside'), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column('available_amount', sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column('locked_amount', sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column('rate_afn_per_usdt', sa.Numeric(precision=20, scale=4), nullable=False),
        sa.Column('min_order_usdt', sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column('max_order_usdt', sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('terms', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', name='directtradeadstatus'), nullable=False),
        sa.Column('total_trades', sa.Integer(), nullable=False),
        sa.Column('completed_trades', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_direct_trade_ads_seller_id'), 'direct_trade_ads', ['seller_id'], unique=False)
    op.create_index('ix_direct_trade_ads_seller_status', 'direct_trade_ads', ['seller_id', 'status'], unique=False)
    op.create_index(op.f('ix_direct_trade_ads_status'), 'direct_trade_ads', ['status'], unique=False)
    op.create_index('ix_direct_trade_ads_status_created', 'direct_trade_ads', ['status', 'created_at'], unique=False)

    # --- user_reputation ---
    op.create_table(
        'user_reputation',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('total_trades', sa.Integer(), nullable=False),
        sa.Column('completed_trades', sa.Integer(), nullable=False),
        sa.Column('cancelled_trades', sa.Integer(), nullable=False),
        sa.Column('disputed_trades', sa.Integer(), nullable=False),
        sa.Column('positive_ratings', sa.Integer(), nullable=False),
        sa.Column('negative_ratings', sa.Integer(), nullable=False),
        sa.Column('trust_score', sa.Integer(), nullable=False),
        sa.Column('avg_response_time', sa.Integer(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('is_blocked', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_reputation_trust_score'), 'user_reputation', ['trust_score'], unique=False)
    op.create_index(op.f('ix_user_reputation_user_id'), 'user_reputation', ['user_id'], unique=True)

    # --- direct_trade_orders ---
    op.create_table(
        'direct_trade_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reference', sa.String(length=30), nullable=False),
        sa.Column('ad_id', sa.Integer(), nullable=False),
        sa.Column('buyer_id', sa.Integer(), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('amount_usdt', sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column('rate_afn_per_usdt', sa.Numeric(precision=20, scale=4), nullable=False),
        sa.Column('seller_fee_percent', sa.Numeric(precision=6, scale=3), nullable=False),
        sa.Column('buyer_fee_percent', sa.Numeric(precision=6, scale=3), nullable=False),
        sa.Column('seller_fee_usdt', sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column('buyer_receives_usdt', sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column('base_amount_afn', sa.Numeric(precision=20, scale=4), nullable=False),
        sa.Column('buyer_fee_afn', sa.Numeric(precision=20, scale=4), nullable=False),
        sa.Column('total_payment_afn', sa.Numeric(precision=20, scale=4), nullable=False),
        sa.Column('seller_receives_afn', sa.Numeric(precision=20, scale=4), nullable=False),
        sa.Column('status', sa.Enum('PENDING_PAYMENT', 'PAYMENT_REVIEW', 'READY_TO_RELEASE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'DISPUTED', name='directtradeorderstatus'), nullable=False),
        sa.Column('buyer_payment_reference', sa.String(length=120), nullable=True),
        sa.Column('buyer_payment_proof', sa.String(length=255), nullable=True),
        sa.Column('buyer_note', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('admin_note', sa.Text(), nullable=True),
        sa.Column('released_by', sa.Integer(), nullable=True),
        sa.Column('released_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dispute_reason', sa.Text(), nullable=True),
        sa.Column('dispute_opened_by', sa.Integer(), nullable=True),
        sa.Column('dispute_opened_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dispute_resolved_by', sa.Integer(), nullable=True),
        sa.Column('dispute_resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dispute_decision', sa.String(length=50), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['ad_id'], ['direct_trade_ads.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['buyer_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['dispute_opened_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['dispute_resolved_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['released_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_direct_trade_orders_ad_id'), 'direct_trade_orders', ['ad_id'], unique=False)
    op.create_index(op.f('ix_direct_trade_orders_buyer_id'), 'direct_trade_orders', ['buyer_id'], unique=False)
    op.create_index('ix_direct_trade_orders_buyer_status', 'direct_trade_orders', ['buyer_id', 'status'], unique=False)
    op.create_index(op.f('ix_direct_trade_orders_created_at'), 'direct_trade_orders', ['created_at'], unique=False)
    op.create_index(op.f('ix_direct_trade_orders_reference'), 'direct_trade_orders', ['reference'], unique=True)
    op.create_index(op.f('ix_direct_trade_orders_seller_id'), 'direct_trade_orders', ['seller_id'], unique=False)
    op.create_index('ix_direct_trade_orders_seller_status', 'direct_trade_orders', ['seller_id', 'status'], unique=False)
    op.create_index(op.f('ix_direct_trade_orders_status'), 'direct_trade_orders', ['status'], unique=False)
    op.create_index('ix_direct_trade_orders_status_expires', 'direct_trade_orders', ['status', 'expires_at'], unique=False)

    # --- direct_trade_messages ---
    op.create_table(
        'direct_trade_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_system', sa.Boolean(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['direct_trade_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_direct_trade_messages_created_at'), 'direct_trade_messages', ['created_at'], unique=False)
    op.create_index(op.f('ix_direct_trade_messages_order_id'), 'direct_trade_messages', ['order_id'], unique=False)


def downgrade() -> None:
    # ═══════════════════════════════════════════════════
    #            Drop Direct Trade Tables
    # ═══════════════════════════════════════════════════

    op.drop_index(op.f('ix_direct_trade_messages_order_id'), table_name='direct_trade_messages')
    op.drop_index(op.f('ix_direct_trade_messages_created_at'), table_name='direct_trade_messages')
    op.drop_table('direct_trade_messages')

    op.drop_index('ix_direct_trade_orders_status_expires', table_name='direct_trade_orders')
    op.drop_index(op.f('ix_direct_trade_orders_status'), table_name='direct_trade_orders')
    op.drop_index('ix_direct_trade_orders_seller_status', table_name='direct_trade_orders')
    op.drop_index(op.f('ix_direct_trade_orders_seller_id'), table_name='direct_trade_orders')
    op.drop_index(op.f('ix_direct_trade_orders_reference'), table_name='direct_trade_orders')
    op.drop_index(op.f('ix_direct_trade_orders_created_at'), table_name='direct_trade_orders')
    op.drop_index('ix_direct_trade_orders_buyer_status', table_name='direct_trade_orders')
    op.drop_index(op.f('ix_direct_trade_orders_buyer_id'), table_name='direct_trade_orders')
    op.drop_index(op.f('ix_direct_trade_orders_ad_id'), table_name='direct_trade_orders')
    op.drop_table('direct_trade_orders')

    op.drop_index(op.f('ix_user_reputation_user_id'), table_name='user_reputation')
    op.drop_index(op.f('ix_user_reputation_trust_score'), table_name='user_reputation')
    op.drop_table('user_reputation')

    op.drop_index('ix_direct_trade_ads_status_created', table_name='direct_trade_ads')
    op.drop_index(op.f('ix_direct_trade_ads_status'), table_name='direct_trade_ads')
    op.drop_index('ix_direct_trade_ads_seller_status', table_name='direct_trade_ads')
    op.drop_index(op.f('ix_direct_trade_ads_seller_id'), table_name='direct_trade_ads')
    op.drop_table('direct_trade_ads')