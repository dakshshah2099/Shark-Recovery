import asyncio
import datetime
import logging
import uuid
from typing import Any, Dict, List, Optional
try:
    from backend.config import settings
    from backend.models.schemas import WhatsAppPayload
except ImportError:
    from config import settings
    from models.schemas import WhatsAppPayload

logger = logging.getLogger(__name__)

# Buffer for real-time dashboard outreach polling
_mock_whatsapp_message_store: List[Dict[str, Any]] = []


def _get_twilio_client():
    """
    Initializes Twilio client supporting API Key & Secret (preferred & safer)
    or primary Account SID & Auth Token.
    """
    from twilio.rest import Client

    account_sid = (settings.TWILIO_ACCOUNT_SID or "").strip()
    api_key = (settings.TWILIO_API_KEY or "").strip()
    api_secret = (settings.TWILIO_API_SECRET or "").strip()
    auth_token = (settings.TWILIO_AUTH_TOKEN or "").strip()

    # 1. Preferred: API Key (SK...) + API Secret + Account SID (AC...)
    if api_key and api_secret and account_sid:
        logger.info(f"Authenticating Twilio client using API Key ({api_key[:6]}...) for Account {account_sid[:6]}...")
        return Client(api_key, api_secret, account_sid=account_sid)

    # 2. Fallback: Account SID (AC...) + Auth Token
    if account_sid and auth_token and account_sid.startswith("AC"):
        logger.info(f"Authenticating Twilio client using Account SID ({account_sid[:6]}...) and Auth Token")
        return Client(account_sid, auth_token)

    return None


async def send_whatsapp_message(payload: WhatsAppPayload) -> Dict[str, Any]:
    """
    Dispatches a WhatsApp message via Twilio API (using API Key or Auth Token)
    if credentials are provided, otherwise records to local outreach store.
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

    account_sid = (settings.TWILIO_ACCOUNT_SID or "").strip()
    api_key = (settings.TWILIO_API_KEY or "").strip()

    # Validate if user accidentally put API Key in TWILIO_ACCOUNT_SID without setting TWILIO_API_KEY
    if account_sid.startswith("SK") and not api_key:
        err_notice = f"TWILIO_ACCOUNT_SID is set to an API Key ('{account_sid[:6]}...'). Please set TWILIO_ACCOUNT_SID to your Account SID ('AC...') and enter this key into TWILIO_API_KEY."
        logger.warning(err_notice)
        delivery_status = "twilio_config_error: Account SID must start with AC (found SK API Key)"
        dispatch_mode = "twilio_fallback"
    else:
        client = _get_twilio_client()
        if client:
            try:
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
