from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from backend.config import settings
    from backend.database import async_session_maker, init_db
    from backend.models.transaction import Transaction
    from backend.routers import dashboard_router, simulate_router, webhook_router
    from backend.seed import seed_database
except ImportError:
    from config import settings
    from database import async_session_maker, init_db
    from models.transaction import Transaction
    from routers import dashboard_router, simulate_router, webhook_router
    from seed import seed_database
from sqlmodel import select


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events."""
    # Startup: Ensure SQLite tables exist
    await init_db()
    # Auto-seed if empty
    async with async_session_maker() as session:
        existing = (await session.execute(select(Transaction))).scalars().first()
        if not existing:
            await seed_database()
    yield
    # Shutdown: Cleanup if needed


app = FastAPI(
    title=settings.APP_NAME,
    description="Autonomous AI Revenue Recovery Agent for Razorpay failed transactions.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js / Vite dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(webhook_router)
app.include_router(simulate_router)
app.include_router(dashboard_router)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint to verify backend status."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
    }
