from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# Engine — اتصال اصلی به دیتابیس
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,          # توی development، SQLها رو چاپ میکنه
    pool_pre_ping=True,           # قبل از هر query، اتصال رو چک میکنه
    pool_size=5,
    max_overflow=10,
)

# Session — هر درخواست یه session جدا میگیره
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """
    کلاس پایه برای همه مدلها.
    همه جدولها از این ارث میبرن.
    """
    pass


def get_db():
    """
    Dependency برای FastAPI.
    هر درخواست یه session میگیره و آخرش میبنده.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()