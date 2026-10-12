"""
سرویس ایمیل Aryana Currency.

با SMTP واقعی ایمیل می‌فرسته (Gmail, SendGrid, Resend, ...).
اگه SMTP تنظیم نشده باشه، فقط توی لاگ چاپ می‌کنه (برای توسعه).
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, reset_token: str) -> bool:
    """
    ارسال ایمیل بازنشانی رمز عبور.
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

    # ─── اگه SMTP تنظیم نشده، فقط لاگ ───
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured — email not sent (log only).")
        return False

    # ─── ارسال واقعی ───
    try:
        _send_via_smtp(email, reset_link, reset_token)
        logger.info(f"Password reset email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send reset email to {email}: {e}")
        return False


def _send_via_smtp(to_email: str, reset_link: str, reset_token: str) -> None:
    """
    ارسال واقعی با SMTP.
    """
    subject = "بازنشانی رمز عبور — Aryana Currency"

    # ─── بدنه HTML ───
    html_body = f"""
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Arial, sans-serif;
          background: #f5f5f5;
          margin: 0;
          padding: 40px 20px;
          direction: rtl;
        }}
        .container {{
          max-width: 500px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }}
        .header {{
          background: linear-gradient(135deg, #0B0E11 0%, #181A20 100%);
          padding: 32px 24px;
          text-align: center;
        }}
        .brand {{
          color: #F0B90B;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 3px;
          margin: 0;
        }}
        .brand small {{
          display: block;
          font-size: 10px;
          color: #848E9C;
          letter-spacing: 4px;
          margin-top: 4px;
        }}
        .content {{
          padding: 32px 28px;
          text-align: right;
        }}
        h1 {{
          color: #0B0E11;
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 16px;
        }}
        p {{
          color: #4a5568;
          font-size: 14px;
          line-height: 1.7;
          margin: 0 0 16px;
        }}
        .btn {{
          display: inline-block;
          background: #F0B90B;
          color: #0B0E11;
          padding: 14px 32px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          margin: 12px 0 20px;
        }}
        .link-fallback {{
          background: #f7f7f7;
          padding: 14px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 11px;
          color: #4a5568;
          word-break: break-all;
          direction: ltr;
          text-align: left;
          margin-top: 8px;
        }}
        .warning {{
          background: #fff8e5;
          border-right: 3px solid #F0B90B;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 12px;
          color: #73550a;
          line-height: 1.6;
          margin-top: 20px;
        }}
        .footer {{
          background: #f7f7f7;
          padding: 20px;
          text-align: center;
          font-size: 11px;
          color: #848E9C;
          line-height: 1.6;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p class="brand">
            ARYANA
            <small>CURRENCY</small>
          </p>
        </div>

        <div class="content">
          <h1>بازنشانی رمز عبور</h1>

          <p>سلام،</p>

          <p>
            ما درخواستی برای بازنشانی رمز عبور حساب شما دریافت کردیم.
            برای تنظیم رمز جدید، روی دکمه زیر کلیک کنید:
          </p>

          <div style="text-align: center;">
            <a href="{reset_link}" class="btn">
              تنظیم رمز جدید
            </a>
          </div>

          <p style="font-size: 12px; color: #848E9C;">
            اگر دکمه کار نکرد، این لینک را در مرورگر خود کپی کنید:
          </p>

          <div class="link-fallback">
            {reset_link}
          </div>

          <div class="warning">
            <strong>⚠️ توجه:</strong>
            این لینک تا {settings.PASSWORD_RESET_EXPIRE_MINUTES} دقیقه معتبر است.
            اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.
          </div>
        </div>

        <div class="footer">
          این ایمیل به صورت خودکار ارسال شده است.<br>
          © Aryana Currency — Licensed Digital Exchange
        </div>
      </div>
    </body>
    </html>
    """

    # ─── نسخه ساده (برای کلاینت‌های قدیمی) ───
    text_body = f"""
Aryana Currency — بازنشانی رمز عبور

برای تنظیم رمز جدید، این لینک را در مرورگر باز کنید:

{reset_link}

این لینک تا {settings.PASSWORD_RESET_EXPIRE_MINUTES} دقیقه معتبر است.

اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.

© Aryana Currency
    """.strip()

    # ─── ساخت پیام ───
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL))
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # ─── اتصال به SMTP ───
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)