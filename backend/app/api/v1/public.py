from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.settings_service import get_settings_row
from app.schemas.settings import ContactInfoRead, PaymentInfoRead

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/contact-info", response_model=ContactInfoRead)
def get_contact_info(db: Session = Depends(get_db)):
    """
    اطلاعات تماس عمومی (تلفن، ایمیل، آدرس).
    برای نمایش توی Footer و صفحه Contact.
    """
    row = get_settings_row(db)
    return ContactInfoRead(
        phone=row.contact_phone,
        email=row.contact_email,
        address=row.contact_address,
        telegram=row.contact_telegram,
        whatsapp=row.contact_whatsapp,
    )


@router.get("/payment-info", response_model=PaymentInfoRead)
def get_payment_info(db: Session = Depends(get_db)):
    """
    اطلاعات پرداخت (Hesab Pay و USDT wallets).
    فقط برای صفحه Deposit و Withdraw.
    """
    row = get_settings_row(db)
    return PaymentInfoRead(
        hesab_pay=row.hesab_pay_number,
        hesab_pay_holder=row.hesab_pay_holder,
        usdt_wallet_trc20=row.usdt_wallet_trc20,
        usdt_wallet_bep20=row.usdt_wallet_bep20,
        usdt_wallet_erc20=row.usdt_wallet_erc20,
        min_deposit_usdt=float(row.min_deposit_usdt or 10),
        min_withdraw_usdt=float(row.min_withdraw_usdt or 10),
        min_withdraw_afn=float(row.min_withdraw_afn or 500),
    )


@router.get("/smtp-debug")
def smtp_debug():
    """
    ⚠️ ENDPOINT TEMPORARY — فقط برای دیباگ.
    بعداً پاک کن.
    """
    return {
        "debug_marker": settings.DEBUG_MARKER,
        "smtp_host": settings.SMTP_HOST or "EMPTY",
        "smtp_port": settings.SMTP_PORT,
        "smtp_user": settings.SMTP_USER or "EMPTY",
        "smtp_pass_set": bool(settings.SMTP_PASSWORD),
        "smtp_pass_len": len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else 0,
        "smtp_from_email": settings.SMTP_FROM_EMAIL or "EMPTY",
        "frontend_url": settings.FRONTEND_URL,
        "app_env": settings.APP_ENV,
        "debug": settings.DEBUG,
    }