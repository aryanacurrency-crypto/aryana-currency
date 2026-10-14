"""
Telegram notifications for ARYANA CURRENCY.

ارسال اعلان‌های شیک و حرفه‌ای به گروه ادمین‌ها.

متغیرهای محیطی لازم:
    TELEGRAM_BOT_TOKEN
    TELEGRAM_CHAT_ID
"""

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"

# خط جداکننده یکنواخت
DIVIDER = "━━━━━━━━━━━━━━━━━━"


# ═══════════════════════════════════════
#           هسته‌ی ارسال
# ═══════════════════════════════════════


def _is_enabled() -> bool:
    """آیا تلگرام تنظیم شده؟"""
    return bool(settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID)


def send_telegram_message(
    text: str,
    chat_id: str | None = None,
    parse_mode: str = "HTML",
) -> bool:
    """ارسال پیام به تلگرام."""
    if not _is_enabled():
        logger.debug("Telegram not configured; skipping notification.")
        return False

    target_chat = chat_id or settings.TELEGRAM_CHAT_ID
    url = TELEGRAM_API.format(
        token=settings.TELEGRAM_BOT_TOKEN,
        method="sendMessage",
    )

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                url,
                json={
                    "chat_id": target_chat,
                    "text": text,
                    "parse_mode": parse_mode,
                    "disable_web_page_preview": True,
                },
            )
        if resp.status_code >= 400:
            logger.error(
                "Telegram send failed [%s]: %s",
                resp.status_code,
                resp.text[:300],
            )
            return False
        return True
    except Exception as e:  # noqa: BLE001
        logger.error("Telegram send exception: %s", e)
        return False


# ═══════════════════════════════════════
#           کمک‌تابع‌ها
# ═══════════════════════════════════════


def _now() -> str:
    """تاریخ و ساعت خوانا."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d  %H:%M")


def _time_only() -> str:
    """فقط ساعت."""
    return datetime.now(timezone.utc).strftime("%H:%M")


def _esc(value: Any) -> str:
    """اسکیپ کاراکترهای HTML."""
    if value is None or value == "":
        return "—"
    s = str(value)
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _short_wallet(addr: str | None, head: int = 6, tail: int = 6) -> str:
    """کوتاه کردن آدرس ولت: TXYZ...abc123"""
    if not addr:
        return "—"
    s = str(addr)
    if len(s) <= head + tail + 3:
        return s
    return f"{s[:head]}...{s[-tail:]}"


# ═══════════════════════════════════════
#        اعلان‌های کسب‌وکار
# ═══════════════════════════════════════


def notify_new_user(user) -> bool:
    """ثبت‌نام کاربر جدید."""
    text = (
        f"🆕  <b>کاربر جدید ثبت‌نام کرد</b>\n"
        f"{DIVIDER}\n"
        f"👤  <b>نام:</b>  {_esc(user.full_name)}\n"
        f"📧  <b>ایمیل:</b>  <code>{_esc(user.email)}</code>\n"
        f"📱  <b>تلفن:</b>  {_esc(user.phone)}\n"
        f"🕐  {_now()}"
    )
    return send_telegram_message(text)


def notify_new_order(order, user) -> bool:
    """سفارش جدید (خرید یا فروش)."""
    side = order.side.value if hasattr(order.side, "value") else str(order.side)

    if side == "BUY":
        title = "🟢  <b>سفارش خرید جدید</b>"
    else:
        title = "🔴  <b>سفارش فروش جدید</b>"

    text = (
        f"{title}\n"
        f"{DIVIDER}\n"
        f"🧾  <b>شماره:</b>  <code>{_esc(order.reference)}</code>\n"
        f"👤  <b>کاربر:</b>  {_esc(user.full_name)}\n"
        f"📧  <b>ایمیل:</b>  <code>{_esc(user.email)}</code>\n"
        f"{DIVIDER}\n"
        f"💵  <b>مقدار:</b>  {_esc(order.amount_usdt)} USDT\n"
        f"📊  <b>نرخ:</b>  {_esc(order.rate_afn_per_usdt)} AFN\n"
        f"💰  <b>مجموع:</b>  {_esc(order.gross_afn)} AFN\n"
        f"{DIVIDER}\n"
        f"🕐  {_time_only()}  —  منتظر پرداخت"
    )
    return send_telegram_message(text)


def notify_payment_submitted(order, user) -> bool:
    """کاربر رسید پرداخت فرستاد."""
    text = (
        f"💸  <b>رسید پرداخت ارسال شد</b>\n"
        f"{DIVIDER}\n"
        f"🧾  <b>سفارش:</b>  <code>{_esc(order.reference)}</code>\n"
        f"👤  <b>کاربر:</b>  {_esc(user.full_name)}\n"
        f"🔖  <b>رسید:</b>  <code>{_esc(order.user_payment_reference)}</code>\n"
        f"📝  <b>یادداشت:</b>  {_esc(order.user_note)}\n"
        f"{DIVIDER}\n"
        f"⚡  <b>نیاز به بررسی ادمین</b>"
    )
    return send_telegram_message(text)


def notify_new_withdrawal(withdrawal, user) -> bool:
    """درخواست برداشت جدید."""
    currency = (
        withdrawal.currency.value
        if hasattr(withdrawal.currency, "value")
        else str(withdrawal.currency)
    )

    # شبکه رو از destination یا currency استخراج کن
    network = getattr(withdrawal, "network", None) or currency

    text = (
        f"🏦  <b>درخواست برداشت جدید</b>\n"
        f"{DIVIDER}\n"
        f"🧾  <b>شماره:</b>  <code>#{_esc(withdrawal.id)}</code>\n"
        f"👤  <b>کاربر:</b>  {_esc(user.full_name)}\n"
        f"📧  <b>ایمیل:</b>  <code>{_esc(user.email)}</code>\n"
        f"{DIVIDER}\n"
        f"💵  <b>مقدار:</b>  {_esc(withdrawal.amount)} {_esc(currency)}\n"
        f"🌐  <b>شبکه:</b>  {_esc(network)}\n"
        f"📍  <b>آدرس:</b>  <code>{_esc(_short_wallet(withdrawal.destination))}</code>\n"
        f"👤  <b>صاحب:</b>  {_esc(withdrawal.destination_holder)}\n"
        f"{DIVIDER}\n"
        f"⚡  <b>نیاز به بررسی ادمین</b>"
    )
    return send_telegram_message(text)


def notify_new_kyc(doc, user) -> bool:
    """مدرک KYC جدید."""
    doc_type_fa = {
        "national_id": "تذکره / کارت ملی",
        "passport": "پاسپورت",
        "selfie": "سلفی",
    }.get(doc.doc_type, doc.doc_type)

    text = (
        f"🪪  <b>مدرک KYC جدید</b>\n"
        f"{DIVIDER}\n"
        f"👤  <b>کاربر:</b>  {_esc(user.full_name)}\n"
        f"📧  <b>ایمیل:</b>  <code>{_esc(user.email)}</code>\n"
        f"{DIVIDER}\n"
        f"📄  <b>نوع:</b>  {_esc(doc_type_fa)}\n"
        f"🆔  <b>شناسه:</b>  <code>#{_esc(doc.id)}</code>\n"
        f"{DIVIDER}\n"
        f"⚡  <b>نیاز به بررسی ادمین</b>"
    )
    return send_telegram_message(text)