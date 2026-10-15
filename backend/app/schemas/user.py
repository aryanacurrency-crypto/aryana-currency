from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserBase(BaseModel):
    """فیلدهای مشترک کاربر."""
    email: EmailStr
    phone: str | None = None
    full_name: str | None = None


class UserCreate(UserBase):
    """ورودی ثبتنام."""
    password: str = Field(min_length=8, max_length=72)
    hesab_pay_number: str | None = None
    hesab_pay_holder_name: str | None = None
    usdt_wallet_address: str | None = None
    usdt_wallet_network: str | None = None

    # ═══ Referral / Partner Code ═══
    referral_code: str | None = Field(
        default=None,
        max_length=20,
        description="کد دعوت یا کد پارتنر (اختیاری)",
    )


class UserUpdate(BaseModel):
    """ویرایش پروفایل."""
    full_name: str | None = None
    phone: str | None = None
    hesab_pay_number: str | None = None
    hesab_pay_holder_name: str | None = None
    usdt_wallet_address: str | None = None
    usdt_wallet_network: str | None = None


class UserRead(UserBase):
    """خروجی اطلاعات کاربر (بدون پسورد)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    hesab_pay_number: str | None = None
    hesab_pay_holder_name: str | None = None
    usdt_wallet_address: str | None = None
    usdt_wallet_network: str | None = None
    referred_by_id: int | None = None
    referral_code_used: str | None = None
    available_tickets: int = 0
    created_at: datetime