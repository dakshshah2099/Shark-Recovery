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

# Ensure parent directory exists for SQLite file
if "sqlite" in settings.DATABASE_URL and "///" in settings.DATABASE_URL:
    try:
        db_raw_path = settings.DATABASE_URL.split("///")[-1]
        if db_raw_path and not db_raw_path.startswith(":memory:"):
            Path(db_raw_path).resolve().parent.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logging.getLogger(__name__).warning(f"DB path directory creation notice: {e}")

# SQLite async engine configuration
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
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
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        # Auto-migrate newly added columns if table already existed
        for col_def in [
            "ALTER TABLE transaction ADD COLUMN loss_vector VARCHAR DEFAULT 'checkout_dropoff'",
            "ALTER TABLE transaction ADD COLUMN escalation_level INTEGER DEFAULT 1",
            "ALTER TABLE transaction ADD COLUMN promise_to_pay_date VARCHAR",
            "ALTER TABLE transaction ADD COLUMN mandate_retry_schedule TEXT",
            "ALTER TABLE transaction ADD COLUMN voice_call_transcript TEXT",
        ]:
            try:
                await conn.execute(text(col_def))
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
