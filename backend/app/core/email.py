"""
سرویس ایمیل Aryana Currency.

از Brevo API استفاده می‌کنه (HTTP-based) که روی Render کار می‌کنه.
"""
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, reset_token: str) -> bool:
    """
    ارسال ایمیل بازنشانی رمز عبور با Brevo API.
    """
    reset_link = f"{settings.FRONTEND_URL}/pages/reset-password.html?token={reset_token}"

    # ─── لاگ ───
    logger.warning("=" * 60)
    logger.warning("PASSWORD RESET REQUEST")
    logger.warning(f"Email: {email}")
    logger.warning(f"Token: {reset_token}")
    logger.warning(f"Link:  {reset_link}")
    logger.warning("=" * 60)

    # ─── چک تنظیمات ───
    if not settings.BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not configured — email not sent (log only).")
        return False

    # ─── بدنه HTML ───
    html_body = f"""
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px; direction: rtl; }}
        .container {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #0B0E11 0%, #181A20 100%); padding: 32px 24px; text-align: center; }}
        .brand {{ color: #F0B90B; font-size: 20px; font-weight: 800; letter-spacing: 3px; margin: 0; }}
        .brand small {{ display: block; font-size: 10px; color: #848E9C; letter-spacing: 4px; margin-top: 4px; }}
        .content {{ padding: 32px 28px; text-align: right; }}
        h1 {{ color: #0B0E11; font-size: 20px; font-weight: 800; margin: 0 0 16px; }}
        p {{ color: #4a5568; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }}
        .btn {{ display: inline-block; background: #F0B90B; color: #0B0E11; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 12px 0 20px; }}
        .link-fallback {{ background: #f7f7f7; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 11px; color: #4a5568; word-break: break-all; direction: ltr; text-align: left; margin-top: 8px; }}
        .warning {{ background: #fff8e5; border-right: 3px solid #F0B90B; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #73550a; line-height: 1.6; margin-top: 20px; }}
        .footer {{ background: #f7f7f7; padding: 20px; text-align: center; font-size: 11px; color: #848E9C; line-height: 1.6; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><p class="brand">ARYANA<small>CURRENCY</small></p></div>
        <div class="content">
          <h1>بازنشانی رمز عبور</h1>
          <p>سلام،</p>
          <p>ما درخواستی برای بازنشانی رمز عبور حساب شما دریافت کردیم. برای تنظیم رمز جدید، روی دکمه زیر کلیک کنید:</p>
          <div style="text-align: center;"><a href="{reset_link}" class="btn">تنظیم رمز جدید</a></div>
          <p style="font-size: 12px; color: #848E9C;">اگر دکمه کار نکرد، این لینک را در مرورگر خود کپی کنید:</p>
          <div class="link-fallback">{reset_link}</div>
          <div class="warning"><strong>⚠️ توجه:</strong> این لینک تا {settings.PASSWORD_RESET_EXPIRE_MINUTES} دقیقه معتبر است. اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</div>
        </div>
        <div class="footer">این ایمیل به صورت خودکار ارسال شده است.<br>© Aryana Currency — Licensed Digital Exchange</div>
      </div>
    </body>
    </html>
    """

    # ─── ارسال با Brevo API ───
    try:
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json",
        }
        payload = {
            "sender": {"name": settings.SMTP_FROM_NAME, "email": settings.BREVO_FROM_EMAIL},
            "to": [{"email": email}],
            "subject": "بازنشانی رمز عبور — Aryana Currency",
            "htmlContent": html_body,
        }

        with httpx.Client(timeout=15) as client:
            response = client.post(url, json=payload, headers=headers)
            if response.status_code not in [200, 201, 202]:
                logger.error(f"Brevo API Error: {response.text}")
                return False

        logger.info(f"Password reset email sent to {email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send reset email to {email}: {e}")
        return False