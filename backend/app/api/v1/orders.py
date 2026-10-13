from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.database import get_db
from app.core.email import send_order_completed_email
from app.models import Order, User, Wallet
from app.models.enums import Currency, OrderSide, OrderStatus
from app.schemas.order import (
    OrderComplete,
    OrderCreate,
    OrderRead,
    OrderReject,
    OrderSubmitPayment,
)
from app.services import order as order_service

router = APIRouter(prefix="/orders", tags=["orders"])


# ═══════════════════════════════════════
#            کاربر عادی
# ═══════════════════════════════════════


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_new_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ساخت سفارش جدید (خرید یا فروش تتر).

    - BUY:  کاربر افغانی میده، تتر میگیره
    - SELL: کاربر تتر میده، افغانی میگیره
    """
    return order_service.create_order(
        db=db,
        user=current_user,
        side=payload.side,
        amount_usdt=payload.amount_usdt,
    )


@router.get("/my", response_model=list[OrderRead])
def list_my_orders(
    status_filter: OrderStatus | None = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """لیست سفارشهای کاربر فعلی."""
    query = db.query(Order).filter(Order.user_id == current_user.id)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    return query.order_by(Order.created_at.desc()).limit(limit).all()


@router.get("/my/{order_id}", response_model=OrderRead)
def get_my_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """جزئیات یک سفارش."""
    order = db.query(Order).filter(
        Order.id == order_id, Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سفارش یافت نشد",
        )
    return order


@router.post("/{order_id}/submit-payment", response_model=OrderRead)
def submit_payment(
    order_id: int,
    payload: OrderSubmitPayment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    کاربر بعد از واریز، شماره تراکنش رو ثبت میکنه.
    - BUY:  شماره تراکنش Hesab Pay
    - SELL: TXID تتر
    """
    order = db.query(Order).filter(
        Order.id == order_id, Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سفارش یافت نشد",
        )

    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"این سفارش در وضعیت {order.status} قابل ویرایش نیست",
        )

    order.user_payment_reference = payload.payment_reference
    order.user_note = payload.note
    order.status = OrderStatus.AWAITING_REVIEW

    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/cancel", response_model=OrderRead)
def cancel_my_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """لغو سفارش (فقط در حالت PENDING)."""
    order = db.query(Order).filter(
        Order.id == order_id, Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سفارش یافت نشد",
        )

    return order_service.cancel_order(db, order)


# ═══════════════════════════════════════
#              ادمین
# ═══════════════════════════════════════


@router.get("/admin/all", response_model=list[OrderRead])
def admin_list_orders(
    status_filter: OrderStatus | None = None,
    side: OrderSide | None = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """لیست همه سفارشها (فقط ادمین)."""
    query = db.query(Order)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    if side:
        query = query.filter(Order.side == side)
    return query.order_by(Order.created_at.desc()).limit(limit).all()


@router.post("/{order_id}/complete", response_model=OrderRead)
def admin_complete_order(
    order_id: int,
    payload: OrderComplete,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    تکمیل سفارش — ادمین تأیید میکنه که پول طرفین رد و بدل شده.
    دفتر کل و موجودی کاربر آپدیت میشه.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سفارش یافت نشد",
        )

    order.admin_note = payload.admin_note

    # ─── تکمیل سفارش ───
    completed_order = order_service.complete_order(
        db=db,
        order=order,
        admin_user=admin,
        platform_ref=payload.platform_payment_reference,
    )

    # ─── ارسال ایمیل تأیید تراکنش ───
    try:
        user = db.query(User).filter(User.id == completed_order.user_id).first()
        if user:
            # گرفتن side به صورت string
            side_value = (
                completed_order.side.value
                if hasattr(completed_order.side, "value")
                else str(completed_order.side)
            )

            send_order_completed_email(
                email=user.email,
                full_name=user.full_name,
                order_reference=completed_order.reference,
                side=side_value,
                amount_usdt=float(completed_order.amount_usdt),
                rate_afn=float(completed_order.rate_afn_per_usdt),
                total_afn=float(completed_order.gross_afn),
                fee_afn=float(completed_order.fee_afn),
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Order completed email failed: {e}")

    return completed_order


@router.post("/{order_id}/reject", response_model=OrderRead)
def admin_reject_order(
    order_id: int,
    payload: OrderReject,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """رد سفارش توسط ادمین (مثلاً اگه تراکنش جعلی باشه)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سفارش یافت نشد",
        )

    if order.status not in (OrderStatus.PENDING, OrderStatus.AWAITING_REVIEW):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"سفارش در وضعیت {order.status} قابل رد کردن نیست",
        )

    # اگه SELL بود، موجودی قفلشده رو باز کن
    if order.side == OrderSide.SELL:
        wallet = db.query(Wallet).filter(
            Wallet.user_id == order.user_id,
            Wallet.currency == Currency.USDT,
        ).first()
        if wallet:
            wallet.locked_balance -= order.amount_usdt

    order.status = OrderStatus.REJECTED
    order.admin_note = payload.reason
    order.reviewed_by = admin.id
    order.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)
    return order