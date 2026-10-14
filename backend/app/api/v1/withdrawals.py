from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.database import get_db
from app.core.telegram import notify_new_withdrawal
from app.models import User, Withdrawal
from app.models.enums import WithdrawalStatus
from app.schemas.withdrawal import (
    WithdrawalComplete,
    WithdrawalCreate,
    WithdrawalRead,
    WithdrawalReject,
)
from app.services import withdrawal as withdrawal_service

router = APIRouter(prefix="/withdrawals", tags=["withdrawals"])


# ═══════════════════════════════════════
#              کاربر
# ═══════════════════════════════════════


@router.post("/", response_model=WithdrawalRead, status_code=status.HTTP_201_CREATED)
def create_withdrawal_request(
    payload: WithdrawalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ساخت درخواست برداشت."""
    w = withdrawal_service.create_withdrawal(
        db=db,
        user=current_user,
        currency=payload.currency,
        amount=payload.amount,
        destination=payload.destination,
        destination_holder=payload.destination_holder,
    )

    # ─── اعلان تلگرام ───
    try:
        notify_new_withdrawal(w, current_user)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Telegram notify failed: {e}")

    return w


@router.get("/my", response_model=list[WithdrawalRead])
def list_my_withdrawals(
    status_filter: WithdrawalStatus | None = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """لیست درخواست‌های برداشت کاربر."""
    query = db.query(Withdrawal).filter(Withdrawal.user_id == current_user.id)
    if status_filter:
        query = query.filter(Withdrawal.status == status_filter)
    return query.order_by(Withdrawal.created_at.desc()).limit(limit).all()


@router.get("/my/{withdrawal_id}", response_model=WithdrawalRead)
def get_my_withdrawal(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """جزئیات یک درخواست برداشت."""
    w = db.query(Withdrawal).filter(
        Withdrawal.id == withdrawal_id,
        Withdrawal.user_id == current_user.id,
    ).first()
    if not w:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست برداشت یافت نشد",
        )
    return w


@router.post("/my/{withdrawal_id}/cancel", response_model=WithdrawalRead)
def cancel_my_withdrawal(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """لغو درخواست برداشت (فقط در حالت PENDING)."""
    w = db.query(Withdrawal).filter(
        Withdrawal.id == withdrawal_id,
        Withdrawal.user_id == current_user.id,
    ).first()
    if not w:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست برداشت یافت نشد",
        )
    return withdrawal_service.cancel_withdrawal(db, w)


# ═══════════════════════════════════════
#              ادمین
# ═══════════════════════════════════════


@router.get("/admin/all", response_model=list[WithdrawalRead])
def admin_list_withdrawals(
    status_filter: WithdrawalStatus | None = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """لیست همه درخواست‌های برداشت."""
    query = db.query(Withdrawal)
    if status_filter:
        query = query.filter(Withdrawal.status == status_filter)
    return query.order_by(Withdrawal.created_at.desc()).limit(limit).all()


@router.get("/admin/pending", response_model=list[WithdrawalRead])
def admin_list_pending(
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """لیست درخواست‌های در انتظار."""
    return (
        db.query(Withdrawal)
        .filter(Withdrawal.status == WithdrawalStatus.PENDING)
        .order_by(Withdrawal.created_at.asc())
        .limit(limit)
        .all()
    )


# ⚠️ این باید قبل از /admin/{withdrawal_id} باشه
@router.get("/admin/stats")
def admin_withdrawal_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """آمار برداشت‌ها."""
    from sqlalchemy import func

    total = db.query(func.count(Withdrawal.id)).scalar()
    pending = db.query(func.count(Withdrawal.id)).filter(
        Withdrawal.status == WithdrawalStatus.PENDING
    ).scalar()
    completed = db.query(func.count(Withdrawal.id)).filter(
        Withdrawal.status == WithdrawalStatus.COMPLETED
    ).scalar()
    rejected = db.query(func.count(Withdrawal.id)).filter(
        Withdrawal.status == WithdrawalStatus.REJECTED
    ).scalar()

    return {
        "total": total,
        "pending": pending,
        "completed": completed,
        "rejected": rejected,
    }


# ⚠️ این باید بعد از /admin/stats باشه
@router.get("/admin/{withdrawal_id}", response_model=WithdrawalRead)
def admin_get_withdrawal(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """جزئیات یک درخواست برداشت."""
    w = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not w:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست برداشت یافت نشد",
        )
    return w


@router.post("/admin/{withdrawal_id}/complete", response_model=WithdrawalRead)
def admin_complete_withdrawal(
    withdrawal_id: int,
    payload: WithdrawalComplete,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """تکمیل درخواست برداشت."""
    w = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not w:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست برداشت یافت نشد",
        )

    w.admin_note = payload.admin_note
    return withdrawal_service.complete_withdrawal(
        db=db,
        withdrawal=w,
        admin_user=admin,
        platform_ref=payload.platform_payment_reference,
    )


@router.post("/admin/{withdrawal_id}/reject", response_model=WithdrawalRead)
def admin_reject_withdrawal(
    withdrawal_id: int,
    payload: WithdrawalReject,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """رد درخواست برداشت."""
    w = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not w:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست برداشت یافت نشد",
        )
    return withdrawal_service.reject_withdrawal(db, w, admin, payload.reason)