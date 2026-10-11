from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Rate(Base):
    """
    نرخ تتر به افغانی. ادمین از داشبورد ثبت میکنه.
    هر ثبت جدید، رکورد قبلی رو غیرفعال میکنه و این active میشه.
    تاریخچه حفظ میشه برای audit.
    """
    __tablename__ = "rates"

    id: Mapped[int] = mapped_column(primary_key=True)

    # نرخ خرید: پلتفرم از کاربر تتر میخره
    # (کاربر تتر میفروشه، پلتفرم افغانی میده)
    # این نرخ پایینتره چون پلتفرم سود میکنه
    buy_price_afn: Mapped[Decimal] = mapped_column(
        Numeric(20, 4), nullable=False
    )

    # نرخ فروش: پلتفرم به کاربر تتر میفروشه
    # (کاربر افغانی میده، پلتفرم تتر میده)
    # این نرخ بالاتر از buy هست
    sell_price_afn: Mapped[Decimal] = mapped_column(
        Numeric(20, 4), nullable=False
    )

    # فقط یک نرخ active در هر لحظه
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )

    # چه ادمینی این نرخ رو ثبت کرد
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )