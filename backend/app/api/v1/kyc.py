import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models import KycDocument, User
from app.models.enums import KycStatus

router = APIRouter(prefix="/kyc", tags=["kyc"])

# پوشه ذخیره فایل‌های آپلودی
UPLOAD_DIR = Path("storage/kyc")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# محدودیت فایل
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


# ═══════════════════════════════════════
#              کاربر
# ═══════════════════════════════════════


@router.get("/status")
def get_kyc_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """وضعیت KYC کاربر فعلی."""
    documents = db.query(KycDocument).filter(
        KycDocument.user_id == current_user.id
    ).order_by(KycDocument.created_at.desc()).all()

    if not documents:
        overall = "NOT_SUBMITTED"
    elif any(d.status == KycStatus.APPROVED for d in documents):
        overall = "APPROVED"
    elif any(d.status == KycStatus.PENDING for d in documents):
        overall = "PENDING"
    else:
        overall = "REJECTED"

    return {
        "overall_status": overall,
        "is_verified": current_user.is_verified,
        "documents": [
            {
                "id": d.id,
                "doc_type": d.doc_type,
                "status": d.status.value,
                "rejection_reason": d.rejection_reason,
                "created_at": d.created_at.isoformat(),
            }
            for d in documents
        ],
    }


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_kyc_document(
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    آپلود مدرک KYC.
    doc_type: national_id / passport / selfie
    """
    # اعتبارسنجی نوع مدرک
    valid_types = {"national_id", "passport", "selfie"}
    if doc_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"نوع مدرک باید یکی از این‌ها باشد: {', '.join(valid_types)}",
        )

    # اعتبارسنجی MIME type
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="فرمت فایل باید JPG، PNG، WebP یا PDF باشد",
        )

    # خواندن فایل و چک اندازه
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حجم فایل نباید بیشتر از ۵ مگابایت باشد",
        )

    # ذخیره فایل
    ext = Path(file.filename or "").suffix.lower() or ".jpg"
    unique_name = f"{current_user.id}_{doc_type}_{uuid.uuid4().hex[:12]}{ext}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(content)

    # حذف مدارک قبلی از همین نوع که هنوز PENDING یا REJECTED هستن
    db.query(KycDocument).filter(
        KycDocument.user_id == current_user.id,
        KycDocument.doc_type == doc_type,
        KycDocument.status != KycStatus.APPROVED,
    ).delete()

    # ثبت مدرک جدید
    doc = KycDocument(
        user_id=current_user.id,
        doc_type=doc_type,
        file_path=str(file_path),
        status=KycStatus.PENDING,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "doc_type": doc.doc_type,
        "status": doc.status.value,
        "message": "مدرک با موفقیت آپلود شد. منتظر تأیید ادمین باشید.",
    }


# ═══════════════════════════════════════
#              ادمین
# ═══════════════════════════════════════


@router.get("/admin/pending")
def list_pending_kyc(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """لیست مدارک KYC در انتظار تأیید."""
    docs = (
        db.query(KycDocument)
        .filter(KycDocument.status == KycStatus.PENDING)
        .order_by(KycDocument.created_at.asc())
        .all()
    )

    # گروه‌بندی بر اساس کاربر
    result = {}
    for doc in docs:
        if doc.user_id not in result:
            user = db.query(User).filter(User.id == doc.user_id).first()
            result[doc.user_id] = {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "phone": user.phone,
                    "is_verified": user.is_verified,
                },
                "documents": [],
            }

        # مسیر نسبی برای استفاده در فرانت
        # مثلاً: storage/kyc/xxx.jpg
        file_path = doc.file_path.replace("\\", "/")

        result[doc.user_id]["documents"].append({
            "id": doc.id,
            "doc_type": doc.doc_type,
            "file_path": file_path,
            "status": doc.status.value,
            "created_at": doc.created_at.isoformat(),
        })

    return list(result.values())


@router.get("/admin/file/{doc_id}")
def get_kyc_file(
    doc_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """مسیر فایل مدرک (ادمین)."""
    doc = db.query(KycDocument).filter(KycDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="مدرک یافت نشد")

    return {"file_path": doc.file_path, "doc_type": doc.doc_type}


@router.post("/admin/{doc_id}/approve")
def approve_kyc(
    doc_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """تأیید مدرک KYC."""
    doc = db.query(KycDocument).filter(KycDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="مدرک یافت نشد")

    doc.status = KycStatus.APPROVED
    doc.reviewed_by = admin.id
    doc.reviewed_at = datetime.now(timezone.utc)

    # اگه کاربر قبلاً verified نبود، الان verified کن
    user = db.query(User).filter(User.id == doc.user_id).first()
    if user and not user.is_verified:
        user.is_verified = True

    db.commit()
    return {"message": "مدرک تأیید شد", "doc_id": doc.id}


@router.post("/admin/{doc_id}/reject")
def reject_kyc(
    doc_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """رد مدرک KYC با دلیل."""
    reason = (payload.get("reason") or "").strip()
    if len(reason) < 3:
        raise HTTPException(
            status_code=400,
            detail="دلیل رد باید حداقل ۳ کاراکتر باشد",
        )

    doc = db.query(KycDocument).filter(KycDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="مدرک یافت نشد")

    doc.status = KycStatus.REJECTED
    doc.rejection_reason = reason
    doc.reviewed_by = admin.id
    doc.reviewed_at = datetime.now(timezone.utc)

    # چک کن آیا کاربر مدارک دیگه‌ای APPROVED داره
    other_approved = db.query(KycDocument).filter(
        KycDocument.user_id == doc.user_id,
        KycDocument.id != doc.id,
        KycDocument.status == KycStatus.APPROVED,
    ).first()

    user = db.query(User).filter(User.id == doc.user_id).first()
    if user and not other_approved:
        user.is_verified = False

    db.commit()
    return {"message": "مدرک رد شد", "doc_id": doc.id, "reason": reason}


@router.get("/admin/stats")
def get_kyc_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """آمار KYC."""
    from sqlalchemy import func

    total_verified = db.query(func.count(User.id)).filter(User.is_verified == True).scalar()  # noqa: E712
    total_pending = db.query(func.count(KycDocument.id)).filter(
        KycDocument.status == KycStatus.PENDING
    ).scalar()
    total_users = db.query(func.count(User.id)).scalar()

    return {
        "total_users": total_users,
        "verified_users": total_verified,
        "pending_documents": total_pending,
    }