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

    # --- Security ---
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # --- Database ---
    DATABASE_URL: str

    # --- CORS ---
    BACKEND_CORS_ORIGINS: str = ""

    # --- Business Rules ---
    MIN_ORDER_USD: float = 10.0
    DEFAULT_FEE_PERCENT: float = 1.5

    # --- Platform Wallets (for payment instructions) ---
    PLATFORM_USDT_WALLET: str = ""
    PLATFORM_USDT_NETWORK: str = "TRC20"
    PLATFORM_HESAB_PAY: str = ""
    PLATFORM_HESAB_PAY_HOLDER: str = "ARYANA CURRENCY"

    @property
    def cors_origins_list(self) -> list[str]:
        """تبدیل رشته CORS به لیست."""
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


# یک نمونه global از تنظیمات
settings = Settings()