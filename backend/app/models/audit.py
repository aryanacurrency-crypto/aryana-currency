from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    """لاگ عملیات ادمین برای audit."""
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)

    # کی این کار رو کرد
    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    # چی کار کرد: approve_order / reject_order / set_rate / login / ...
    action: Mapped[str] = mapped_column(String(80), nullable=False, index=True)

    # روی چی: order / user / rate / ...
    target_type: Mapped[str | None] = mapped_column(String(50))
    target_id: Mapped[str | None] = mapped_column(String(50))

    # اطلاعات اضافی (JSON string)
    meta: Mapped[str | None] = mapped_column(Text)

    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )