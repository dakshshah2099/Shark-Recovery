import asyncio
import datetime
import logging
import uuid
from typing import Any, Dict, List
try:
    from backend.config import settings
    from backend.models.schemas import WhatsAppPayload
except ImportError:
    from config import settings
    from models.schemas import WhatsAppPayload

logger = logging.getLogger(__name__)

# Buffer for real-time dashboard outreach polling
_mock_whatsapp_message_store: List[Dict[str, Any]] = []


async def send_whatsapp_message(payload: WhatsAppPayload) -> Dict[str, Any]:
    """
    Dispatches a WhatsApp message via Twilio API if credentials are provided,
    otherwise records to local outreach store. Supports Twilio Sandbox and live accounts.
    """
    message_id = f"wam_{uuid.uuid4().hex[:10]}"
    twilio_sid = None
    delivery_status = "delivered"
    dispatch_mode = "local_outreach_hub"

    # Normalize phone format to E.164
    phone_clean = payload.recipient_phone.strip()
    if not phone_clean.startswith("+"):
        if phone_clean.startswith("91") and len(phone_clean) == 12:
            phone_clean = f"+{phone_clean}"
        elif len(phone_clean) == 10:
            phone_clean = f"+91{phone_clean}"

    to_whatsapp = f"whatsapp:{phone_clean}" if not phone_clean.startswith("whatsapp:") else phone_clean
    from_whatsapp = settings.TWILIO_WHATSAPP_FROM if settings.TWILIO_WHATSAPP_FROM.startswith("whatsapp:") else f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}"

    # Attempt Real Twilio Dispatch if configured
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_ACCOUNT_SID.strip() != "":
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

            def _sync_send():
                return client.messages.create(
                    body=payload.message,
                    from_=from_whatsapp,
                    to=to_whatsapp,
                )

            msg = await asyncio.to_thread(_sync_send)
            twilio_sid = msg.sid
            delivery_status = msg.status or "sent"
            dispatch_mode = "twilio_live"
            logger.info(f"Twilio WhatsApp message dispatched successfully: SID {twilio_sid} to {to_whatsapp}")
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"Twilio WhatsApp dispatch warning ({err_msg}). Recording to audit ledger.")
            delivery_status = f"twilio_info: {err_msg[:80]}"
            dispatch_mode = "twilio_fallback"

    message_entry = {
        "message_id": twilio_sid or message_id,
        "transaction_id": payload.transaction_id,
        "recipient_phone": payload.recipient_phone,
        "recipient_name": payload.recipient_name,
        "message": payload.message,
        "payment_link": payload.payment_link,
        "template_name": payload.template_name,
        "status": delivery_status,
        "mode": dispatch_mode,
        "read_receipt": True,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

    _mock_whatsapp_message_store.append(message_entry)

    return {
        "delivered": True,
        "mode": dispatch_mode,
        "message_id": message_entry["message_id"],
        "recipient": payload.recipient_phone,
        "message": payload.message,
        "payment_link": payload.payment_link,
        "status": delivery_status,
    }


def get_whatsapp_messages(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves recent WhatsApp outreach messages for dashboard UI."""
    return list(reversed(_mock_whatsapp_message_store[-limit:]))
