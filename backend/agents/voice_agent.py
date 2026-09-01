import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
try:
    from backend.models.schemas import DiagnosticContext, FailureDiagnosis
    from backend.tools.llm_client import complete_json_prompt
except ImportError:
    from models.schemas import DiagnosticContext, FailureDiagnosis
    from tools.llm_client import complete_json_prompt

logger = logging.getLogger(__name__)


class DialogueTurn(BaseModel):
    speaker: str  # "AI_Agent" or "Customer"
    text: str
    emotion: str  # "empathetic", "helpful", "reassuring", "confirming"
    timestamp_sec: int


class VoiceCallSession(BaseModel):
    call_id: str
    customer_name: str
    customer_phone: str
    order_amount: float
    discount_offered: float
    dialogue: List[DialogueTurn]
    customer_intent: str  # "PROMISE_TO_PAY", "DISCOUNT_ACCEPTED", "TECHNICAL_OBJECTION", "CALL_BACK_LATER"
    promise_to_pay_date: Optional[str]
    call_outcome: str
    call_duration_seconds: int
    sms_payment_link_triggered: bool


VOICE_SYSTEM_PROMPT = """
You are an empathetic, conversational Hinglish AI Voice Recovery Specialist for Razorpay merchants in India.
Your goal is to politely understand why a high-value payment failed, offer a reassuring instant retry link with a dynamic gesture discount, and secure a Promise-to-Pay commitment.

Rules:
1. Speak natural, polite, authentic conversational Hinglish (e.g., "Namaste ji", "Koi baat nahi", "Aapka cart save hai").
2. Do not be pushy or aggressive. Adhere to RBI non-harassment guidelines.
3. Return a structured JSON session with realistic 4-5 turn dialogue and intent classification.
"""


def generate_heuristic_voice_session(
    ctx: DiagnosticContext,
    diag: FailureDiagnosis,
    discount_percent: float,
    payment_link: str,
) -> VoiceCallSession:
    """Deterministic, natural Hinglish voice recovery script."""
    first_name = ctx.customer_name.split()[0] if ctx.customer_name else "Customer"
    call_id = f"call_{ctx.transaction_id[:8]}"
    promise_time = (datetime.utcnow() + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M UTC")

    dialogue = [
        DialogueTurn(
            speaker="AI_Agent",
            text=f"Namaste {first_name} ji! Main Shark Payment Care team se bol raha hoon. Dekha aapka ₹{ctx.amount:,.0f} ka order checkout pe interrupt ho gaya tha. Kya main aapki koi help kar sakta hoon?",
            emotion="empathetic",
            timestamp_sec=2,
        ),
        DialogueTurn(
            speaker="Customer",
            text="Haan, payment ke time bank ka OTP nahi aa raha tha toh maine app band kar di.",
            emotion="explaining",
            timestamp_sec=8,
        ),
        DialogueTurn(
            speaker="AI_Agent",
            text=f"Bilkul samajh sakta hoon {first_name} ji, bank server lag ki wajah se OTP issue hua tha. Humne aapka cart hold kiya hai aur ek special {discount_percent:.0f}% discount apply kar diya hai. Kya main abhi WhatsApp & SMS pe direct 1-click link bhej doon?",
            emotion="reassuring",
            timestamp_sec=16,
        ),
        DialogueTurn(
            speaker="Customer",
            text="Haan please bhej dijiye, main agle aadhe ghante mein card se complete kar dunga.",
            emotion="agreeing",
            timestamp_sec=24,
        ),
        DialogueTurn(
            speaker="AI_Agent",
            text=f"Bahut badhiya! Link turant aapke phone pe bhej diya gaya hai. Dhanyawad {first_name} ji, have a wonderful day!",
            emotion="confirming",
            timestamp_sec=30,
        ),
    ]

    return VoiceCallSession(
        call_id=call_id,
        customer_name=ctx.customer_name,
        customer_phone=ctx.customer_phone,
        order_amount=ctx.amount,
        discount_offered=discount_percent,
        dialogue=dialogue,
        customer_intent="PROMISE_TO_PAY",
        promise_to_pay_date=promise_time,
        call_outcome="Call Successful - Promise to Pay recorded & 1-click SMS/WhatsApp link dispatched",
        call_duration_seconds=34,
        sms_payment_link_triggered=True,
    )


async def run_voice_recovery_agent(
    ctx: DiagnosticContext,
    diag: FailureDiagnosis,
    discount_percent: float = 10.0,
    payment_link: str = "",
) -> VoiceCallSession:
    """Executes Hinglish Voice AI simulation with LLM reasoning and fallback."""
    user_prompt = f"""
Generate an empathetic 4-5 turn conversational Hinglish voice recovery call transcript for this transaction:
- Customer: {ctx.customer_name} ({ctx.customer_phone})
- Amount: INR {ctx.amount:.2f}
- Root Cause: {diag.root_cause} (Category: {diag.failure_category})
- Discount Offered: {discount_percent}%

Return valid JSON with:
{{
  "call_id": "call_{ctx.transaction_id[:8]}",
  "customer_name": "{ctx.customer_name}",
  "customer_phone": "{ctx.customer_phone}",
  "order_amount": {ctx.amount},
  "discount_offered": {discount_percent},
  "dialogue": [
    {{"speaker": "AI_Agent", "text": "...", "emotion": "empathetic", "timestamp_sec": 2}},
    {{"speaker": "Customer", "text": "...", "emotion": "explaining", "timestamp_sec": 8}},
    {{"speaker": "AI_Agent", "text": "...", "emotion": "reassuring", "timestamp_sec": 16}},
    {{"speaker": "Customer", "text": "...", "emotion": "agreeing", "timestamp_sec": 24}},
    {{"speaker": "AI_Agent", "text": "...", "emotion": "confirming", "timestamp_sec": 30}}
  ],
  "customer_intent": "PROMISE_TO_PAY",
  "promise_to_pay_date": "2026-09-02 14:00 UTC",
  "call_outcome": "Promise to Pay Recorded",
  "call_duration_seconds": 34,
  "sms_payment_link_triggered": true
}}
"""
    parsed = await complete_json_prompt(VOICE_SYSTEM_PROMPT, user_prompt)
    if parsed and isinstance(parsed.get("dialogue"), list):
        try:
            return VoiceCallSession(**parsed)
        except Exception as e:
            logger.warning(f"Voice session parsing fallback ({e})")

    return generate_heuristic_voice_session(ctx, diag, discount_percent, payment_link)
