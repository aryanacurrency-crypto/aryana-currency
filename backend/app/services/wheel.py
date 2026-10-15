"""
سرویس گردونه شانس — منطق چرخش، تیکت، و جایزه.
"""
import logging
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import (
    User,
    Wallet,
    WheelPrize,
    WheelSettings,
    WheelSpin,
    WheelTicket,
)
from app.models.enums import Currency

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════
#         تنظیمات گردونه
# ═══════════════════════════════════════


def get_wheel_settings(db: Session) -> WheelSettings:
    """دریافت تنظیمات گردونه — اگه نبود، بساز."""
    settings = db.query(WheelSettings).first()

    if not settings:
        settings = WheelSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


# ═══════════════════════════════════════
#         اعطای تیکت
# ═══════════════════════════════════════


def give_tickets(
    db: Session,
    user_id: int,
    count: int,
    source: str,
    reference_id: int | None = None,
    price_paid: Decimal | None = None,
) -> list[WheelTicket]:
    """اعطای تیکت به کاربر."""
    if count <= 0:
        return []

    settings = get_wheel_settings(db)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=settings.ticket_expiry_days)

    tickets = []
    for _ in range(count):
        ticket = WheelTicket(
            user_id=user_id,
            source=source,
            reference_id=reference_id,
            price_paid=price_paid,
            currency=Currency.AFN,
            status="available",
            expires_at=expires_at,
        )
        db.add(ticket)
        tickets.append(ticket)

    user = db.query(User).get(user_id)
    if user:
        user.available_tickets += count

    db.flush()
    return tickets


def claim_signup_kyc_ticket(db: Session, user: User) -> bool:
    """اعطای تیکت ثبت‌نام + KYC (فقط یک‌بار)."""
    if user.signup_kyc_ticket_claimed:
        return False

    settings = get_wheel_settings(db)
    if not settings.ticket_on_signup_kyc:
        return False

    give_tickets(
        db=db,
        user_id=user.id,
        count=settings.ticket_on_signup_kyc_count,
        source="signup_kyc",
    )

    user.signup_kyc_ticket_claimed = True
    return True


def give_trade_ticket(db: Session, user: User, order_id: int) -> bool:
    """اعطای تیکت بعد از معامله موفق."""
    settings = get_wheel_settings(db)
    if not settings.ticket_on_successful_trade:
        return False

    give_tickets(
        db=db,
        user_id=user.id,
        count=settings.ticket_on_successful_trade_count,
        source="successful_trade",
        reference_id=order_id,
    )
    return True


# ═══════════════════════════════════════
#         خرید تیکت
# ═══════════════════════════════════════


def buy_ticket(db: Session, user: User, count: int = 1) -> list[WheelTicket]:
    """خرید تیکت با موجودی AFN."""
    settings = get_wheel_settings(db)

    if not settings.ticket_purchase_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="خرید تیکت در حال حاضر غیرفعال است",
        )

    if count < 1 or count > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="تعداد تیکت باید بین ۱ تا ۱۰ باشد",
        )

    total_price = settings.ticket_price * count

    wallet = db.query(Wallet).filter(
        Wallet.user_id == user.id,
        Wallet.currency == Currency.AFN,
    ).first()

    if not wallet or wallet.balance < total_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"موجودی افغانی کافی نیست. نیاز: {total_price} AFN",
        )

    wallet.balance -= total_price

    tickets = give_tickets(
        db=db,
        user_id=user.id,
        count=count,
        source="purchase",
        price_paid=settings.ticket_price,
    )

    return tickets


# ═══════════════════════════════════════
#         انتخاب برنده
# ═══════════════════════════════════════


def pick_winner(db: Session) -> WheelPrize:
    """انتخاب برنده بر اساس احتمال‌های ذخیره‌شده."""
    prizes = db.query(WheelPrize).filter(
        WheelPrize.is_active == True  # noqa: E712
    ).order_by(WheelPrize.sort_order).all()

    if not prizes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="هیچ جایزه فعالی تنظیم نشده است",
        )

    # فیلتر جایزه‌های رسیده به سقف روزانه
    eligible = []
    for prize in prizes:
        if prize.max_wins_per_day and prize.daily_win_count >= prize.max_wins_per_day:
            continue
        eligible.append(prize)

    if not eligible:
        empty = next((p for p in prizes if p.prize_type == "empty"), None)
        if empty:
            return empty
        return prizes[0]

    # نرمال‌سازی احتمال
    total_prob = sum(Decimal(str(p.probability_percent)) for p in eligible)

    if total_prob <= 0:
        return eligible[0]

    normalization = (
        Decimal("100") / total_prob if total_prob != 100 else Decimal("1")
    )

    rand_val = Decimal(secrets.randbelow(10_000_000)) / Decimal("100000")

    cumulative = Decimal("0")
    for prize in eligible:
        weighted = Decimal(str(prize.probability_percent)) * normalization
        cumulative += weighted
        if rand_val <= cumulative:
            return prize

    return eligible[-1]


# ═══════════════════════════════════════
#       محاسبه زاویه چرخش
# ═══════════════════════════════════════


