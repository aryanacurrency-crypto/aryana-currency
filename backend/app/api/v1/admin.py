from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.core.settings_service import get_settings_row
from app.models import Order, User, Wallet
from app.models.enums import OrderStatus
from app.schemas.order import OrderRead
from app.schemas.settings import PlatformSettingsRead, PlatformSettingsUpdate
from app.schemas.user import UserRead

router = APIRouter(prefix="/admin", tags=["admin"])


# ═══════════════════════════════════════
#              کاربران
# ═══════════════════════════════════════


@router.get("/users", response_model=list[UserRead])
def list_users(
    search: str | None = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """لیست کاربران با امکان جستجو."""
    query = db.query(User)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (User.email.ilike(pattern)) | (User.full_name.ilike(pattern)) | (User.phone.ilike(pattern))
        )
    return query.order_by(User.created_at.desc()).limit(limit).all()


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """جزئیات یک کاربر."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد",
        )
    return user


@router.post("/users/{user_id}/toggle-active", response_model=UserRead)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """فعال/غیرفعال کردن کاربر."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد",
        )

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نمی‌توانید حساب خودتان را غیرفعال کنید",
        )

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/{user_id}/wallets")
def get_user_wallets(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """کیف پول‌های یک کاربر."""
    wallets = db.query(Wallet).filter(Wallet.user_id == user_id).all()
    return [
        {
            "currency": w.currency.value,
            "balance": str(w.balance),
            "locked_balance": str(w.locked_balance),
        }
        for w in wallets
    ]


# ═══════════════════════════════════════
#              تنظیمات پلتفرم
# ═══════════════════════════════════════


@router.get("/settings", response_model=PlatformSettingsRead)
def get_settings(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """گرفتن تنظیمات پلتفرم (فقط ادمین)."""
    return get_settings_row(db)


@router.patch("/settings", response_model=PlatformSettingsRead)
def update_settings(
    payload: PlatformSettingsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """آپدیت تنظیمات پلتفرم (فقط ادمین)."""
    row = get_settings_row(db)

    # فقط فیلدهایی که ارسال شدن رو آپدیت کن
    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(row, field, value)

    row.updated_by = admin.id
    db.commit()
    db.refresh(row)

    return row


# ═══════════════════════════════════════
#              آمار داشبورد
# ═══════════════════════════════════════


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """آمار کلی پلتفرم برای داشبورد ادمین."""
    total_users = db.query(func.count(User.id)).scalar()

    pending_orders = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.AWAITING_REVIEW
    ).scalar()

    completed_orders = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.COMPLETED
    ).scalar()

    total_orders = db.query(func.count(Order.id)).scalar()

    total_fees = (
        db.query(func.coalesce(func.sum(Order.fee_afn), 0))
        .filter(Order.status == OrderStatus.COMPLETED)
        .scalar()
    )

    total_usdt_traded = (
        db.query(func.coalesce(func.sum(Order.amount_usdt), 0))
        .filter(Order.status == OrderStatus.COMPLETED)
        .scalar()
    )

    return {
        "total_users": total_users,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "total_orders": total_orders,
        "total_fees_afn": str(total_fees),
        "total_usdt_traded": str(total_usdt_traded),
    }


# ═══════════════════════════════════════
#         سفارش‌های در انتظار
# ═══════════════════════════════════════


@router.get("/orders/pending", response_model=list[OrderRead])
def list_pending_orders(
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """سفارش‌های در انتظار تأیید."""
    return (
        db.query(Order)
        .filter(Order.status == OrderStatus.AWAITING_REVIEW)
        .order_by(Order.created_at.asc())
        .limit(limit)
        .all()
    )


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """جزئیات یک سفارش (ادمین)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سفارش یافت نشد",
        )
    return order