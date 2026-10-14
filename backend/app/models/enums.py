from enum import Enum


class Currency(str, Enum):
    """ارزهای پشتیبانی‌شده."""
    AFN = "AFN"       # افغانی
    USDT = "USDT"     # تتر


class UserRole(str, Enum):
    """نقش کاربر."""
    USER = "USER"
    ADMIN = "ADMIN"


class KycStatus(str, Enum):
    """وضعیت احراز هویت."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class OrderSide(str, Enum):
    """نوع سفارش."""
    BUY = "BUY"       # کاربر تتر می‌خره (افغانی می‌ده)
    SELL = "SELL"     # کاربر تتر می‌فروشه (افغانی می‌گیره)


class OrderStatus(str, Enum):
    """وضعیت سفارش."""
    PENDING = "PENDING"                 # منتظر واریز کاربر
    AWAITING_REVIEW = "AWAITING_REVIEW" # کاربر واریز کرد، منتظر ادمین
    PROCESSING = "PROCESSING"           # ادمین تأیید کرد، در حال ارسال
    COMPLETED = "COMPLETED"             # موفق
    CANCELLED = "CANCELLED"             # کاربر لغو کرد
    REJECTED = "REJECTED"               # ادمین رد کرد


class LedgerDirection(str, Enum):
    """جهت ثبت در دفتر کل."""
    DEBIT = "DEBIT"     # بدهکار
    CREDIT = "CREDIT"   # بستانکار


class WithdrawalStatus(str, Enum):
    """وضعیت برداشت."""
    PENDING = "PENDING"             # منتظر بررسی ادمین
    PROCESSING = "PROCESSING"       # در حال پردازش
    COMPLETED = "COMPLETED"         # تکمیل شده
    REJECTED = "REJECTED"           # رد شده
    CANCELLED = "CANCELLED"         # لغو شده


# ═══════════════════════════════════════════════════════
#          Direct Trade (Traders By Traders) Enums
# ═══════════════════════════════════════════════════════


class DirectTradeAdSide(str, Enum):
    """نوع آگهی در معاملات مستقیم."""
    SELL = "SELL"     # فروشنده تتر می‌فروشه
    BUY = "BUY"       # خریدار تتر می‌خره (آگهی خرید)


class DirectTradeAdStatus(str, Enum):
    """وضعیت آگهی."""
    ACTIVE = "ACTIVE"           # فعال و قابل مشاهده
    PAUSED = "PAUSED"           # موقتاً غیرفعال
    COMPLETED = "COMPLETED"     # موجودی تمام شد
    CANCELLED = "CANCELLED"     # لغو شده توسط فروشنده


class DirectTradeOrderStatus(str, Enum):
    """وضعیت سفارش معامله مستقیم."""
    PENDING_PAYMENT = "PENDING_PAYMENT"       # منتظر پرداخت خریدار
    PAYMENT_REVIEW = "PAYMENT_REVIEW"         # پرداخت انجام شد، منتظر بررسی
    READY_TO_RELEASE = "READY_TO_RELEASE"     # تأیید شد، آماده آزادسازی
    COMPLETED = "COMPLETED"                   # تکمیل شده
    CANCELLED = "CANCELLED"                   # لغو شده
    EXPIRED = "EXPIRED"                       # منقضی شده (تایمر)
    DISPUTED = "DISPUTED"                     # در حال بررسی اختلاف