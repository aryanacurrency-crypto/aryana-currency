from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import Currency, WithdrawalStatus


class Withdrawal(Base):
    """
    درخواست برداشت کاربر.
    کاربر درخواست می‌ده، ادمین دستی تأیید/رد می‌کنه.
    """
    __tablename__ = "withdrawals"

    id: Mapped[int] = mapped_column(primary_key=True)

    reference: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )

    currency: Mapped[Currency] = mapped_column(nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(20, 8), nullable=False)

    # مقصد
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    destination_holder: Mapped[str | None] = mapped_column(String(120))

    # وضعیت
    status: Mapped[WithdrawalStatus] = mapped_column(
        SAEnum(WithdrawalStatus), default=WithdrawalStatus.PENDING, nullable=False, index=True
    )

    # اطلاعات ادمین
    admin_note: Mapped[str | None] = mapped_column(Text)
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    platform_payment_reference: Mapped[str | None] = mapped_column(String(120))

    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # زمان‌ها
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )