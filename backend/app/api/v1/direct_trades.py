"""
API معاملات مستقیم (Traders By Traders).

Endpoints:
- Ads: ساخت، لیست، جزئیات، ویرایش، لغو
- Orders: ساخت، پرداخت، لغو، اختلاف
- Admin: تأیید، رد، حل اختلاف
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.database import get_db
from app.core.telegram import (
    notify_direct_trade_new_ad,
    notify_direct_trade_new_order,
    notify_direct_trade_payment_submitted,
    notify_direct_trade_completed,
    notify_direct_trade_dispute,
)
from app.models import DirectTradeAd, DirectTradeOrder, User, UserReputation
from app.models.enums import (
    DirectTradeAdSide,
    DirectTradeAdStatus,
    DirectTradeOrderStatus,
)
from app.schemas.direct_trade import (
    DirectTradeAdCreate,
    DirectTradeAdRead,
    DirectTradeAdUpdate,
    DirectTradeAdWithSeller,
    DirectTradeDisputeCreate,
    DirectTradeDisputeResolve,
    DirectTradeOrderCancel,
    DirectTradeOrderComplete,
    DirectTradeOrderCreate,
    DirectTradeOrderRead,
    DirectTradeOrderReject,
    DirectTradeOrderWithDetails,
    DirectTradePaymentSubmit,
    DirectTradeStats,
    UserReputationPublic,
    UserReputationRead,
)
from app.services import direct_trade as dt_service

router = APIRouter(prefix="/direct-trades", tags=["direct-trades"])


# ═══════════════════════════════════════════════════════
#                      ADS
# ═══════════════════════════════════════════════════════


@router.post(
    "/ads/",
    response_model=DirectTradeAdRead,
    status_code=status.HTTP_201_CREATED,
)
def create_ad(
    payload: DirectTradeAdCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ساخت آگهی فروش تتر."""
    ad = dt_service.create_ad(
        db=db,
        seller=current_user,
        side=payload.side,
        total_amount=payload.total_amount,
        rate_afn_per_usdt=payload.rate_afn_per_usdt,
        min_order_usdt=payload.min_order_usdt,
        max_order_usdt=payload.max_order_usdt,
        payment_method=payload.payment_method,
        terms=payload.terms,
    )

    try:
        notify_direct_trade_new_ad(ad, current_user)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Telegram notify failed: {e}")

    return ad


@router.get("/ads/", response_model=list[DirectTradeAdWithSeller])
def list_active_ads(
    side: DirectTradeAdSide | None = None,
    min_amount: Decimal | None = Query(default=None, gt=0),
    max_amount: Decimal | None = Query(default=None, gt=0),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """لیست آگهی‌های فعال با فیلتر."""
    ads = dt_service.get_active_ads(
        db=db,
        side=side,
        min_amount=min_amount,
        max_amount=max_amount,
        limit=limit,
        offset=offset,
    )

    result = []
    for ad in ads:
        seller = db.query(User).filter(User.id == ad.seller_id).first()
        rep = db.query(UserReputation).filter(
            UserReputation.user_id == ad.seller_id
        ).first()

        result.append(DirectTradeAdWithSeller(
            id=ad.id,
            side=ad.side,
            available_amount=ad.available_amount - ad.locked_amount,
            locked_amount=ad.locked_amount,
            rate_afn_per_usdt=ad.rate_afn_per_usdt,
            min_order_usdt=ad.min_order_usdt,
            max_order_usdt=ad.max_order_usdt,
            payment_method=ad.payment_method,
            terms=ad.terms,
            status=ad.status,
            total_trades=ad.total_trades or 0,
            completed_trades=ad.completed_trades or 0,
            created_at=ad.created_at,
            seller_full_name=seller.full_name if seller else None,
            seller_is_verified=seller.is_verified if seller else False,
            seller_trust_score=rep.trust_score if rep and rep.trust_score is not None else 50,
        ))

    return result


@router.get("/ads/my", response_model=list[DirectTradeAdRead])
def list_my_ads(
    status_filter: DirectTradeAdStatus | None = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """آگهی‌های من."""
    query = db.query(DirectTradeAd).filter(
        DirectTradeAd.seller_id == current_user.id
    )
    if status_filter:
        query = query.filter(DirectTradeAd.status == status_filter)
    return query.order_by(DirectTradeAd.created_at.desc()).limit(limit).all()


@router.get("/ads/{ad_id}", response_model=DirectTradeAdWithSeller)
def get_ad_detail(
    ad_id: int,
    db: Session = Depends(get_db),
):
    """جزئیات یک آگهی."""
    ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == ad_id).first()
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="آگهی یافت نشد",
        )

    seller = db.query(User).filter(User.id == ad.seller_id).first()
    rep = db.query(UserReputation).filter(
        UserReputation.user_id == ad.seller_id
    ).first()

    return DirectTradeAdWithSeller(
        id=ad.id,
        side=ad.side,
        available_amount=ad.available_amount - ad.locked_amount,
        locked_amount=ad.locked_amount,
        rate_afn_per_usdt=ad.rate_afn_per_usdt,
        min_order_usdt=ad.min_order_usdt,
        max_order_usdt=ad.max_order_usdt,
        payment_method=ad.payment_method,
        terms=ad.terms,
        status=ad.status,
        total_trades=ad.total_trades or 0,
        completed_trades=ad.completed_trades or 0,
        created_at=ad.created_at,
        seller_full_name=seller.full_name if seller else None,
        seller_is_verified=seller.is_verified if seller else False,
        seller_trust_score=rep.trust_score if rep and rep.trust_score is not None else 50,
    )


