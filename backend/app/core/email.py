"""
سرویس ایمیل Aryana Currency.

الان فقط توکن رو توی لاگ چاپ می‌کنه.
بعداً با SMTP واقعی جایگزین می‌شه.
"""
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, reset_token: str) -> bool:
    """
    ارسال ایمیل بازنشانی رمز عبور.

    الان: فقط توکن رو توی لاگ چاپ می‌کنه.
    بعداً: با SMTP واقعی جایگزین می‌شه.
    """
    reset_link = f"{settings.FRONTEND_URL}/pages/reset-password.html?token={reset_token}"

    # ─── لاگ برای توسعه ───
    logger.warning("=" * 60)
    logger.warning("PASSWORD RESET REQUEST")
    logger.warning(f"Email: {email}")
    logger.warning(f"Token: {reset_token}")
    logger.warning(f"Link:  {reset_link}")
    logger.warning(f"Valid for: {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes")
    logger.warning("=" * 60)

    return True