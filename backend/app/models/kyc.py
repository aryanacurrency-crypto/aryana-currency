from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import BYTEA
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

    # نوع مدرک: national_id / passport / selfie / tazkira / driver_license
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # ═══ اطلاعات شخصی ═══
    first_name: Mapped[str | None] = mapped_column(String(120))
    last_name: Mapped[str | None] = mapped_column(String(120))
    phone_number: Mapped[str | None] = mapped_column(String(30))

    # ═══ اطلاعات سند ═══
    document_type: Mapped[str | None] = mapped_column(String(50))
    document_number: Mapped[str | None] = mapped_column(String(100))

    # مسیر فایل (سازگاری با نسخه قبلی)
    file_path: Mapped[str | None] = mapped_column(String(255))

    # داده‌ی فایل
    file_data: Mapped[bytes | None] = mapped_column(BYTEA)
    file_mime: Mapped[str | None] = mapped_column(String(100))

    status: Mapped[KycStatus] = mapped_column(
        SAEnum(KycStatus), default=KycStatus.PENDING, nullable=False
    )

    # ═══ وضعیت کلی کاربر ═══
    is_user_fully_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )