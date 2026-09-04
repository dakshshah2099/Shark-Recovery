import logging
import re
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
You are an empathetic, courteous Indian female AI Voice Recovery Specialist (Priya from Shark Recovery) for Razorpay merchants in India.
Your goal is to politely understand why a payment failed, offer immediate payment resolution assistance via a direct 1-click retry link, and secure a Promise-to-Pay commitment.

STRICT LINGUISTIC & GRAMMATICAL RULES:
1. Authentic Conversational Hinglish: Speak natural, polite, respectful Indian phone dialogue (e.g., "Namaste ji", "Koi baat nahi", "Aapka cart humne hold kiya hai").
2. FEMININE FIRST-PERSON GRAMMATICAL GENDER:
   - You are a FEMALE speaker. You must ALWAYS use feminine verb inflections when speaking in Hindi/Hinglish.
   - ALWAYS use: "bol rahi hoon" (NEVER "bol raha hoon"), "kar sakti hoon" (NEVER "kar sakta hoon"), "samajh sakti hoon" (NEVER "samajh sakta hoon"), "dekh sakti hoon", "bhej rahi hoon" / "bhej sakti hoon".
   - NEVER use masculine verb forms ("bol raha hoon", "kar sakta hoon", "samajh sakta hoon", "bhej raha hoon").

STRICT DISCOUNT & INCENTIVE TRUTH RULES:
3. IF DISCOUNT OFFERED IS 0% (OR NONE):
   - You MUST NOT mention the word "discount", "offer", "chhoot", "percent", or "0%".
   - Stating "0% discount" or "special discount" when no discount exists is STRICTLY FORBIDDEN and misleading.
   - Instead, reassure the customer that their cart and order are securely reserved on priority, and offer a direct 1-click retry link with smooth multi-rail payment options (UPI, Card, NetBanking).
4. IF DISCOUNT OFFERED IS GREATER THAN 0% (e.g. 5%, 10%, 15%):
   - Mention the exact discount incentive honestly and politely (e.g. "Humne aapke checkout ke liye ek special 10% discount apply kiya hai").
5. RBI Non-Harassment: Courteous, empathetic, helpful, non-coercive.
6. Return structured JSON matching the VoiceCallSession schema with a realistic 4-5 turn dialogue.
"""


def sanitize_voice_dialogue(
    dialogue: List[DialogueTurn],
    discount_percent: float,
) -> List[DialogueTurn]:
    """Ensures feminine grammatical gender and removes misleading 0% discount mentions from AI turns."""
    sanitized: List[DialogueTurn] = []
    for turn in dialogue:
        text = turn.text
        if turn.speaker == "AI_Agent":
            # Deterministically correct masculine Hindi verb inflections to feminine
            text = re.sub(r"\bbol\s+raha\s+hoon\b", "bol rahi hoon", text, flags=re.IGNORECASE)
            text = re.sub(r"\bbol\s+raha\s+hun\b", "bol rahi hoon", text, flags=re.IGNORECASE)
            text = re.sub(r"\bkar\s+sakta\s+hoon\b", "kar sakti hoon", text, flags=re.IGNORECASE)
            text = re.sub(r"\bkar\s+sakta\s+hun\b", "kar sakti hoon", text, flags=re.IGNORECASE)
            text = re.sub(r"\bsamajh\s+sakta\s+hoon\b", "samajh sakti hoon", text, flags=re.IGNORECASE)
            text = re.sub(r"\bsamajh\s+sakta\s+hun\b", "samajh sakti hoon", text, flags=re.IGNORECASE)
            text = re.sub(r"\bdekh\s+raha\s+hoon\b", "dekh rahi hoon", text, flags=re.IGNORECASE)
            text = re.sub(r"\bbhej\s+raha\s+hoon\b", "bhej rahi hoon", text, flags=re.IGNORECASE)
            text = re.sub(r"\bbata\s+raha\s+hoon\b", "bata rahi hoon", text, flags=re.IGNORECASE)
            text = re.sub(r"\bkoshish\s+kar\s+raha\s+hoon\b", "koshish kar rahi hoon", text, flags=re.IGNORECASE)

            # Strip misleading 0% discount mentions
            if discount_percent <= 0:
                text = re.sub(r"\b0\s*%\s*(discount|off|chhoot)\b", "cart reservation", text, flags=re.IGNORECASE)
                text = re.sub(r"\bspecial\s+0\s*%\s*discount\b", "cart reservation", text, flags=re.IGNORECASE)
                text = re.sub(r"\b0\s*percent\s*discount\b", "cart reservation", text, flags=re.IGNORECASE)
                text = re.sub(r"\bek\s+special\s+discount\b", "aapka cart", text, flags=re.IGNORECASE)

        sanitized.append(
            DialogueTurn(
                speaker=turn.speaker,
                text=text,
                emotion=turn.emotion,
                timestamp_sec=turn.timestamp_sec,
            )
        )
    return sanitized


def generate_heuristic_voice_session(
    ctx: DiagnosticContext,
    diag: FailureDiagnosis,
    discount_percent: float,
    payment_link: str,
) -> VoiceCallSession:
    """Deterministic, natural Hinglish voice recovery script with female gender agreement and honest discount handling."""
    first_name = ctx.customer_name.split()[0] if ctx.customer_name else "Customer"
    call_id = f"call_{ctx.transaction_id[:8]}"
    promise_time = (datetime.utcnow() + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M UTC")

    # Honest discount pitch vs cart reservation pitch
    if discount_percent > 0:
        offer_pitch = f"Humne aapka cart hold kiya hai aur ek special {discount_percent:.0f}% gesture discount apply kar diya hai. Kya main abhi WhatsApp aur SMS pe direct 1-click retry link bhej doon?"
    else:
        offer_pitch = "Humne aapka cart priority pe reserve rakha hai taaki aapka order cancel na ho. Kya main abhi WhatsApp aur SMS pe direct 1-click retry link bhej doon jisse aap UPI ya card se bina kisi delay ke complete kar sakein?"

    dialogue = [
        DialogueTurn(
            speaker="AI_Agent",
            text=f"Namaste {first_name} ji! Main Shark Recovery team se bol rahi hoon. Dekha aapka ₹{ctx.amount:,.0f} ka order checkout pe interrupt ho gaya tha. Kya main aapki koi help kar sakti hoon?",
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
            text=f"Bilkul samajh sakti hoon {first_name} ji, bank server latency ki wajah se OTP issue hua tha. {offer_pitch}",
            emotion="reassuring",
            timestamp_sec=16,
        ),
        DialogueTurn(
            speaker="Customer",
            text="Haan please link bhej dijiye, main agle aadhe ghante mein complete kar dunga.",
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
    discount_percent: float = 0.0,
    payment_link: str = "",
) -> VoiceCallSession:
    """Executes Hinglish Voice AI simulation with LLM reasoning and fallback."""
    if discount_percent > 0:
        discount_instruction = (
            f"DISCOUNT OFFERED: {discount_percent:.0f}%\n"
            f"- Explicitly mention the {discount_percent:.0f}% discount in the AI Agent's reassurance turn as an incentive."
        )
    else:
        discount_instruction = (
            f"DISCOUNT OFFERED: 0% (NO DISCOUNT)\n"
            f"- STRICT INSTRUCTION: DO NOT mention any discount, rebate, coupon, or percent off in the dialogue.\n"
            f"- DO NOT say '0% discount' or 'special discount'. Instead, offer cart reservation and seamless 1-click retry."
        )

    first_name = ctx.customer_name.split()[0] if ctx.customer_name else "Customer"
    user_prompt = f"""
