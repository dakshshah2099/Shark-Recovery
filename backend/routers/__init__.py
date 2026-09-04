from .dashboard import router as dashboard_router
from .simulate import router as simulate_router
from .voice import router as voice_router
from .webhook import router as webhook_router

__all__ = ["webhook_router", "simulate_router", "dashboard_router", "voice_router"]
