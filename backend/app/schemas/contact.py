"""
Schemas برای فرم تماس با ما.
"""
from pydantic import BaseModel, EmailStr, Field


class ContactMessageCreate(BaseModel):
    """ورودی فرم تماس."""
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=2, max_length=120)
    message: str = Field(min_length=10, max_length=5000)