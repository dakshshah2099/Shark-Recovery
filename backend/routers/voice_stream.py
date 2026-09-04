"""
voice_stream.py
Telephony Media Stream Gateway and Browser Live Voice AI WebSocket Router.
Bridges Twilio Voice / Exotel PSTN and Browser Microphones with Gemini 2.0 Multimodal Live API.
"""
import asyncio
import base64
import json
import logging
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

try:
    from backend.config import settings
    from backend.database import async_session_maker, get_session
    from backend.models.audit_log import ActionType, AuditLog, AuditStatus
    from backend.models.customer import Customer
    from backend.models.schemas import EmailPayload, RazorpayPaymentLinkCreate, WhatsAppPayload
    from backend.models.transaction import Transaction
    from backend.tools.gemini_live_client import GeminiLiveSession
    from backend.tools.razorpay_tool import create_payment_link
    from backend.tools.smtp_tool import send_recovery_email
    from backend.tools.telephony_codec import (
        mulaw_to_pcm16,
        pcm16_to_mulaw,
        resample_pcm16,
    )
    from backend.tools.whatsapp_tool import _get_twilio_client, send_whatsapp_message
except ImportError:
    from config import settings
    from database import async_session_maker, get_session
    from models.audit_log import ActionType, AuditLog, AuditStatus
    from models.customer import Customer
    from models.schemas import EmailPayload, RazorpayPaymentLinkCreate, WhatsAppPayload
    from models.transaction import Transaction
    from tools.gemini_live_client import GeminiLiveSession
    from tools.razorpay_tool import create_payment_link
    from tools.smtp_tool import send_recovery_email
    from tools.telephony_codec import (
        mulaw_to_pcm16,
        pcm16_to_mulaw,
        resample_pcm16,
    )
    from tools.whatsapp_tool import _get_twilio_client, send_whatsapp_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["Telephony & Voice Streaming"])

# Active live sessions cache in memory
_ACTIVE_SESSIONS: Dict[str, GeminiLiveSession] = {}


class OutboundCallRequest(BaseModel):
    transaction_id: str = Field(..., description="Transaction ID to recover")
    customer_phone: Optional[str] = Field(None, description="Phone number to call")
    discount_percent: float = Field(0.0, ge=0.0, le=15.0, description="Approved discount incentive")
    provider: str = Field("auto", description="Telephony provider: 'twilio', 'exotel', or 'browser_live'")


class OutboundCallResponse(BaseModel):
    success: bool
    session_id: str
    call_sid: str
    provider_used: str
    status: str
    message: str
    media_stream_url: str


@router.post("/outbound-call", response_model=OutboundCallResponse)
async def trigger_outbound_call(
    req: OutboundCallRequest,
    db: AsyncSession = Depends(get_session),
):
    """
    Initiates an outbound AI voice recovery phone call to a customer via Twilio/Exotel PSTN
    or sets up a browser real-time live test session.
    """
    # Fetch transaction from database
    stmt = select(Transaction).where(Transaction.id == req.transaction_id)
    res = await db.exec(stmt)
    txn = res.first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    customer = None
    if txn.customer_id:
        cust_res = await db.exec(select(Customer).where(Customer.id == txn.customer_id))
        customer = cust_res.first()

    customer_name = customer.name if customer else "Valued Customer"
    customer_phone = customer.phone if customer else None
    phone = req.customer_phone or customer_phone or "+919876543210"
    session_id = f"voice_{txn.id[:8]}_{int(asyncio.get_event_loop().time())}"

    # Check if real Twilio Voice credentials exist via API Key & Secret
    has_twilio = bool(settings.TWILIO_API_KEY and settings.TWILIO_API_SECRET and settings.TWILIO_PHONE_NUMBER)

    call_sid = f"CA_{session_id}"
    provider_used = "simulation_browser"

    if req.provider == "twilio" or (req.provider == "auto" and has_twilio):
        try:
            from twilio.rest import Client

            api_key = (settings.TWILIO_API_KEY or "").strip()
            api_secret = (settings.TWILIO_API_SECRET or "").strip()
            client = Client(api_key, api_secret)

            twiml_url = f"{settings.PUBLIC_BASE_URL}/api/voice/twiml?session_id={session_id}"
            call = client.calls.create(
                to=phone,
                from_=settings.TWILIO_PHONE_NUMBER,
                url=twiml_url,
            )
            call_sid = call.sid
            provider_used = "twilio_pstn"
            logger.info(f"Twilio Voice Call initiated via API Key: SID {call_sid} to {phone}")
        except Exception as e:
            logger.warning(f"Twilio outbound call fallback to live session: {e}")
            provider_used = "telephony_bridge_ready"
    else:
        provider_used = "live_multimodal_ready"

    # Log to Audit Ledger
    audit = AuditLog(
        transaction_id=txn.id,
        customer_id=txn.customer_id,
        agent_name="HinglishVoiceAgent",
        action_type=ActionType.VOICE_CALL_DISPATCHED,
        status=AuditStatus.SUCCESS,
        input_payload=json.dumps({
            "session_id": session_id,
            "call_sid": call_sid,
            "recipient_phone": phone,
            "provider": provider_used,
            "discount_percent": req.discount_percent,
        }),
        output_payload=json.dumps({
            "message": f"Voice recovery session {session_id} initiated for {customer_name} on {provider_used}",
            "call_sid": call_sid,
            "status": "in-flight",
        }),
        metadata_json=json.dumps({
            "loss_vector": txn.loss_vector or "checkout_dropout",
            "provider": provider_used,
        }),
    )
    db.add(audit)
    await db.commit()

    media_ws_url = f"/api/voice/live-chat/{session_id}"

    return OutboundCallResponse(
        success=True,
        session_id=session_id,
        call_sid=call_sid,
        provider_used=provider_used,
        status="initiated",
        message=f"Autonomous voice session active on {provider_used}",
        media_stream_url=media_ws_url,
    )


@router.post("/twiml")
async def generate_twiml(session_id: str = Query(...)):
    """
    Returns TwiML XML instructing Twilio to bridge customer phone audio
    to the backend WebSocket Media Stream.
    """
    ws_url = settings.PUBLIC_BASE_URL.replace("http://", "ws://").replace("https://", "wss://")
    stream_endpoint = f"{ws_url}/api/voice/media-stream/{session_id}"

    twiml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{stream_endpoint}">
            <Parameter name="sessionId" value="{session_id}" />
        </Stream>
    </Connect>
</Response>
"""
    return Response(content=twiml_content, media_type="application/xml")


async def execute_voice_dispatch_tool(
    tool_name: str,
    args: Dict[str, Any],
    session_id: str,
    txn_id: str,
    cust_id: Optional[str],
    cust_name: str,
    cust_phone: str,
    cust_email: str,
    amount: float,
    default_discount: float,
) -> Dict[str, Any]:
    """
    Executes live recovery tools invoked by Priya (Voice AI Agent) during voice interactions:
    - dispatch_whatsapp
    - dispatch_sms
    - dispatch_email
    - dispatch_recovery_link (omnichannel: whatsapp / sms / email / all)
    - record_promise_to_pay
    """
    logger.info(f"VoiceLive[{session_id}] Priya executing tool '{tool_name}' with args {args}")
    disc = float(args.get("discount_percent", default_discount))
    first_name = cust_name.split()[0] if cust_name else "Customer"
    final_amount = round(amount * (1.0 - (disc / 100.0)), 2) if disc > 0 else amount

    # Generate live Razorpay link
    payment_link = f"https://rzp.io/i/{txn_id[:12]}"
    try:
        link_req = RazorpayPaymentLinkCreate(
            amount=final_amount,
            currency="INR",
            customer_name=cust_name,
            customer_email=cust_email,
            customer_contact=cust_phone,
            description=f"Shark Recovery ({disc:.0f}% off)" if disc > 0 else "Shark Payment Recovery",
            notes={"txn_id": txn_id, "channel": tool_name, "voice_agent": "Priya Live"},
        )
        link_resp = await create_payment_link(link_req)
        payment_link = link_resp.payment_url
    except Exception as e:
        logger.warning(f"Payment link creation fallback for {session_id}: {e}")

    # 1. WhatsApp Dispatch Helper
    async def _send_wa(custom_msg: Optional[str] = None) -> Dict[str, Any]:
        if custom_msg:
            msg_text = custom_msg
        elif disc > 0:
            msg_text = f"Namaste {first_name} ji! Aapke order ke liye special {disc:.0f}% discount apply kar diya hai (Payable: INR {final_amount:,.2f}). Instant payment link: {payment_link}"
        else:
            msg_text = f"Namaste {first_name} ji! Aapka cart priority reserve hai. Aap yahan se 1-click retry kar sakte hain: {payment_link}"

        wa_payload = WhatsAppPayload(
            transaction_id=txn_id,
            recipient_phone=cust_phone,
            recipient_name=cust_name,
            message=msg_text,
            payment_link=payment_link,
            discount_applied=disc,
            original_amount=amount,
            final_amount=final_amount,
        )
        wa_res = await send_whatsapp_message(wa_payload)

        async with async_session_maker() as db_session:
            audit = AuditLog(
                transaction_id=txn_id,
                customer_id=cust_id,
                agent_name="VoiceAgent (Priya Live)",
                action_type=ActionType.WHATSAPP_DISPATCHED,
                status=AuditStatus.SUCCESS if wa_res.get("delivered") else AuditStatus.FAILURE,
                input_payload=json.dumps({"channel": "whatsapp", "discount": disc, "phone": cust_phone}),
                output_payload=json.dumps(wa_res),
            )
            db_session.add(audit)
            res = await db_session.execute(select(Transaction).where(Transaction.id.contains(txn_id)))
            txn_obj = res.scalars().first()
            if txn_obj:
                txn_obj.recovery_link = payment_link
                txn_obj.recovery_channel = "whatsapp"
                txn_obj.discount_applied_percent = disc
                db_session.add(txn_obj)
            await db_session.commit()
        return wa_res

    # 2. SMS Dispatch Helper
    async def _send_sms(custom_sms: Optional[str] = None) -> Dict[str, Any]:
        if custom_sms:
            sms_text = custom_sms
        elif disc > 0:
            sms_text = f"Hi {first_name}, complete your INR {final_amount:,.2f} order with {disc:.0f}% OFF. Tap link to pay: {payment_link} - Shark Care"
        else:
            sms_text = f"Hi {first_name}, your cart is reserved. Complete your Razorpay checkout securely here: {payment_link} - Shark Care"

        twilio_client = _get_twilio_client()
        sms_sid = f"sms_{uuid.uuid4().hex[:10]}"
        sms_status = "simulated"
        if twilio_client and getattr(settings, "TWILIO_PHONE_NUMBER", None):
            try:
                phone_clean = cust_phone.strip()
                if not phone_clean.startswith("+"):
                    phone_clean = f"+91{phone_clean}" if len(phone_clean) == 10 else f"+{phone_clean}"
                msg = await asyncio.wait_for(
                    asyncio.to_thread(
                        twilio_client.messages.create,
                        body=sms_text,
                        from_=settings.TWILIO_PHONE_NUMBER,
                        to=phone_clean,
                    ),
                    timeout=3.0,
                )
                sms_sid = msg.sid
                sms_status = msg.status or "sent"
            except Exception as e:
                logger.warning(f"Twilio SMS dispatch notice: {e}")
                sms_status = f"twilio_fallback: {str(e)[:60]}"

        async with async_session_maker() as db_session:
            audit = AuditLog(
                transaction_id=txn_id,
                customer_id=cust_id,
                agent_name="VoiceAgent (Priya Live)",
                action_type=ActionType.PAYMENT_LINK_GENERATED,
                status=AuditStatus.SUCCESS,
                input_payload=json.dumps({"channel": "sms", "discount": disc, "phone": cust_phone}),
                output_payload=json.dumps({"sms_id": sms_sid, "status": sms_status, "link": payment_link}),
            )
            db_session.add(audit)
            res = await db_session.execute(select(Transaction).where(Transaction.id.contains(txn_id)))
            txn_obj = res.scalars().first()
            if txn_obj:
                txn_obj.recovery_link = payment_link
                txn_obj.recovery_channel = "sms"
                txn_obj.discount_applied_percent = disc
                db_session.add(txn_obj)
            await db_session.commit()
        return {"sms_id": sms_sid, "status": sms_status}

    # 3. Email Dispatch Helper
    async def _send_mail(subject_override: Optional[str] = None) -> Dict[str, Any]:
        subj = subject_override or (
            f"Special {disc:.0f}% Incentive: Complete your checkout"
            if disc > 0
            else f"Reserved Cart: Complete your order for INR {amount:,.2f}"
        )
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-top: 0;">Namaste {first_name} ji,</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                Following up on our phone call, we have secured your checkout cart.
                {" A special incentive of <strong>" + f"{disc:.0f}% OFF</strong> has been applied." if disc > 0 else " Your items remain reserved on priority."}
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 6px 0; color: #64748b; font-size: 13px;">Amount Payable:</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0284c7;">INR {final_amount:,.2f}</p>
            </div>
            <div style="text-align: center; margin: 24px 0;">
                <a href="{payment_link}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                    Complete Payment Securely
                </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                Shark Payment Care • Powered by Razorpay
            </p>
        </div>
        """
        text_body = f"Namaste {first_name} ji,\n\nCart reserved. Payable: INR {final_amount:,.2f}.\n\nPay here: {payment_link}\n\n- Shark Payment Care"

        email_payload = EmailPayload(
            transaction_id=txn_id,
            recipient_email=cust_email,
            recipient_name=cust_name,
            subject=subj,
            body_html=html_body,
            body_text=text_body,
            payment_link=payment_link,
            discount_applied=disc,
            original_amount=amount,
            final_amount=final_amount,
        )
        mail_res = await send_recovery_email(email_payload)

        async with async_session_maker() as db_session:
            audit = AuditLog(
                transaction_id=txn_id,
                customer_id=cust_id,
                agent_name="VoiceAgent (Priya Live)",
                action_type=ActionType.EMAIL_DISPATCHED,
                status=AuditStatus.SUCCESS if mail_res.get("delivered") else AuditStatus.FAILURE,
                input_payload=json.dumps({"channel": "email", "discount": disc, "email": cust_email}),
                output_payload=json.dumps(mail_res),
            )
            db_session.add(audit)
            res = await db_session.execute(select(Transaction).where(Transaction.id.contains(txn_id)))
            txn_obj = res.scalars().first()
            if txn_obj:
                txn_obj.recovery_link = payment_link
                txn_obj.recovery_channel = "email"
                txn_obj.discount_applied_percent = disc
                db_session.add(txn_obj)
            await db_session.commit()
        return mail_res

    # Tool Route Resolution
    if tool_name == "dispatch_whatsapp":
        await _send_wa(args.get("message_text"))
        return {
            "status": "dispatched",
            "channel": "whatsapp",
            "recipient": cust_phone,
            "discount_applied": disc,
            "payment_link": payment_link,
            "message": f"Instant WhatsApp recovery link dispatched to {cust_phone}",
        }

    elif tool_name == "dispatch_sms":
        await _send_sms(args.get("sms_text"))
        return {
            "status": "dispatched",
            "channel": "sms",
            "recipient": cust_phone,
            "discount_applied": disc,
            "payment_link": payment_link,
            "message": f"Direct SMS with 1-click retry link sent to {cust_phone}",
        }

    elif tool_name == "dispatch_email":
        await _send_mail(args.get("subject"))
        return {
            "status": "dispatched",
            "channel": "email",
            "recipient": cust_email,
            "discount_applied": disc,
            "payment_link": payment_link,
            "message": f"Official recovery email with itemized invoice sent to {cust_email}",
        }

    elif tool_name == "dispatch_recovery_link":
        ch = str(args.get("channel", "whatsapp")).lower()
        dispatched_channels: List[str] = []
        if ch in ["whatsapp", "all"]:
            await _send_wa()
            dispatched_channels.append("WhatsApp")
        if ch in ["sms", "all"]:
            await _send_sms()
            dispatched_channels.append("SMS")
        if ch in ["email", "all"]:
            await _send_mail()
            dispatched_channels.append("Email")
        if not dispatched_channels:
            await _send_wa()
            dispatched_channels.append("WhatsApp")

        return {
            "status": "dispatched",
            "channel": ch,
            "channels_executed": dispatched_channels,
            "discount_applied": disc,
            "payment_link": payment_link,
            "message": f"Recovery link ({disc:.0f}% off) dispatched via {', '.join(dispatched_channels)}",
        }

    elif tool_name == "record_promise_to_pay":
        pdate = str(args.get("promise_date", "Today"))
        note = str(args.get("note", "Customer verbally agreed to complete payment"))
        async with async_session_maker() as db_session:
            audit = AuditLog(
                transaction_id=txn_id,
                customer_id=cust_id,
                agent_name="VoiceAgent (Priya Live)",
                action_type=ActionType.PROMISE_TO_PAY_RECORDED,
                status=AuditStatus.SUCCESS,
                input_payload=json.dumps({"promise_date": pdate, "note": note}),
                output_payload=json.dumps({"recorded": True, "date": pdate}),
            )
            db_session.add(audit)
            res = await db_session.execute(select(Transaction).where(Transaction.id.contains(txn_id)))
            txn_obj = res.scalars().first()
            if txn_obj:
                txn_obj.promise_to_pay_date = pdate
                db_session.add(txn_obj)
            await db_session.commit()
        return {
            "status": "recorded",
            "promise_date": pdate,
            "note": note,
            "commitment_logged": True,
            "message": f"Promise to Pay commitment recorded for {pdate}",
        }

    return {"status": "success", "tool": tool_name}


