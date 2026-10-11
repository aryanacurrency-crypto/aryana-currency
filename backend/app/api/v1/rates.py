from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models import Rate, User
from app.schemas.rate import RateCreate, RateRead

router = APIRouter(prefix="/rates", tags=["rates"])


@router.get("/current", response_model=RateRead)
def get_current_rate(db: Session = Depends(get_db)):
    """
    نرخ فعال فعلی.
    این endpoint عمومی هست — همه میتونن ببینن.
    """
    rate = db.query(Rate).filter(Rate.is_active == True).order_by(Rate.created_at.desc()).first()  # noqa: E712
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="نرخ فعالی تنظیم نشده است",
        )
    return rate


@router.get("/history", response_model=list[RateRead])
def get_rate_history(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """تاریخچه نرخها (آخرین ۵۰ تا)."""
    if limit > 200:
        limit = 200
    return (
        db.query(Rate)
        .order_by(Rate.created_at.desc())
        .limit(limit)
        .all()
    )


@router.post("/", response_model=RateRead, status_code=status.HTTP_201_CREATED)
def set_new_rate(
    payload: RateCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    تنظیم نرخ جدید — فقط ادمین.
    نرخ قبلی غیرفعال میشه.
    """
    # چک منطقی: نرخ فروش باید بالاتر از نرخ خرید باشه
    if payload.sell_price_afn <= payload.buy_price_afn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نرخ فروش باید بزرگتر از نرخ خرید باشد",
        )

    # غیرفعال کردن نرخهای قبلی
    db.query(Rate).filter(Rate.is_active == True).update({Rate.is_active: False})  # noqa: E712

    # ساخت نرخ جدید
    rate = Rate(
        buy_price_afn=payload.buy_price_afn,
        sell_price_afn=payload.sell_price_afn,
        is_active=True,
        created_by=admin.id,
    )
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return rate