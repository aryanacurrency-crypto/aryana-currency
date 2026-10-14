"""
سرویس معاملات مستقیم (Traders By Traders).

منطق کسب‌وکار:
- محاسبه کمیسیون پله‌ای
- Escrow (قفل دارایی طرفین)
- تسویه نهایی
- مدیریت سفارش‌ها
- سیستم اعتبار
"""

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_DOWN

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    DirectTradeAd,
    DirectTradeOrder,
    User,
    UserReputation,
    Wallet,
)
from app.models.enums import (
    Currency,
    DirectTradeAdSide,
    DirectTradeAdStatus,
    DirectTradeOrderStatus,
    LedgerDirection,
)
from app.services import ledger as ledger_service


# ═══════════════════════════════════════════════════════
#                    CONSTANTS
# ═══════════════════════════════════════════════════════

ORDER_EXPIRY_MINUTES = 15
MIN_AD_AMOUNT_USDT = Decimal("10")
MAX_AD_AMOUNT_USDT = Decimal("100000")


# ═══════════════════════════════════════════════════════
#               Reference Generator
# ═══════════════════════════════════════════════════════


def generate_order_reference() -> str:
    """ساخت شماره سفارش مثل DT-2026-A1B2C3."""
    year = datetime.now(timezone.utc).year
    short = uuid.uuid4().hex[:6].upper()
    return f"DT-{year}-{short}"


# ═══════════════════════════════════════════════════════
#               Fee Calculation
# ═══════════════════════════════════════════════════════


def calculate_fee_percent(amount_usdt: Decimal) -> Decimal:
    """
    محاسبه درصد کمیسیون بر اساس پله‌ای.

    - تا 100 USDT: 1.50%
    - 100 تا 500: 1.25%
    - بالای 500: 1.00%
    """
    if amount_usdt <= Decimal("100"):
        return Decimal("1.500")
    elif amount_usdt <= Decimal("500"):
        return Decimal("1.250")
    else:
        return Decimal("1.000")


def calculate_trade(
    amount_usdt: Decimal,
    rate_afn_per_usdt: Decimal,
) -> dict:
    """
    محاسبه تمام مبالغ معامله.

    Args:
        amount_usdt: مقدار تتر درخواستی خریدار
        rate_afn_per_usdt: نرخ (AFN per USDT)

    Returns:
        dict با تمام مبالغ محاسبه‌شده
    """
    if amount_usdt <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="مقدار باید بیشتر از صفر باشد",
        )

    if rate_afn_per_usdt <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نرخ باید بیشتر از صفر باشد",
        )

    # درصد کمیسیون (یکسان برای خریدار و فروشنده)
    fee_percent = calculate_fee_percent(amount_usdt)

    # --- سمت فروشنده ---
    # کمیسیون فروشنده به تتر
    seller_fee_usdt = (amount_usdt * fee_percent / Decimal("100")).quantize(
        Decimal("0.00000001"), rounding=ROUND_DOWN
    )

    # تتر خالص به خریدار (amount - seller_fee)
    buyer_receives_usdt = amount_usdt - seller_fee_usdt

    # --- سمت خریدار ---
    # مبلغ پایه (AFN) = تتر خالص × نرخ
    base_amount_afn = (buyer_receives_usdt * rate_afn_per_usdt).quantize(
        Decimal("0.0001"), rounding=ROUND_DOWN
    )

    # کمیسیون خریدار به AFN
    buyer_fee_afn = (base_amount_afn * fee_percent / Decimal("100")).quantize(
        Decimal("0.0001"), rounding=ROUND_DOWN
    )

    # مبلغ کل قابل پرداخت خریدار
    total_payment_afn = base_amount_afn + buyer_fee_afn

    # مبلغ دریافتی فروشنده
    seller_receives_afn = base_amount_afn

    return {
        "amount_usdt": amount_usdt,
        "rate_afn_per_usdt": rate_afn_per_usdt,
        "fee_percent": fee_percent,
        "seller_fee_usdt": seller_fee_usdt,
        "buyer_receives_usdt": buyer_receives_usdt,
        "base_amount_afn": base_amount_afn,
        "buyer_fee_afn": buyer_fee_afn,
        "total_payment_afn": total_payment_afn,
        "seller_receives_afn": seller_receives_afn,
    }


