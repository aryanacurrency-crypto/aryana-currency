"""
سرویس تنظیمات پلتفرم.

تنظیمات رو از دیتابیس می‌خونه. اگه دیتابیس خالی بود، از .env می‌خونه (fallback).
"""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.platform_settings import PlatformSettings


def get_settings_row(db: Session) -> PlatformSettings:
    """
    گرفتن ردیف تنظیمات (id=1). اگه نبود، می‌سازه.
    """
    row = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()

    if not row:
        row = PlatformSettings(
            id=1,
            # Contact — همه خالی (ادمین از پنل پرشون می‌کنه)
            contact_email=None,
            contact_telegram_channel=None,
            contact_telegram_support=None,
            contact_address=None,
            # Payment — از .env
            hesab_pay_number=settings.PLATFORM_HESAB_PAY or None,
            hesab_pay_holder=settings.PLATFORM_HESAB_PAY_HOLDER or None,
            usdt_wallet_trc20=settings.PLATFORM_USDT_WALLET or None,
            min_deposit_usdt=10,
            min_withdraw_usdt=10,
            min_withdraw_afn=500,
        )
        db.add(row)
        db.commit()
        db.refresh(row)

    return row