@router.patch("/ads/{ad_id}", response_model=DirectTradeAdRead)
def update_ad(
    ad_id: int,
    payload: DirectTradeAdUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ویرایش آگهی."""
    ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="آگهی یافت نشد")

    if ad.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="شما صاحب این آگهی نیستید")

    if ad.status != DirectTradeAdStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="فقط آگهی‌های فعال قابل ویرایش هستند")

    if payload.rate_afn_per_usdt is not None:
        if payload.rate_afn_per_usdt <= 0:
            raise HTTPException(status_code=400, detail="نرخ نامعتبر است")
        ad.rate_afn_per_usdt = payload.rate_afn_per_usdt

    if payload.min_order_usdt is not None:
        if payload.min_order_usdt <= 0:
            raise HTTPException(status_code=400, detail="حداقل سفارش نامعتبر است")
        ad.min_order_usdt = payload.min_order_usdt

    if payload.max_order_usdt is not None:
        if payload.max_order_usdt <= 0:
            raise HTTPException(status_code=400, detail="حداکثر سفارش نامعتبر است")
        ad.max_order_usdt = payload.max_order_usdt

    if payload.terms is not None:
        ad.terms = payload.terms

    if ad.max_order_usdt < ad.min_order_usdt:
        raise HTTPException(status_code=400, detail="حداکثر سفارش نمی‌تواند کمتر از حداقل باشد")

    db.commit()
    db.refresh(ad)
    return ad


@router.delete("/ads/{ad_id}", response_model=DirectTradeAdRead)
def cancel_ad(
    ad_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """لغو آگهی."""
    ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="آگهی یافت نشد")
    return dt_service.cancel_ad(db, ad, current_user)


# ═══════════════════════════════════════════════════════
#                     ORDERS
# ═══════════════════════════════════════════════════════


@router.post(
    "/orders/",
    response_model=DirectTradeOrderRead,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    payload: DirectTradeOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ساخت سفارش جدید."""
    order = dt_service.create_order(
        db=db,
        buyer=current_user,
        ad_id=payload.ad_id,
        amount_usdt=payload.amount_usdt,
    )

    try:
        notify_direct_trade_new_order(order, current_user)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Telegram notify failed: {e}")

    return order


@router.get("/orders/my", response_model=list[DirectTradeOrderRead])
def list_my_orders(
    status_filter: DirectTradeOrderStatus | None = None,
    role: str = Query(default="all", pattern="^(all|buyer|seller)$"),
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """سفارش‌های من (خریدار یا فروشنده)."""
    query = db.query(DirectTradeOrder)

    if role == "buyer":
        query = query.filter(DirectTradeOrder.buyer_id == current_user.id)
    elif role == "seller":
        query = query.filter(DirectTradeOrder.seller_id == current_user.id)
    else:
        from sqlalchemy import or_
        query = query.filter(
            or_(
                DirectTradeOrder.buyer_id == current_user.id,
                DirectTradeOrder.seller_id == current_user.id,
            )
        )

    if status_filter:
        query = query.filter(DirectTradeOrder.status == status_filter)

    return query.order_by(DirectTradeOrder.created_at.desc()).limit(limit).all()


@router.get("/orders/my/{order_id}", response_model=DirectTradeOrderWithDetails)
def get_my_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """جزئیات سفارش (فقط برای خریدار یا فروشنده)."""
    order = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")

    if order.buyer_id != current_user.id and order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="شما به این سفارش دسترسی ندارید")

    buyer = db.query(User).filter(User.id == order.buyer_id).first()
    buyer_rep = db.query(UserReputation).filter(
        UserReputation.user_id == order.buyer_id
    ).first()

    seller = db.query(User).filter(User.id == order.seller_id).first()
    seller_rep = db.query(UserReputation).filter(
        UserReputation.user_id == order.seller_id
    ).first()

    ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == order.ad_id).first()

    return DirectTradeOrderWithDetails(
        id=order.id,
        reference=order.reference,
        ad_id=order.ad_id,
        buyer_id=order.buyer_id,
        seller_id=order.seller_id,
        amount_usdt=order.amount_usdt,
        rate_afn_per_usdt=order.rate_afn_per_usdt,
        seller_fee_usdt=order.seller_fee_usdt,
        buyer_receives_usdt=order.buyer_receives_usdt,
        base_amount_afn=order.base_amount_afn,
        buyer_fee_afn=order.buyer_fee_afn,
        total_payment_afn=order.total_payment_afn,
        seller_receives_afn=order.seller_receives_afn,
        status=order.status,
        buyer_payment_reference=order.buyer_payment_reference,
        buyer_payment_proof=order.buyer_payment_proof,
        buyer_note=order.buyer_note,
        expires_at=order.expires_at,
        created_at=order.created_at,
        paid_at=order.paid_at,
        completed_at=order.completed_at,
        buyer_full_name=buyer.full_name if buyer else None,
        buyer_is_verified=buyer.is_verified if buyer else False,
        buyer_trust_score=buyer_rep.trust_score if buyer_rep and buyer_rep.trust_score is not None else 50,
        seller_full_name=seller.full_name if seller else None,
        seller_is_verified=seller.is_verified if seller else False,
        seller_trust_score=seller_rep.trust_score if seller_rep and seller_rep.trust_score is not None else 50,
        seller_payment_method=ad.payment_method if ad else None,
    )


