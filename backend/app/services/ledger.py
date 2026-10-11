import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import LedgerEntry
from app.models.enums import Currency, LedgerDirection


def new_transaction_id() -> str:
    """ساخت یه شناسه یکتا برای گروه تراکنش."""
    return f"TX-{uuid.uuid4().hex[:16].upper()}"


def record_entry(
    db: Session,
    transaction_id: str,
    account_type: str,
    currency: Currency,
    direction: LedgerDirection,
    amount: Decimal,
    user_id: int | None = None,
    order_id: int | None = None,
    description: str | None = None,
) -> LedgerEntry:
    """ثبت یه ردیف توی دفتر کل."""
    entry = LedgerEntry(
        transaction_id=transaction_id,
        user_id=user_id,
        account_type=account_type,
        currency=currency,
        direction=direction,
        amount=amount,
        order_id=order_id,
        description=description,
    )
    db.add(entry)
    return entry


def verify_balance(db: Session, transaction_id: str) -> bool:
    """
    چک میکنه جمع debit = جمع credit برای یه transaction.
    برای هر currency جداگانه چک میشه.
    """
    entries = db.query(LedgerEntry).filter(
        LedgerEntry.transaction_id == transaction_id
    ).all()

    # گروهبندی بر اساس ارز
    balances: dict[Currency, Decimal] = {}
    for e in entries:
        balances.setdefault(e.currency, Decimal("0"))
        if e.direction == LedgerDirection.DEBIT:
            balances[e.currency] += e.amount
        else:
            balances[e.currency] -= e.amount

    for currency, diff in balances.items():
        if diff != Decimal("0"):
            return False
    return True


# --- حسابهای استاندارد پلتفرم ---
def platform_usdt_account() -> str:
    """حساب کیف پول تتر پلتفرم (واقعی روی بلاکچین)."""
    return "platform_usdt_wallet"


def platform_afn_account() -> str:
    """حساب افغانی پلتفرم (روی Hesab Pay)."""
    return "platform_afn_wallet"


def platform_fee_account() -> str:
    """حساب درآمد کارمزد."""
    return "platform_fee_revenue"


def user_wallet_account(user_id: int) -> str:
    """حساب کیف پول کاربر."""
    return f"user_wallet_{user_id}"