@router.websocket("/media-stream/{session_id}")
async def telephony_media_stream_websocket(
    websocket: WebSocket,
    session_id: str,
):
    """
    WebSocket handling real-time bidirectional telephony audio from Twilio / Exotel.
    Receives G.711 μ-law (8kHz), converts to PCM (16kHz), sends to Gemini Live API,
    and returns Gemini's synthesized voice back to the caller in real time.
    """
    await websocket.accept()
    logger.info(f"Telephony Media Stream connected for session {session_id}")

    # Fetch context from session_id
    customer_id = None
    customer_name = "Customer"
    customer_phone = "+919876543210"
    customer_email = "customer@example.com"
    order_amount = 14999.0
    failure_reason = "Checkout Dropout - Bank Timeout"
    discount_percent = 0.0
    raw_txn_id = session_id.replace("voice_", "").split("_")[0]

    try:
        async with async_session_maker() as session:
            res = await session.execute(select(Transaction).where(Transaction.id.contains(raw_txn_id)))
            txn = res.scalars().first()
            if txn:
                raw_txn_id = txn.id
                customer_id = txn.customer_id
                order_amount = txn.amount
                failure_reason = txn.failure_reason or "Checkout Dropout"
                discount_percent = txn.discount_applied_percent or 0.0
                cust_res = await session.execute(select(Customer).where(Customer.id == txn.customer_id))
                cust = cust_res.scalar_one_or_none()
                if cust:
                    customer_name = cust.name
                    customer_phone = cust.phone
                    customer_email = getattr(cust, "email", "customer@example.com") or "customer@example.com"
    except Exception as e:
        logger.warning(f"Error resolving transaction context for telephony {session_id}: {e}")

    # Dynamic Tool Execution Callback
    async def telephony_tool_handler(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        return await execute_voice_dispatch_tool(
            tool_name=tool_name,
            args=args,
            session_id=session_id,
            txn_id=raw_txn_id,
            cust_id=customer_id,
            cust_name=customer_name,
            cust_phone=customer_phone,
            cust_email=customer_email,
            amount=order_amount,
            default_discount=discount_percent,
        )

    stream_sid: Optional[str] = None
    live_session = GeminiLiveSession(
        session_id=session_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_email=customer_email,
        order_amount=order_amount,
        failure_reason=failure_reason,
        discount_percent=discount_percent,
        on_tool_call=telephony_tool_handler,
    )
    await live_session.connect()

    async def forward_gemini_to_telephony():
        """Reads Gemini 24kHz audio stream and sends G.711 μ-law to Twilio."""
        try:
            async for event in live_session.receive_stream():
                if event.get("type") == "audio" and stream_sid:
                    pcm_24k = event["pcm_24k"]
                    # Resample 24kHz -> 8kHz
                    pcm_8k = resample_pcm16(pcm_24k, src_rate=24000, dst_rate=8000)
                    mulaw_bytes = pcm16_to_mulaw(pcm_8k)
                    b64_mulaw = base64.b64encode(mulaw_bytes).decode("utf-8")

                    out_packet = {
                        "event": "media",
                        "streamSid": stream_sid,
                        "media": {"payload": b64_mulaw},
                    }
                    await websocket.send_text(json.dumps(out_packet))
        except Exception as e:
            logger.warning(f"Error in Gemini->Telephony pipeline: {e}")

    gemini_task = asyncio.create_task(forward_gemini_to_telephony())

    try:
        while True:
            msg_text = await websocket.receive_text()
            data = json.loads(msg_text)
            event_type = data.get("event")

            if event_type == "start":
                stream_sid = data.get("streamSid")
                logger.info(f"Telephony stream started: streamSid {stream_sid}")
                # AI Agent speaks FIRST as soon as phone call stream begins
                await live_session.trigger_first_turn()

            elif event_type == "media":
                media_payload = data.get("media", {}).get("payload")
                if media_payload:
                    mulaw_chunk = base64.b64decode(media_payload)
                    # Convert 8kHz mulaw -> 8kHz PCM16 -> 16kHz PCM16 for Gemini
                    pcm_8k = mulaw_to_pcm16(mulaw_chunk)
                    pcm_16k = resample_pcm16(pcm_8k, src_rate=8000, dst_rate=16000)
                    await live_session.send_audio_chunk(pcm_16k)

            elif event_type == "stop":
                logger.info(f"Telephony stream stopped for session {session_id}")
                break

    except WebSocketDisconnect:
        logger.info(f"Telephony WebSocket disconnected for {session_id}")
    finally:
        gemini_task.cancel()
        await live_session.close()


@router.websocket("/live-chat/{session_id}")
async def browser_live_chat_websocket(
    websocket: WebSocket,
    session_id: str,
    model: Optional[str] = Query(None),
    txn_id: Optional[str] = Query(None),
    customer_name: Optional[str] = Query(None),
    customer_phone: Optional[str] = Query(None),
    customer_email: Optional[str] = Query(None),
    order_amount: Optional[float] = Query(None),
    discount_percent: Optional[float] = Query(None),
    failure_reason: Optional[str] = Query(None),
):
    """
    Interactive Browser WebSocket for direct operator microphone testing with Gemini Live API.
    Streams customer speech from browser mic, and returns live agent voice and transcript subtitles.
    AI Agent (Gemini / Priya) speaks FIRST immediately on connection with exact payment context.
    """
    await websocket.accept()
    logger.info(f"Browser Live Chat connected for session {session_id} (model: {model}, txn_id: {txn_id}, customer: {customer_name})")

    resolved_txn_id = txn_id or session_id.replace("voice_", "").replace("call_", "").replace("live_", "").split("_")[0]
    resolved_customer_id = None
    resolved_customer_name = customer_name or "Deepak Gupta"
    resolved_customer_phone = customer_phone or "+919876543210"
    resolved_customer_email = customer_email or "customer@example.com"
    resolved_order_amount = float(order_amount) if order_amount is not None else 14999.0
    resolved_failure_reason = failure_reason or "Checkout Dropout - Bank OTP Timeout"
    resolved_discount_percent = float(discount_percent) if discount_percent is not None else 0.0

    try:
        async with async_session_maker() as session:
            txn = None
            if resolved_txn_id and not resolved_txn_id.isdigit():
                res = await session.execute(select(Transaction).where(Transaction.id.contains(resolved_txn_id)))
                txn = res.scalars().first()
            if not txn and resolved_txn_id and not resolved_txn_id.isdigit():
                res = await session.execute(select(Transaction).where(Transaction.razorpay_order_id.contains(resolved_txn_id)))
                txn = res.scalars().first()
            if not txn and order_amount is None:
                # Load latest transaction from DB
                res = await session.execute(select(Transaction).order_by(Transaction.created_at.desc()).limit(1))
                txn = res.scalars().first()

            if txn:
                resolved_txn_id = txn.id
                resolved_customer_id = txn.customer_id
                if order_amount is None:
                    resolved_order_amount = txn.amount
                if failure_reason is None:
                    resolved_failure_reason = txn.failure_reason or "Checkout Dropout"
                if discount_percent is None:
                    resolved_discount_percent = txn.discount_applied_percent or 0.0

                cust_res = await session.execute(select(Customer).where(Customer.id == txn.customer_id))
                cust = cust_res.scalar_one_or_none()
                if cust:
                    if not customer_name:
                        resolved_customer_name = cust.name
                    if not customer_phone:
                        resolved_customer_phone = cust.phone
                    if not customer_email:
                        resolved_customer_email = getattr(cust, "email", "customer@example.com") or "customer@example.com"
    except Exception as e:
        logger.warning(f"Error resolving transaction context for session {session_id}: {e}")

    logger.info(
        f"Resolved Live Voice Context: Cust='{resolved_customer_name}', Amount=INR {resolved_order_amount}, "
        f"Reason='{resolved_failure_reason}', Discount={resolved_discount_percent}%, Txn='{resolved_txn_id}'"
    )

    # Tool execution callback for live function calls
    async def handle_live_tool_call(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        return await execute_voice_dispatch_tool(
            tool_name=tool_name,
            args=args,
            session_id=session_id,
            txn_id=resolved_txn_id,
            cust_id=resolved_customer_id,
            cust_name=resolved_customer_name,
            cust_phone=resolved_customer_phone,
            cust_email=resolved_customer_email,
            amount=resolved_order_amount,
            default_discount=resolved_discount_percent,
        )

    active_model = model or getattr(settings, "GEMINI_LIVE_MODEL", "models/gemini-2.0-flash-exp")
    live_session = GeminiLiveSession(
        session_id=session_id,
        customer_name=resolved_customer_name,
        customer_phone=resolved_customer_phone,
        customer_email=resolved_customer_email,
        order_amount=resolved_order_amount,
        failure_reason=resolved_failure_reason,
        discount_percent=resolved_discount_percent,
        model_name=active_model,
        on_tool_call=handle_live_tool_call,
    )
    await live_session.connect()

    # Send initial connected handshake to browser
    await websocket.send_text(json.dumps({
        "event": "connected",
        "session_id": session_id,
        "status": live_session.connection_status,
        "model": active_model if not live_session._mock_mode else "Kokoro Neural Voice (Local)",
        "customer_name": resolved_customer_name,
        "customer_phone": resolved_customer_phone,
        "customer_email": resolved_customer_email,
        "order_amount": resolved_order_amount,
        "discount_percent": resolved_discount_percent,
        "failure_reason": resolved_failure_reason,
        "error_note": live_session.connection_error,
    }))

    async def forward_gemini_to_browser():
        """Forwards Gemini audio chunks and transcript tokens to browser UI."""
        try:
            async for event in live_session.receive_stream():
                if event.get("type") == "transcript":
                    await websocket.send_text(json.dumps({
                        "event": "transcript",
                        "speaker": event["speaker"],
                        "text": event["text"],
                    }))
                elif event.get("type") == "audio":
                    pcm_24k = event["pcm_24k"]
                    b64_pcm = base64.b64encode(pcm_24k).decode("utf-8")
                    await websocket.send_text(json.dumps({
                        "event": "audio",
                        "pcm_base64": b64_pcm,
                        "sample_rate": 24000,
                    }))
                elif event.get("type") == "tool_executed":
                    await websocket.send_text(json.dumps({
                        "event": "tool_executed",
                        "tool_name": event["tool_name"],
                        "arguments": event["arguments"],
                        "result": event["result"],
                    }))
        except Exception as e:
            logger.warning(f"Error in Gemini->Browser stream: {e}")

    gemini_task = asyncio.create_task(forward_gemini_to_browser())

    # Trigger AI Agent (Gemini) to speak FIRST immediately!
    await live_session.trigger_first_turn()

    try:
        while True:
            msg_text = await websocket.receive_text()
            data = json.loads(msg_text)
            event_type = data.get("event")

            if event_type == "audio_chunk":
                # Raw 16kHz PCM audio chunk from browser mic
                b64_pcm = data.get("pcm_base64")
                if b64_pcm:
                    pcm_chunk = base64.b64decode(b64_pcm)
                    await live_session.send_audio_chunk(pcm_chunk)

            elif event_type == "user_transcript":
                # Optional client-side transcription
                text = data.get("text", "")
                await websocket.send_text(json.dumps({
                    "event": "transcript",
                    "speaker": "Customer",
                    "text": text,
                }))

            elif event_type == "end_call":
                logger.info(f"Browser ended live call session {session_id}")
                break

    except WebSocketDisconnect:
        logger.info(f"Browser Live WebSocket disconnected for {session_id}")
    finally:
        gemini_task.cancel()
        await live_session.close()
