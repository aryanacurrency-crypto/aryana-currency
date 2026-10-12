from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Currency, WithdrawalStatus


class WithdrawalCreate(BaseModel):
    """ورودی درخواست برداشت."""
    currency: Currency
    amount: Decimal = Field(gt=0)
    destination: str = Field(min_length=4, max_length=255)
    destination_holder: str | None = Field(default=None, max_length=120)


class WithdrawalRead(BaseModel):
    """خروجی برداشت."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    user_id: int
    currency: Currency
    amount: Decimal
    destination: str
    destination_holder: str | None = None
    status: WithdrawalStatus
    admin_note: str | None = None
    rejection_reason: str | None = None
    platform_payment_reference: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class WithdrawalComplete(BaseModel):
    """ادمین برای تکمیل برداشت."""
    platform_payment_reference: str = Field(min_length=4, max_length=120)
    admin_note: str | None = Field(default=None, max_length=500)


class WithdrawalReject(BaseModel):
    """ادمین برای رد برداشت."""
    reason: str = Field(min_length=3, max_length=500)