from datetime import datetime

from pydantic import BaseModel, Field


class ContactInfoRead(BaseModel):
    """اطلاعات تماس عمومی."""
    email: str | None = None
    address: str | None = None
    telegram_channel: str | None = None
    telegram_support: str | None = None


class PaymentInfoRead(BaseModel):
    """اطلاعات پرداخت برای Deposit/Withdraw."""
    hesab_pay: str | None = None
    hesab_pay_holder: str | None = None
    usdt_wallet_trc20: str | None = None
    usdt_wallet_bep20: str | None = None
    usdt_wallet_erc20: str | None = None
    min_deposit_usdt: float = 10
    min_withdraw_usdt: float = 10
    min_withdraw_afn: float = 500


class PlatformSettingsRead(BaseModel):
    """تنظیمات کامل — فقط برای ادمین."""
    contact_email: str | None = None
    contact_telegram_channel: str | None = None
    contact_telegram_support: str | None = None
    contact_address: str | None = None

    hesab_pay_number: str | None = None
    hesab_pay_holder: str | None = None

    usdt_wallet_trc20: str | None = None
    usdt_wallet_bep20: str | None = None
    usdt_wallet_erc20: str | None = None

    min_deposit_usdt: float = 10
    min_withdraw_usdt: float = 10
    min_withdraw_afn: float = 500

    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class PlatformSettingsUpdate(BaseModel):
    """آپدیت تنظیمات — فقط فیلدهای ارسال‌شده تغییر می‌کنن."""
    contact_email: str | None = None
    contact_telegram_channel: str | None = None
    contact_telegram_support: str | None = None
    contact_address: str | None = None

    hesab_pay_number: str | None = None
    hesab_pay_holder: str | None = None

    usdt_wallet_trc20: str | None = None
    usdt_wallet_bep20: str | None = None
    usdt_wallet_erc20: str | None = None

    min_deposit_usdt: float | None = Field(default=None, ge=0)
    min_withdraw_usdt: float | None = Field(default=None, ge=0)
    min_withdraw_afn: float | None = Field(default=None, ge=0)