from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/payment-info")
def get_payment_info():
    """
    اطلاعات پرداخت عمومی (آدرس ولت و حساب Hesab Pay پلتفرم).
    برای نمایش به کاربر در صفحه سفارش.
    """
    return {
        "usdt_wallet": settings.PLATFORM_USDT_WALLET,
        "usdt_network": "TRC20",
        "hesab_pay": settings.PLATFORM_HESAB_PAY,
        "hesab_pay_holder": settings.PLATFORM_HESAB_PAY_HOLDER,
    }