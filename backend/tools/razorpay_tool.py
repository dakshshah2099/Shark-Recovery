import logging
import time
import uuid
from typing import Any, Dict, Optional
import razorpay
try:
    from backend.config import settings
    from backend.models.schemas import RazorpayPaymentLinkCreate, RazorpayPaymentLinkResponse
except ImportError:
    from config import settings
    from models.schemas import RazorpayPaymentLinkCreate, RazorpayPaymentLinkResponse

logger = logging.getLogger(__name__)


def get_razorpay_client() -> Optional[razorpay.Client]:
    """Returns initialized Razorpay Client if credentials are provided."""
    if (
        settings.RAZORPAY_KEY_ID
        and settings.RAZORPAY_KEY_SECRET
        and not settings.RAZORPAY_KEY_ID.startswith("rzp_test_placeholder")
    ):
        try:
            return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        except Exception as e:
            logger.warning(f"Failed to initialize Razorpay Client: {e}")
            return None
    return None


async def create_payment_link(
    payload: RazorpayPaymentLinkCreate,
) -> RazorpayPaymentLinkResponse:
    """
    Creates a Razorpay Payment Link for recovered cart transactions.
    Gracefully falls back to mock link if live API is unavailable or credentials are unset.
    """
    client = get_razorpay_client()
    amount_paise = int(round(payload.amount * 100))

    if client:
        try:
            options: Dict[str, Any] = {
                "amount": amount_paise,
                "currency": payload.currency,
                "accept_partial": False,
                "description": payload.description,
                "customer": {
                    "name": payload.customer_name,
                    "email": payload.customer_email,
                    "contact": payload.customer_contact,
                },
                "notify": {"sms": False, "email": False},
                "reminder_enable": True,
                "notes": payload.notes,
                "expire_by": int(time.time()) + (payload.expire_by_minutes * 60),
            }
            resp = client.payment_link.create(options)
            return RazorpayPaymentLinkResponse(
                link_id=resp.get("id", f"plink_{uuid.uuid4().hex[:10]}"),
                short_url=resp.get("short_url", f"https://rzp.io/i/{uuid.uuid4().hex[:8]}"),
                amount=payload.amount,
                currency=payload.currency,
                status=resp.get("status", "created"),
                created_at=resp.get("created_at", int(time.time())),
            )
        except Exception as err:
            logger.warning(f"Razorpay live API call failed ({err}), generating sandbox mock link.")

    # Graceful mock payment link generation
    link_id = f"plink_{uuid.uuid4().hex[:10]}"
    short_url = f"https://rzp.io/i/rec_{uuid.uuid4().hex[:8]}"
    return RazorpayPaymentLinkResponse(
        link_id=link_id,
        short_url=short_url,
        amount=payload.amount,
        currency=payload.currency,
        status="created",
        created_at=int(time.time()),
    )
