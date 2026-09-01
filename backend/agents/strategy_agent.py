import logging
from typing import Optional

try:
    from backend.config import settings
    from backend.models.schemas import (
        CommunicationTone,
        DiagnosticContext,
        FailureDiagnosis,
        RecoveryChannel,
        RecoveryStrategy,
    )
    from backend.models.transaction import FailureCategory
    from backend.tools.llm_client import complete_json_prompt
except ImportError:
    from config import settings
    from models.schemas import (
        CommunicationTone,
        DiagnosticContext,
        FailureDiagnosis,
        RecoveryChannel,
        RecoveryStrategy,
    )
    from models.transaction import FailureCategory
    from tools.llm_client import complete_json_prompt

logger = logging.getLogger(__name__)

STRATEGY_SYSTEM_PROMPT = """
You are the Chief Strategy & Recovery Agent of an autonomous Revenue Recovery system.
Your job is to select the optimal outreach channel (email, whatsapp, sms), communication tone (casual_hinglish, urgent, empathetic, incentive_focused, professional), and dynamic incentive discount (0% to 15%) to recover failed payments.

Decision Rules:
1. High-Value Mobile Shoppers (Amount >= 1500 INR or phone available): Prioritize WhatsApp with casual_hinglish or incentive_focused tone.
2. Insufficient Funds / Abandoned Carts: Offer a 10% instant checkout discount with promo code 'SAVE10' or 'RECOVER10'.
3. Technical / Bank Errors: Tone should be empathetic/reassuring, discount 0% or 5% gesture, focus on smooth 1-click retry.
4. Corporate / Email preferred: Use professional tone with detailed order summary.
"""


def heuristic_strategy(ctx: DiagnosticContext, diag: FailureDiagnosis) -> RecoveryStrategy:
    """Deterministic, high-conversion strategy engine."""
    first_name = ctx.customer_name.split()[0] if ctx.customer_name else "there"

    if diag.failure_category == FailureCategory.INSUFFICIENT_FUNDS:
        channel = RecoveryChannel.WHATSAPP if ctx.customer_phone else RecoveryChannel.EMAIL
        tone = CommunicationTone.INCENTIVE_FOCUSED
        discount = 10.0
        offer_code = "RECOVER10"
        headline = f"Exclusive 10% Off for {first_name} - Complete your order!"
        message = (
            f"Hey {first_name}! We noticed your payment didn't go through. "
            f"Here's an exclusive 10% discount to help you complete your order. "
            f"Use code RECOVER10 or click below to finish checkout with UPI/Cards!"
        )
        rationale = "High churn risk due to balance constraint; 10% dynamic discount triggers instant checkout completion."

    elif diag.failure_category == FailureCategory.AUTHENTICATION_FAILED:
        channel = RecoveryChannel.WHATSAPP if ctx.customer_phone else RecoveryChannel.EMAIL
        tone = CommunicationTone.CASUAL_HINGLISH
        discount = 5.0
        offer_code = "QUICK5"
        headline = f"Payment stuck? Complete in 1 click, {first_name}!"
        message = (
            f"Hi {first_name}! OTP expire ho gaya tha kya? Koi baat nahi, "
            f"humne aapka cart save kar liya hai. Click below to retry in 10 seconds with UPI or Card!"
        )
        rationale = "Authentication dropout needs immediate low-friction retry link in Hinglish."

    elif diag.failure_category == FailureCategory.BANK_SERVER_ERROR:
        channel = RecoveryChannel.EMAIL if ctx.customer_email else RecoveryChannel.WHATSAPP
        tone = CommunicationTone.EMPATHETIC
        discount = 0.0
        offer_code = None
        headline = "Bank gateway issue resolved - Retry your order"
        message = (
            f"Dear {first_name},\n\n"
            f"We noticed your recent payment of INR {ctx.amount:.2f} was interrupted due to a temporary bank server issue.\n"
            f"The connection is now restored. You can securely complete your transaction using the link below without re-entering items."
        )
        rationale = "Technical failure requires empathetic reassurance without eroding margin."

    elif diag.failure_category == FailureCategory.USER_DROPOUT:
        channel = RecoveryChannel.WHATSAPP if ctx.customer_phone else RecoveryChannel.EMAIL
        tone = CommunicationTone.CASUAL_HINGLISH
        discount = 10.0
        offer_code = "SPECIAL10"
        headline = f"Items waiting in your cart, {first_name}!"
        message = (
            f"Hey {first_name}! Aapka cart miss kar raha hai aapko. "
            f"Special 10% discount apply kar diya hai. Click the link to grab your items before stock runs out!"
        )
        rationale = "Abandoned carts respond best to Hinglish urgency with 10% incentive."

    else:
        channel = RecoveryChannel.EMAIL
        tone = CommunicationTone.PROFESSIONAL
        discount = 5.0
        offer_code = "RENEW5"
        headline = f"Complete your pending order - INR {ctx.amount:.2f}"
        message = (
            f"Hello {first_name},\n\n"
            f"Your order of INR {ctx.amount:.2f} is pending. "
            f"Please click below to finalize your payment securely via Razorpay."
        )
        rationale = "Standard professional follow-up for uncategorized transaction dropouts."

    return RecoveryStrategy(
        transaction_id=ctx.transaction_id,
        channel=channel,
        tone=tone,
        discount_percentage=discount,
        offer_code=offer_code,
        custom_headline=headline,
        message_content=message,
        urgency_level="high" if discount > 0 else "medium",
        rationale=rationale,
    )


