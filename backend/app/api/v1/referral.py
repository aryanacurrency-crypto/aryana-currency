from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import User
from app.schemas.referral import (
    ReferralItem,
    ReferralStats,
    ReferralValidateResponse,
)
from app.services import referral as referral_service

router = APIRouter(prefix="/referral", tags=["referral"])


@router.get("/validate/{code}", response_model=ReferralValidateResponse)
def validate_referral_code(code: str, db: Session = Depends(get_db)):
    """اعتبارسنجی کد رفرال (عمومی — برای فرم ثبت‌نام)."""
    return referral_service.validate_referral_code(db, code)


@router.get("/me", response_model=ReferralStats)
def get_my_referral_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """آمار رفرال کاربر فعلی."""
    return referral_service.get_referral_stats(db, current_user)


@router.get("/list", response_model=list[ReferralItem])
def get_my_referrals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """لیست دعوت‌شده‌های کاربر."""
    return referral_service.get_referrals_list(db, current_user)