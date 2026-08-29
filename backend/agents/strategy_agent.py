import logging
from typing import Optional
from pydantic_ai import Agent
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

logger = logging.getLogger(__name__)

STRATEGY_SYSTEM_PROMPT = """
You are the Chief Strategy & Recovery Agent of an autonomous Revenue Recovery system.
Your job is to select the optimal outreach channel (email, whatsapp, sms), communication tone (casual_hinglish, urgent, empathetic, incentive_focused, professional), and dynamic incentive discount (0% to 15%) to recover failed payments.

Decision Rules:
1. High-Value Mobile Shoppers (Amount >= 1500 INR or phone available): Prioritize WhatsApp with casual_hinglish or incentive_focused tone.
2. Insufficient Funds / Abandoned Carts: Offer a 10% instant checkout discount with promo code 'SAVE10' or 'RECOVER10'.
3. Technical / Bank Errors: Tone should be empathetic/reassuring, discount 0% or 5% gesture, focus on smooth 1-click retry.
4. Corporate / Email preferred: Use professional tone with detailed order summary.

Output strictly conforms to the RecoveryStrategy schema.
"""


def _get_agent() -> Optional[Agent]:
    api_key = settings.GOOGLE_API_KEY or settings.GEMINI_API_KEY
    if api_key:
        try:
            return Agent(
                settings.LLM_MODEL,
                output_type=RecoveryStrategy,
                system_prompt=STRATEGY_SYSTEM_PROMPT,
            )
        except Exception as e:
            logger.warning(f"Could not initialize Gemini Agent for Strategy ({e}). Using rule-based fallback.")
            return None
    return None


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
    """Executes the Strategy Selection Agent with LLM fallback to deterministic rules."""
    agent = _get_agent()
    if agent:
        try:
            prompt = (
                f"Select recovery strategy for:\n"
                f"Customer Context: {ctx.model_dump_json(indent=2)}\n"
                f"Diagnosis: {diag.model_dump_json(indent=2)}"
            )
            result = await agent.run(prompt)
            if isinstance(result.data, RecoveryStrategy):
                return result.data
        except Exception as e:
            logger.warning(f"Strategy LLM call failed: {e}. Executing heuristic fallback.")

    return heuristic_strategy(ctx, diag)
