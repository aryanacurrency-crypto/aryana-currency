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


class ReferralCode(Base):
    """کد اختصاصی دعوت هر کاربر."""
    __tablename__ = "referral_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)

    clicks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    signups: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_earned_afn: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), default=Decimal("0"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Referral(Base):
    """رکورد هر دعوت — رابط بین دعوت‌کننده و دعوت‌شده."""
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(primary_key=True)

    referrer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    referred_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    code_used: Mapped[str] = mapped_column(String(20), nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    bonus_amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), default=Decimal("15"), nullable=False
    )
    bonus_currency: Mapped[Currency] = mapped_column(
        default=Currency.AFN, nullable=False
    )

    bonus_status: Mapped[str] = mapped_column(
        String(20), default="locked", nullable=False, index=True
    )

    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    kyc_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    first_trade_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    bonus_locked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    bonus_released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    released_by_order_id: Mapped[int | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class LockedBalance(Base):
    """موجودی قفل‌شده — برای پاداش‌های در انتظار شرط."""
    __tablename__ = "locked_balances"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    amount: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    currency: Mapped[Currency] = mapped_column(default=Currency.AFN, nullable=False)

    reason: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    referral_id: Mapped[int | None] = mapped_column(
        ForeignKey("referrals.id", ondelete="SET NULL"), index=True
    )

    status: Mapped[str] = mapped_column(
        String(20), default="locked", nullable=False, index=True
    )

    description: Mapped[str | None] = mapped_column(Text)

    locked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    released_by_order_id: Mapped[int | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL")
    )


class ReferralEarning(Base):
    """درآمد کمیسیون از معاملات زیرمجموعه."""
    __tablename__ = "referral_earnings"

    id: Mapped[int] = mapped_column(primary_key=True)

    referrer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    trading_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )

    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    order_fee_afn: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    commission_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    commission_amount: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    currency: Mapped[Currency] = mapped_column(default=Currency.AFN, nullable=False)

    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )