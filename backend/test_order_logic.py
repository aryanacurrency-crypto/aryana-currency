"""
تست منطق سفارش — این فایل موقتیه، بعداً حذف میشه.
"""
from decimal import Decimal

from app.core.database import SessionLocal
from app.models import Rate, User
from app.models.enums import Currency, OrderSide
from app.services.order import calculate_order_amounts


def main():
    db = SessionLocal()
    try:
        # یه نرخ تستی بساز
        admin = db.query(User).filter(User.email == "admin@aryana.af").first()
        if not admin:
            print("❌ کاربر ادمین پیدا نشد. اول register کن.")
            return

        # غیرفعال کردن نرخهای قبلی
        db.query(Rate).update({Rate.is_active: False})
        db.flush()

        # نرخ جدید بساز
        rate = Rate(
            buy_price_afn=Decimal("69.00"),
            sell_price_afn=Decimal("70.50"),
            is_active=True,
            created_by=admin.id,
        )
        db.add(rate)
        db.commit()
        db.refresh(rate)

        print(f"✅ نرخ ساخته شد: buy={rate.buy_price_afn}, sell={rate.sell_price_afn}")
        print()

        # --- تست ۱: کاربر میخره ۱۰۰ تتر ---
        calc = calculate_order_amounts(
            side=OrderSide.BUY,
            amount_usdt=Decimal("100"),
            rate=rate,
        )
        print("🟢 تست ۱ — خرید ۱۰۰ تتر:")
        print(f"   نرخ استفاده‌شده: {calc['rate_used']} (باید 70.50 باشه)")
        print(f"   gross:  {calc['gross_afn']} AFN  (باید 7050.00 باشه)")
        print(f"   fee:    {calc['fee_afn']} AFN    (باید 105.75 باشه)")
        print(f"   net:    {calc['net_afn']} AFN    (باید 7155.75 باشه)")
        print()

        # --- تست ۲: کاربر میفروشه ۱۰۰ تتر ---
        calc = calculate_order_amounts(
            side=OrderSide.SELL,
            amount_usdt=Decimal("100"),
            rate=rate,
        )
        print("🔴 تست ۲ — فروش ۱۰۰ تتر:")
        print(f"   نرخ استفاده‌شده: {calc['rate_used']} (باید 69.00 باشه)")
        print(f"   gross:  {calc['gross_afn']} AFN  (باید 6900.00 باشه)")
        print(f"   fee:    {calc['fee_afn']} AFN    (باید 103.50 باشه)")
        print(f"   net:    {calc['net_afn']} AFN    (باید 6796.50 باشه)")
        print()

        # --- تست ۳: مقدار خیلی کوچیک ---
        try:
            from app.services.order import create_order
            from fastapi import HTTPException
            create_order(db, admin, OrderSide.BUY, Decimal("5"))
            print("❌ تست ۳ شکست خورد — سفارش ۵ دلاری نباید قبول شه")
        except Exception as e:
            if "حداقل" in str(e):
                print("✅ تست ۳ درست — سفارش زیر ۱۰ دلار رد شد")
            else:
                print(f"❌ تست ۳ ارور غیرمنتظره: {e}")
        print()

        print("🎉 همه تستها اجرا شدن. عددها رو با مقادیر داخل پرانتز چک کن.")

    finally:
        db.close()


if __name__ == "__main__":
    main()