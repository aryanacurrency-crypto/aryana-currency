"""
Seed کردن داده‌های پیش‌فرض:
- Platform Settings (تنظیمات رفرال و VIP)
- Wheel Settings (تنظیمات گردونه)
- Wheel Prizes (۸ جایزه پیش‌فرض)
- Referral Codes (برای کاربرای موجود)
"""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import (
    PlatformSettings,
    ReferralCode,
    User,
    WheelPrize,
    WheelSettings,
)
from app.models.enums import Currency
from app.services.referral import generate_unique_code


def seed_platform_settings(db: Session) -> None:
    """ساخت تنظیمات پیش‌فرض پلتفرم (اگه نباشه)."""
    settings = db.query(PlatformSettings).first()

    if settings:
        print("✅ Platform Settings already exists, skipping...")
        return

    settings = PlatformSettings(
        referral_enabled=True,
        referral_bonus_amount=Decimal("15"),
        referral_bonus_currency=Currency.AFN,
        referral_requires_kyc=True,
        referral_requires_first_trade=True,
        referral_expiry_days=90,
        base_exchange_fee_percent=Decimal("1.5"),
        referral_level1_commission_percent=Decimal("20"),
        referral_level2_commission_percent=Decimal("5"),
        referral_level3_commission_percent=Decimal("2"),
        referral_max_levels=1,
        vip_commission_enabled=False,
        vip_level1_commission_percent=Decimal("10"),
        vip_level2_commission_percent=Decimal("15"),
        vip_level3_commission_percent=Decimal("20"),
        require_kyc_for_trade=True,
    )
    db.add(settings)
    db.commit()
    print("✅ Platform Settings created")


def seed_wheel_settings(db: Session) -> None:
    """ساخت تنظیمات پیش‌فرض گردونه."""
    settings = db.query(WheelSettings).first()

    if settings:
        print("✅ Wheel Settings already exists, skipping...")
        return

    settings = WheelSettings(
        is_enabled=True,
        ticket_price=Decimal("50"),
        ticket_currency=Currency.AFN,
        ticket_expiry_days=7,
        max_spins_per_day=10,
        min_spin_interval_seconds=5,
        ticket_on_signup_kyc=True,
        ticket_on_signup_kyc_count=1,
        ticket_on_successful_trade=True,
        ticket_on_successful_trade_count=1,
        ticket_purchase_enabled=True,
        animation_duration_seconds=Decimal("8.0"),
        near_jackpot_chance_percent=Decimal("30"),
        near_jackpot_offset_min=2,
        near_jackpot_offset_max=5,
        sound_enabled=True,
        require_admin_approval_above=Decimal("100"),
        max_big_prize_per_day=1,
    )
    db.add(settings)
    db.commit()
    print("✅ Wheel Settings created")


