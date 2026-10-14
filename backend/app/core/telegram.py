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
#        اعلان‌های صرافی (Orders)
# ═══════════════════════════════════════


def notify_new_user(user) -> bool:
    """ثبت‌نام کاربر جدید."""
    text = (
        f"🆕  <b>New User Registered</b>\n"
        f"{DIVIDER}\n"
        f"👤  <b>Name:</b>  {_esc(user.full_name)}\n"
        f"📧  <b>Email:</b>  <code>{_esc(user.email)}</code>\n"
        f"📱  <b>Phone:</b>  {_esc(user.phone)}\n"
        f"🕐  {_now()}"
    )
    return send_telegram_message(text)


def notify_new_order(order, user) -> bool:
    """سفارش جدید صرافی (خرید یا فروش)."""
    side = order.side.value if hasattr(order.side, "value") else str(order.side)

    if side == "BUY":
        title = "🟢  <b>New BUY Order — Exchange</b>"
    else:
        title = "🔴  <b>New SELL Order — Exchange</b>"

    text = (
        f"{title}\n"
        f"{DIVIDER}\n"
        f"🧾  <b>Ref:</b>  <code>{_esc(order.reference)}</code>\n"
        f"👤  <b>User:</b>  {_esc(user.full_name)}\n"
        f"📧  <b>Email:</b>  <code>{_esc(user.email)}</code>\n"
        f"{DIVIDER}\n"
        f"💵  <b>Amount:</b>  {_esc(order.amount_usdt)} USDT\n"
        f"📊  <b>Rate:</b>  {_esc(order.rate_afn_per_usdt)} AFN\n"
        f"💰  <b>Total:</b>  {_esc(order.gross_afn)} AFN\n"
        f"{DIVIDER}\n"
        f"🕐  {_time_only()}  —  Awaiting payment"
    )
    return send_telegram_message(text)


def notify_payment_submitted(order, user) -> bool:
    """کاربر رسید پرداخت صرافی فرستاد."""
    text = (
        f"💸  <b>Payment Submitted — Exchange</b>\n"
        f"{DIVIDER}\n"
        f"🧾  <b>Ref:</b>  <code>{_esc(order.reference)}</code>\n"
        f"👤  <b>User:</b>  {_esc(user.full_name)}\n"
        f"🔖  <b>Tx/Ref:</b>  <code>{_esc(order.user_payment_reference)}</code>\n"
        f"📝  <b>Note:</b>  {_esc(order.user_note)}\n"
        f"{DIVIDER}\n"
        f"⚡  <b>Needs admin review</b>"
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
        f"🏦  <b>New Withdrawal Request</b>\n"
        f"{DIVIDER}\n"
        f"🧾  <b>ID:</b>  <code>#{_esc(withdrawal.id)}</code>\n"
        f"👤  <b>User:</b>  {_esc(user.full_name)}\n"
        f"📧  <b>Email:</b>  <code>{_esc(user.email)}</code>\n"
        f"{DIVIDER}\n"
        f"💵  <b>Amount:</b>  {_esc(withdrawal.amount)} {_esc(currency)}\n"
        f"📍  <b>To:</b>  <code>{_esc(_short_wallet(withdrawal.destination))}</code>\n"
        f"👤  <b>Holder:</b>  {_esc(withdrawal.destination_holder)}\n"
        f"{DIVIDER}\n"
        f"⚡  <b>Needs admin review</b>"
    )
    return send_telegram_message(text)


def notify_new_kyc(doc, user) -> bool:
    """مدرک KYC جدید."""
    text = (
        f"🪪  <b>New KYC Document</b>\n"
        f"{DIVIDER}\n"
        f"👤  <b>User:</b>  {_esc(user.full_name)}\n"
        f"📧  <b>Email:</b>  <code>{_esc(user.email)}</code>\n"
        f"{DIVIDER}\n"
        f"📄  <b>Type:</b>  <b>{_esc(doc.doc_type)}</b>\n"
        f"🆔  <b>Doc ID:</b>  <code>#{_esc(doc.id)}</code>\n"
        f"{DIVIDER}\n"
        f"⚡  <b>Needs admin review</b>"
    )
    return send_telegram_message(text)


# ═══════════════════════════════════════════════════════
#        اعلان‌های Direct Trades (Traders By Traders)
# ═══════════════════════════════════════════════════════


def notify_direct_trade_new_ad(ad, seller) -> bool:
    """آگهی جدید در معاملات مستقیم."""
    side_icon = "🔴 SELL" if ad.side.value == "SELL" else "🟢 BUY"

    text = (
        f"📢  <b>New Direct Trade Ad — {side_icon}</b>\n"
        f"{DIVIDER}\n"
        f"👤  <b>Seller:</b>  {_esc(seller.full_name)}\n"
        f"📧  <b>Email:</b>  <code>{_esc(seller.email)}</code>\n"
        f"{DIVIDER}\n"
        f"💵  <b>Amount:</b>  {_esc(ad.total_amount)} USDT\n"
        f"📊  <b>Rate:</b>  {_esc(ad.rate_afn_per_usdt)} AFN\n"
        f"📉  <b>Min Order:</b>  {_esc(ad.min_order_usdt)} USDT\n"
        f"📈  <b>Max Order:</b>  {_esc(ad.max_order_usdt)} USDT\n"
        f"{DIVIDER}\n"
        f"🕐  {_now()}"
    )
    return send_telegram_message(text)


