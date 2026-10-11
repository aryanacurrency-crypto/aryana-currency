from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class RateCreate(BaseModel):
    """ورودی ساخت نرخ جدید (فقط ادمین)."""
    buy_price_afn: Decimal = Field(gt=0, description="نرخ خرید پلتفرم از کاربر")
    sell_price_afn: Decimal = Field(gt=0, description="نرخ فروش پلتفرم به کاربر")


class RateRead(BaseModel):
    """خروجی نرخ (برای همه)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    buy_price_afn: Decimal
    sell_price_afn: Decimal
    is_active: bool
    created_at: datetime