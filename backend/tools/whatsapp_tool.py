import datetime
import logging
import uuid
from typing import Any, Dict, List
try:
    from backend.models.schemas import WhatsAppPayload
except ImportError:
    from models.schemas import WhatsAppPayload

logger = logging.getLogger(__name__)

# In-memory buffer for real-time dashboard / WhatsApp UI polling
_mock_whatsapp_message_store: List[Dict[str, Any]] = []


async def send_whatsapp_message(payload: WhatsAppPayload) -> Dict[str, Any]:
    """
    Simulates sending an outreach WhatsApp message.
    Appends the message to the in-memory message store for the live UI replica.
    """
    message_entry = {
        "message_id": f"wam_{uuid.uuid4().hex[:10]}",
        "transaction_id": payload.transaction_id,
        "recipient_phone": payload.recipient_phone,
        "recipient_name": payload.recipient_name,
        "message": payload.message,
        "payment_link": payload.payment_link,
        "template_name": payload.template_name,
        "status": "delivered",
        "read_receipt": True,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

    _mock_whatsapp_message_store.append(message_entry)
    logger.info(f"WhatsApp message dispatched to {payload.recipient_phone}: {payload.message[:40]}...")

    return {
        "delivered": True,
        "mode": "mock_replica",
        "message_id": message_entry["message_id"],
        "recipient": payload.recipient_phone,
        "message": payload.message,
        "payment_link": payload.payment_link,
    }


def get_whatsapp_messages(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves recent mock WhatsApp messages for the dashboard UI."""
    return list(reversed(_mock_whatsapp_message_store[-limit:]))