def seed_wheel_prizes(db: Session) -> None:
    """ساخت ۸ جایزه پیش‌فرض گردونه."""
    existing = db.query(WheelPrize).count()

    if existing > 0:
        print(f"✅ Wheel Prizes already exist ({existing}), skipping...")
        return

    prizes = [
        {
            "sort_order": 0,
            "prize_type": "cash",
            "label": "1000 AFN",
            "label_fa": "🏆 1000 افغانی",
            "label_ps": "🏆 1000 افغانی",
            "label_en": "🏆 1000 AFN",
            "icon": "🏆",
            "color": "#FFD700",
            "amount": Decimal("1000"),
            "currency": Currency.AFN,
            "probability_percent": Decimal("0.0000"),
        },
        {
            "sort_order": 1,
            "prize_type": "cash",
            "label": "100 AFN",
            "label_fa": "💎 100 افغانی",
            "label_ps": "💎 100 افغانی",
            "label_en": "💎 100 AFN",
            "icon": "💎",
            "color": "#9C27B0",
            "amount": Decimal("100"),
            "currency": Currency.AFN,
            "probability_percent": Decimal("0.0100"),
        },
        {
            "sort_order": 2,
            "prize_type": "cash",
            "label": "50 AFN",
            "label_fa": "💰 50 افغانی",
            "label_ps": "💰 50 افغانی",
            "label_en": "💰 50 AFN",
            "icon": "💰",
            "color": "#FF9800",
            "amount": Decimal("50"),
            "currency": Currency.AFN,
            "probability_percent": Decimal("10.0000"),
        },
        {
            "sort_order": 3,
            "prize_type": "cash",
            "label": "20 AFN",
            "label_fa": "💵 20 افغانی",
            "label_ps": "💵 20 افغانی",
            "label_en": "💵 20 AFN",
            "icon": "💵",
            "color": "#4CAF50",
            "amount": Decimal("20"),
            "currency": Currency.AFN,
            "probability_percent": Decimal("40.0000"),
        },
        {
            "sort_order": 4,
            "prize_type": "cash",
            "label": "10 AFN",
            "label_fa": "💴 10 افغانی",
            "label_ps": "💴 10 افغانی",
            "label_en": "💴 10 AFN",
            "icon": "💴",
            "color": "#2196F3",
            "amount": Decimal("10"),
            "currency": Currency.AFN,
            "probability_percent": Decimal("30.0000"),
        },
        {
            "sort_order": 5,
            "prize_type": "empty",
            "label": "خالی",
            "label_fa": "❌ خالی",
            "label_ps": "❌ خالی",
            "label_en": "❌ Empty",
            "icon": "❌",
            "color": "#9E9E9E",
            "amount": Decimal("0"),
            "currency": Currency.AFN,
            "probability_percent": Decimal("8.0000"),
        },
        {
            "sort_order": 6,
            "prize_type": "empty",
            "label": "خالی",
            "label_fa": "❌ خالی",
            "label_ps": "❌ خالی",
            "label_en": "❌ Empty",
            "icon": "❌",
            "color": "#757575",
            "amount": Decimal("0"),
            "currency": Currency.AFN,
            "probability_percent": Decimal("8.0000"),
        },
        {
            "sort_order": 7,
            "prize_type": "ticket",
            "label": "تیکت",
            "label_fa": "🎟️ تیکت رایگان",
            "label_ps": "🎟️ وړیا ټکټ",
            "label_en": "🎟️ Free Ticket",
            "icon": "🎟️",
            "color": "#F44336",
            "amount": Decimal("0"),
            "ticket_count": 1,
            "currency": Currency.AFN,
            "probability_percent": Decimal("3.9900"),
        },
    ]

    for p_data in prizes:
        prize = WheelPrize(**p_data)
        db.add(prize)

    db.commit()
    print(f"✅ Created {len(prizes)} wheel prizes")


def seed_referral_codes(db: Session) -> None:
    """ساخت کد رفرال برای کاربرای موجودی که ندارن."""
    users_without_code = db.query(User).filter(
        ~User.id.in_(
            db.query(ReferralCode.user_id)
        )
    ).all()

    if not users_without_code:
        print("✅ All users already have referral codes")
        return

    count = 0
    for user in users_without_code:
        base = ""
        if user.full_name:
            base = user.full_name.split()[0][:8]
        else:
            base = user.email.split("@")[0][:8]

        code = generate_unique_code(db, base)

        referral_code = ReferralCode(
            user_id=user.id,
            code=code,
        )
        db.add(referral_code)
        count += 1

    db.commit()
    print(f"✅ Created {count} referral codes")


def run_all_seeds() -> None:
    """اجرای تمام seedها."""
    print("🌱 Starting database seeding...\n")

    db = SessionLocal()
    try:
        seed_platform_settings(db)
        seed_wheel_settings(db)
        seed_wheel_prizes(db)
        seed_referral_codes(db)

        print("\n🎉 Seeding complete!")
    finally:
        db.close()


if __name__ == "__main__":
    run_all_seeds()