@router.post("/orders/{order_id}/submit-payment", response_model=DirectTradeOrderRead)
def submit_payment(
    order_id: int,
    payload: DirectTradePaymentSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ارسال رسید پرداخت توسط خریدار."""
    order = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")

    order = dt_service.submit_payment(
        db=db,
        order=order,
        buyer=current_user,
        payment_reference=payload.payment_reference,
        payment_proof=payload.payment_proof,
        note=payload.note,
    )

    try:
        notify_direct_trade_payment_submitted(order, current_user)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Telegram notify failed: {e}")

    return order


@router.post("/orders/{order_id}/cancel", response_model=DirectTradeOrderRead)
def cancel_order(
    order_id: int,
    payload: DirectTradeOrderCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """لغو سفارش."""
    order = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")

    return dt_service.cancel_order(
        db=db,
        order=order,
        user=current_user,
        reason=payload.reason,
    )


@router.post("/orders/{order_id}/dispute", response_model=DirectTradeOrderRead)
def open_dispute(
    order_id: int,
    payload: DirectTradeDisputeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """باز کردن اختلاف."""
    order = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")

    order = dt_service.open_dispute(
        db=db,
        order=order,
        user=current_user,
        reason=payload.reason,
    )

    try:
        notify_direct_trade_dispute(order, current_user)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Telegram notify failed: {e}")

    return order


# ═══════════════════════════════════════════════════════
#                       STATS
# ═══════════════════════════════════════════════════════


@router.get("/stats", response_model=DirectTradeStats)
def get_stats(db: Session = Depends(get_db)):
    """آمار کلی معاملات مستقیم."""
    return dt_service.get_ad_stats(db)


@router.get("/reputation/{user_id}", response_model=UserReputationPublic)
def get_user_reputation(
    user_id: int,
    db: Session = Depends(get_db),
):
    """اطلاعات اعتبار کاربر."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    rep = db.query(UserReputation).filter(
        UserReputation.user_id == user_id
    ).first()

    return UserReputationPublic(
        user_id=user_id,
        full_name=user.full_name,
        trust_score=rep.trust_score if rep and rep.trust_score is not None else 50,
        completed_trades=rep.completed_trades if rep and rep.completed_trades is not None else 0,
        is_verified=user.is_verified,
        is_blocked=rep.is_blocked if rep and rep.is_blocked is not None else False,
    )


