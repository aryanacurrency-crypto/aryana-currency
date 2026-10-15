"""add referral and wheel tables

Revision ID: 5eaef8cebc91
Revises: 64d45d390b91
Create Date: 2026-10-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5eaef8cebc91'
down_revision: Union[str, None] = '64d45d390b91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ═══════════════════════════════════════════════
    # Referral Tables
    # ═══════════════════════════════════════════════

    op.create_table(
        'referral_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('clicks', sa.Integer(), nullable=False),
        sa.Column('signups', sa.Integer(), nullable=False),
        sa.Column('total_earned_afn', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_referral_codes_code', 'referral_codes', ['code'], unique=True)
    op.create_index('ix_referral_codes_user_id', 'referral_codes', ['user_id'], unique=True)

    op.create_table(
        'referrals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('referrer_id', sa.Integer(), nullable=False),
        sa.Column('referred_user_id', sa.Integer(), nullable=False),
        sa.Column('code_used', sa.String(length=20), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('bonus_amount', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('bonus_currency', postgresql.ENUM('AFN', 'USDT', name='currency', create_type=False), nullable=False),
        sa.Column('bonus_status', sa.String(length=20), nullable=False),
        sa.Column('registered_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('kyc_completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('first_trade_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('bonus_locked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('bonus_released_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('released_by_order_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['referrer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['referred_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['released_by_order_id'], ['orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('referred_user_id'),
    )
    op.create_index('ix_referrals_bonus_status', 'referrals', ['bonus_status'], unique=False)
    op.create_index('ix_referrals_referred_user_id', 'referrals', ['referred_user_id'], unique=True)
    op.create_index('ix_referrals_referrer_id', 'referrals', ['referrer_id'], unique=False)

    op.create_table(
        'locked_balances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('currency', postgresql.ENUM('AFN', 'USDT', name='currency', create_type=False), nullable=False),
        sa.Column('reason', sa.String(length=50), nullable=False),
        sa.Column('referral_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('locked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('released_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('released_by_order_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['referral_id'], ['referrals.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['released_by_order_id'], ['orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_locked_balances_reason', 'locked_balances', ['reason'], unique=False)
    op.create_index('ix_locked_balances_referral_id', 'locked_balances', ['referral_id'], unique=False)
    op.create_index('ix_locked_balances_status', 'locked_balances', ['status'], unique=False)
    op.create_index('ix_locked_balances_user_id', 'locked_balances', ['user_id'], unique=False)

    op.create_table(
        'referral_earnings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('referrer_id', sa.Integer(), nullable=False),
        sa.Column('trading_user_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('order_fee_afn', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('commission_percent', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('commission_amount', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('currency', postgresql.ENUM('AFN', 'USDT', name='currency', create_type=False), nullable=False),
        sa.Column('is_paid', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['referrer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trading_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_referral_earnings_order_id', 'referral_earnings', ['order_id'], unique=False)
    op.create_index('ix_referral_earnings_referrer_id', 'referral_earnings', ['referrer_id'], unique=False)
    op.create_index('ix_referral_earnings_trading_user_id', 'referral_earnings', ['trading_user_id'], unique=False)

    # ═══════════════════════════════════════════════
    # Wheel Tables
    # ═══════════════════════════════════════════════

    op.create_table(
        'wheel_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False),
        sa.Column('ticket_price', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('ticket_currency', postgresql.ENUM('AFN', 'USDT', name='currency', create_type=False), nullable=False),
        sa.Column('ticket_expiry_days', sa.Integer(), nullable=False),
        sa.Column('max_spins_per_day', sa.Integer(), nullable=False),
        sa.Column('min_spin_interval_seconds', sa.Integer(), nullable=False),
        sa.Column('ticket_on_signup_kyc', sa.Boolean(), nullable=False),
        sa.Column('ticket_on_signup_kyc_count', sa.Integer(), nullable=False),
        sa.Column('ticket_on_successful_trade', sa.Boolean(), nullable=False),
        sa.Column('ticket_on_successful_trade_count', sa.Integer(), nullable=False),
        sa.Column('ticket_purchase_enabled', sa.Boolean(), nullable=False),
        sa.Column('animation_duration_seconds', sa.Numeric(precision=4, scale=2), nullable=False),
        sa.Column('near_jackpot_chance_percent', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('near_jackpot_offset_min', sa.Integer(), nullable=False),
        sa.Column('near_jackpot_offset_max', sa.Integer(), nullable=False),
        sa.Column('sound_enabled', sa.Boolean(), nullable=False),
        sa.Column('require_admin_approval_above', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('max_big_prize_per_day', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'wheel_prizes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('prize_type', sa.String(length=20), nullable=False),
        sa.Column('label', sa.String(length=100), nullable=False),
        sa.Column('label_fa', sa.String(length=100), nullable=True),
        sa.Column('label_ps', sa.String(length=100), nullable=True),
        sa.Column('label_en', sa.String(length=100), nullable=True),
        sa.Column('icon', sa.String(length=20), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=False),
        sa.Column('gradient_from', sa.String(length=20), nullable=True),
        sa.Column('gradient_to', sa.String(length=20), nullable=True),
        sa.Column('amount', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('currency', postgresql.ENUM('AFN', 'USDT', name='currency', create_type=False), nullable=False),
        sa.Column('ticket_count', sa.Integer(), nullable=False),
        sa.Column('probability_percent', sa.Numeric(precision=7, scale=4), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('max_wins_per_day', sa.Integer(), nullable=True),
        sa.Column('max_wins_per_user', sa.Integer(), nullable=True),
        sa.Column('daily_win_count', sa.Integer(), nullable=False),
        sa.Column('daily_win_reset_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('requires_kyc', sa.Boolean(), nullable=False),
        sa.Column('requires_deposit', sa.Boolean(), nullable=False),
        sa.Column('min_wallet_balance', sa.Numeric(precision=20, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'wheel_tickets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False),
        sa.Column('reference_id', sa.Integer(), nullable=True),
        sa.Column('price_paid', sa.Numeric(precision=20, scale=2), nullable=True),
        sa.Column('currency', postgresql.ENUM('AFN', 'USDT', name='currency', create_type=False), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_wheel_tickets_source', 'wheel_tickets', ['source'], unique=False)
    op.create_index('ix_wheel_tickets_status', 'wheel_tickets', ['status'], unique=False)
    op.create_index('ix_wheel_tickets_user_id', 'wheel_tickets', ['user_id'], unique=False)

    op.create_table(
        'wheel_spins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('ticket_id', sa.Integer(), nullable=False),
        sa.Column('prize_id', sa.Integer(), nullable=True),
        sa.Column('result_type', sa.String(length=20), nullable=False),
        sa.Column('prize_amount', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('prize_currency', postgresql.ENUM('AFN', 'USDT', name='currency', create_type=False), nullable=False),
        sa.Column('prize_ticket_count', sa.Integer(), nullable=False),
        sa.Column('result_angle', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('device_info', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ticket_id'], ['wheel_tickets.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['prize_id'], ['wheel_prizes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_wheel_spins_prize_id', 'wheel_spins', ['prize_id'], unique=False)
    op.create_index('ix_wheel_spins_status', 'wheel_spins', ['status'], unique=False)
    op.create_index('ix_wheel_spins_ticket_id', 'wheel_spins', ['ticket_id'], unique=False)
    op.create_index('ix_wheel_spins_user_id', 'wheel_spins', ['user_id'], unique=False)

    op.create_table(
        'wheel_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('target_type', sa.String(length=50), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=True),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_wheel_audit_logs_admin_id', 'wheel_audit_logs', ['admin_id'], unique=False)

    # ═══════════════════════════════════════════════
    # Update Existing Tables
    # ═══════════════════════════════════════════════

    # ─── kyc_documents: افزودن فیلدهای جدید ───
    op.add_column('kyc_documents', sa.Column('first_name', sa.String(length=120), nullable=True))
    op.add_column('kyc_documents', sa.Column('last_name', sa.String(length=120), nullable=True))
    op.add_column('kyc_documents', sa.Column('phone_number', sa.String(length=30), nullable=True))
    op.add_column('kyc_documents', sa.Column('document_type', sa.String(length=50), nullable=True))
    op.add_column('kyc_documents', sa.Column('document_number', sa.String(length=100), nullable=True))
    op.add_column('kyc_documents', sa.Column('is_user_fully_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    # ─── platform_settings: افزودن فیلدهای referral ───
    op.add_column('platform_settings', sa.Column('referral_enabled', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    op.add_column('platform_settings', sa.Column('referral_bonus_amount', sa.Numeric(precision=20, scale=2), nullable=False, server_default=sa.text('15')))
    op.add_column('platform_settings', sa.Column('referral_bonus_currency', postgresql.ENUM('AFN', 'USDT', name='currency', create_type=False), nullable=False, server_default=sa.text("'AFN'")))
    op.add_column('platform_settings', sa.Column('referral_requires_kyc', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    op.add_column('platform_settings', sa.Column('referral_requires_first_trade', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    op.add_column('platform_settings', sa.Column('referral_expiry_days', sa.Integer(), nullable=False, server_default=sa.text('90')))
    op.add_column('platform_settings', sa.Column('base_exchange_fee_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default=sa.text('1.5')))
    op.add_column('platform_settings', sa.Column('referral_level1_commission_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default=sa.text('20')))
    op.add_column('platform_settings', sa.Column('referral_level2_commission_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default=sa.text('5')))
    op.add_column('platform_settings', sa.Column('referral_level3_commission_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default=sa.text('2')))
    op.add_column('platform_settings', sa.Column('referral_max_levels', sa.Integer(), nullable=False, server_default=sa.text('1')))
    op.add_column('platform_settings', sa.Column('require_kyc_for_trade', sa.Boolean(), nullable=False, server_default=sa.text('true')))

    # ─── users: افزودن فیلدهای referral و ticket ───
    op.add_column('users', sa.Column('referred_by_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('referral_code_used', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('signup_kyc_ticket_claimed', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('users', sa.Column('available_tickets', sa.Integer(), nullable=False, server_default=sa.text('0')))
    op.create_index('ix_users_referred_by_id', 'users', ['referred_by_id'], unique=False)
    op.create_foreign_key('fk_users_referred_by_id', 'users', 'users', ['referred_by_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # ═══ users ═══
    op.drop_constraint('fk_users_referred_by_id', 'users', type_='foreignkey')
    op.drop_index('ix_users_referred_by_id', table_name='users')
    op.drop_column('users', 'available_tickets')
    op.drop_column('users', 'signup_kyc_ticket_claimed')
    op.drop_column('users', 'referral_code_used')
    op.drop_column('users', 'referred_by_id')

    # ═══ platform_settings ═══
    op.drop_column('platform_settings', 'require_kyc_for_trade')
    op.drop_column('platform_settings', 'referral_max_levels')
    op.drop_column('platform_settings', 'referral_level3_commission_percent')
    op.drop_column('platform_settings', 'referral_level2_commission_percent')
    op.drop_column('platform_settings', 'referral_level1_commission_percent')
    op.drop_column('platform_settings', 'base_exchange_fee_percent')
    op.drop_column('platform_settings', 'referral_expiry_days')
    op.drop_column('platform_settings', 'referral_requires_first_trade')
    op.drop_column('platform_settings', 'referral_requires_kyc')
    op.drop_column('platform_settings', 'referral_bonus_currency')
    op.drop_column('platform_settings', 'referral_bonus_amount')
    op.drop_column('platform_settings', 'referral_enabled')

    # ═══ kyc_documents ═══
    op.drop_column('kyc_documents', 'is_user_fully_verified')
    op.drop_column('kyc_documents', 'document_number')
    op.drop_column('kyc_documents', 'document_type')
    op.drop_column('kyc_documents', 'phone_number')
    op.drop_column('kyc_documents', 'last_name')
    op.drop_column('kyc_documents', 'first_name')

    # ═══ wheel ═══
    op.drop_index('ix_wheel_audit_logs_admin_id', table_name='wheel_audit_logs')
    op.drop_table('wheel_audit_logs')

    op.drop_index('ix_wheel_spins_user_id', table_name='wheel_spins')
    op.drop_index('ix_wheel_spins_ticket_id', table_name='wheel_spins')
    op.drop_index('ix_wheel_spins_status', table_name='wheel_spins')
    op.drop_index('ix_wheel_spins_prize_id', table_name='wheel_spins')
    op.drop_table('wheel_spins')

    op.drop_index('ix_wheel_tickets_user_id', table_name='wheel_tickets')
    op.drop_index('ix_wheel_tickets_status', table_name='wheel_tickets')
    op.drop_index('ix_wheel_tickets_source', table_name='wheel_tickets')
    op.drop_table('wheel_tickets')

    op.drop_table('wheel_prizes')
    op.drop_table('wheel_settings')

    # ═══ referral ═══
    op.drop_index('ix_referral_earnings_trading_user_id', table_name='referral_earnings')
    op.drop_index('ix_referral_earnings_referrer_id', table_name='referral_earnings')
    op.drop_index('ix_referral_earnings_order_id', table_name='referral_earnings')
    op.drop_table('referral_earnings')

    op.drop_index('ix_locked_balances_user_id', table_name='locked_balances')
    op.drop_index('ix_locked_balances_status', table_name='locked_balances')
    op.drop_index('ix_locked_balances_referral_id', table_name='locked_balances')
    op.drop_index('ix_locked_balances_reason', table_name='locked_balances')
    op.drop_table('locked_balances')

    op.drop_index('ix_referrals_referrer_id', table_name='referrals')
    op.drop_index('ix_referrals_referred_user_id', table_name='referrals')
    op.drop_index('ix_referrals_bonus_status', table_name='referrals')
    op.drop_table('referrals')

    op.drop_index('ix_referral_codes_user_id', table_name='referral_codes')
    op.drop_index('ix_referral_codes_code', table_name='referral_codes')
    op.drop_table('referral_codes')