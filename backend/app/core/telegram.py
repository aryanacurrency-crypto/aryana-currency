"""
Telegram notifications for ARYANA CURRENCY.

ارسال اعلان به گروه ادمین‌ها از طریق Bot API.

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
    """
    ارسال پیام به تلگرام.

    - اگه تنظیمات ناقص باشه، بی‌صدا برمی‌گرده False (تا اپ کرش نکنه)
    - اگه ارسال موفق باشه، True برمی‌گردونه
    - خطاها فقط log می‌شن، raise نمی‌شن
    """
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


def _now() -> str:
    """تایم‌استمپ خوانا (به وقت کابل)."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def _esc(value: Any) -> str:
    """اسکیپ کاراکترهای HTML."""
    if value is None:
        return "—"
    s = str(value)
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ═══════════════════════════════════════
#        اعلان‌های کسب‌وکار
# ═══════════════════════════════════════


def notify_new_user(user) -> bool:
    """ثبت‌نام کاربر جدید."""
    text = (
        f"👤 <b>New User Registered</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📧 Email: <code>{_esc(user.email)}</code>\n"
        f"🆔 Name: {_esc(user.full_name)}\n"
        f"📱 Phone: {_esc(user.phone)}\n"
        f"🕐 {_now()}"
    )
    return send_telegram_message(text)


def notify_new_order(order, user) -> bool:
    """سفارش جدید (خرید یا فروش)."""
    side = order.side.value if hasattr(order.side, "value") else str(order.side)
    side_icon = "🟢 BUY" if side == "BUY" else "🔴 SELL"

    text = (
        f"🔔 <b>New Order — {side_icon}</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"🧾 Ref: <code>{_esc(order.reference)}</code>\n"
        f"👤 User: {_esc(user.full_name)} (<code>{_esc(user.email)}</code>)\n"
        f"💵 Amount: <b>{_esc(order.amount_usdt)} USDT</b>\n"
        f"📊 Rate: {_esc(order.rate_afn_per_usdt)} AFN\n"
        f"💰 Total: {_esc(order.gross_afn)} AFN\n"
        f"🕐 {_now()}"
    )
    return send_telegram_message(text)


def notify_payment_submitted(order, user) -> bool:
    """کاربر رسید پرداخت فرستاد."""
    text = (
        f"💸 <b>Payment Submitted</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"🧾 Ref: <code>{_esc(order.reference)}</code>\n"
        f"👤 User: {_esc(user.full_name)}\n"
        f"🔖 Tx/Ref: <code>{_esc(order.user_payment_reference)}</code>\n"
        f"📝 Note: {_esc(order.user_note)}\n"
        f"👉 <i>Review in admin panel</i>\n"
        f"🕐 {_now()}"
    )
    return send_telegram_message(text)


def notify_new_withdrawal(withdrawal, user) -> bool:
    """درخواست برداشت جدید."""
    currency = (
        withdrawal.currency.value
        if hasattr(withdrawal.currency, "value")
        else str(withdrawal.currency)
    )
    text = (
        f"🏦 <b>New Withdrawal Request</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"🧾 ID: <code>#{_esc(withdrawal.id)}</code>\n"
        f"👤 User: {_esc(user.full_name)} (<code>{_esc(user.email)}</code>)\n"
        f"💵 Amount: <b>{_esc(withdrawal.amount)} {_esc(currency)}</b>\n"
        f"📍 Destination: <code>{_esc(withdrawal.destination)}</code>\n"
        f"👤 Holder: {_esc(withdrawal.destination_holder)}\n"
        f"🕐 {_now()}"
    )
    return send_telegram_message(text)


def notify_new_kyc(doc, user) -> bool:
    """مدرک KYC جدید."""
    text = (
        f"🪪 <b>New KYC Document</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 User: {_esc(user.full_name)} (<code>{_esc(user.email)}</code>)\n"
        f"📄 Doc Type: <b>{_esc(doc.doc_type)}</b>\n"
        f"🆔 Doc ID: <code>#{_esc(doc.id)}</code>\n"
        f"👉 <i>Review in admin panel</i>\n"
        f"🕐 {_now()}"
    )
    return send_telegram_message(text)