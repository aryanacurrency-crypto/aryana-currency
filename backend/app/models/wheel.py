from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import Currency


class WheelSettings(Base):
    """تنظیمات گردونه — تک رکورد، قابل ویرایش از پنل ادمین."""
    __tablename__ = "wheel_settings"

    id: Mapped[int] = mapped_column(primary_key=True)

    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    ticket_price: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), default=Decimal("50"), nullable=False
    )
    ticket_currency: Mapped[Currency] = mapped_column(
        default=Currency.AFN, nullable=False
    )
    ticket_expiry_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)

    max_spins_per_day: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    min_spin_interval_seconds: Mapped[int] = mapped_column(
        Integer, default=5, nullable=False
    )

    ticket_on_signup_kyc: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    ticket_on_signup_kyc_count: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )

    ticket_on_successful_trade: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    ticket_on_successful_trade_count: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )

    ticket_purchase_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    animation_duration_seconds: Mapped[Decimal] = mapped_column(
        Numeric(4, 2), default=Decimal("8.0"), nullable=False
    )
    near_jackpot_chance_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("30"), nullable=False
    )
    near_jackpot_offset_min: Mapped[int] = mapped_column(
        Integer, default=2, nullable=False
    )
    near_jackpot_offset_max: Mapped[int] = mapped_column(
        Integer, default=5, nullable=False
    )
    sound_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    require_admin_approval_above: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), default=Decimal("100"), nullable=False
    )
    max_big_prize_per_day: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )


class WheelPrize(Base):
    """جایزه‌های گردونه — کاملاً قابل تنظیم از پنل ادمین."""
    __tablename__ = "wheel_prizes"

    id: Mapped[int] = mapped_column(primary_key=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    prize_type: Mapped[str] = mapped_column(String(20), nullable=False)

    label: Mapped[str] = mapped_column(String(100), nullable=False)
    label_fa: Mapped[str | None] = mapped_column(String(100))
    label_ps: Mapped[str | None] = mapped_column(String(100))
    label_en: Mapped[str | None] = mapped_column(String(100))

    icon: Mapped[str | None] = mapped_column(String(20))
    color: Mapped[str] = mapped_column(String(20), nullable=False)
    gradient_from: Mapped[str | None] = mapped_column(String(20))
    gradient_to: Mapped[str | None] = mapped_column(String(20))

    amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), default=Decimal("0"), nullable=False
    )
    currency: Mapped[Currency] = mapped_column(
        default=Currency.AFN, nullable=False
    )
    ticket_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    probability_percent: Mapped[Decimal] = mapped_column(
        Numeric(7, 4), default=Decimal("0"), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    max_wins_per_day: Mapped[int | None] = mapped_column(Integer)
    max_wins_per_user: Mapped[int | None] = mapped_column(Integer)
    daily_win_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    daily_win_reset_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    requires_kyc: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requires_deposit: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    min_wallet_balance: Mapped[Decimal | None] = mapped_column(Numeric(20, 2))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )


class WheelTicket(Base):
    """تیکت‌های گردونه هر کاربر."""
    __tablename__ = "wheel_tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    source: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    reference_id: Mapped[int | None] = mapped_column(Integer)

    price_paid: Mapped[Decimal | None] = mapped_column(Numeric(20, 2))
    currency: Mapped[Currency] = mapped_column(default=Currency.AFN, nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), default="available", nullable=False, index=True
    )

    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class WheelSpin(Base):
    """تاریخچه چرخش‌ها."""
    __tablename__ = "wheel_spins"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("wheel_tickets.id", ondelete="SET NULL"), index=True
    )
    prize_id: Mapped[int | None] = mapped_column(
        ForeignKey("wheel_prizes.id", ondelete="SET NULL"), index=True
    )

    result_type: Mapped[str] = mapped_column(String(20), nullable=False)

    prize_amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), default=Decimal("0"), nullable=False
    )
    prize_currency: Mapped[Currency] = mapped_column(default=Currency.AFN, nullable=False)
    prize_ticket_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    result_angle: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)

    ip_address: Mapped[str | None] = mapped_column(String(45))
    device_info: Mapped[str | None] = mapped_column(Text)

    status: Mapped[str] = mapped_column(
        String(20), default="completed", nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class WheelAuditLog(Base):
    """لاگ تغییرات ادمین روی تنظیمات گردونه."""
    __tablename__ = "wheel_audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    admin_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    action: Mapped[str] = mapped_column(String(50), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[int | None] = mapped_column(Integer)

    old_value: Mapped[str | None] = mapped_column(Text)
    new_value: Mapped[str | None] = mapped_column(Text)

    ip_address: Mapped[str | None] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )