"""
Schemaهای معاملات مستقیم (Traders By Traders).

شامل Schemaهای آگهی، سفارش، چت، و اعتبار کاربر.
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    DirectTradeAdSide,
    DirectTradeAdStatus,
    DirectTradeOrderStatus,
)


# ═══════════════════════════════════════════════════════
#                  DirectTradeAd Schemas
# ═══════════════════════════════════════════════════════


class DirectTradeAdCreate(BaseModel):
    """ورودی ساخت آگهی جدید (فروشنده)."""
    side: DirectTradeAdSide = Field(
        default=DirectTradeAdSide.SELL,
        description="نوع آگهی: SELL (فروش تتر) یا BUY (خرید تتر)"
    )
    total_amount: Decimal = Field(gt=0, description="مقدار کل تتر برای فروش")
    rate_afn_per_usdt: Decimal = Field(gt=0, description="نرخ تبدیل (افغانی به ازای هر تتر)")
    min_order_usdt: Decimal = Field(default=Decimal("10"), gt=0, description="حداقل مقدار خرید برای هر سفارش")
    max_order_usdt: Decimal = Field(gt=0, description="حداکثر مقدار خرید برای هر سفارش")
    payment_method: str = Field(default="Hesab Pay", max_length=50)
    terms: str | None = Field(default=None, max_length=1000, description="شرایط اختیاری فروشنده")


class DirectTradeAdUpdate(BaseModel):
    """ورودی ویرایش آگهی (فقط فیلدهای مجاز)."""
    rate_afn_per_usdt: Decimal | None = Field(default=None, gt=0)
    min_order_usdt: Decimal | None = Field(default=None, gt=0)
    max_order_usdt: Decimal | None = Field(default=None, gt=0)
    terms: str | None = Field(default=None, max_length=1000)


class DirectTradeAdRead(BaseModel):
    """خروجی آگهی."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    seller_id: int
    side: DirectTradeAdSide
    total_amount: Decimal
    available_amount: Decimal
    locked_amount: Decimal
    rate_afn_per_usdt: Decimal
    min_order_usdt: Decimal
    max_order_usdt: Decimal
    payment_method: str
    terms: str | None = None
    status: DirectTradeAdStatus
    total_trades: int = 0
    completed_trades: int = 0
    created_at: datetime
    updated_at: datetime


class DirectTradeAdWithSeller(BaseModel):
    """آگهی همراه با اطلاعات فروشنده."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    side: DirectTradeAdSide
    available_amount: Decimal
    locked_amount: Decimal
    rate_afn_per_usdt: Decimal
    min_order_usdt: Decimal
    max_order_usdt: Decimal
    payment_method: str
    terms: str | None = None
    status: DirectTradeAdStatus
    total_trades: int = 0
    completed_trades: int = 0
    created_at: datetime

    seller_full_name: str | None = None
    seller_is_verified: bool = False
    seller_trust_score: int = 50


# ═══════════════════════════════════════════════════════
#                DirectTradeOrder Schemas
# ═══════════════════════════════════════════════════════


class DirectTradeOrderCreate(BaseModel):
    """ورودی ساخت سفارش جدید (خریدار)."""
    ad_id: int = Field(gt=0)
    amount_usdt: Decimal = Field(gt=0, description="مقدار تتر درخواستی (قبل از کسر کمیسیون)")


class DirectTradeOrderRead(BaseModel):
    """خروجی سفارش."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    ad_id: int
    buyer_id: int
    seller_id: int

    amount_usdt: Decimal
    rate_afn_per_usdt: Decimal

    seller_fee_percent: Decimal
    buyer_fee_percent: Decimal
    seller_fee_usdt: Decimal
    buyer_receives_usdt: Decimal

    base_amount_afn: Decimal
    buyer_fee_afn: Decimal
    total_payment_afn: Decimal
    seller_receives_afn: Decimal

    status: DirectTradeOrderStatus

    buyer_payment_reference: str | None = None
    buyer_payment_proof: str | None = None
    buyer_note: str | None = None

    admin_note: str | None = None
    reviewed_at: datetime | None = None
    released_at: datetime | None = None

    dispute_reason: str | None = None
    dispute_opened_at: datetime | None = None
    dispute_decision: str | None = None

    expires_at: datetime

    created_at: datetime
    paid_at: datetime | None = None
    completed_at: datetime | None = None
    updated_at: datetime


class DirectTradeOrderWithDetails(BaseModel):
    """سفارش با اطلاعات کامل خریدار و فروشنده."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    ad_id: int

    buyer_id: int
    seller_id: int

    amount_usdt: Decimal
    rate_afn_per_usdt: Decimal

    seller_fee_usdt: Decimal
    buyer_receives_usdt: Decimal
    base_amount_afn: Decimal
    buyer_fee_afn: Decimal
    total_payment_afn: Decimal
    seller_receives_afn: Decimal

    status: DirectTradeOrderStatus

    buyer_payment_reference: str | None = None
    buyer_payment_proof: str | None = None
    buyer_note: str | None = None

    expires_at: datetime

    created_at: datetime
    paid_at: datetime | None = None
    completed_at: datetime | None = None

    buyer_full_name: str | None = None
    buyer_is_verified: bool = False
    buyer_trust_score: int = 50

    seller_full_name: str | None = None
    seller_is_verified: bool = False
    seller_trust_score: int = 50
    seller_payment_method: str | None = None


class DirectTradePaymentSubmit(BaseModel):
    """ورودی خریدار بعد از پرداخت."""
    payment_reference: str = Field(min_length=3, max_length=120, description="شماره رسید یا TXID")
    payment_proof: str | None = Field(default=None, max_length=255, description="لینک/آدرس عکس رسید (اختیاری)")
    note: str | None = Field(default=None, max_length=500)


class DirectTradeOrderComplete(BaseModel):
    """ادمین برای تکمیل سفارش."""
    admin_note: str | None = Field(default=None, max_length=500)


class DirectTradeOrderReject(BaseModel):
    """ادمین برای رد سفارش."""
    reason: str = Field(min_length=3, max_length=500)


class DirectTradeOrderCancel(BaseModel):
    """لغو سفارش توسط خریدار یا فروشنده."""
    reason: str | None = Field(default=None, max_length=500)


class DirectTradeDisputeCreate(BaseModel):
    """باز کردن اختلاف."""
    reason: str = Field(min_length=10, max_length=1000, description="دلیل اختلاف")
    evidence: str | None = Field(default=None, max_length=500, description="لینک مدارک (اختیاری)")


class DirectTradeDisputeResolve(BaseModel):
    """ادمین برای حل اختلاف."""
    decision: str = Field(pattern="^(BUYER|SELLER)$", description="تصمیم: BUYER یا SELLER")
    admin_note: str = Field(min_length=3, max_length=1000)


# ═══════════════════════════════════════════════════════
#              DirectTradeMessage Schemas
# ═══════════════════════════════════════════════════════


class DirectTradeMessageCreate(BaseModel):
    """ورودی ارسال پیام در چت معامله."""
    message: str = Field(min_length=1, max_length=2000)


class DirectTradeMessageRead(BaseModel):
    """خروجی پیام."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    sender_id: int
    message: str
    is_system: bool = False
    is_read: bool = False
    created_at: datetime


# ═══════════════════════════════════════════════════════
#              UserReputation Schemas
# ═══════════════════════════════════════════════════════


class UserReputationRead(BaseModel):
    """خروجی اعتبار کاربر."""
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    total_trades: int = 0
    completed_trades: int = 0
    cancelled_trades: int = 0
    disputed_trades: int = 0
    positive_ratings: int = 0
    negative_ratings: int = 0
    trust_score: int = 50
    avg_response_time: int = 0
    is_verified: bool = False
    is_blocked: bool = False
    updated_at: datetime | None = None


class UserReputationPublic(BaseModel):
    """اطلاعات عمومی اعتبار کاربر (برای نمایش به دیگران)."""
    user_id: int
    full_name: str | None = None
    trust_score: int = 50
    completed_trades: int = 0
    is_verified: bool = False
    is_blocked: bool = False


# ═══════════════════════════════════════════════════════
#                  Stats Schemas
# ═══════════════════════════════════════════════════════


class DirectTradeStats(BaseModel):
    """آمار کلی معاملات مستقیم."""
    total_ads: int = 0
    active_ads: int = 0
    total_orders: int = 0
    completed_orders: int = 0
    total_volume_usdt: Decimal = Decimal("0")
    total_volume_afn: Decimal = Decimal("0")