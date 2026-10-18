"""
API فرم تماس — ارسال به ایمیل پشتیبانی.
"""
import logging

from fastapi import APIRouter, BackgroundTasks

from app.core.email import send_contact_message_email
from app.schemas.contact import ContactMessageCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("/send")
async def send_message(
    payload: ContactMessageCreate,
    background_tasks: BackgroundTasks,
):
    """
    ارسال پیام فرم تماس به ایمیل پشتیبانی.
    پاسخ به صورت background_task ارسال می‌شه.
    """
    logger.info(
        f"[Contact] New message from {payload.name} <{payload.email}> — Subject: {payload.subject}"
    )

    background_tasks.add_task(
        send_contact_message_email,
        name=payload.name,
        user_email=payload.email,
        subject=payload.subject,
        message=payload.message,
    )

    return {
        "success": True,
        "message": "Your message has been sent. We will reply within a few hours.",
    }