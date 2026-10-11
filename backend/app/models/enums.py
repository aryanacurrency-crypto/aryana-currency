from enum import Enum


class Currency(str, Enum):
    """ارزهای پشتیبانیشده."""
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
    BUY = "BUY"       # کاربر تتر میخره (افغانی میده)
    SELL = "SELL"     # کاربر تتر میفروشه (افغانی میگیره)


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