# ═══════════════════════════════════════════════════════
#               Reputation
# ═══════════════════════════════════════════════════════


def get_or_create_reputation(db: Session, user_id: int) -> UserReputation:
    """گرفتن یا ساخت رکورد اعتبار کاربر."""
    rep = db.query(UserReputation).filter(
        UserReputation.user_id == user_id
    ).first()

    if not rep:
        rep = UserReputation(user_id=user_id)
        db.add(rep)
        db.flush()

    return rep


def recalculate_trust_score(rep: UserReputation) -> int:
    """
    محاسبه Trust Score (0-100).

    فرمول:
    - پایه: 50
    - +5 به ازای هر معامله موفق (حداکثر +30)
    - -20 به ازای هر اختلاف باخته
    - -10 به ازای هر لغو بعد پرداخت
    - +10 اگر verified
    - 0 اگر blocked
    """
    if rep.is_blocked:
        return 0

    score = 50

    # پاداش معاملات موفق
    completed_bonus = min(rep.completed_trades * 5, 30)
    score += completed_bonus

    # جریمه اختلافات
    score -= rep.disputed_trades * 20

    # جریمه لغوها
    score -= rep.cancelled_trades * 10

    # پاداش verify
    if rep.is_verified:
        score += 10

    # محدود به 0-100
    return max(0, min(100, score))


def update_reputation_on_complete(db: Session, user_id: int) -> None:
    """آپدیت اعتبار بعد از معامله موفق."""
    rep = get_or_create_reputation(db, user_id)
    rep.total_trades += 1
    rep.completed_trades += 1
    rep.trust_score = recalculate_trust_score(rep)


def update_reputation_on_cancel(db: Session, user_id: int) -> None:
    """آپدیت اعتبار بعد از لغو."""
    rep = get_or_create_reputation(db, user_id)
    rep.total_trades += 1
    rep.cancelled_trades += 1
    rep.trust_score = recalculate_trust_score(rep)


# ═══════════════════════════════════════════════════════
#                   AD — Create
# ═══════════════════════════════════════════════════════


def create_ad(
    db: Session,
    seller: User,
    side: DirectTradeAdSide,
    total_amount: Decimal,
    rate_afn_per_usdt: Decimal,
    min_order_usdt: Decimal,
    max_order_usdt: Decimal,
    payment_method: str = "Hesab Pay",
    terms: str | None = None,
) -> DirectTradeAd:
    """
    ساخت آگهی فروش تتر.
    تتر فروشنده بلافاصله قفل می‌شود.
    """
    # اعتبارسنجی مقدار
    if total_amount < MIN_AD_AMOUNT_USDT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"حداقل مقدار آگهی {MIN_AD_AMOUNT_USDT} تتر است",
        )

    if total_amount > MAX_AD_AMOUNT_USDT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"حداکثر مقدار آگهی {MAX_AD_AMOUNT_USDT} تتر است",
        )

    # اعتبارسنجی محدودیت‌ها
    if min_order_usdt <= 0 or min_order_usdt > total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حداقل سفارش نامعتبر است",
        )

    if max_order_usdt < min_order_usdt or max_order_usdt > total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حداکثر سفارش نامعتبر است",
        )

    if rate_afn_per_usdt <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نرخ نامعتبر است",
        )

    # چک موجودی تتر فروشنده
    wallet = db.query(Wallet).filter(
        Wallet.user_id == seller.id,
        Wallet.currency == Currency.USDT,
    ).first()

    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کیف پول تتر یافت نشد",
        )

    available = wallet.balance - wallet.locked_balance
    if available < total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"موجودی کافی نیست. موجودی قابل استفاده: {available} USDT",
        )

    # قفل کردن تتر
    wallet.locked_balance += total_amount

    # ساخت آگهی
    ad = DirectTradeAd(
        seller_id=seller.id,
        side=side,
        total_amount=total_amount,
        available_amount=total_amount,
        locked_amount=Decimal("0"),
        rate_afn_per_usdt=rate_afn_per_usdt,
        min_order_usdt=min_order_usdt,
        max_order_usdt=max_order_usdt,
        payment_method=payment_method,
        terms=terms,
        status=DirectTradeAdStatus.ACTIVE,
    )
    db.add(ad)

    # اطمینان از وجود رکورد اعتبار
    get_or_create_reputation(db, seller.id)

    db.commit()
    db.refresh(ad)
    return ad


