"""
سرویس تنظیمات پلتفرم.

تنظیمات رو از دیتابیس می‌خونه. اگه دیتابیس خالی بود، از .env می‌خونه (fallback).
"""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.platform_settings import PlatformSettings


def get_settings_row(db: Session) -> PlatformSettings:
    """
    گرفتن ردیف تنظیمات (id=1). اگه نبود، می‌سازه با مقادیر .env.
    """
    row = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()

    if not row:
        row = PlatformSettings(
            id=1,
            # Contact Info — خالی
            contact_phone=None,
            contact_email=None,
            contact_address=None,
            # Payment Info — از .env
            hesab_pay_number=settings.PLATFORM_HESAB_PAY or None,
            hesab_pay_holder=settings.PLATFORM_HESAB_PAY_HOLDER or None,
            usdt_wallet_trc20=settings.PLATFORM_USDT_WALLET or None,
            usdt_wallet_bep20=getattr(settings, "PLATFORM_USDT_WALLET_BEP20", None) or None,
            usdt_wallet_erc20=getattr(settings, "PLATFORM_USDT_WALLET_ERC20", None) or None,
            min_deposit_usdt=10,
            min_withdraw_usdt=10,
            min_withdraw_afn=500,
        )
        db.add(row)
        db.commit()
        db.refresh(row)

    return row