def notify_direct_trade_new_order(order, buyer) -> bool:
    """سفارش جدید در معاملات مستقیم."""
    text = (
        f"🔔  <b>New Direct Trade Order</b>\n"
        f"{DIVIDER}\n"
        f"🧾  <b>Ref:</b>  <code>{_esc(order.reference)}</code>\n"
        f"👤  <b>Buyer:</b>  {_esc(buyer.full_name)}\n"
        f"📧  <b>Email:</b>  <code>{_esc(buyer.email)}</code>\n"
        f"{DIVIDER}\n"
        f"💵  <b>Amount:</b>  {_esc(order.amount_usdt)} USDT\n"
        f"📊  <b>Rate:</b>  {_esc(order.rate_afn_per_usdt)} AFN\n"
        f"{DIVIDER}\n"
        f"📥  <b>Buyer Receives:</b>  {_esc(order.buyer_receives_usdt)} USDT\n"
        f"💰  <b>Buyer Pays:</b>  {_esc(order.total_payment_afn)} AFN\n"
        f"🏦  <b>Seller Gets:</b>  {_esc(order.seller_receives_afn)} AFN\n"
        f"{DIVIDER}\n"
        f"🕐  {_time_only()}  —  Awaiting payment"
    )
    return send_telegram_message(text)


def notify_direct_trade_payment_submitted(order, buyer) -> bool:
    """خریدار رسید پرداخت فرستاد (Direct Trade)."""
    text = (
        f"💸  <b>Direct Trade — Payment Submitted</b>\n"
        f"{DIVIDER}\n"
        f"🧾  <b>Ref:</b>  <code>{_esc(order.reference)}</code>\n"
        f"👤  <b>Buyer:</b>  {_esc(buyer.full_name)}\n"
        f"📧  <b>Email:</b>  <code>{_esc(buyer.email)}</code>\n"
        f"{DIVIDER}\n"
        f"🔖  <b>Tx/Ref:</b>  <code>{_esc(order.buyer_payment_reference)}</code>\n"
        f"📝  <b>Note:</b>  {_esc(order.buyer_note)}\n"
        f"{DIVIDER}\n"
        f"⚡  <b>Needs admin review</b>"
    )
    return send_telegram_message(text)


def notify_direct_trade_completed(order) -> bool:
    """معامله مستقیم با موفقیت تکمیل شد."""
    text = (
        f"✅  <b>Direct Trade — Completed</b>\n"
        f"{DIVIDER}\n"
        f"🧾  <b>Ref:</b>  <code>{_esc(order.reference)}</code>\n"
        f"{DIVIDER}\n"
        f"💵  <b>Amount:</b>  {_esc(order.amount_usdt)} USDT\n"
        f"📥  <b>Buyer Received:</b>  {_esc(order.buyer_receives_usdt)} USDT\n"
        f"💰  <b>Seller Received:</b>  {_esc(order.seller_receives_afn)} AFN\n"
        f"{DIVIDER}\n"
        f"💼  <b>Platform Fees:</b>\n"
        f"   • Seller: {_esc(order.seller_fee_usdt)} USDT\n"
        f"   • Buyer: {_esc(order.buyer_fee_afn)} AFN\n"
        f"{DIVIDER}\n"
        f"🕐  {_now()}"
    )
    return send_telegram_message(text)


def notify_direct_trade_dispute(order, user) -> bool:
    """اختلاف جدید در معامله مستقیم."""
    text = (
        f"🚨  <b>Direct Trade — DISPUTE OPENED</b>\n"
        f"{DIVIDER}\n"
        f"🧾  <b>Ref:</b>  <code>{_esc(order.reference)}</code>\n"
        f"👤  <b>Opened by:</b>  {_esc(user.full_name)}\n"
        f"📧  <b>Email:</b>  <code>{_esc(user.email)}</code>\n"
        f"{DIVIDER}\n"
        f"📝  <b>Reason:</b>\n"
        f"{_esc(order.dispute_reason)}\n"
        f"{DIVIDER}\n"
        f"⚡  <b>Needs admin resolution</b>\n"
        f"🕐  {_now()}"
    )
    return send_telegram_message(text)


def notify_direct_trade_expired(order) -> bool:
    """سفارش منقضی‌شده در معامله مستقیم."""
    text = (
        f"⏱  <b>Direct Trade — Order Expired</b>\n"
        f"{DIVIDER}\n"
        f"🧾  <b>Ref:</b>  <code>{_esc(order.reference)}</code>\n"
        f"💵  <b>Amount:</b>  {_esc(order.amount_usdt)} USDT\n"
        f"{DIVIDER}\n"
        f"ℹ️  <b>Escrow released automatically</b>\n"
        f"🕐  {_now()}"
    )
    return send_telegram_message(text)