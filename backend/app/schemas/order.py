from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OrderSide, OrderStatus


class OrderCreate(BaseModel):
    """ورودی ساخت سفارش توسط کاربر."""
    side: OrderSide = Field(description="BUY یا SELL")
    amount_usdt: Decimal = Field(
        gt=0,
        description="مقدار تتر",
        examples=["100.00"],
    )


class OrderRead(BaseModel):
    """خروجی کامل سفارش."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    user_id: int
    side: OrderSide
    status: OrderStatus

    amount_usdt: Decimal
    rate_afn_per_usdt: Decimal
    gross_afn: Decimal
    fee_percent: Decimal
    fee_afn: Decimal
    net_afn: Decimal

    user_payment_reference: str | None = None
    user_note: str | None = None
    platform_payment_reference: str | None = None

    admin_note: str | None = None
    reviewed_at: datetime | None = None

    created_at: datetime
    updated_at: datetime


class OrderSubmitPayment(BaseModel):
    """کاربر بعد از واریز، شماره تراکنش رو ثبت میکنه."""
    payment_reference: str = Field(
        min_length=4,
        max_length=120,
        description="TXID تتر یا شماره تراکنش Hesab Pay",
    )
    note: str | None = Field(default=None, max_length=500)


class OrderComplete(BaseModel):
    """ادمین برای تکمیل سفارش."""
    platform_payment_reference: str = Field(
        min_length=4,
        max_length=120,
        description="TXID/شماره تراکنش پلتفرم به کاربر",
    )
    admin_note: str | None = Field(default=None, max_length=500)


class OrderReject(BaseModel):
    """ادمین برای رد سفارش."""
    reason: str = Field(min_length=3, max_length=500)