# ═══════════════════════════════════════════════════════
#                   AD — Cancel
# ═══════════════════════════════════════════════════════


def cancel_ad(db: Session, ad: DirectTradeAd, seller: User) -> DirectTradeAd:
    """
    لغو آگهی توسط فروشنده.
    تتر قفل‌شده آزاد می‌شود.
    """
    if ad.seller_id != seller.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="شما صاحب این آگهی نیستید",
        )

    if ad.status not in (DirectTradeAdStatus.ACTIVE, DirectTradeAdStatus.PAUSED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"آگهی در وضعیت {ad.status.value} قابل لغو نیست",
        )

    # چک سفارش فعال
    active_orders = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.ad_id == ad.id,
        DirectTradeOrder.status.in_([
            DirectTradeOrderStatus.PENDING_PAYMENT,
            DirectTradeOrderStatus.PAYMENT_REVIEW,
            DirectTradeOrderStatus.READY_TO_RELEASE,
            DirectTradeOrderStatus.DISPUTED,
        ]),
    ).count()

    if active_orders > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"این آگهی {active_orders} سفارش فعال دارد و قابل لغو نیست",
        )

    # آزاد کردن تتر باقی‌مانده
    wallet = db.query(Wallet).filter(
        Wallet.user_id == ad.seller_id,
        Wallet.currency == Currency.USDT,
    ).first()

    if wallet:
        wallet.locked_balance -= ad.available_amount

    ad.status = DirectTradeAdStatus.CANCELLED
    db.commit()
    db.refresh(ad)
    return ad


# ═══════════════════════════════════════════════════════
#                   ORDER — Create
# ═══════════════════════════════════════════════════════


def create_order(
    db: Session,
    buyer: User,
    ad_id: int,
    amount_usdt: Decimal,
) -> DirectTradeOrder:
    """
    ساخت سفارش جدید توسط خریدار.

    - اعتبارسنجی مقدار
    - قفل تتر از آگهی فروشنده
    - محاسبه مبالغ
    """
    # گرفتن آگهی
    ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == ad_id).first()

    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="آگهی یافت نشد",
        )

    if ad.status != DirectTradeAdStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این آگهی فعال نیست",
        )

    # چک خود-معامله
    if ad.seller_id == buyer.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="شما نمی‌توانید با آگهی خودتان معامله کنید",
        )

    # اعتبارسنجی مقدار
    if amount_usdt < ad.min_order_usdt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"حداقل مقدار سفارش {ad.min_order_usdt} تتر است",
        )

    if amount_usdt > ad.max_order_usdt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"حداکثر مقدار سفارش {ad.max_order_usdt} تتر است",
        )

    # چک موجودی آگهی
    remaining = ad.available_amount - ad.locked_amount
    if amount_usdt > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"موجودی آگهی کافی نیست. قابل خرید: {remaining} USDT",
        )

    # محاسبه مبالغ
    calc = calculate_trade(amount_usdt, ad.rate_afn_per_usdt)

    # قفل تتر از آگهی
    ad.locked_amount += amount_usdt

    # ساخت سفارش
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=ORDER_EXPIRY_MINUTES)

    order = DirectTradeOrder(
        reference=generate_order_reference(),
        ad_id=ad.id,
        buyer_id=buyer.id,
        seller_id=ad.seller_id,
        amount_usdt=calc["amount_usdt"],
        rate_afn_per_usdt=calc["rate_afn_per_usdt"],
        seller_fee_percent=calc["fee_percent"],
        buyer_fee_percent=calc["fee_percent"],
        seller_fee_usdt=calc["seller_fee_usdt"],
        buyer_receives_usdt=calc["buyer_receives_usdt"],
        base_amount_afn=calc["base_amount_afn"],
        buyer_fee_afn=calc["buyer_fee_afn"],
        total_payment_afn=calc["total_payment_afn"],
        seller_receives_afn=calc["seller_receives_afn"],
        status=DirectTradeOrderStatus.PENDING_PAYMENT,
        expires_at=expires_at,
    )
    db.add(order)

    # اطمینان از وجود رکورد اعتبار دو طرف
    get_or_create_reputation(db, buyer.id)
    get_or_create_reputation(db, ad.seller_id)

    db.commit()
    db.refresh(order)
    return order