def calculate_target_angle(
    db: Session, prize: WheelPrize, settings: WheelSettings
) -> Decimal:
    """محاسبه زاویه‌ی نهایی برای انیمیشن گردونه."""
    prizes = db.query(WheelPrize).filter(
        WheelPrize.is_active == True  # noqa: E712
    ).order_by(WheelPrize.sort_order).all()

    total_prizes = len(prizes)
    if total_prizes == 0:
        return Decimal("0")

    slice_angle = Decimal("360") / Decimal(total_prizes)
    start_angle = Decimal(prize.sort_order) * slice_angle
    end_angle = start_angle + slice_angle

    mid = (start_angle + end_angle) / Decimal("2")
    margin = slice_angle * Decimal("0.4")

    rand_offset = Decimal(secrets.randbelow(int(margin * 1000))) / Decimal("1000")
    target = mid - margin + rand_offset

    if _should_tease_jackpot(settings):
        jackpot = _find_jackpot_prize(prizes)
        if jackpot:
            jackpot_start = Decimal(jackpot.sort_order) * slice_angle
            offset_range = (
                settings.near_jackpot_offset_max
                - settings.near_jackpot_offset_min
                + 1
            )
            offset = Decimal(
                secrets.randbelow(offset_range)
                + settings.near_jackpot_offset_min
            )
            target = jackpot_start + offset

    return target


def _should_tease_jackpot(settings: WheelSettings) -> bool:
    """آیا این چرخش باید نزدیک بزرگ‌ترین جایزه رد بشه؟"""
    chance = Decimal(str(settings.near_jackpot_chance_percent))
    rand = Decimal(secrets.randbelow(10000)) / Decimal("100")
    return rand <= chance


def _find_jackpot_prize(prizes: list[WheelPrize]) -> WheelPrize | None:
    """بزرگ‌ترین جایزه نقدی رو پیدا کن."""
    cash_prizes = [p for p in prizes if p.prize_type == "cash"]
    if not cash_prizes:
        return None
    return max(cash_prizes, key=lambda p: p.amount)


# ═══════════════════════════════════════
#         چرخش اصلی
# ═══════════════════════════════════════


def spin_wheel(
    db: Session,
    user: User,
    ip_address: str | None = None,
    device_info: str | None = None,
) -> dict:
    """چرخش گردونه."""
    settings = get_wheel_settings(db)

    if not settings.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="گردونه موقتاً غیرفعال است",
        )

    # ─── چک تیکت ───
    ticket = db.query(WheelTicket).filter(
        WheelTicket.user_id == user.id,
        WheelTicket.status == "available",
    ).order_by(WheelTicket.created_at.asc()).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="تیکت قابل استفاده ندارید",
        )

    now = datetime.now(timezone.utc)

    # چک انقضای تیکت
    if ticket.expires_at:
        expires = ticket.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if now > expires:
            ticket.status = "expired"
            db.flush()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="تیکت شما منقضی شده است",
            )

    # ─── چک سقف روزانه ───
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_spins = db.query(WheelSpin).filter(
        WheelSpin.user_id == user.id,
        WheelSpin.created_at >= today_start,
    ).count()

    if today_spins >= settings.max_spins_per_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"حداکثر {settings.max_spins_per_day} چرخش در روز",
        )

    # ─── چک فاصله بین چرخش‌ها ───
    last_spin = db.query(WheelSpin).filter(
        WheelSpin.user_id == user.id
    ).order_by(WheelSpin.created_at.desc()).first()

    if last_spin:
        last_time = last_spin.created_at
        if last_time.tzinfo is None:
            last_time = last_time.replace(tzinfo=timezone.utc)
        diff = (now - last_time).total_seconds()
        if diff < settings.min_spin_interval_seconds:
            wait = settings.min_spin_interval_seconds - int(diff)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"لطفاً {wait} ثانیه صبر کنید",
            )

    # ─── انتخاب برنده ───
    prize = pick_winner(db)
    target_angle = calculate_target_angle(db, prize, settings)

    needs_approval = (
        prize.amount >= settings.require_admin_approval_above
        and prize.prize_type == "cash"
    )
    spin_status = "pending" if needs_approval else "completed"

    # ─── ثبت چرخش ───
    spin = WheelSpin(
        user_id=user.id,
        ticket_id=ticket.id,
        prize_id=prize.id,
        result_type=prize.prize_type,
        prize_amount=prize.amount,
        prize_currency=prize.currency,
        prize_ticket_count=prize.ticket_count,
        result_angle=target_angle,
        ip_address=ip_address,
        device_info=device_info,
        status=spin_status,
    )
    db.add(spin)

    # ─── مصرف تیکت ───
    ticket.status = "used"
    ticket.used_at = now
    user.available_tickets = max(0, user.available_tickets - 1)

    # ─── بروزرسانی شمارنده جایزه ───
    prize.daily_win_count += 1

    # ─── اعطای جایزه ───
    if not needs_approval:
        _grant_prize(db, user, prize)

    db.flush()

    return {
        "spin_id": spin.id,
        "target_angle": float(target_angle),
        "duration": float(settings.animation_duration_seconds),
        "result": {
            "type": prize.prize_type,
            "label": prize.label,
            "icon": prize.icon,
            "color": prize.color,
            "amount": float(prize.amount) if prize.amount else 0,
            "currency": prize.currency.value,
            "ticket_count": prize.ticket_count
            if prize.prize_type == "ticket"
            else 0,
        },
        "requires_approval": needs_approval,
    }


def _grant_prize(db: Session, user: User, prize: WheelPrize) -> None:
    """اعطای جایزه به کاربر."""
    if prize.prize_type == "cash" and prize.amount > 0:
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user.id,
            Wallet.currency == prize.currency,
        ).first()

        if wallet:
            wallet.balance += prize.amount

    elif prize.prize_type == "ticket" and prize.ticket_count > 0:
        give_tickets(
            db=db,
            user_id=user.id,
            count=prize.ticket_count,
            source="wheel_win",
        )