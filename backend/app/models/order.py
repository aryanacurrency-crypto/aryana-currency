from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import OrderSide, OrderStatus


class Order(Base):
    """
    سفارش کاربر با پلتفرم.
    BUY:  کاربر تتر میخره (افغانی میده، تتر میگیره)
    SELL: کاربر تتر میفروشه (تتر میده، افغانی میگیره)
    """
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)

    # شماره یکتا برای کاربر (مثل ARY-2026-000123)
    reference: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )

    side: Mapped[OrderSide] = mapped_column(SAEnum(OrderSide), nullable=False)

    # --- مبالغ (همه snapshot لحظه ثبت) ---
    amount_usdt: Mapped[Decimal] = mapped_column(Numeric(20, 8), nullable=False)
    rate_afn_per_usdt: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False)
    gross_afn: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False)
    fee_percent: Mapped[Decimal] = mapped_column(
        Numeric(6, 3), nullable=False, default=Decimal("1.5")
    )
    fee_afn: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False)
    net_afn: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False)

    # --- وضعیت ---
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True
    )

    # --- اطلاعات واریز کاربر ---
    # BUY:  شماره تراکنش Hesab Pay
    # SELL: TXID تتر
    user_payment_reference: Mapped[str | None] = mapped_column(String(120))
    user_note: Mapped[str | None] = mapped_column(Text)

    # --- اطلاعات پرداخت پلتفرم به کاربر ---
    # BUY:  TXID تتر (پلتفرم به کاربر تتر داد)
    # SELL: شماره تراکنش Hesab Pay (پلتفرم به کاربر افغانی داد)
    platform_payment_reference: Mapped[str | None] = mapped_column(String(120))

    # --- آدرس کیف پول کاربر (snapshot — ممکنه کاربر بعداً عوض کنه) ---
    user_wallet_address_snapshot: Mapped[str | None] = mapped_column(String(120))
    user_hesab_pay_snapshot: Mapped[str | None] = mapped_column(String(50))

    # --- تأیید ادمین ---
    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    admin_note: Mapped[str | None] = mapped_column(Text)

    # --- زمانها ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )