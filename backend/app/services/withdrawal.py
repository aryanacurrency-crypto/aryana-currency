import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User, Wallet, Withdrawal
from app.models.enums import Currency, LedgerDirection, WithdrawalStatus
from app.services import ledger as ledger_service


def generate_reference() -> str:
    """ساخت شماره برداشت مثل WDR-2026-A1B2C3."""
    year = datetime.now(timezone.utc).year
    short = uuid.uuid4().hex[:6].upper()
    return f"WDR-{year}-{short}"


def create_withdrawal(
    db: Session,
    user: User,
    currency: Currency,
    amount: Decimal,
    destination: str,
    destination_holder: str | None = None,
) -> Withdrawal:
    """
    ساخت درخواست برداشت.
    موجودی کاربر قفل میشه تا ادمین بررسی کنه.
    """
    # حداقل مقدار
    if currency == Currency.USDT and amount < Decimal("10"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حداقل برداشت تتر ۱۰ USDT است",
        )

    if currency == Currency.AFN and amount < Decimal("500"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حداقل برداشت افغانی ۵۰۰ AFN است",
        )

    # چک موجودی
    wallet = db.query(Wallet).filter(
        Wallet.user_id == user.id,
        Wallet.currency == currency,
    ).first()

    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کیف پول یافت نشد",
        )

    available = wallet.balance - wallet.locked_balance
    if available < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"موجودی کافی نیست. موجودی قابل استفاده: {available} {currency.value}",
        )

    # قفل کردن موجودی
    wallet.locked_balance += amount

    # ساخت درخواست
    withdrawal = Withdrawal(
        reference=generate_reference(),
        user_id=user.id,
        currency=currency,
        amount=amount,
        destination=destination,
        destination_holder=destination_holder,
        status=WithdrawalStatus.PENDING,
    )
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)
    return withdrawal


def complete_withdrawal(
    db: Session,
    withdrawal: Withdrawal,
    admin_user: User,
    platform_ref: str,
) -> Withdrawal:
    """
    تکمیل برداشت توسط ادمین.
    موجودی قفل‌شده کم میشه و از دفتر کل ثبت میشه.
    """
    if withdrawal.status != WithdrawalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"این درخواست در وضعیت {withdrawal.status.value} قابل تکمیل نیست",
        )

    wallet = db.query(Wallet).filter(
        Wallet.user_id == withdrawal.user_id,
        Wallet.currency == withdrawal.currency,
    ).first()

    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="کیف پول یافت نشد",
        )

    # کم کردن موجودی
    wallet.locked_balance -= withdrawal.amount
    wallet.balance -= withdrawal.amount

    # ثبت در دفتر کل
    tx_id = ledger_service.new_transaction_id()

    # کاربر ارز میده
    ledger_service.record_entry(
        db, tx_id,
        ledger_service.user_wallet_account(withdrawal.user_id),
        withdrawal.currency,
        LedgerDirection.DEBIT,
        withdrawal.amount,
        user_id=withdrawal.user_id,
        description=f"برداشت {withdrawal.currency.value}",
    )

    # پلتفرم ارز می‌ده (خارج)
    platform_account = (
        ledger_service.platform_usdt_account()
        if withdrawal.currency == Currency.USDT
        else ledger_service.platform_afn_account()
    )

    ledger_service.record_entry(
        db, tx_id,
        platform_account,
        withdrawal.currency,
        LedgerDirection.CREDIT,
        withdrawal.amount,
        description=f"پرداخت به کاربر بابت برداشت {withdrawal.reference}",
    )

    # چک توازن
    if not ledger_service.verify_balance(db, tx_id):
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="خطا در ثبت دفتر کل",
        )

    # آپدیت وضعیت
    withdrawal.status = WithdrawalStatus.COMPLETED
    withdrawal.platform_payment_reference = platform_ref
    withdrawal.reviewed_by = admin_user.id
    withdrawal.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(withdrawal)
    return withdrawal


def reject_withdrawal(
    db: Session,
    withdrawal: Withdrawal,
    admin_user: User,
    reason: str,
) -> Withdrawal:
    """رد درخواست برداشت — موجودی قفل باز میشه."""
    if withdrawal.status != WithdrawalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"این درخواست در وضعیت {withdrawal.status.value} قابل رد کردن نیست",
        )

    # باز کردن قفل
    wallet = db.query(Wallet).filter(
        Wallet.user_id == withdrawal.user_id,
        Wallet.currency == withdrawal.currency,
    ).first()

    if wallet:
        wallet.locked_balance -= withdrawal.amount

    withdrawal.status = WithdrawalStatus.REJECTED
    withdrawal.rejection_reason = reason
    withdrawal.reviewed_by = admin_user.id
    withdrawal.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(withdrawal)
    return withdrawal


def cancel_withdrawal(
    db: Session,
    withdrawal: Withdrawal,
) -> Withdrawal:
    """لغو درخواست برداشت توسط کاربر."""
    if withdrawal.status != WithdrawalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="فقط درخواست‌های در انتظار قابل لغو هستند",
        )

    # باز کردن قفل
    wallet = db.query(Wallet).filter(
        Wallet.user_id == withdrawal.user_id,
        Wallet.currency == withdrawal.currency,
    ).first()

    if wallet:
        wallet.locked_balance -= withdrawal.amount

    withdrawal.status = WithdrawalStatus.CANCELLED
    db.commit()
    db.refresh(withdrawal)
    return withdrawal