# ═══════════════════════════════════════════════════════
#                   ORDER — Submit Payment
# ═══════════════════════════════════════════════════════


def submit_payment(
    db: Session,
    order: DirectTradeOrder,
    buyer: User,
    payment_reference: str,
    payment_proof: str | None = None,
    note: str | None = None,
) -> DirectTradeOrder:
    """خریدار رسید پرداخت را ثبت می‌کند."""
    if order.buyer_id != buyer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="این سفارش متعلق به شما نیست",
        )

    if order.status != DirectTradeOrderStatus.PENDING_PAYMENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"سفارش در وضعیت {order.status.value} قابل ویرایش نیست",
        )

    # چک انقضا
    now = datetime.now(timezone.utc)
    expires = order.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if now > expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="مهلت پرداخت این سفارش به پایان رسیده است",
        )

    order.buyer_payment_reference = payment_reference
    order.buyer_payment_proof = payment_proof
    order.buyer_note = note
    order.status = DirectTradeOrderStatus.PAYMENT_REVIEW
    order.paid_at = now

    db.commit()
    db.refresh(order)
    return order


# ═══════════════════════════════════════════════════════
#           ORDER — Complete (Release Escrow)
# ═══════════════════════════════════════════════════════


def complete_order(
    db: Session,
    order: DirectTradeOrder,
    admin_user: User,
    admin_note: str | None = None,
) -> DirectTradeOrder:
    """
    تکمیل سفارش و آزادسازی Escrow.

    انتقال‌ها:
    1. تتر از فروشنده → خریدار
    2. کمیسیون فروشنده → ARYANA (USDT)
    3. AFN از ARYANA به فروشنده
    4. کمیسیون خریدار → ARYANA (AFN)
    """
    if order.status not in (
        DirectTradeOrderStatus.PAYMENT_REVIEW,
        DirectTradeOrderStatus.READY_TO_RELEASE,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"سفارش در وضعیت {order.status.value} قابل تکمیل نیست",
        )

    ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == order.ad_id).first()
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="آگهی مرتبط یافت نشد",
        )

    # --- کیف پول فروشنده ---
    seller_wallet = db.query(Wallet).filter(
        Wallet.user_id == order.seller_id,
        Wallet.currency == Currency.USDT,
    ).first()

    if not seller_wallet:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="کیف پول تتر فروشنده یافت نشد",
        )

    # --- کیف پول خریدار ---
    buyer_wallet = db.query(Wallet).filter(
        Wallet.user_id == order.buyer_id,
        Wallet.currency == Currency.USDT,
    ).first()

    if not buyer_wallet:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="کیف پول تتر خریدار یافت نشد",
        )

    # 1. انتقال تتر
    seller_wallet.locked_balance -= order.amount_usdt
    seller_wallet.balance -= order.amount_usdt
    buyer_wallet.balance += order.buyer_receives_usdt

    # 2. آپدیت آگهی
    ad.locked_amount -= order.amount_usdt
    ad.available_amount -= order.amount_usdt
    ad.total_trades += 1
    ad.completed_trades += 1

    if ad.available_amount <= 0:
        ad.status = DirectTradeAdStatus.COMPLETED

    # 3. ثبت در دفتر کل
    tx_id = ledger_service.new_transaction_id()

    # فروشنده تتر می‌ده
    ledger_service.record_entry(
        db, tx_id,
        ledger_service.user_wallet_account(order.seller_id),
        Currency.USDT,
        LedgerDirection.DEBIT,
        order.amount_usdt,
        user_id=order.seller_id,
        description=f"فروش تتر در معامله {order.reference}",
    )

    # خریدار تتر می‌گیرد
    ledger_service.record_entry(
        db, tx_id,
        ledger_service.user_wallet_account(order.buyer_id),
        Currency.USDT,
        LedgerDirection.CREDIT,
        order.buyer_receives_usdt,
        user_id=order.buyer_id,
        description=f"خرید تتر در معامله {order.reference}",
    )

    # کمیسیون فروشنده به پلتفرم (USDT)
    if order.seller_fee_usdt > 0:
        ledger_service.record_entry(
            db, tx_id,
            ledger_service.platform_usdt_account(),
            Currency.USDT,
            LedgerDirection.CREDIT,
            order.seller_fee_usdt,
            description=f"کمیسیون فروشنده — {order.reference}",
        )

    # چک توازن USDT
    if not ledger_service.verify_balance(db, tx_id):
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="خطا در توازن دفتر کل تتر",
        )

    # 4. آپدیت اعتبار
    update_reputation_on_complete(db, order.buyer_id)
    update_reputation_on_complete(db, order.seller_id)

    # 5. آپدیت سفارش
    order.status = DirectTradeOrderStatus.COMPLETED
    order.reviewed_by = admin_user.id
    order.reviewed_at = datetime.now(timezone.utc)
    order.admin_note = admin_note
    order.released_by = admin_user.id
    order.released_at = datetime.now(timezone.utc)
    order.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)
    return order


