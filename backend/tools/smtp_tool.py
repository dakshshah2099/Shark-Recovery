import asyncio
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict
try:
    from backend.config import settings
    from backend.models.schemas import EmailPayload
except ImportError:
    from config import settings
    from models.schemas import EmailPayload

logger = logging.getLogger(__name__)


def _send_sync_smtp(message: MIMEMultipart, recipient_email: str) -> None:
    """Synchronous bulletproof SMTP delivery via Python standard library smtplib."""
    host = settings.SMTP_HOST or "smtp.gmail.com"
    port = int(settings.SMTP_PORT or (465 if "gmail" in host.lower() else 587))
    username = (settings.SMTP_USERNAME or "").strip()
    password = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()

    # Attempt 1: Direct SSL (Port 465 or default for Gmail)
    if port == 465 or "gmail" in host.lower():
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, 465, context=context, timeout=15) as server:
                server.login(username, password)
                server.send_message(message)
                return
        except Exception as e_ssl:
            logger.warning(f"SMTP Port 465 SSL failed ({e_ssl}), trying fallback STARTTLS on port 587...")

    # Attempt 2: STARTTLS (Port 587 / 2525)
    context = ssl.create_default_context()
    with smtplib.SMTP(host, 587 if port == 465 else port, timeout=15) as server:
        server.ehlo()
        server.starttls(context=context)
        server.ehlo()
        server.login(username, password)
        server.send_message(message)


async def send_recovery_email(payload: EmailPayload) -> Dict[str, Any]:
    """
    Sends an automated recovery email asynchronously via standard smtplib executed in asyncio threadpool.
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
    is_live_smtp = bool(
        settings.SMTP_USERNAME
        and settings.SMTP_PASSWORD
        and not str(settings.SMTP_PASSWORD).startswith("placeholder")
    )

    if is_live_smtp:
        try:
            logger.info(f"Dispatching live SMTP recovery email to {payload.recipient_email} via {settings.SMTP_HOST}")
            await asyncio.to_thread(_send_sync_smtp, message, payload.recipient_email)
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
