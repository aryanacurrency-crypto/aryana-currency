from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import Currency


class PlatformSettings(Base):
    """تنظیمات پلتفرم — یک ردیف، قابل ویرایش توسط ادمین."""
    __tablename__ = "platform_settings"

    id: Mapped[int] = mapped_column(primary_key=True)

    # ═══ Contact Info ═══
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_telegram_channel: Mapped[str | None] = mapped_column(String(255))
    contact_telegram_support: Mapped[str | None] = mapped_column(String(100))
    contact_address: Mapped[str | None] = mapped_column(String(255))

    # ═══ Payment Info ═══
    hesab_pay_number: Mapped[str | None] = mapped_column(String(50))
    hesab_pay_holder: Mapped[str | None] = mapped_column(String(120))

    usdt_wallet_trc20: Mapped[str | None] = mapped_column(String(120))
    usdt_wallet_bep20: Mapped[str | None] = mapped_column(String(120))
    usdt_wallet_erc20: Mapped[str | None] = mapped_column(String(120))

    # ═══ Limits ═══
    min_deposit_usdt: Mapped[float] = mapped_column(Numeric(20, 8), default=10)
    min_withdraw_usdt: Mapped[float] = mapped_column(Numeric(20, 8), default=10)
    min_withdraw_afn: Mapped[float] = mapped_column(Numeric(20, 2), default=500)

    # ═══ Referral Settings ═══
    referral_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    referral_bonus_amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), default=Decimal("15"), nullable=False
    )
    referral_bonus_currency: Mapped[Currency] = mapped_column(
        default=Currency.AFN, nullable=False
    )
    referral_requires_kyc: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    referral_requires_first_trade: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    referral_expiry_days: Mapped[int] = mapped_column(
        Integer, default=90, nullable=False
    )

    # ═══ Commission Settings ═══
    base_exchange_fee_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("1.5"), nullable=False
    )
    referral_level1_commission_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("20"), nullable=False
    )
    referral_level2_commission_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("5"), nullable=False
    )
    referral_level3_commission_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("2"), nullable=False
    )
    referral_max_levels: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # ═══ VIP Commission Settings ═══
    vip_commission_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    vip_level1_commission_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("10"), nullable=False
    )
    vip_level2_commission_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("15"), nullable=False
    )
    vip_level3_commission_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("20"), nullable=False
    )

    # ═══ KYC Required for Trading ═══
    require_kyc_for_trade: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # ═══ Meta ═══
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )