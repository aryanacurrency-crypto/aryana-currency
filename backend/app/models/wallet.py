from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import Currency


class Wallet(Base):
    """
    موجودی دفتری هر کاربر برای هر ارز.

    برای USDT: موجودی واقعی در کیف پول پلتفرم نگه داشته میشه، اینجا فقط حسابداریه.
    برای AFN: موجودی دفتری کاربر (چون پرداخت از طریق Hesab Pay دستیه).
    """
    __tablename__ = "wallets"
    __table_args__ = (
        UniqueConstraint("user_id", "currency", name="uq_wallet_user_currency"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    currency: Mapped[Currency] = mapped_column(nullable=False)

    # موجودی قابل استفاده
    balance: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), default=Decimal("0"), nullable=False
    )

    # موجودی قفل شده (برای سفارشهای در جریان)
    locked_balance: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), default=Decimal("0"), nullable=False
    )

    # زمانها
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    @property
    def available_balance(self) -> Decimal:
        """موجودی قابل استفاده = balance - locked_balance."""
        return self.balance - self.locked_balance