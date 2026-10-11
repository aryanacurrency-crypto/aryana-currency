from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import admin as admin_router
from app.api.v1 import auth as auth_router
from app.api.v1 import kyc as kyc_router
from app.api.v1 import orders as orders_router
from app.api.v1 import public as public_router
from app.api.v1 import rates as rates_router
from app.api.v1 import wallet as wallet_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="0.1.0",
    description="صرافی دیجیتال آریانا — API",
)

# CORS
if settings.cors_origins_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Static files (KYC documents, etc.)
STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# --- Routers ---
API_V1_PREFIX = "/api/v1"
app.include_router(auth_router.router, prefix=API_V1_PREFIX)
app.include_router(rates_router.router, prefix=API_V1_PREFIX)
app.include_router(wallet_router.router, prefix=API_V1_PREFIX)
app.include_router(orders_router.router, prefix=API_V1_PREFIX)
app.include_router(admin_router.router, prefix=API_V1_PREFIX)
app.include_router(public_router.router, prefix=API_V1_PREFIX)
app.include_router(kyc_router.router, prefix=API_V1_PREFIX)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "env": settings.APP_ENV, "app": settings.APP_NAME}