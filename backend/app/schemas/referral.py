from pydantic import BaseModel, ConfigDict


class ReferralCodeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    clicks: int
    signups: int
    total_earned_afn: float


class ReferralStats(BaseModel):
    code: str
    clicks: int
    signups: int
    total_referrals: int
    released_count: int
    locked_count: int
    total_earned: float
    locked_amount: float
    total_commission: float


class ReferralItem(BaseModel):
    id: int
    referred_user_name: str
    registered_at: str | None
    kyc_completed: bool
    first_trade_done: bool
    bonus_amount: float
    bonus_status: str
    bonus_released_at: str | None


class ReferralValidateResponse(BaseModel):
    valid: bool
    referrer_name: str | None = None
    referrer_id: int | None = None
    reason: str | None = None