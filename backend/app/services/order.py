from datetime import datetime, timezone
from decimal import Decimal, ROUND_DOWN

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Order, Rate, User, Wallet
from app.models.enums import Currency, LedgerDirection, OrderSide, OrderStatus
from app.services import ledger as ledger_service


def generate_reference() -> str:
    """ساخت شماره سفارش مثل ARY-2026-000123."""
    year = datetime.now(timezone.utc).year
    import uuid
    short = uuid.uuid4().hex[:6].upper()
    return f"ARY-{year}-{short}"


def get_active_rate(db: Session) -> Rate:
    """آخرین نرخ فعال رو برمیگردونه. اگه نبود ارور میده."""
    rate = db.query(Rate).filter(Rate.is_active == True).order_by(Rate.created_at.desc()).first()  # noqa: E712
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="نرخ معاملات در حال حاضر تنظیم نشده است. لطفاً بعداً تلاش کنید.",
        )
    return rate


def calculate_order_amounts(
    side: OrderSide,
    amount_usdt: Decimal,
    rate: Rate,
) -> dict:
    """
    محاسبه مبالغ سفارش.

    BUY:  کاربر تتر میخره → از نرخ sell استفاده میکنیم (بالاتر)
    SELL: کاربر تتر میفروشه → از نرخ buy استفاده میکنیم (پایینتر)

    کارمزد پیش‌فرض ۱.۵٪ روی مبلغ افغانی اعمال میشه.
    """
    if side == OrderSide.BUY:
        rate_used = rate.sell_price_afn
    else:
        rate_used = rate.buy_price_afn

    gross_afn = (amount_usdt * rate_used).quantize(Decimal("0.01"), rounding=ROUND_DOWN)

    fee_percent = Decimal(str(settings.DEFAULT_FEE_PERCENT))
    fee_afn = (gross_afn * fee_percent / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_DOWN)

    if side == OrderSide.BUY:
        net_afn = gross_afn + fee_afn
    else:
        net_afn = gross_afn - fee_afn

    return {
        "rate_used": rate_used,
        "gross_afn": gross_afn,
        "fee_percent": fee_percent,
        "fee_afn": fee_afn,
        "net_afn": net_afn,
    }


def create_order(
    db: Session,
    user: User,
    side: OrderSide,
    amount_usdt: Decimal,
) -> Order:
    """ساخت سفارش جدید."""
    min_usdt = Decimal(str(settings.MIN_ORDER_USD))
    if amount_usdt < min_usdt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"حداقل مقدار سفارش {min_usdt} USDT است",
        )

    rate = get_active_rate(db)
    calc = calculate_order_amounts(side, amount_usdt, rate)

    if side == OrderSide.SELL:
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user.id,
            Wallet.currency == Currency.USDT,
        ).first()

        if not wallet or wallet.available_balance < amount_usdt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="موجودی تتر کافی نیست",
            )

    order = Order(
        reference=generate_reference(),
        user_id=user.id,
        side=side,
        amount_usdt=amount_usdt,
        rate_afn_per_usdt=calc["rate_used"],
        gross_afn=calc["gross_afn"],
        fee_percent=calc["fee_percent"],
        fee_afn=calc["fee_afn"],
        net_afn=calc["net_afn"],
        status=OrderStatus.PENDING,
        user_wallet_address_snapshot=user.usdt_wallet_address,
        user_hesab_pay_snapshot=user.hesab_pay_number,
    )
    db.add(order)

    if side == OrderSide.SELL:
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user.id,
            Wallet.currency == Currency.USDT,
        ).first()
        wallet.locked_balance += amount_usdt

    db.commit()
    db.refresh(order)
    return order


