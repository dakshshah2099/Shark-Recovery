"""
test_voice_stream.py
Unit tests for Telephony Codec, Gemini Multimodal Live Session, and Outbound Call API.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlmodel import select
from backend.main import app
from backend.database import async_session_maker
from backend.models.transaction import Transaction
from backend.tools.telephony_codec import (
    mulaw_to_pcm16,
    pcm16_to_mulaw,
    resample_pcm16,
)
from backend.tools.gemini_live_client import GeminiLiveSession


def test_telephony_codec_roundtrip():
    """Verifies that G.711 μ-law and 16-bit PCM conversion preserves audio frame integrity."""
    # Test silence / zero values
    pcm_silence = b"\x00\x00" * 100
    mulaw = pcm16_to_mulaw(pcm_silence)
    assert len(mulaw) == 100
    recovered_pcm = mulaw_to_pcm16(mulaw)
    assert len(recovered_pcm) == 200

    # Test sine wave-like audio bytes
    test_pcm = bytes([i % 256 for i in range(320)])  # 160 samples (20ms @ 8kHz)
    mulaw_encoded = pcm16_to_mulaw(test_pcm)
    assert len(mulaw_encoded) == 160
    pcm_decoded = mulaw_to_pcm16(mulaw_encoded)
    assert len(pcm_decoded) == 320


def test_resample_pcm16():
    """Verifies audio resampling between telephony 8kHz and Gemini 16kHz/24kHz."""
    # 8000Hz (160 samples = 320 bytes = 20ms) -> 16000Hz (320 samples = 640 bytes)
    pcm_8k = b"\x10\x00" * 160
    pcm_16k = resample_pcm16(pcm_8k, src_rate=8000, dst_rate=16000)
    assert len(pcm_16k) == 640

    # 24000Hz (480 samples = 960 bytes = 20ms) -> 8000Hz (160 samples = 320 bytes)
    pcm_24k = b"\x20\x00" * 480
    pcm_8k_down = resample_pcm16(pcm_24k, src_rate=24000, dst_rate=8000)
    assert len(pcm_8k_down) == 320


@pytest.mark.asyncio
async def test_gemini_live_session_setup():
    """Verifies GeminiLiveSession system prompt, tool definitions, and simulated connect."""
    session = GeminiLiveSession(
        session_id="test_sess_01",
        customer_name="Priya Sharma",
        customer_phone="+919876543210",
        order_amount=14999.0,
        failure_reason="Checkout Dropout - Gateway 503",
        discount_percent=10.0,
    )
    prompt = session._build_system_instruction()
    assert "Priya" in prompt
    assert "10%" in prompt
    assert "bol rahi hoon" in prompt

    tools = session._build_tools_declaration()
    assert len(tools) > 0
    fn_names = [fn["name"] for fn in tools[0]["functionDeclarations"]]
    assert "dispatch_recovery_link" in fn_names
    assert "record_promise_to_pay" in fn_names

    connected = await session.connect()
    assert connected is True
    await session.close()


@pytest.mark.asyncio
async def test_twiml_endpoint():
    """Verifies that the /api/voice/twiml endpoint generates valid TwiML with media stream URL."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/voice/twiml?session_id=sess_test123")
        assert resp.status_code == 200
        assert "application/xml" in resp.headers.get("content-type", "")
        assert "<Response>" in resp.text
        assert "<Stream" in resp.text
        assert "sess_test123" in resp.text


@pytest.mark.asyncio
async def test_outbound_call_endpoint():
    """Verifies that the /api/voice/outbound-call endpoint queries DB and returns 200 without error."""
    import uuid
    from backend.database import async_session_maker
    from backend.models.customer import Customer
    from backend.models.transaction import Transaction, TransactionStatus

    txn_id = f"txn_test_{uuid.uuid4().hex[:6]}"
    cust_id = f"cust_test_{uuid.uuid4().hex[:6]}"
    async with async_session_maker() as session:
        cust = Customer(id=cust_id, name="Test Outbound Cust", phone="+919876543210", email="test@example.com")
        session.add(cust)
        txn = Transaction(
            id=txn_id,
            customer_id=cust_id,
            razorpay_order_id=f"order_{uuid.uuid4().hex[:8]}",
            amount=5000.0,
            status=TransactionStatus.FAILED,
            failure_reason="Checkout Dropout",
        )
        session.add(txn)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Case 1: Browser simulation provider returns success=True
        resp = await client.post(
            "/api/voice/outbound-call",
            json={
                "transaction_id": txn_id,
                "provider": "simulation_browser",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "session_id" in data

        # Case 2: Twilio trial account restriction returns success=False with diagnostic guidance
        resp_tw = await client.post(
            "/api/voice/outbound-call",
            json={
                "transaction_id": txn_id,
                "customer_phone": "+919876543210",
                "provider": "twilio",
            },
        )
        assert resp_tw.status_code == 200
        data_tw = resp_tw.json()
        assert data_tw["success"] is False
        assert data_tw["status"] in ("failed", "unconfigured")
        assert "Twilio" in data_tw["message"]
        assert "Live Mic Interactive Call" in data_tw["message"]


@pytest.mark.asyncio
async def test_screen_and_confirm_promise_to_pay():
    """Verifies PTP screening recommendations and Hinglish Voice Agent confirmation workflow."""
    from backend.models.customer import Customer
    from backend.models.transaction import FailureCategory, TransactionStatus

    async with async_session_maker() as session:
        cust = Customer(name="PTP Test User", email="ptp_user@example.com", phone="+919876599999", risk_score=0.1)
        session.add(cust)
        await session.commit()
        await session.refresh(cust)

        txn = Transaction(
            razorpay_order_id="order_ptp_fresh_001",
            customer_id=cust.id,
            amount=3500.0,
            status=TransactionStatus.FAILED,
            failure_category=FailureCategory.INSUFFICIENT_FUNDS,
            failure_reason="Daily limit exceeded",
            retry_count=0,
            max_retries=3,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)
        txn_id = txn.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test Screen PTP
        screen_resp = await client.get(f"/api/voice/screen-ptp/{txn_id}")
        assert screen_resp.status_code == 200
        screen_data = screen_resp.json()
        assert screen_data["transaction_id"] == txn_id
        assert len(screen_data["recommended_windows"]) >= 2
        assert "Namaste" in screen_data["recommended_script"]
        assert screen_data["is_eligible_for_ptp"] is True

        # 2. Test Confirm PTP
        confirm_resp = await client.post(
            "/api/voice/confirm-ptp",
            json={
                "transaction_id": txn_id,
                "promise_date": "Tomorrow 10:30 AM IST",
                "payment_method": "UPI DeepLink",
                "discount_percent": 10.0,
            },
        )
        assert confirm_resp.status_code == 200
        confirm_data = confirm_resp.json()
        assert confirm_data["success"] is True
        assert confirm_data["promise_to_pay_date"] == "Tomorrow 10:30 AM IST"
        assert "Shukriya" in confirm_data["confirmation_speech"]
        assert confirm_data["final_amount"] > 0
        assert confirm_data["status"] == "CONFIRMED"

