from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    تنظیمات کلی پروژه.
    مقادیر از فایل .env خونده میشن.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # --- App ---
    APP_NAME: str = "Aryana Currency"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # --- Frontend URL (برای لینک‌های ایمیل) ---
    FRONTEND_URL: str = "https://aryana-currency.vercel.app"

    # --- Security ---
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_EXPIRE_MINUTES: int = 15
    ALGORITHM: str = "HS256"

    # --- Database ---
    DATABASE_URL: str

    # --- CORS ---
    BACKEND_CORS_ORIGINS: str = ""

    # --- Business Rules ---
    MIN_ORDER_USD: float = 10.0
    DEFAULT_FEE_PERCENT: float = 1.5

    # --- Platform Wallets ---
    PLATFORM_USDT_WALLET: str = ""
    PLATFORM_USDT_NETWORK: str = "TRC20"
    PLATFORM_HESAB_PAY: str = ""
    PLATFORM_HESAB_PAY_HOLDER: str = "ARYANA CURRENCY"

    # --- Brevo (برای ارسال ایمیل) ---
    BREVO_API_KEY: str = ""
    BREVO_FROM_EMAIL: str = "aryanaacurrency@gmail.com"
    SMTP_FROM_NAME: str = "Aryana Currency"

    # --- Telegram (اعلان‌های ادمین) ---
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # ═══════════════════════════════════════
    #   Referral — Fallback Defaults
    #   (مقادیر اصلی از دیتابیس خونده میشن)
    # ═══════════════════════════════════════
    DEFAULT_REFERRAL_BONUS_AFN: float = 15.0
    DEFAULT_REFERRAL_EXPIRY_DAYS: int = 90
    DEFAULT_REFERRAL_MAX_LEVELS: int = 1

    # ═══════════════════════════════════════
    #   Wheel — Fallback Defaults
    #   (مقادیر اصلی از دیتابیس خونده میشن)
    # ═══════════════════════════════════════
    DEFAULT_TICKET_PRICE_AFN: float = 50.0
    DEFAULT_TICKET_EXPIRY_DAYS: int = 7
    DEFAULT_MAX_SPINS_PER_DAY: int = 10

    @property
    def cors_origins_list(self) -> list[str]:
        """تبدیل رشته CORS به لیست."""
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


# یک نمونه global از تنظیمات
settings = Settings()