from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import Currency, LedgerDirection


class LedgerEntry(Base):
    """
    دفتر کل دوطرفه (double-entry).

    هر تراکنش مالی چند ردیف اینجا ایجاد میکنه.
    قانون طلایی: جمع DEBIT = جمع CREDIT برای هر transaction_id.

    انواع حساب (account_type):
    - user_wallet_{user_id}    ← کیف پول کاربر
    - platform_usdt_wallet     ← کیف پول تتر پلتفرم (واقعی روی بلاکچین)
    - platform_afn_wallet      ← موجودی افغانی پلتفرم (روی Hesab Pay)
    - platform_fee_revenue     ← درآمد کارمزد پلتفرم
    - platform_payable_{user_id}  ← پول پلتفرم به کاربر (در انتظار پرداخت)
    """
    __tablename__ = "ledger_entries"

    id: Mapped[int] = mapped_column(primary_key=True)

    # شناسه گروهی تراکنش — همه ردیفهای یک تراکنش این رو یکسان دارن
    transaction_id: Mapped[str] = mapped_column(
        String(40), index=True, nullable=False
    )

    # صاحب حساب (NULL برای حسابهای پلتفرم)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )

    # نوع حساب
    account_type: Mapped[str] = mapped_column(String(60), nullable=False, index=True)

    # ارز و جهت
    currency: Mapped[Currency] = mapped_column(nullable=False)
    direction: Mapped[LedgerDirection] = mapped_column(
        SAEnum(LedgerDirection), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(20, 8), nullable=False)

    # توضیحات
    description: Mapped[str | None] = mapped_column(String(255))

    # اتصال به سفارش (اگه مربوطه)
    order_id: Mapped[int | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"), index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )