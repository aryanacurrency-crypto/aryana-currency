from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.enums import Currency


class WalletRead(BaseModel):
    """خروجی کیف پول کاربر."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    currency: Currency
    balance: Decimal
    locked_balance: Decimal

    @property
    def available_balance(self) -> Decimal:
        return self.balance - self.locked_balance


class WalletSummary(BaseModel):
    """خلاصه همه کیف پولهای کاربر."""
    afn: WalletRead
    usdt: WalletRead