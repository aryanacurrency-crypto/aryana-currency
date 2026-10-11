from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# --- این بخش رو اضافه کردیم ---
import sys
from pathlib import Path

# اضافه کردن مسیر backend به sys.path تا بتونیم app رو import کنیم
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.database import Base
# import کردن همه مدلها تا metadata پر شه
from app import models  # noqa: F401

# -----------------------------

# این آبجکت تنظیمات alembic.ini هست
config = context.config

# URL دیتابیس رو از settings میگیریم
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# تنظیم logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# metadata از Base (شامل همه جدولها)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """حالت offline (SQL فقط چاپ میشه، اجرا نمیشه)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """حالت online (واقعاً به دیتابیس وصل میشه)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()