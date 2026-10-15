"""
API ادمین برای مدیریت گردونه شانس.
"""
import json
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models import (
    User,
    WheelAuditLog,
    WheelPrize,
    WheelSpin,
    WheelTicket,
)
from app.services.wheel import get_wheel_settings

router = APIRouter(prefix="/wheel", tags=["admin-wheel"])


# ═══════════════════════════════════════
#              Schemas
# ═══════════════════════════════════════


class WheelSettingsUpdate(BaseModel):
    is_enabled: bool | None = None
    ticket_price: Decimal | None = None
    ticket_expiry_days: int | None = None
    max_spins_per_day: int | None = None
    min_spin_interval_seconds: int | None = None
    ticket_on_signup_kyc: bool | None = None
    ticket_on_signup_kyc_count: int | None = None
    ticket_on_successful_trade: bool | None = None
    ticket_on_successful_trade_count: int | None = None
    ticket_purchase_enabled: bool | None = None
    animation_duration_seconds: Decimal | None = None
    near_jackpot_chance_percent: Decimal | None = None
    near_jackpot_offset_min: int | None = None
    near_jackpot_offset_max: int | None = None
    sound_enabled: bool | None = None
    require_admin_approval_above: Decimal | None = None
    max_big_prize_per_day: int | None = None


class WheelPrizeCreate(BaseModel):
    sort_order: int = 0
    prize_type: str
    label: str
    label_fa: str | None = None
    label_ps: str | None = None
    label_en: str | None = None
    icon: str | None = None
    color: str
    amount: Decimal = Decimal("0")
    currency: str = "AFN"
    ticket_count: int = 0
    probability_percent: Decimal = Decimal("0")
    is_active: bool = True
    max_wins_per_day: int | None = None
    max_wins_per_user: int | None = None
    requires_kyc: bool = False
    requires_deposit: bool = False
    min_wallet_balance: Decimal | None = None


class WheelPrizeUpdate(BaseModel):
    sort_order: int | None = None
    prize_type: str | None = None
    label: str | None = None
    label_fa: str | None = None
    label_ps: str | None = None
    label_en: str | None = None
    icon: str | None = None
    color: str | None = None
    amount: Decimal | None = None
    currency: str | None = None
    ticket_count: int | None = None
    probability_percent: Decimal | None = None
    is_active: bool | None = None
    max_wins_per_day: int | None = None
    max_wins_per_user: int | None = None
    requires_kyc: bool | None = None
    requires_deposit: bool | None = None
    min_wallet_balance: Decimal | None = None


# ═══════════════════════════════════════
#       تنظیمات گردونه (Settings)
# ═══════════════════════════════════════