async def run_strategy_agent(ctx: DiagnosticContext, diag: FailureDiagnosis) -> RecoveryStrategy:
    """Executes the Strategy Selection Agent with LiteLLM/OpenAI and heuristic fallback."""
    user_prompt = f"""
Select an optimal recovery strategy and return a JSON object matching this schema:
{{
  "transaction_id": "{ctx.transaction_id}",
  "channel": "one of: email, whatsapp, sms",
  "tone": "one of: urgent, empathetic, casual_hinglish, incentive_focused, professional",
  "discount_percentage": float between 0.0 and 15.0,
  "offer_code": "discount code or null",
  "custom_headline": "catchy headline string",
  "message_content": "persuasive recovery message text (Hinglish or English)",
  "urgency_level": "one of: low, medium, high",
  "rationale": "strategic justification string"
}}

Customer Context:
{ctx.model_dump_json(indent=2)}

Failure Diagnosis:
{diag.model_dump_json(indent=2)}
"""
    parsed = await complete_json_prompt(STRATEGY_SYSTEM_PROMPT, user_prompt)
    if parsed:
        try:
            chan_str = str(parsed.get("channel", "")).strip().lower()
            try:
                parsed["channel"] = RecoveryChannel(chan_str)
            except ValueError:
                chan_upper = chan_str.upper()
                if chan_upper in RecoveryChannel.__members__:
                    parsed["channel"] = RecoveryChannel[chan_upper]
                else:
                    parsed["channel"] = RecoveryChannel.EMAIL if (ctx.amount >= 3000 or not ctx.customer_phone) else RecoveryChannel.WHATSAPP

            tone_str = str(parsed.get("tone", "")).strip().lower().replace(" ", "_")
            try:
                parsed["tone"] = CommunicationTone(tone_str)
            except ValueError:
                tone_upper = tone_str.upper()
                if tone_upper in CommunicationTone.__members__:
                    parsed["tone"] = CommunicationTone[tone_upper]
                else:
                    parsed["tone"] = CommunicationTone.PROFESSIONAL if parsed["channel"] == RecoveryChannel.EMAIL else CommunicationTone.CASUAL_HINGLISH

            parsed["transaction_id"] = ctx.transaction_id
            return RecoveryStrategy(**parsed)
        except Exception as e:
            logger.warning(f"Failed to parse LLM strategy JSON into schema ({e}). Fallback to heuristic.")

    return heuristic_strategy(ctx, diag)
