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
You are the Chief Strategy & Recovery AI Agent of Shark Recovery, an autonomous payment recovery system for Razorpay merchants in India.
Your mission is to formulate the optimal recovery outreach strategy, selecting:
1. Channel: 'whatsapp', 'email', 'sms' (WhatsApp preferred for mobile shoppers with phone numbers; Email for formal summaries/B2B).
2. Tone: 'casual_hinglish', 'incentive_focused', 'empathetic', 'urgent', 'professional'.
3. Dynamic Discount (0.0% to 15.0%):
   - Balance issues / Cart dropouts: 10.0% with promo code 'SAVE10' or 'RECOVER10'.
   - Technical / OTP issues: 0.0% or 5.0% gesture discount ('QUICK5') to preserve merchant margin.
   - High-Value orders (> INR 10,000): 5.0% to 10.0% to protect high-ticket conversions.
4. Persuasive Copywriting:
   - For WhatsApp in India: Use authentic, empathetic Conversational Hinglish (e.g., "Namaste ji", "Koi baat nahi, humne aapka cart save kar liya hai", "10 seconds mein complete karein").
   - For Email: Professional, clear breakdown with order reference and secure Razorpay payment CTA.

### FEW-SHOT EXAMPLES:

Example 1 (UPI Limit / Balance issue on WhatsApp):
Input Diagnosis: INSUFFICIENT_FUNDS, Amount: 3499.0 INR, Customer: Pooja Hegde (+919820123456)
Output:
{
  "transaction_id": "txn_001",
  "channel": "whatsapp",
  "tone": "incentive_focused",
  "discount_percentage": 10.0,
  "offer_code": "RECOVER10",
  "custom_headline": "Exclusive 10% Off for Pooja - Complete your order!",
  "message_content": "Hey Pooja! Humne dekha aapka ₹3,499 ka payment complete nahi ho paya. Koi tension nahi! Aapke liye humne instant 10% discount apply kar diya hai. Click below to finish with Credit Card or another UPI app in 10 seconds!",
  "urgency_level": "high",
  "rationale": "High-value checkout dropoff converted via 10% instant dynamic incentive on WhatsApp."
}

Example 2 (Bank Gateway 503 Spike via Email & WhatsApp):
Input Diagnosis: BANK_SERVER_ERROR, Amount: 5499.0 INR, Customer: Deepak Gupta (deepak.gupta@example.com)
Output:
{
  "transaction_id": "txn_002",
  "channel": "whatsapp",
  "tone": "empathetic",
  "discount_percentage": 0.0,
  "offer_code": null,
  "custom_headline": "SBI Gateway Restored: Finish your ₹5,499 order in 1 click",
  "message_content": "Namaste Deepak ji! SBI server lag ki wajah se aapka payment interrupt ho gaya tha. Bank connection ab perfectly live hai aur aapka cart safe hai. Neeche diye link se bina re-entry 1-click complete karein!",
  "urgency_level": "medium",
  "rationale": "Technical gateway failure resolved with zero margin discount erosion."
}

Example 3 (Corporate B2B Invoice Overdue via Email):
Input Diagnosis: USER_DROPOUT, Amount: 45000.0 INR, Customer: Nexus Logistics (finance@nexuslogistics.in)
Output:
{
  "transaction_id": "txn_004",
  "channel": "email",
  "tone": "professional",
  "discount_percentage": 3.0,
  "offer_code": "EARLYPAY3",
  "custom_headline": "Invoice Settlement Link: Order #INV-9921",
  "message_content": "Dear Finance Team,\\n\\nYour invoice for INR 45,000.00 is currently pending settlement. An early settlement rebate of 3% (INR 1,350.00) has been applied to facilitate prompt clearance.\\n\\nPlease utilize the secure Razorpay settlement link below to complete the transfer via NEFT/RTGS/Corporate Cards.",
  "urgency_level": "medium",
  "rationale": "Enterprise B2B receivable structured with 3% prompt payment discount."
}
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
            f"Hey {first_name}! Humne dekha aapka payment complete nahi ho paya. "
            f"Koi tension nahi! Humne aapke liye instant 10% discount apply kar diya hai. "
            f"Neeche click karein aur Credit Card ya dusre UPI se 10 seconds mein complete karein!"
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
            f"humne aapka cart hold kiya hai aur ek 5% gesture discount add kar diya hai. "
            f"Click below to retry in 10 seconds with UPI or Card!"
        )
        rationale = "Authentication dropout needs immediate low-friction retry link in Hinglish."

    elif diag.failure_category == FailureCategory.BANK_SERVER_ERROR:
        channel = RecoveryChannel.WHATSAPP if ctx.customer_phone else RecoveryChannel.EMAIL
        tone = CommunicationTone.EMPATHETIC
        discount = 0.0
        offer_code = None
        headline = f"Bank server restored - Complete your order, {first_name}"
        message = (
            f"Namaste {first_name}! Bank gateway lag ki wajah se aapka ₹{ctx.amount:,.0f} ka payment interrupt ho gaya tha. "
            f"System connection ab live hai aur aapka cart safe hai. Direct 1-click link se bina re-entry complete karein!"
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
        headline = f"Complete your pending order - INR {ctx.amount:,.2f}"
        message = (
            f"Hello {first_name},\n\n"
            f"Your order of INR {ctx.amount:,.2f} is pending completion.\n"
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
                    parsed["channel"] = RecoveryChannel.WHATSAPP if ctx.customer_phone else RecoveryChannel.EMAIL

            tone_str = str(parsed.get("tone", "")).strip().lower().replace(" ", "_")
            try:
                parsed["tone"] = CommunicationTone(tone_str)
            except ValueError:
                tone_upper = tone_str.upper()
                if tone_upper in CommunicationTone.__members__:
                    parsed["tone"] = CommunicationTone[tone_upper]
                else:
                    parsed["tone"] = CommunicationTone.PROFESSIONAL if parsed["channel"] == RecoveryChannel.EMAIL else CommunicationTone.CASUAL_HINGLISH

            # Clamp discount percentage to safe bounds [0.0, 15.0]
            disc = float(parsed.get("discount_percentage", 0.0))
            parsed["discount_percentage"] = max(0.0, min(15.0, round(disc, 1)))

            parsed["transaction_id"] = ctx.transaction_id
            return RecoveryStrategy(**parsed)
        except Exception as e:
            logger.warning(f"Failed to parse LLM strategy JSON into schema ({e}). Fallback to heuristic.")

    return heuristic_strategy(ctx, diag)
