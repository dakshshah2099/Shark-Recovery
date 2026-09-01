import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict
import aiosmtplib
try:
    from backend.config import settings
    from backend.models.schemas import EmailPayload
except ImportError:
    from config import settings
    from models.schemas import EmailPayload

logger = logging.getLogger(__name__)


async def send_recovery_email(payload: EmailPayload) -> Dict[str, Any]:
    """
    Sends an automated recovery email asynchronously via aiosmtplib.
    Gracefully falls back to simulated dispatch if SMTP credentials are not configured.
    """
    # Build MIME Message
    message = MIMEMultipart("alternative")
    message["Subject"] = payload.subject

    sender_name = "Shark Recovery"
    if settings.SMTP_USERNAME and "gmail" in (settings.SMTP_HOST or "").lower():
        from_header = f"{sender_name} <{settings.SMTP_USERNAME}>"
    else:
        from_header = f"{sender_name} <{settings.SMTP_FROM}>" if settings.SMTP_FROM else f"{sender_name} <recovery@sharkagent.com>"

    message["From"] = from_header
    message["To"] = payload.recipient_email

    part_text = MIMEText(payload.body_text, "plain", "utf-8")
    part_html = MIMEText(payload.body_html, "html", "utf-8")
    message.attach(part_text)
    message.attach(part_html)

    # Check if live SMTP credentials exist
    is_live_smtp = bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD and not str(settings.SMTP_PASSWORD).startswith("placeholder"))

    if is_live_smtp:
        try:
            port = int(settings.SMTP_PORT or 587)
            logger.info(f"Dispatching live SMTP recovery email to {payload.recipient_email} via {settings.SMTP_HOST}:{port}")
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=port,
                username=settings.SMTP_USERNAME,
                password=settings.SMTP_PASSWORD,
                use_tls=port == 465,
                start_tls=port in (587, 2525),
                timeout=12,
            )
            logger.info(f"Live SMTP email delivered successfully to {payload.recipient_email}")
            return {
                "delivered": True,
                "mode": "live_smtp",
                "recipient": payload.recipient_email,
                "subject": payload.subject,
                "message": "Email successfully dispatched via live SMTP gateway.",
            }
        except Exception as err:
            logger.warning(f"SMTP dispatch failed ({err}). Falling back to simulation mode.")
            return {
                "delivered": False,
                "mode": "live_smtp_failed",
                "error": str(err),
                "recipient": payload.recipient_email,
                "subject": payload.subject,
                "message": f"SMTP Gateway notice: {err}",
            }

    # Simulated dispatch for sandbox testing & dashboard visibility
    return {
        "delivered": True,
        "mode": "simulated",
        "recipient": payload.recipient_email,
        "subject": payload.subject,
        "payment_link": payload.payment_link,
        "discount_applied": payload.discount_applied,
        "message": "Recovery email simulated successfully and recorded in audit trail.",
    }
