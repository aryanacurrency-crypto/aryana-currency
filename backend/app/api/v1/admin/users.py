"""
API ادمین برای مدیریت VIP کاربران.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models import Referral, User

router = APIRouter(prefix="/admin/users", tags=["admin-users-vip"])


class VIPUpdate(BaseModel):
    is_vip: bool
    vip_level: int = 1


@router.post("/{user_id}/vip")
def set_user_vip(
    user_id: int,
    payload: VIPUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """تعیین یا لغو VIP کاربر."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "کاربر یافت نشد")

    if payload.is_vip and payload.vip_level not in (1, 2, 3):
        raise HTTPException(400, "سطح VIP باید ۱، ۲، یا ۳ باشد")

    user.is_vip = payload.is_vip
    user.vip_level = payload.vip_level if payload.is_vip else 0
    user.vip_since = datetime.now(timezone.utc) if payload.is_vip else None

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "is_vip": user.is_vip,
        "vip_level": user.vip_level,
        "message": f"کاربر {'VIP شد' if payload.is_vip else 'VIP لغو شد'}",
    }


@router.get("/{user_id}/vip-info")
def get_user_vip_info(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """اطلاعات VIP و رفرال کاربر."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "کاربر یافت نشد")

    # تعداد زیرمجموعه‌های موفق
    total_referrals = db.query(Referral).filter(
        Referral.referrer_id == user_id
    ).count()

    released_referrals = db.query(Referral).filter(
        Referral.referrer_id == user_id,
        Referral.bonus_status == "released",
    ).count()

    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "is_vip": user.is_vip,
        "vip_level": user.vip_level,
        "vip_since": user.vip_since.isoformat() if user.vip_since else None,
        "total_referrals": total_referrals,
        "released_referrals": released_referrals,
        "available_tickets": user.available_tickets,
    }