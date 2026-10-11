from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import UserRole


class User(Base):
    """کاربران پلتفرم."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    # اطلاعات ورود
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # اطلاعات شخصی
    full_name: Mapped[str | None] = mapped_column(String(120))

    # نقش و وضعیت
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole), default=UserRole.USER, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # اطلاعات Hesab Pay (برای واریز افغانی به کاربر هنگام فروش تتر)
    hesab_pay_number: Mapped[str | None] = mapped_column(String(50))
    hesab_pay_holder_name: Mapped[str | None] = mapped_column(String(120))

    # آدرس کیف پول تتر کاربر (برای ارسال تتر هنگام خرید)
    usdt_wallet_address: Mapped[str | None] = mapped_column(String(120))
    usdt_wallet_network: Mapped[str | None] = mapped_column(String(20))  # TRC20 / BEP20

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