# ═══════════════════════════════════════════════════════
#                   ORDER — Cancel
# ═══════════════════════════════════════════════════════


def cancel_order(
    db: Session,
    order: DirectTradeOrder,
    user: User,
    reason: str | None = None,
) -> DirectTradeOrder:
    """
    لغو سفارش توسط خریدار یا فروشنده.
    تتر قفل‌شده آزاد می‌شود.
    """
    if order.buyer_id != user.id and order.seller_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="شما به این سفارش دسترسی ندارید",
        )

    if order.status not in (
        DirectTradeOrderStatus.PENDING_PAYMENT,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"سفارش در وضعیت {order.status.value} قابل لغو نیست",
        )

    # آزاد کردن قفل آگهی
    ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == order.ad_id).first()
    if ad:
        ad.locked_amount -= order.amount_usdt

    # آپدیت اعتبار
    update_reputation_on_cancel(db, user.id)

    order.status = DirectTradeOrderStatus.CANCELLED
    order.admin_note = reason

    db.commit()
    db.refresh(order)
    return order


# ═══════════════════════════════════════════════════════
#                   ORDER — Expire Stale
# ═══════════════════════════════════════════════════════


def expire_stale_orders(db: Session) -> int:
    """
    منقضی کردن سفارش‌های PENDING_PAYMENT که تایمرشون تموم شده.
    تتر قفل‌شده آزاد می‌شود.
    """
    now = datetime.now(timezone.utc)

    stale = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.status == DirectTradeOrderStatus.PENDING_PAYMENT,
        DirectTradeOrder.expires_at < now,
    ).all()

    count = 0
    for order in stale:
        ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == order.ad_id).first()
        if ad:
            ad.locked_amount -= order.amount_usdt

        order.status = DirectTradeOrderStatus.EXPIRED
        count += 1

    if count > 0:
        db.commit()

    return count


# ═══════════════════════════════════════════════════════
#                   ORDER — Dispute
# ═══════════════════════════════════════════════════════


def open_dispute(
    db: Session,
    order: DirectTradeOrder,
    user: User,
    reason: str,
) -> DirectTradeOrder:
    """باز کردن اختلاف توسط خریدار یا فروشنده."""
    if order.buyer_id != user.id and order.seller_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="شما به این سفارش دسترسی ندارید",
        )

    if order.status not in (
        DirectTradeOrderStatus.PAYMENT_REVIEW,
        DirectTradeOrderStatus.READY_TO_RELEASE,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"در وضعیت {order.status.value} امکان باز کردن اختلاف نیست",
        )

    order.status = DirectTradeOrderStatus.DISPUTED
    order.dispute_reason = reason
    order.dispute_opened_by = user.id
    order.dispute_opened_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)
    return order


