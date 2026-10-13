from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


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

    # ═══ Meta ═══
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )