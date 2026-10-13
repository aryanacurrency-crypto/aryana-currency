"""
سرویس ایمیل Aryana Currency.

از Brevo API استفاده می‌کنه (HTTP-based) که روی Render کار می‌کنه.
"""
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════
#         Helper اصلی (ارسال)
# ═══════════════════════════════════════

def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    ارسال ایمیل با Brevo API.
    """
    if not settings.BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not configured — email not sent (log only).")
        return False

    try:
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json",
        }
        payload = {
            "sender": {
                "name": settings.SMTP_FROM_NAME,
                "email": settings.BREVO_FROM_EMAIL,
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_body,
        }

        with httpx.Client(timeout=15) as client:
            response = client.post(url, json=payload, headers=headers)
            if response.status_code not in [200, 201, 202]:
                logger.error(f"Brevo API Error: {response.text}")
                return False

        logger.info(f"Email sent to {to_email} — Subject: {subject}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


# ═══════════════════════════════════════
#       Email wrapper (HTML base)
# ═══════════════════════════════════════

def _wrap_html(title: str, content_html: str) -> str:
    """
    قالب HTML مشترک برای همه ایمیل‌ها.
    """
    return f"""
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px; direction: rtl; }}
        .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #0B0E11 0%, #181A20 100%); padding: 32px 24px; text-align: center; }}
        .brand {{ color: #F0B90B; font-size: 20px; font-weight: 800; letter-spacing: 3px; margin: 0; }}
        .brand small {{ display: block; font-size: 10px; color: #848E9C; letter-spacing: 4px; margin-top: 4px; }}
        .content {{ padding: 32px 28px; text-align: right; }}
        h1 {{ color: #0B0E11; font-size: 20px; font-weight: 800; margin: 0 0 16px; }}
        p {{ color: #4a5568; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }}
        .btn {{ display: inline-block; background: #F0B90B; color: #0B0E11 !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 12px 0 20px; }}
        .info-box {{ background: #f7f7f7; padding: 16px 18px; border-radius: 8px; margin: 16px 0; }}
        .info-row {{ display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #eeeeee; }}
        .info-row:last-child {{ border-bottom: none; }}
        .info-row span:first-child {{ color: #718096; }}
        .info-row span:last-child {{ color: #1a202c; font-weight: 600; }}
        .highlight {{ color: #F0B90B; font-weight: 700; }}
        .warning {{ background: #fff8e5; border-right: 3px solid #F0B90B; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #73550a; line-height: 1.6; margin-top: 20px; }}
        .success-badge {{ display: inline-block; background: rgba(14, 203, 129, 0.12); color: #0ECB81; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px; }}
        .footer {{ background: #f7f7f7; padding: 20px; text-align: center; font-size: 11px; color: #848E9C; line-height: 1.6; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p class="brand">ARYANA<small>CURRENCY</small></p>
        </div>
        <div class="content">
          <h1>{title}</h1>
          {content_html}
        </div>
        <div class="footer">
          این ایمیل به صورت خودکار ارسال شده است.<br>
          © Aryana Currency — صرافی دیجیتال دارای جواز
        </div>
      </div>
    </body>
    </html>
    """


# ═══════════════════════════════════════
#       ۱. Password Reset
# ═══════════════════════════════════════

def send_password_reset_email(email: str, reset_token: str) -> bool:
    """
    ارسال ایمیل بازنشانی رمز عبور.
    """
    reset_link = f"{settings.FRONTEND_URL}/pages/reset-password.html?token={reset_token}"

    logger.warning("=" * 60)
    logger.warning("PASSWORD RESET REQUEST")
    logger.warning(f"Email: {email}")
    logger.warning(f"Link:  {reset_link}")
    logger.warning("=" * 60)

    content = f"""
      <p>سلام،</p>
      <p>ما درخواستی برای تغییر رمز حساب شما دریافت کردیم. برای تعیین رمز جدید، روی دکمه زیر کلیک کنید:</p>
      <div style="text-align: center;">
        <a href="{reset_link}" class="btn">تعیین رمز جدید</a>
      </div>
      <p style="font-size: 12px; color: #848E9C;">اگر دکمه کار نکرد، این لینک را در مرورگر خود کاپی کنید:</p>
      <div style="background: #f7f7f7; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 11px; color: #4a5568; word-break: break-all; direction: ltr; text-align: left;">
        {reset_link}
      </div>
      <div class="warning">
        <strong>⚠️ توجه:</strong>
        این لینک تا {settings.PASSWORD_RESET_EXPIRE_MINUTES} دقیقه معتبر است.
        اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.
      </div>
    """

    html = _wrap_html("تغییر رمز حساب", content)
    return _send_email(email, "تغییر رمز حساب — Aryana Currency", html)


# ═══════════════════════════════════════
#       ۲. Welcome Email
# ═══════════════════════════════════════

def send_welcome_email(email: str, full_name: str | None = None) -> bool:
    """
    ارسال ایمیل خوش‌آمدگویی بعد از ثبت‌نام.
    """
    logger.info(f"Sending welcome email to {email}")

    name = full_name or "کاربر عزیز"
    dashboard_link = f"{settings.FRONTEND_URL}/pages/dashboard.html"

    content = f"""
      <p>سلام <strong>{name}</strong>،</p>
      <p>
        به <span class="highlight">Aryana Currency</span> خوش آمدید! 🎉
      </p>
      <p>
        حساب شما با موفقیت ساخته شد. حالا می‌توانید:
      </p>

      <div class="info-box">
        <div class="info-row">
          <span>✅ خرید USDT</span>
          <span>با بهترین نرخ</span>
        </div>
        <div class="info-row">
          <span>✅ فروش USDT</span>
          <span>دریافت افغانی</span>
        </div>
        <div class="info-row">
          <span>✅ شبکه‌های پشتیبانی‌شده</span>
          <span>TRC20 · BEP20 · ERC20</span>
        </div>
        <div class="info-row">
          <span>✅ پشتیبانی</span>
          <span>۲۴/۷</span>
        </div>
      </div>

      <p>برای شروع، وارد داشبورد خود شوید:</p>

      <div style="text-align: center;">
        <a href="{dashboard_link}" class="btn">ورود به داشبورد</a>
      </div>

      <div class="warning">
        <strong>💡 پیشنهاد:</strong>
        برای امنیت بیشتر و افزایش محدودیت‌های معاملات، پیشنهاد می‌کنیم هویت خود را (KYC) تایید کنید.
      </div>

      <p style="font-size: 12px; color: #848E9C; margin-top: 24px;">
        اگر سوالی دارید، تیم پشتیبانی ما ۲۴/۷ آماده‌ی کمک است.
      </p>
    """

    html = _wrap_html("خوش آمدید به Aryana Currency 🎉", content)
    return _send_email(email, "خوش آمدید به Aryana Currency", html)


# ═══════════════════════════════════════
#       ۳. Order Completed Email
# ═══════════════════════════════════════

def send_order_completed_email(
    email: str,
    full_name: str | None,
    order_reference: str,
    side: str,           # "BUY" یا "SELL"
    amount_usdt: float,
    rate_afn: float,
    total_afn: float,
    fee_afn: float,
) -> bool:
    """
    ارسال ایمیل تأیید تکمیل سفارش.
    """
    logger.info(f"Sending order completed email to {email} — {order_reference}")

    name = full_name or "کاربر عزیز"
    is_buy = side == "BUY"

    side_label = "خرید" if is_buy else "فروش"
    side_color = "#0ECB81" if is_buy else "#F6465D"

    fmt = lambda n: f"{n:,.2f}"

    content = f"""
      <p>سلام <strong>{name}</strong>،</p>

      <span class="success-badge">✅ سفارش تکمیل شد</span>

      <p>
        سفارش <strong>{side_label} USDT</strong> شما با موفقیت تکمیل شد.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span>شماره سفارش</span>
          <span style="font-family: monospace;">{order_reference}</span>
        </div>
        <div class="info-row">
          <span>نوع</span>
          <span style="color: {side_color};">{side_label} USDT</span>
        </div>
        <div class="info-row">
          <span>مقدار</span>
          <span>{fmt(amount_usdt)} USDT</span>
        </div>
        <div class="info-row">
          <span>نرخ</span>
          <span>{fmt(rate_afn)} افغانی</span>
        </div>
        <div class="info-row">
          <span>مبلغ کل</span>
          <span>{fmt(total_afn)} افغانی</span>
        </div>
        <div class="info-row">
          <span>کارمزد</span>
          <span>{fmt(fee_afn)} افغانی</span>
        </div>
      </div>

      <p style="font-size: 13px; color: #718096;">
        می‌توانید جزئیات کامل سفارش را در داشبورد خود ببینید.
      </p>

      <div class="warning">
        <strong>💡</strong>
        اگر سوالی درباره این سفارش دارید، شماره سفارش را در پیام‌تان ذکر کنید.
      </div>
    """

    html = _wrap_html(f"سفارش {side_label} USDT تکمیل شد", content)
    return _send_email(email, f"سفارش {side_label} USDT تکمیل شد — {order_reference}", html)