def complete_order(db: Session, order: Order, admin_user: User, platform_ref: str) -> Order:
    """
    تکمیل سفارش توسط ادمین.
    اینجا دفتر کل ثبت میشه، موجودیها آپدیت میشن، تیکت داده میشه،
    و کمیسیون VIP توزیع میشه.
    """
    if order.status not in (OrderStatus.PENDING, OrderStatus.AWAITING_REVIEW, OrderStatus.PROCESSING):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"سفارش در وضعیت {order.status} قابل تکمیل نیست",
        )

    tx_id = ledger_service.new_transaction_id()

    user_usdt_wallet = db.query(Wallet).filter(
        Wallet.user_id == order.user_id,
        Wallet.currency == Currency.USDT,
    ).first()

    user_afn_wallet = db.query(Wallet).filter(
        Wallet.user_id == order.user_id,
        Wallet.currency == Currency.AFN,
    ).first()

    if not user_usdt_wallet or not user_afn_wallet:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="کیف پول کاربر یافت نشد",
        )

    if order.side == OrderSide.BUY:
        # کاربر تتر میخره
        ledger_service.record_entry(
            db, tx_id, ledger_service.user_wallet_account(order.user_id),
            Currency.USDT, LedgerDirection.CREDIT, order.amount_usdt,
            user_id=order.user_id, order_id=order.id, description="دریافت تتر از خرید",
        )
        ledger_service.record_entry(
            db, tx_id, ledger_service.platform_usdt_account(),
            Currency.USDT, LedgerDirection.DEBIT, order.amount_usdt,
            order_id=order.id, description="ارسال تتر بابت خرید کاربر",
        )
        ledger_service.record_entry(
            db, tx_id, ledger_service.platform_afn_account(),
            Currency.AFN, LedgerDirection.CREDIT, order.net_afn,
            order_id=order.id, description="دریافت افغانی از خرید کاربر",
        )
        ledger_service.record_entry(
            db, tx_id, ledger_service.user_wallet_account(order.user_id),
            Currency.AFN, LedgerDirection.DEBIT, order.net_afn,
            user_id=order.user_id, order_id=order.id, description="پرداخت افغانی بابت خرید",
        )

        user_usdt_wallet.balance += order.amount_usdt

    else:  # SELL
        ledger_service.record_entry(
            db, tx_id, ledger_service.platform_usdt_account(),
            Currency.USDT, LedgerDirection.CREDIT, order.amount_usdt,
            order_id=order.id, description="دریافت تتر از فروش کاربر",
        )
        ledger_service.record_entry(
            db, tx_id, ledger_service.user_wallet_account(order.user_id),
            Currency.USDT, LedgerDirection.DEBIT, order.amount_usdt,
            user_id=order.user_id, order_id=order.id, description="پرداخت تتر بابت فروش",
        )
        ledger_service.record_entry(
            db, tx_id, ledger_service.platform_afn_account(),
            Currency.AFN, LedgerDirection.DEBIT, order.net_afn,
            order_id=order.id, description="ارسال افغانی بابت فروش کاربر",
        )
        ledger_service.record_entry(
            db, tx_id, ledger_service.user_wallet_account(order.user_id),
            Currency.AFN, LedgerDirection.CREDIT, order.net_afn,
            user_id=order.user_id, order_id=order.id, description="دریافت افغانی از فروش",
        )

        user_usdt_wallet.locked_balance -= order.amount_usdt
        user_usdt_wallet.balance -= order.amount_usdt
        user_afn_wallet.balance += order.net_afn

    # چک توازن
    if not ledger_service.verify_balance(db, tx_id):
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="خطا در ثبت دفتر کل — تراکنش لغو شد",
        )

    # آپدیت سفارش
    order.status = OrderStatus.COMPLETED
    order.platform_payment_reference = platform_ref
    order.reviewed_by = admin_user.id
    order.reviewed_at = datetime.now(timezone.utc)

    db.flush()  # برای اینکه order.status نهایی بشه

    # ═══════════════════════════════════════════
    # 🎁 اعطای تیکت گردونه
    # ═══════════════════════════════════════════
    try:
        from app.services import wheel as wheel_service
        user = db.query(User).get(order.user_id)
        if user:
            wheel_service.give_trade_ticket(db, user, order.id)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Wheel ticket failed: {e}")

    # ═══════════════════════════════════════════
    # 💰 توزیع کمیسیون VIP و آزادسازی پاداش رفرال
    # ═══════════════════════════════════════════
    try:
        from app.services import referral as referral_service
        user = db.query(User).get(order.user_id)
        if user:
            referral_service.on_first_successful_trade(db, user, order)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Referral commission failed: {e}")

    db.commit()
    db.refresh(order)
    return order


def cancel_order(db: Session, order: Order) -> Order:
    """لغو سفارش توسط کاربر (فقط در حالت PENDING)."""
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="فقط سفارشهای در انتظار پرداخت قابل لغو هستند",
        )

    if order.side == OrderSide.SELL:
        wallet = db.query(Wallet).filter(
            Wallet.user_id == order.user_id,
            Wallet.currency == Currency.USDT,
        ).first()
        if wallet:
            wallet.locked_balance -= order.amount_usdt

    order.status = OrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    return order