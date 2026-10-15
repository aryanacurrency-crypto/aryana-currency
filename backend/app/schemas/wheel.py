from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WheelTicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    status: str
    expires_at: datetime | None
    created_at: datetime


class WheelSpinResult(BaseModel):
    type: str
    label: str
    icon: str | None
    color: str
    amount: float
    currency: str
    ticket_count: int


class WheelSpinResponse(BaseModel):
    spin_id: int
    target_angle: float
    duration: float
    result: WheelSpinResult
    requires_approval: bool


class WheelPrizeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sort_order: int
    prize_type: str
    label: str
    icon: str | None
    color: str
    amount: float
    currency: str
    ticket_count: int


class WheelStatusResponse(BaseModel):
    is_enabled: bool
    ticket_price: float
    ticket_currency: str
    ticket_expiry_days: int
    available_tickets: int
    max_spins_per_day: int
    today_spins: int
    prizes: list[WheelPrizeRead]