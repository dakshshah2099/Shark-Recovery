import json
import logging
from typing import Optional
from pydantic_ai import Agent
try:
    from backend.config import settings
    from backend.models.schemas import DiagnosticContext, FailureDiagnosis
    from backend.models.transaction import FailureCategory
except ImportError:
    from config import settings
    from models.schemas import DiagnosticContext, FailureDiagnosis
    from models.transaction import FailureCategory

logger = logging.getLogger(__name__)

DIAGNOSTIC_SYSTEM_PROMPT = """
You are the Chief Diagnostic Agent of an autonomous Revenue Recovery system.
Your job is to analyze failed checkout transactions and payment gateway errors from Razorpay, diagnose root causes, assess churn/fraud risk (0.0 to 1.0), and decide if the transaction qualifies for automated recovery retry.

Categorization Guidelines:
- INSUFFICIENT_FUNDS: Customer lacked balance, card limit reached. (can_retry: true, risk: low-med)
- AUTHENTICATION_FAILED: OTP expired, 3DS verification failed, incorrect CVV. (can_retry: true, risk: low)
- BANK_SERVER_ERROR: Issuer bank or gateway downtime, 5xx gateway error. (can_retry: true, risk: low)
- EXPIRED_CARD: Card expired or invalid card details. (can_retry: true with alternate method, risk: med)
- USER_DROPOUT: Checkout session abandoned before completing authentication. (can_retry: true, risk: low)
- NETWORK_TIMEOUT: Latency or connection dropped mid-transaction. (can_retry: true, risk: low)
- PAYMENT_DECLINED: Gateway fraud flag or blocked card. (can_retry: false, risk: high)

Output strictly conforms to the FailureDiagnosis schema.
"""


def _get_agent() -> Optional[Agent]:
    api_key = settings.GOOGLE_API_KEY or settings.GEMINI_API_KEY
    if api_key:
        try:
            return Agent(
                settings.LLM_MODEL,
                output_type=FailureDiagnosis,
                system_prompt=DIAGNOSTIC_SYSTEM_PROMPT,
            )
        except Exception as e:
            logger.warning(f"Could not initialize Gemini Agent for Diagnostics ({e}). Using heuristic fallback.")
            return None
    return None


def heuristic_diagnosis(ctx: DiagnosticContext) -> FailureDiagnosis:
    """Deterministic, high-accuracy heuristic fallback classifier."""
    text = f"{ctx.failure_code or ''} {ctx.failure_reason or ''}".lower()

    if any(k in text for k in ["insufficient", "balance", "limit", "low_funds"]):
        category = FailureCategory.INSUFFICIENT_FUNDS
        root_cause = "Customer's account had insufficient funds or hit daily card limit."
        can_retry = True
        risk_score = 0.25
        rec_action = "Offer flexible payment link with alternative UPI/wallet options and small incentive."
    elif any(k in text for k in ["otp", "auth", "3ds", "cvv", "verification"]):
        category = FailureCategory.AUTHENTICATION_FAILED
        root_cause = "Customer did not complete OTP / 3DS authentication in time."
        can_retry = True
        risk_score = 0.15
        rec_action = "Send quick 1-click retry payment link via WhatsApp or SMS."
    elif any(k in text for k in ["fraud", "block", "blacklist", "stolen", "decline"]):
        category = FailureCategory.PAYMENT_DECLINED
        root_cause = "Risk flags or security block detected by payment gateway."
        can_retry = False
        risk_score = 0.90
        rec_action = "Do not auto-retry. Flag for merchant manual review."
    elif any(k in text for k in ["gateway", "bank", "server", "downtime", "500", "502", "503", "504"]):
        category = FailureCategory.BANK_SERVER_ERROR
        root_cause = "Issuer bank or gateway experienced temporary technical downtime."
        can_retry = True
        risk_score = 0.10
        rec_action = "Reassure customer with system recovery notification and valid retry link."
    elif any(k in text for k in ["expire", "expired", "invalid_card"]):
        category = FailureCategory.EXPIRED_CARD
        root_cause = "Payment card details were expired or invalid."
        can_retry = True
        risk_score = 0.35
        rec_action = "Prompt customer to retry using UPI, NetBanking, or a new card."
    elif any(k in text for k in ["timeout", "timed out", "network", "socket", "connection"]):
        category = FailureCategory.NETWORK_TIMEOUT
        root_cause = "Network connection timed out during gateway handshake."
        can_retry = True
        risk_score = 0.15
        rec_action = "Immediate retry link dispatched via preferred channel."
    else:
        category = FailureCategory.USER_DROPOUT
        root_cause = "Customer dropped out during payment window."
        can_retry = True
        risk_score = 0.20
        rec_action = "Send gentle abandoned cart recovery reminder."

    # Adjust risk score for previous failed attempts
    if ctx.previous_failed_attempts > 1:
        risk_score = min(1.0, risk_score + 0.2)

    return FailureDiagnosis(
        transaction_id=ctx.transaction_id,
        failure_category=category,
        root_cause=root_cause,
        can_retry=can_retry,
        risk_score=risk_score,
        recommended_action=rec_action,
        diagnostic_notes=f"Processed diagnostic triage for {ctx.customer_name} ({ctx.amount} INR).",
    )


async def run_diagnostic_agent(ctx: DiagnosticContext) -> FailureDiagnosis:
    """Executes the Diagnostic Agent with LLM fallback to deterministic rules."""
    agent = _get_agent()
    if agent:
        try:
            prompt = f"Diagnose the following failed transaction:\n{ctx.model_dump_json(indent=2)}"
            result = await agent.run(prompt)
            if isinstance(result.data, FailureDiagnosis):
                return result.data
        except Exception as e:
            logger.warning(f"Diagnostic LLM call failed: {e}. Executing heuristic fallback.")

    return heuristic_diagnosis(ctx)
