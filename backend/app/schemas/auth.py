from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """ورودی ورود."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """خروجی ورود."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """ورودی گرفتن توکن جدید."""
    refresh_token: str


class AccessTokenResponse(BaseModel):
    """خروجی گرفتن access token جدید."""
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    """ورودی تغییر رمز عبور."""
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=72)