def resolve_dispute(
    db: Session,
    order: DirectTradeOrder,
    admin_user: User,
    decision: str,
    admin_note: str,
) -> DirectTradeOrder:
    """
    حل اختلاف توسط ادمین.
    decision: BUYER یا SELLER
    """
    if order.status != DirectTradeOrderStatus.DISPUTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این سفارش در وضعیت اختلاف نیست",
        )

    if decision not in ("BUYER", "SELLER"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="تصمیم باید BUYER یا SELLER باشد",
        )

    ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == order.ad_id).first()
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="آگهی یافت نشد",
        )

    seller_wallet = db.query(Wallet).filter(
        Wallet.user_id == order.seller_id,
        Wallet.currency == Currency.USDT,
    ).first()

    buyer_wallet = db.query(Wallet).filter(
        Wallet.user_id == order.buyer_id,
        Wallet.currency == Currency.USDT,
    ).first()

    if not seller_wallet or not buyer_wallet:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="کیف پول یافت نشد",
        )

    if decision == "BUYER":
        seller_wallet.locked_balance -= order.amount_usdt
        seller_wallet.balance -= order.amount_usdt
        buyer_wallet.balance += order.buyer_receives_usdt
    else:
        seller_wallet.locked_balance -= order.amount_usdt

    ad.locked_amount -= order.amount_usdt

    if decision == "BUYER":
        ad.available_amount -= order.amount_usdt
        ad.total_trades += 1
        update_reputation_on_complete(db, order.buyer_id)
        update_reputation_on_complete(db, order.seller_id)
    else:
        update_reputation_on_cancel(db, order.buyer_id)

    order.status = DirectTradeOrderStatus.COMPLETED
    order.dispute_resolved_by = admin_user.id
    order.dispute_resolved_at = datetime.now(timezone.utc)
    order.dispute_decision = decision
    order.admin_note = admin_note
    order.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)
    return order


# ═══════════════════════════════════════════════════════
#                   Query Helpers
# ═══════════════════════════════════════════════════════


def get_active_ads(
    db: Session,
    side: DirectTradeAdSide | None = None,
    min_amount: Decimal | None = None,
    max_amount: Decimal | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[DirectTradeAd]:
    """گرفتن آگهی‌های فعال با فیلتر."""
    query = db.query(DirectTradeAd).filter(
        DirectTradeAd.status == DirectTradeAdStatus.ACTIVE,
        DirectTradeAd.available_amount > DirectTradeAd.locked_amount,
    )

    if side:
        query = query.filter(DirectTradeAd.side == side)

    if min_amount:
        query = query.filter(DirectTradeAd.available_amount >= min_amount)

    if max_amount:
        query = query.filter(DirectTradeAd.available_amount <= max_amount)

    return (
        query.order_by(DirectTradeAd.rate_afn_per_usdt.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def get_ad_stats(db: Session) -> dict:
    """آمار کلی Direct Trade."""
    total_ads = db.query(func.count(DirectTradeAd.id)).scalar() or 0

    active_ads = db.query(func.count(DirectTradeAd.id)).filter(
        DirectTradeAd.status == DirectTradeAdStatus.ACTIVE
    ).scalar() or 0

    total_orders = db.query(func.count(DirectTradeOrder.id)).scalar() or 0

    completed_orders = db.query(func.count(DirectTradeOrder.id)).filter(
        DirectTradeOrder.status == DirectTradeOrderStatus.COMPLETED
    ).scalar() or 0

    total_volume_usdt = db.query(
        func.coalesce(func.sum(DirectTradeOrder.amount_usdt), Decimal("0"))
    ).filter(
        DirectTradeOrder.status == DirectTradeOrderStatus.COMPLETED
    ).scalar() or Decimal("0")

    total_volume_afn = db.query(
        func.coalesce(func.sum(DirectTradeOrder.total_payment_afn), Decimal("0"))
    ).filter(
        DirectTradeOrder.status == DirectTradeOrderStatus.COMPLETED
    ).scalar() or Decimal("0")

    return {
        "total_ads": total_ads,
        "active_ads": active_ads,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_volume_usdt": total_volume_usdt,
        "total_volume_afn": total_volume_afn,
    }