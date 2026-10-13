from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.settings_service import get_settings_row
from app.schemas.settings import ContactInfoRead, PaymentInfoRead

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/contact-info", response_model=ContactInfoRead)
def get_contact_info(db: Session = Depends(get_db)):
    """
    اطلاعات تماس عمومی (ایمیل، آدرس، تلگرام).
    برای نمایش توی صفحه Contact.
    """
    row = get_settings_row(db)
    return ContactInfoRead(
        email=row.contact_email,
        address=row.contact_address,
        telegram_channel=row.contact_telegram_channel,
        telegram_support=row.contact_telegram_support,
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