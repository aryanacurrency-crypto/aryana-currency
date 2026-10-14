"""
مدل‌های معاملات مستقیم (Traders By Traders).

سیستم P2P که کاربران با یکدیگر معامله می‌کنند و ARYANA
فقط نقش واسطه و امانت‌دار (Escrow) را دارد.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import (
    DirectTradeAdSide,
    DirectTradeAdStatus,
    DirectTradeOrderStatus,
)


# ═══════════════════════════════════════════════════════
#                    DirectTradeAd
# ═══════════════════════════════════════════════════════


class DirectTradeAd(Base):
    """
    آگهی معامله مستقیم.

    فروشنده آگهی می‌سازد و مقدار مشخصی USDT را برای فروش
    با نرخ دلخواه خود قرار می‌دهد.
    """
    __tablename__ = "direct_trade_ads"

    id: Mapped[int] = mapped_column(primary_key=True)

    # --- صاحب آگهی (فروشنده) ---
    seller_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # --- نوع آگهی ---
    side: Mapped[DirectTradeAdSide] = mapped_column(
        SAEnum(DirectTradeAdSide),
        default=DirectTradeAdSide.SELL,
        nullable=False,
    )

    # --- مقادیر (همه به USDT) ---
    # مقدار اصلی آگهی (چیزی که فروشنده ثبت می‌کند)
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), nullable=False
    )

    # مقدار باقی‌مانده قابل فروش
    available_amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), nullable=False
    )

    # مقدار قفل‌شده برای سفارش‌های در جریان
    locked_amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), default=Decimal("0"), nullable=False
    )

    # --- نرخ فروشنده (AFN per USDT) ---
    rate_afn_per_usdt: Mapped[Decimal] = mapped_column(
        Numeric(20, 4), nullable=False
    )

    # --- محدودیت‌های خرید ---
    min_order_usdt: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), default=Decimal("10"), nullable=False
    )
    max_order_usdt: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), nullable=False
    )

    # --- اطلاعات پرداخت ---
    payment_method: Mapped[str] = mapped_column(
        String(50), default="Hesab Pay", nullable=False
    )

    # --- شرایط فروشنده (توضیحات اختیاری) ---
    terms: Mapped[str | None] = mapped_column(Text)

    # --- وضعیت ---
    status: Mapped[DirectTradeAdStatus] = mapped_column(
        SAEnum(DirectTradeAdStatus),
        default=DirectTradeAdStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    # --- آمار ---
    total_trades: Mapped[int] = mapped_column(default=0, nullable=False)
    completed_trades: Mapped[int] = mapped_column(default=0, nullable=False)

    # --- زمان‌ها ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # --- Indexes ---
    __table_args__ = (
        Index("ix_direct_trade_ads_status_created", "status", "created_at"),
        Index("ix_direct_trade_ads_seller_status", "seller_id", "status"),
    )

    @property
    def remaining_amount(self) -> Decimal:
        """مقدار قابل استفاده (نه قفل‌شده)."""
        return self.available_amount - self.locked_amount


# ═══════════════════════════════════════════════════════
#                  DirectTradeOrder
# ═══════════════════════════════════════════════════════


class DirectTradeOrder(Base):
    """
    سفارش معامله مستقیم بین خریدار و فروشنده.

    Escrow: ARYANA تتر فروشنده و AFN خریدار را قفل می‌کند
    تا معامله کامل شود.
    """
    __tablename__ = "direct_trade_orders"

    id: Mapped[int] = mapped_column(primary_key=True)

    # --- شماره یکتا (مثل DT-2026-A1B2C3) ---
    reference: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )

    # --- ارتباط‌ها ---
    ad_id: Mapped[int] = mapped_column(
        ForeignKey("direct_trade_ads.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    buyer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    seller_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    # --- مقادیر (snapshot لحظه ثبت سفارش) ---
    # مقدار تتر درخواستی خریدار (قبل از کمیسیون)
    amount_usdt: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), nullable=False
    )

    # نرخ لحظه ثبت (AFN per USDT)
    rate_afn_per_usdt: Mapped[Decimal] = mapped_column(
        Numeric(20, 4), nullable=False
    )

    # --- کمیسیون‌ها ---
    seller_fee_percent: Mapped[Decimal] = mapped_column(
        Numeric(6, 3), nullable=False
    )
    buyer_fee_percent: Mapped[Decimal] = mapped_column(
        Numeric(6, 3), nullable=False
    )

    # --- مبالغ محاسبه‌شده ---
    # کمیسیون فروشنده (به USDT)
    seller_fee_usdt: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), nullable=False
    )
    # تتر خالص به خریدار (بعد از کسر کمیسیون فروشنده)
    buyer_receives_usdt: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), nullable=False
    )

    # مبلغ پایه AFN (buyer_receives_usdt × rate)
    base_amount_afn: Mapped[Decimal] = mapped_column(
        Numeric(20, 4), nullable=False
    )

    # کمیسیون خریدار (به AFN)
    buyer_fee_afn: Mapped[Decimal] = mapped_column(
        Numeric(20, 4), nullable=False
    )

    # مبلغ کل قابل پرداخت خریدار
    total_payment_afn: Mapped[Decimal] = mapped_column(
        Numeric(20, 4), nullable=False
    )

    # مبلغ دریافتی نقدی فروشنده
    seller_receives_afn: Mapped[Decimal] = mapped_column(
        Numeric(20, 4), nullable=False
    )

    # --- وضعیت ---
    status: Mapped[DirectTradeOrderStatus] = mapped_column(
        SAEnum(DirectTradeOrderStatus),
        default=DirectTradeOrderStatus.PENDING_PAYMENT,
        nullable=False,
        index=True,
    )

    # --- اطلاعات پرداخت خریدار ---
    buyer_payment_reference: Mapped[str | None] = mapped_column(String(120))
    buyer_payment_proof: Mapped[str | None] = mapped_column(String(255))
    buyer_note: Mapped[str | None] = mapped_column(Text)

    # --- تأیید ادمین ---
    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    admin_note: Mapped[str | None] = mapped_column(Text)

    # --- آزادسازی ---
    released_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # --- حل اختلاف ---
    dispute_reason: Mapped[str | None] = mapped_column(Text)
    dispute_opened_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    dispute_opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dispute_resolved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    dispute_resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dispute_decision: Mapped[str | None] = mapped_column(String(50))  # BUYER / SELLER

    # --- تایمر ---
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # --- زمان‌ها ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_direct_trade_orders_buyer_status", "buyer_id", "status"),
        Index("ix_direct_trade_orders_seller_status", "seller_id", "status"),
        Index("ix_direct_trade_orders_status_expires", "status", "expires_at"),
    )


# ═══════════════════════════════════════════════════════
#                DirectTradeMessage
# ═══════════════════════════════════════════════════════


class DirectTradeMessage(Base):
    """
    پیام‌های چت بین خریدار و فروشنده در یک سفارش.
    (فاز ۲ — ولی از اول ساختار رو آماده می‌کنیم)
    """
    __tablename__ = "direct_trade_messages"

    id: Mapped[int] = mapped_column(primary_key=True)

    order_id: Mapped[int] = mapped_column(
        ForeignKey("direct_trade_orders.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- محتوا ---
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # --- آیا پیام سیستمی است؟ (مثل "معامله تکمیل شد") ---
    is_system: Mapped[bool] = mapped_column(default=False, nullable=False)

    # --- آیا خوانده شده؟ ---
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)

    # --- زمان ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


# ═══════════════════════════════════════════════════════
#                UserReputation (Trust Score)
# ═══════════════════════════════════════════════════════


class UserReputation(Base):
    """
    اعتبار کاربر در معاملات مستقیم.

    Trust Score از 0 تا 100 محاسبه می‌شود.
    """
    __tablename__ = "user_reputation"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # --- آمار ---
    total_trades: Mapped[int] = mapped_column(default=0, nullable=False)
    completed_trades: Mapped[int] = mapped_column(default=0, nullable=False)
    cancelled_trades: Mapped[int] = mapped_column(default=0, nullable=False)
    disputed_trades: Mapped[int] = mapped_column(default=0, nullable=False)

    # --- امتیازات ---
    positive_ratings: Mapped[int] = mapped_column(default=0, nullable=False)
    negative_ratings: Mapped[int] = mapped_column(default=0, nullable=False)

    # --- Trust Score (0-100) ---
    trust_score: Mapped[int] = mapped_column(default=50, nullable=False, index=True)

    # --- میانگین زمان پاسخ (به ثانیه) ---
    avg_response_time: Mapped[int] = mapped_column(default=0, nullable=False)

    # --- وضعیت ---
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    is_blocked: Mapped[bool] = mapped_column(default=False, nullable=False)

    # --- زمان ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )