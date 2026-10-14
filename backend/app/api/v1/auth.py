import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.email import send_password_reset_email, send_welcome_email
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.telegram import notify_new_user
from app.models import User, Wallet
from app.models.enums import Currency
from app.models.password_reset import PasswordResetToken
from app.schemas.auth import (
    AccessTokenResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


# ═══════════════════════════════════════
#              ثبت‌نام / ورود
# ═══════════════════════════════════════


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """ثبت‌نام کاربر جدید."""
    # چک ایمیل تکراری
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="این ایمیل قبلاً ثبت شده است",
        )

    # چک شماره تلفن تکراری
    if payload.phone:
        existing_phone = db.query(User).filter(User.phone == payload.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="این شماره تلفن قبلاً ثبت شده است",
            )

    # ساخت کاربر
    user = User(
        email=payload.email,
        phone=payload.phone,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        hesab_pay_number=payload.hesab_pay_number,
        hesab_pay_holder_name=payload.hesab_pay_holder_name,
        usdt_wallet_address=payload.usdt_wallet_address,
        usdt_wallet_network=payload.usdt_wallet_network,
    )
    db.add(user)
    db.flush()

    # ساخت دو کیف پول خالی
    for currency in (Currency.AFN, Currency.USDT):
        db.add(Wallet(user_id=user.id, currency=currency))

    db.commit()
    db.refresh(user)

    # ─── ارسال ایمیل خوش‌آمدگویی ───
    try:
        send_welcome_email(user.email, user.full_name)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Welcome email failed: {e}")

    # ─── اعلان تلگرام ───
    try:
        notify_new_user(user)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Telegram notify failed: {e}")

    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """ورود با ایمیل و پسورد."""
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ایمیل یا پسورد اشتباه است",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="حساب کاربری غیرفعال است",
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(payload: RefreshRequest):
    """گرفتن access token جدید با refresh token."""
    data = decode_token(payload.refresh_token)

    if data is None or data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token نامعتبر است",
        )

    user_id = data.get("sub")
    return AccessTokenResponse(access_token=create_access_token(user_id))


# ═══════════════════════════════════════
#         فراموشی / بازنشانی رمز
# ═══════════════════════════════════════


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    درخواست بازنشانی رمز عبور.

    برای امنیت، همیشه پیام موفقیت برمی‌گردونیم — حتی اگه ایمیل وجود نداشته باشه
    (تا کسی نتونه بفهمه کدوم ایمیل‌ها توی سیستم ثبت شدن).
    """
    user = db.query(User).filter(User.email == payload.email).first()

    # اگه کاربر وجود داشت، توکن بساز
    if user and user.is_active:
        # پاک کردن توکن‌های قدیمی استفاده نشده
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,  # noqa: E712
        ).delete(synchronize_session=False)

        # ساخت توکن جدید
        token = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES
        )

        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
        )
        db.add(reset_token)
        db.commit()

        # ارسال ایمیل
        try:
            send_password_reset_email(user.email, token)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send reset email: {e}")

    # همیشه پیام موفقیت (برای امنیت)
    return MessageResponse(
        message="اگر این ایمیل در سیستم ثبت شده باشد، لینک بازنشانی برای شما ارسال خواهد شد."
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """بازنشانی رمز عبور با توکن."""
    # پیدا کردن توکن
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token
    ).first()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لینک بازنشانی نامعتبر است",
        )

    if reset_token.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این لینک قبلاً استفاده شده است",
        )

    # چک انقضا
    now = datetime.now(timezone.utc)
    expires_at = reset_token.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لینک بازنشانی منقضی شده است",
        )

    # پیدا کردن کاربر
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد",
        )

    # تغییر رمز
    user.hashed_password = hash_password(payload.new_password)

    # علامت‌گذاری توکن به عنوان استفاده‌شده
    reset_token.used = True

    db.commit()

    return MessageResponse(message="رمز عبور با موفقیت تغییر کرد")


# ═══════════════════════════════════════
#           اطلاعات کاربر فعلی
# ═══════════════════════════════════════


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    """اطلاعات کاربر فعلی."""
    return current_user


@router.patch("/me", response_model=UserRead)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ویرایش پروفایل کاربر.
    فقط فیلدهای قابل ویرایش: full_name, phone, hesab_pay_*, usdt_wallet_*
    """
    # اگه شماره تلفن تغییر کرده، چک کن تکراری نباشه
    if payload.phone is not None and payload.phone != current_user.phone:
        existing = db.query(User).filter(
            User.phone == payload.phone,
            User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="این شماره تلفن قبلاً ثبت شده است",
            )

    # آپدیت فیلدها (فقط اونایی که ارسال شدن)
    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تغییر رمز عبور."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز عبور فعلی اشتباه است",
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز عبور جدید باید حداقل ۸ کاراکتر باشد",
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"message": "رمز عبور با موفقیت تغییر کرد"}