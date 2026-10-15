"""
سرویس Referral — منطق پاداش دعوت و کمیسیون VIP.
"""
import logging
import secrets
import string
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_DOWN

from sqlalchemy.orm import Session

from app.models import (
    LockedBalance,
    Order,
    PlatformSettings,
    Referral,
    ReferralCode,
    ReferralEarning,
    User,
    Wallet,
)
from app.models.enums import Currency, OrderStatus

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════
#         تولید کد اختصاصی
# ═══════════════════════════════════════


def generate_unique_code(db: Session, base: str = "") -> str:
    """تولید کد اختصاصی یکتا برای کاربر."""
    base = (base or "ARY").upper()[:8]

    for _ in range(20):
        suffix = "".join(
            secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4)
        )
        code = f"{base}{suffix}"
        exists = db.query(ReferralCode).filter(ReferralCode.code == code).first()
        if not exists:
            return code

    return "".join(
        secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8)
    )


def get_or_create_referral_code(db: Session, user: User) -> ReferralCode:
    """دریافت یا ساخت کد اختصاصی برای کاربر."""
    referral_code = db.query(ReferralCode).filter(
        ReferralCode.user_id == user.id
    ).first()

    if referral_code:
        return referral_code

    base = ""
    if user.full_name:
        base = user.full_name.split()[0][:8]
    else:
        base = user.email.split("@")[0][:8]

    code = generate_unique_code(db, base)

    referral_code = ReferralCode(user_id=user.id, code=code)
    db.add(referral_code)
    db.flush()
    return referral_code


# ═══════════════════════════════════════
#         اعتبارسنجی کد
# ═══════════════════════════════════════


def validate_referral_code(db: Session, code: str) -> dict:
    """اعتبارسنجی کد رفرال."""
    if not code:
        return {"valid": False, "reason": "empty"}

    code = code.upper().strip()
    if len(code) > 20:
        return {"valid": False, "reason": "invalid_format"}

    referral_code = db.query(ReferralCode).filter(
        ReferralCode.code == code
    ).first()
    if not referral_code:
        return {"valid": False, "reason": "not_found"}

    referrer = db.query(User).get(referral_code.user_id)
    if not referrer or not referrer.is_active:
        return {"valid": False, "reason": "inactive"}

    full_name = referrer.full_name or referrer.email.split("@")[0]
    display_name = full_name.split()[0] if full_name else "کاربر"

    return {
        "valid": True,
        "referrer_name": display_name,
        "referrer_id": referrer.id,
    }


# ═══════════════════════════════════════
#     هوک‌های رویداد (KYC / معامله)
# ═══════════════════════════════════════


def on_kyc_completed(db: Session, user: User) -> None:
    """وقتی KYC کاربر تأیید شد."""
    referral = db.query(Referral).filter(
        Referral.referred_user_id == user.id
    ).first()

    if not referral:
        return

    if referral.kyc_completed_at is None:
        referral.kyc_completed_at = datetime.now(timezone.utc)

    _try_release_bonus(db, referral)


def on_first_successful_trade(db: Session, user: User, order: Order) -> None:
    """وقتی کاربر اولین معامله موفقش رو انجام داد."""
    referral = db.query(Referral).filter(
        Referral.referred_user_id == user.id
    ).first()

    if referral and referral.first_trade_at is None:
        referral.first_trade_at = datetime.now(timezone.utc)
        _try_release_bonus(db, referral)

    # توزیع کمیسیون VIP به همه سطوح بالادست
    distribute_vip_commission(db, user, order)


# ═══════════════════════════════════════
#         آزادسازی پاداش 15 AFN
# ═══════════════════════════════════════


def _try_release_bonus(db: Session, referral: Referral) -> None:
    """اگه هر دو شرط (KYC + معامله) کامل شدن، پاداش رو آزاد کن."""
    settings = db.query(PlatformSettings).first()
    if not settings:
        return

    kyc_ok = referral.kyc_completed_at is not None
    trade_ok = referral.first_trade_at is not None

    requires_kyc = settings.referral_requires_kyc
    requires_trade = settings.referral_requires_first_trade

    if requires_kyc and not kyc_ok:
        return
    if requires_trade and not trade_ok:
        return

    if referral.bonus_status != "locked":
        return

    # ═══ آزادسازی ═══
    now = datetime.now(timezone.utc)

    # 1. بروزرسانی referral
    referral.bonus_status = "released"
    referral.bonus_released_at = now

    # 2. بروزرسانی LockedBalance
    locked = db.query(LockedBalance).filter(
        LockedBalance.referral_id == referral.id,
        LockedBalance.status == "locked",
    ).first()

    if locked:
        locked.status = "released"
        locked.released_at = now
        locked.released_by_order_id = referral.released_by_order_id

    # 3. اضافه به wallet دعوت‌کننده
    wallet = db.query(Wallet).filter(
        Wallet.user_id == referral.referrer_id,
        Wallet.currency == referral.bonus_currency,
    ).first()

    if wallet:
        wallet.balance += referral.bonus_amount

    # 4. بروزرسانی آمار ReferralCode
    referral_code = db.query(ReferralCode).filter(
        ReferralCode.user_id == referral.referrer_id
    ).first()

    if referral_code:
        referral_code.total_earned_afn += referral.bonus_amount

    logger.info(
        f"Referral bonus released: referrer={referral.referrer_id} "
        f"amount={referral.bonus_amount} {referral.bonus_currency}"
    )


