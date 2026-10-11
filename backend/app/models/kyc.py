from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import KycStatus


class KycDocument(Base):
    """مدارک احراز هویت کاربر."""
    __tablename__ = "kyc_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # نوع مدرک: national_id / passport / selfie / ...
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # مسیر فایل ذخیرهشده روی سرور
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[KycStatus] = mapped_column(
        SAEnum(KycStatus), default=KycStatus.PENDING, nullable=False
    )

    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )