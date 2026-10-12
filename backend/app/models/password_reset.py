from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PasswordResetToken(Base):
    """توکن‌های بازنشانی رمز عبور."""
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # خود توکن (URL-safe string)
    token: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )

    # زمان انقضا (معمولاً ۱۵ دقیقه بعد)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # آیا استفاده شده؟
    used: Mapped[bool] = mapped_column(default=False, nullable=False)

    # زمان ساخت
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )