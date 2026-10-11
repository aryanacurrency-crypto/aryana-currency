from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User, Wallet
from app.models.enums import Currency
from app.schemas.wallet import WalletRead, WalletSummary

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/", response_model=WalletSummary)
def get_my_wallets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    خلاصه کیف پول کاربر (AFN + USDT).
    """
    wallets = db.query(Wallet).filter(Wallet.user_id == current_user.id).all()

    afn_wallet = next((w for w in wallets if w.currency == Currency.AFN), None)
    usdt_wallet = next((w for w in wallets if w.currency == Currency.USDT), None)

    if not afn_wallet or not usdt_wallet:
        # این نباید اتفاق بیفته چون موقع ثبتنام هر دو کیف پول ساخته میشن
        # ولی برای احتیاط، اگه نبود میسازیم
        if not afn_wallet:
            afn_wallet = Wallet(user_id=current_user.id, currency=Currency.AFN)
            db.add(afn_wallet)
        if not usdt_wallet:
            usdt_wallet = Wallet(user_id=current_user.id, currency=Currency.USDT)
            db.add(usdt_wallet)
        db.commit()
        db.refresh(afn_wallet)
        db.refresh(usdt_wallet)

    return WalletSummary(afn=afn_wallet, usdt=usdt_wallet)


@router.get("/{currency}", response_model=WalletRead)
def get_single_wallet(
    currency: Currency,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """موجودی یه ارز خاص."""
    wallet = (
        db.query(Wallet)
        .filter(Wallet.user_id == current_user.id, Wallet.currency == currency)
        .first()
    )
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"کیف پول {currency.value} یافت نشد",
        )
    return wallet