import logging
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from pathlib import Path
try:
    from backend.config import settings
except ImportError:
    from config import settings

# Suppress verbose SQL query logging, only log errors
logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)
logging.getLogger("sqlalchemy.pool").setLevel(logging.ERROR)
logging.getLogger("sqlalchemy.dialects").setLevel(logging.ERROR)

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Ensure parent directory exists for SQLite file
if "sqlite" in db_url and "///" in db_url:
    try:
        db_raw_path = db_url.split("///")[-1]
        if db_raw_path and not db_raw_path.startswith(":memory:"):
            Path(db_raw_path).resolve().parent.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logging.getLogger(__name__).warning(f"DB path directory creation notice: {e}")

is_sqlite = "sqlite" in db_url.lower()
is_postgres = "postgres" in db_url.lower()

# Async engine configuration with database-specific pooling
engine_kwargs = {"echo": False}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Enterprise PostgreSQL connection pool with proactive liveness checking
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(
    db_url,
    **engine_kwargs,
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initialize database tables defined in SQLModel metadata and run auto-migrations."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all, checkfirst=True)
    except Exception as e:
        logging.getLogger(__name__).info(f"Schema create check: {e}")

    # Resilient column auto-migration across PostgreSQL and SQLite
    migration_cols = [
        ("loss_vector", "VARCHAR DEFAULT 'checkout_dropoff'"),
        ("escalation_level", "INTEGER DEFAULT 1"),
        ("promise_to_pay_date", "VARCHAR"),
        ("mandate_retry_schedule", "TEXT"),
        ("voice_call_transcript", "TEXT"),
        ("is_benchmark", "BOOLEAN DEFAULT FALSE"),
    ]
    for col_name, col_def in migration_cols:
        try:
            async with engine.begin() as conn:
                if is_postgres:
                    await conn.execute(text(f"ALTER TABLE transaction ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))
                else:
                    await conn.execute(text(f"ALTER TABLE transaction ADD COLUMN {col_name} {col_def}"))
        except Exception:
            pass


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing an async database session per request."""
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