# ═══ این Endpoint رو کاملاً بازنویسی کردیم ═══
@router.get("/reputation/me")
def get_my_reputation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    اعتبار من — بدون response_model و بدون وابستگی به service.

    همه فیلدها با مقدار پیش‌فرض امن برگردانده می‌شن.
    حتی اگه رکورد در دیتابیس وجود نداشته باشه یا فیلدها None باشن،
    این تابع به‌صورت مستقیم مقادیر امن برمی‌گردونه.
    """
    try:
        rep = db.query(UserReputation).filter(
            UserReputation.user_id == current_user.id
        ).first()

        if not rep:
            rep = UserReputation(
                user_id=current_user.id,
                total_trades=0,
                completed_trades=0,
                cancelled_trades=0,
                disputed_trades=0,
                positive_ratings=0,
                negative_ratings=0,
                trust_score=50,
                avg_response_time=0,
                is_verified=False,
                is_blocked=False,
            )
            db.add(rep)
            db.commit()
            db.refresh(rep)

        return {
            "user_id": int(rep.user_id),
            "total_trades": int(rep.total_trades or 0),
            "completed_trades": int(rep.completed_trades or 0),
            "cancelled_trades": int(rep.cancelled_trades or 0),
            "disputed_trades": int(rep.disputed_trades or 0),
            "positive_ratings": int(rep.positive_ratings or 0),
            "negative_ratings": int(rep.negative_ratings or 0),
            "trust_score": int(rep.trust_score) if rep.trust_score is not None else 50,
            "avg_response_time": int(rep.avg_response_time or 0),
            "is_verified": bool(rep.is_verified),
            "is_blocked": bool(rep.is_blocked),
            "updated_at": str(rep.updated_at) if rep.updated_at else None,
        }

    except Exception as e:
        import traceback
        import logging
        logging.getLogger(__name__).error(
            f"get_my_reputation error:\n{traceback.format_exc()}"
        )

        # حتی در صورت خطا، مقادیر پیش‌فرض برمی‌گردونیم تا فرانت خراب نشه
        return {
            "user_id": int(current_user.id),
            "total_trades": 0,
            "completed_trades": 0,
            "cancelled_trades": 0,
            "disputed_trades": 0,
            "positive_ratings": 0,
            "negative_ratings": 0,
            "trust_score": 50,
            "avg_response_time": 0,
            "is_verified": False,
            "is_blocked": False,
            "updated_at": None,
        }


# ═══════════════════════════════════════════════════════
#                       ADMIN
# ═══════════════════════════════════════════════════════


@router.get("/admin/orders", response_model=list[DirectTradeOrderRead])
def admin_list_orders(
    status_filter: DirectTradeOrderStatus | None = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """لیست همه سفارش‌ها (ادمین)."""
    query = db.query(DirectTradeOrder)
    if status_filter:
        query = query.filter(DirectTradeOrder.status == status_filter)
    return query.order_by(DirectTradeOrder.created_at.desc()).limit(limit).all()


@router.get("/admin/orders/pending-review", response_model=list[DirectTradeOrderRead])
def admin_list_pending_review(
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """سفارش‌های در انتظار بررسی پرداخت."""
    return (
        db.query(DirectTradeOrder)
        .filter(DirectTradeOrder.status == DirectTradeOrderStatus.PAYMENT_REVIEW)
        .order_by(DirectTradeOrder.paid_at.asc())
        .limit(limit)
        .all()
    )


@router.get("/admin/orders/disputed", response_model=list[DirectTradeOrderRead])
def admin_list_disputed(
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """سفارش‌های دارای اختلاف."""
    return (
        db.query(DirectTradeOrder)
        .filter(DirectTradeOrder.status == DirectTradeOrderStatus.DISPUTED)
        .order_by(DirectTradeOrder.dispute_opened_at.asc())
        .limit(limit)
        .all()
    )


@router.get("/admin/orders/{order_id}", response_model=DirectTradeOrderRead)
def admin_get_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """جزئیات سفارش (ادمین)."""
    order = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")
    return order


@router.post("/admin/orders/{order_id}/complete", response_model=DirectTradeOrderRead)
def admin_complete_order(
    order_id: int,
    payload: DirectTradeOrderComplete,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """تأیید و تکمیل سفارش (آزادسازی Escrow)."""
    order = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")

    order = dt_service.complete_order(
        db=db,
        order=order,
        admin_user=admin,
        admin_note=payload.admin_note,
    )

    try:
        notify_direct_trade_completed(order)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Telegram notify failed: {e}")

    return order


@router.post("/admin/orders/{order_id}/reject", response_model=DirectTradeOrderRead)
def admin_reject_order(
    order_id: int,
    payload: DirectTradeOrderReject,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """رد سفارش."""
    order = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")

    ad = db.query(DirectTradeAd).filter(DirectTradeAd.id == order.ad_id).first()
    if ad:
        ad.locked_amount -= order.amount_usdt

    order.status = DirectTradeOrderStatus.CANCELLED
    order.reviewed_by = admin.id
    order.reviewed_at = dt_service.datetime.now(dt_service.timezone.utc)
    order.admin_note = payload.reason

    db.commit()
    db.refresh(order)
    return order


@router.post(
    "/admin/orders/{order_id}/resolve-dispute",
    response_model=DirectTradeOrderRead,
)
def admin_resolve_dispute(
    order_id: int,
    payload: DirectTradeDisputeResolve,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """حل اختلاف."""
    order = db.query(DirectTradeOrder).filter(
        DirectTradeOrder.id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")

    return dt_service.resolve_dispute(
        db=db,
        order=order,
        admin_user=admin,
        decision=payload.decision,
        admin_note=payload.admin_note,
    )


@router.post("/admin/expire-stale")
def admin_expire_stale(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """منقضی کردن سفارش‌های PENDING_PAYMENT که تایمرشون تموم شده."""
    count = dt_service.expire_stale_orders(db)
    return {"expired_count": count}