# ═══════════════════════════════════════
#       توزیع کمیسیون VIP از کارمزد
# ═══════════════════════════════════════


def distribute_vip_commission(db: Session, trading_user: User, order: Order) -> None:
    """توزیع کمیسیون از کارمزد معامله به دعوت‌کننده‌های VIP."""
    settings = db.query(PlatformSettings).first()
    if not settings or not settings.vip_commission_enabled:
        return

    if order.status != OrderStatus.COMPLETED:
        return

    if order.fee_afn <= 0:
        return

    # پیدا کردن دعوت‌کننده سطح ۱
    level1_referral = db.query(Referral).filter(
        Referral.referred_user_id == trading_user.id
    ).first()

    if not level1_referral:
        return

    # بررسی VIP بودن دعوت‌کننده
    referrer = db.query(User).get(level1_referral.referrer_id)
    if not referrer or not referrer.is_vip or referrer.vip_level < 1:
        return

    # درصد بر اساس سطح VIP
    commission_percent_map = {
        1: settings.vip_level1_commission_percent,
        2: settings.vip_level2_commission_percent,
        3: settings.vip_level3_commission_percent,
    }

    percent = commission_percent_map.get(referrer.vip_level, Decimal("0"))
    if percent <= 0:
        return

    commission_amount = (order.fee_afn * percent / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_DOWN
    )

    if commission_amount <= 0:
        return

    # ثبت earning
    earning = ReferralEarning(
        referrer_id=referrer.id,
        trading_user_id=trading_user.id,
        order_id=order.id,
        level=1,
        order_fee_afn=order.fee_afn,
        commission_percent=percent,
        commission_amount=commission_amount,
        currency=Currency.AFN,
        is_paid=True,
    )
    db.add(earning)

    # اضافه به wallet دعوت‌کننده
    wallet = db.query(Wallet).filter(
        Wallet.user_id == referrer.id,
        Wallet.currency == Currency.AFN,
    ).first()

    if wallet:
        wallet.balance += commission_amount

    logger.info(
        f"VIP commission distributed: referrer={referrer.id} "
        f"(VIP{referrer.vip_level}) amount={commission_amount} AFN "
        f"from order={order.id}"
    )


# ═══════════════════════════════════════
#           اطلاعات رفرال کاربر
# ═══════════════════════════════════════


def get_referral_stats(db: Session, user: User) -> dict:
    """آمار رفرال کاربر."""
    referral_code = get_or_create_referral_code(db, user)

    referrals = db.query(Referral).filter(
        Referral.referrer_id == user.id
    ).all()

    total_referrals = len(referrals)
    released_count = sum(1 for r in referrals if r.bonus_status == "released")
    locked_count = sum(1 for r in referrals if r.bonus_status == "locked")

    total_earned = sum(
        (r.bonus_amount for r in referrals if r.bonus_status == "released"),
        Decimal("0"),
    )
    locked_amount = sum(
        (r.bonus_amount for r in referrals if r.bonus_status == "locked"),
        Decimal("0"),
    )

    commission_rows = db.query(ReferralEarning.commission_amount).filter(
        ReferralEarning.referrer_id == user.id
    ).all()
    commission_sum = sum((row[0] for row in commission_rows), Decimal("0"))

    return {
        "code": referral_code.code,
        "clicks": referral_code.clicks,
        "signups": referral_code.signups,
        "total_referrals": total_referrals,
        "released_count": released_count,
        "locked_count": locked_count,
        "total_earned": float(total_earned),
        "locked_amount": float(locked_amount),
        "total_commission": float(commission_sum),
    }


def get_referrals_list(db: Session, user: User) -> list[dict]:
    """لیست دعوت‌شده‌ها با جزئیات."""
    referrals = db.query(Referral).filter(
        Referral.referrer_id == user.id
    ).order_by(Referral.created_at.desc()).all()

    result = []
    for r in referrals:
        referred_user = db.query(User).get(r.referred_user_id)
        if not referred_user:
            continue

        result.append({
            "id": r.id,
            "referred_user_name": referred_user.full_name
            or referred_user.email.split("@")[0],
            "registered_at": r.registered_at.isoformat()
            if r.registered_at
            else None,
            "kyc_completed": r.kyc_completed_at is not None,
            "first_trade_done": r.first_trade_at is not None,
            "bonus_amount": float(r.bonus_amount),
            "bonus_status": r.bonus_status,
            "bonus_released_at": r.bonus_released_at.isoformat()
            if r.bonus_released_at
            else None,
        })

    return result