from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import User, WheelPrize, WheelSpin, WheelTicket
from app.schemas.wheel import (
    WheelSpinResponse,
    WheelStatusResponse,
    WheelTicketRead,
)
from app.services import wheel as wheel_service

router = APIRouter(prefix="/wheel", tags=["wheel"])


@router.get("/status", response_model=WheelStatusResponse)
def get_wheel_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """وضعیت گردونه و جایزه‌ها."""
    settings = wheel_service.get_wheel_settings(db)

    prizes = db.query(WheelPrize).filter(
        WheelPrize.is_active == True  # noqa: E712
    ).order_by(WheelPrize.sort_order).all()

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    today_spins = db.query(WheelSpin).filter(
        WheelSpin.user_id == current_user.id,
        WheelSpin.created_at >= today_start,
    ).count()

    return {
        "is_enabled": settings.is_enabled,
        "ticket_price": float(settings.ticket_price),
        "ticket_currency": settings.ticket_currency.value,
        "ticket_expiry_days": settings.ticket_expiry_days,
        "available_tickets": current_user.available_tickets,
        "max_spins_per_day": settings.max_spins_per_day,
        "today_spins": today_spins,
        "prizes": prizes,
    }


@router.post("/spin", response_model=WheelSpinResponse)
def spin(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """چرخش گردونه."""
    result = wheel_service.spin_wheel(
        db=db,
        user=current_user,
        ip_address=request.client.host if request.client else None,
        device_info=request.headers.get("user-agent"),
    )
    db.commit()
    return result


@router.get("/tickets", response_model=list[WheelTicketRead])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """لیست تیکت‌های کاربر."""
    return db.query(WheelTicket).filter(
        WheelTicket.user_id == current_user.id
    ).order_by(WheelTicket.created_at.desc()).limit(50).all()


@router.post("/buy-ticket")
def buy_ticket(
    count: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """خرید تیکت."""
    tickets = wheel_service.buy_ticket(db, current_user, count)
    db.commit()

    return {
        "success": True,
        "tickets_created": len(tickets),
        "available_tickets": current_user.available_tickets,
    }