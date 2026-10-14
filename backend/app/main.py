from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import admin as admin_router
from app.api.v1 import auth as auth_router
from app.api.v1 import direct_trades as direct_trades_router
from app.api.v1 import kyc as kyc_router
from app.api.v1 import orders as orders_router
from app.api.v1 import public as public_router
from app.api.v1 import rates as rates_router
from app.api.v1 import wallet as wallet_router
from app.api.v1 import withdrawals as withdrawals_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="0.1.0",
    description="صرافی دیجیتال آریانا — API",
)

# ═══════════════════════════════════════
#              CORS — همیشه فعال
# ═══════════════════════════════════════

# دامنه‌های پیش‌فرض (اگه Environment Variable نباشه، از اینا استفاده می‌شه)
DEFAULT_CORS_ORIGINS = [
    "https://aryana-currency.vercel.app",
    "https://www.aryana-currency.vercel.app",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://localhost:8000",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000",
]

# اگه توی .env یا Environment Variable ست شده باشه، از اون استفاده کن
cors_origins = settings.cors_origins_list or DEFAULT_CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

API_V1_PREFIX = "/api/v1"
app.include_router(auth_router.router, prefix=API_V1_PREFIX)
app.include_router(rates_router.router, prefix=API_V1_PREFIX)
app.include_router(wallet_router.router, prefix=API_V1_PREFIX)
app.include_router(orders_router.router, prefix=API_V1_PREFIX)
app.include_router(admin_router.router, prefix=API_V1_PREFIX)
app.include_router(public_router.router, prefix=API_V1_PREFIX)
app.include_router(kyc_router.router, prefix=API_V1_PREFIX)
app.include_router(withdrawals_router.router, prefix=API_V1_PREFIX)
app.include_router(direct_trades_router.router, prefix=API_V1_PREFIX)


@app.get("/", tags=["system"])
def root():
    return {
        "app": settings.APP_NAME,
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["system"])
def health():
    return {
        "status": "ok",
        "env": settings.APP_ENV,
        "app": settings.APP_NAME,
    }