Generate an empathetic, authentic 4-5 turn conversational Hinglish voice recovery call transcript for this transaction:
- Customer Name: {ctx.customer_name} ({ctx.customer_phone})
- Order Amount: INR {ctx.amount:,.2f}
- Failure Root Cause: {diag.root_cause} (Category: {diag.failure_category})
- {discount_instruction}
- AI AGENT GENDER: FEMALE (Priya from Shark Recovery). The AI Agent MUST ALWAYS speak in the FEMININE first-person grammatical gender in Hindi/Hinglish ('bol rahi hoon', 'kar sakti hoon', 'samajh sakti hoon', 'bhej rahi hoon'). NEVER use masculine verb forms ('bol raha hoon', 'kar sakta hoon').

Return valid JSON with:
{{
  "call_id": "call_{ctx.transaction_id[:8]}",
  "customer_name": "{ctx.customer_name}",
  "customer_phone": "{ctx.customer_phone}",
  "order_amount": {ctx.amount},
  "discount_offered": {discount_percent},
  "dialogue": [
    {{"speaker": "AI_Agent", "text": "Namaste {first_name} ji! Main Shark Recovery team se bol rahi hoon...", "emotion": "empathetic", "timestamp_sec": 2}},
    {{"speaker": "Customer", "text": "...", "emotion": "explaining", "timestamp_sec": 8}},
    {{"speaker": "AI_Agent", "text": "Bilkul samajh sakti hoon...", "emotion": "reassuring", "timestamp_sec": 16}},
    {{"speaker": "Customer", "text": "...", "emotion": "agreeing", "timestamp_sec": 24}},
    {{"speaker": "AI_Agent", "text": "Bahut badhiya! Link turant aapke phone pe bhej diya gaya hai. Dhanyawad ji!", "emotion": "confirming", "timestamp_sec": 30}}
  ],
  "customer_intent": "PROMISE_TO_PAY",
  "promise_to_pay_date": "2026-09-04 16:00 UTC",
  "call_outcome": "Promise to Pay Recorded",
  "call_duration_seconds": 34,
  "sms_payment_link_triggered": true
}}
"""
    parsed = await complete_json_prompt(VOICE_SYSTEM_PROMPT, user_prompt)
    if parsed and isinstance(parsed.get("dialogue"), list):
        try:
            raw_session = VoiceCallSession(**parsed)
            # Post-process dialogue to enforce 100% feminine grammatical gender and 0% discount truth
            sanitized_dialogue = sanitize_voice_dialogue(raw_session.dialogue, discount_percent)
            raw_session.dialogue = sanitized_dialogue
            return raw_session
        except Exception as e:
            logger.warning(f"Voice session parsing fallback ({e})")

    return generate_heuristic_voice_session(ctx, diag, discount_percent, payment_link)