@router.get("/settings")
def get_admin_wheel_settings(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """دریافت تنظیمات گردونه."""
    settings = get_wheel_settings(db)

    return {
        "id": settings.id,
        "is_enabled": settings.is_enabled,
        "ticket_price": float(settings.ticket_price),
        "ticket_currency": settings.ticket_currency.value,
        "ticket_expiry_days": settings.ticket_expiry_days,
        "max_spins_per_day": settings.max_spins_per_day,
        "min_spin_interval_seconds": settings.min_spin_interval_seconds,
        "ticket_on_signup_kyc": settings.ticket_on_signup_kyc,
        "ticket_on_signup_kyc_count": settings.ticket_on_signup_kyc_count,
        "ticket_on_successful_trade": settings.ticket_on_successful_trade,
        "ticket_on_successful_trade_count": settings.ticket_on_successful_trade_count,
        "ticket_purchase_enabled": settings.ticket_purchase_enabled,
        "animation_duration_seconds": float(settings.animation_duration_seconds),
        "near_jackpot_chance_percent": float(settings.near_jackpot_chance_percent),
        "near_jackpot_offset_min": settings.near_jackpot_offset_min,
        "near_jackpot_offset_max": settings.near_jackpot_offset_max,
        "sound_enabled": settings.sound_enabled,
        "require_admin_approval_above": float(settings.require_admin_approval_above),
        "max_big_prize_per_day": settings.max_big_prize_per_day,
    }


@router.put("/settings")
def update_admin_wheel_settings(
    payload: WheelSettingsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """بروزرسانی تنظیمات گردونه."""
    settings = get_wheel_settings(db)

    old_value = {
        "is_enabled": settings.is_enabled,
        "ticket_price": float(settings.ticket_price),
        "max_spins_per_day": settings.max_spins_per_day,
    }

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(settings, field, value)

    settings.updated_by = admin.id

    log = WheelAuditLog(
        admin_id=admin.id,
        action="update_settings",
        target_type="wheel_settings",
        target_id=settings.id,
        old_value=json.dumps(old_value),
        new_value=json.dumps({k: str(v) for k, v in update_data.items()}),
    )
    db.add(log)

    db.commit()
    db.refresh(settings)

    return {"success": True, "message": "Settings updated"}


# ═══════════════════════════════════════
#       جایزه‌ها (Prizes CRUD)
# ═══════════════════════════════════════


@router.get("/prizes")
def list_prizes(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """لیست همه جایزه‌ها."""
    prizes = db.query(WheelPrize).order_by(WheelPrize.sort_order).all()

    total_prob = sum(float(p.probability_percent) for p in prizes if p.is_active)

    return {
        "prizes": [
            {
                "id": p.id,
                "sort_order": p.sort_order,
                "prize_type": p.prize_type,
                "label": p.label,
                "label_fa": p.label_fa,
                "label_ps": p.label_ps,
                "label_en": p.label_en,
                "icon": p.icon,
                "color": p.color,
                "amount": float(p.amount),
                "currency": p.currency.value,
                "ticket_count": p.ticket_count,
                "probability_percent": float(p.probability_percent),
                "is_active": p.is_active,
                "max_wins_per_day": p.max_wins_per_day,
                "max_wins_per_user": p.max_wins_per_user,
                "daily_win_count": p.daily_win_count,
                "requires_kyc": p.requires_kyc,
                "requires_deposit": p.requires_deposit,
            }
            for p in prizes
        ],
        "total_probability": total_prob,
        "total_active": sum(1 for p in prizes if p.is_active),
    }


@router.post("/prizes", status_code=status.HTTP_201_CREATED)
def create_prize(
    payload: WheelPrizeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """ساخت جایزه جدید."""
    from app.models.enums import Currency

    prize = WheelPrize(
        sort_order=payload.sort_order,
        prize_type=payload.prize_type,
        label=payload.label,
        label_fa=payload.label_fa,
        label_ps=payload.label_ps,
        label_en=payload.label_en,
        icon=payload.icon,
        color=payload.color,
        amount=payload.amount,
        currency=Currency(payload.currency),
        ticket_count=payload.ticket_count,
        probability_percent=payload.probability_percent,
        is_active=payload.is_active,
        max_wins_per_day=payload.max_wins_per_day,
        max_wins_per_user=payload.max_wins_per_user,
        requires_kyc=payload.requires_kyc,
        requires_deposit=payload.requires_deposit,
        min_wallet_balance=payload.min_wallet_balance,
        created_by=admin.id,
    )
    db.add(prize)
    db.commit()
    db.refresh(prize)

    return {"success": True, "id": prize.id, "message": "Prize created"}


@router.put("/prizes/{prize_id}")
def update_prize(
    prize_id: int,
    payload: WheelPrizeUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """بروزرسانی جایزه."""
    from app.models.enums import Currency

    prize = db.query(WheelPrize).filter(WheelPrize.id == prize_id).first()
    if not prize:
        raise HTTPException(404, "جایزه یافت نشد")

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "currency" and isinstance(value, str):
            value = Currency(value)
        setattr(prize, field, value)

    db.commit()
    db.refresh(prize)

    return {"success": True, "message": "Prize updated"}


@router.patch("/prizes/{prize_id}/toggle")
def toggle_prize(
    prize_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """فعال/غیرفعال کردن جایزه."""
    prize = db.query(WheelPrize).filter(WheelPrize.id == prize_id).first()
    if not prize:
        raise HTTPException(404, "جایزه یافت نشد")

    prize.is_active = not prize.is_active
    db.commit()

    return {"success": True, "is_active": prize.is_active}


@router.delete("/prizes/{prize_id}")
def delete_prize(
    prize_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """حذف جایزه."""
    prize = db.query(WheelPrize).filter(WheelPrize.id == prize_id).first()
    if not prize:
        raise HTTPException(404, "جایزه یافت نشد")

    total = db.query(func.count(WheelPrize.id)).scalar()
    if total <= 2:
        raise HTTPException(400, "حداقل ۲ جایزه باید باقی بماند")

    db.delete(prize)
    db.commit()

    return {"success": True, "message": "Prize deleted"}


# ═══════════════════════════════════════
#              آمار
# ═══════════════════════════════════════


@router.get("/stats")
def get_wheel_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """آمار کلی گردونه."""
    total_spins = db.query(func.count(WheelSpin.id)).scalar()
    total_tickets_sold = db.query(func.count(WheelTicket.id)).filter(
        WheelTicket.source == "purchase"
    ).scalar()

    total_paid_cash = db.query(
        func.coalesce(func.sum(WheelSpin.prize_amount), 0)
    ).filter(
        WheelSpin.result_type == "cash",
        WheelSpin.status == "completed",
    ).scalar()

    return {
        "total_spins": total_spins,
        "total_tickets_sold": total_tickets_sold,
        "total_paid_cash_afn": float(total_paid_cash or 0),
        "pending_approvals": db.query(func.count(WheelSpin.id)).filter(
            WheelSpin.status == "pending"
        ).scalar(),
    }