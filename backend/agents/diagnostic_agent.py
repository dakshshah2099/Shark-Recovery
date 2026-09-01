import json
import logging
from typing import Optional

try:
    from backend.config import settings
    from backend.models.schemas import DiagnosticContext, FailureDiagnosis
    from backend.models.transaction import FailureCategory
    from backend.tools.llm_client import complete_json_prompt
except ImportError:
    from config import settings
    from models.schemas import DiagnosticContext, FailureDiagnosis
    from models.transaction import FailureCategory
    from tools.llm_client import complete_json_prompt

logger = logging.getLogger(__name__)

DIAGNOSTIC_SYSTEM_PROMPT = """
You are the Chief Diagnostic AI Agent of Shark Recovery, an autonomous enterprise revenue recovery platform for Razorpay merchants in India.
Your mission is to perform root-cause triage on failed checkout transactions, categorize error codes, evaluate customer churn and fraud risk (0.00 to 1.00), and determine whether the transaction qualifies for automated recovery.

Categorization Guidelines:
1. INSUFFICIENT_FUNDS: Customer lacked balance or hit daily card/UPI debit limit. (can_retry: true, risk_score: 0.20-0.35)
2. AUTHENTICATION_FAILED: OTP expired, 3DS authentication dropped, incorrect CVV entered. (can_retry: true, risk_score: 0.10-0.20)
3. BANK_SERVER_ERROR: Issuer bank downtime, 500/502/503 gateway outage, CBS node lag. (can_retry: true, risk_score: 0.05-0.15)
4. EXPIRED_CARD: Card validity date expired or card expired on file. (can_retry: true with alternate payment method, risk_score: 0.30-0.40)
5. USER_DROPOUT: Checkout session abandoned before completing authentication. (can_retry: true, risk_score: 0.15-0.25)
6. NETWORK_TIMEOUT: TCP/socket connection dropped mid-transaction during gateway handshake. (can_retry: true, risk_score: 0.10-0.20)
7. PAYMENT_DECLINED: Suspected fraud, stolen card alert, blacklisted VPA, chargeback risk. (can_retry: false, risk_score: 0.85-1.00)

### FEW-SHOT EXAMPLES:

Example 1:
Input:
{
  "transaction_id": "txn_001",
  "razorpay_order_id": "order_Hdfc_123",
  "amount": 3499.0,
  "failure_code": "BAD_REQUEST_ERROR",
  "failure_reason": "Payment failed due to daily UPI debit limit exceeded",
  "customer_name": "Pooja Hegde",
  "customer_email": "pooja.hegde@example.com",
  "customer_phone": "+919820123456",
  "previous_failed_attempts": 0,
  "total_spent": 12400.0
}
Output:
{
  "transaction_id": "txn_001",
  "failure_category": "INSUFFICIENT_FUNDS",
  "root_cause": "Customer's bank rejected UPI transaction due to exceeding 24-hour cumulative debit ceiling.",
  "can_retry": true,
  "risk_score": 0.20,
  "recommended_action": "Offer dynamic 10% discount link supporting alternative Credit Card / Netbanking methods.",
  "diagnostic_notes": "High-LTV customer (INR 12,400 spent). Very high recovery probability if alternate method provided."
}

Example 2:
Input:
{
  "transaction_id": "txn_002",
  "razorpay_order_id": "order_Sbi_456",
  "amount": 5499.0,
  "failure_code": "GATEWAY_ERROR",
  "failure_reason": "SBI gateway server 503 temporary outage during 3DS redirect",
  "customer_name": "Deepak Gupta",
  "customer_email": "deepak.gupta@example.com",
  "customer_phone": "+919711002233",
  "previous_failed_attempts": 0,
  "total_spent": 4500.0
}
Output:
{
  "transaction_id": "txn_002",
  "failure_category": "BANK_SERVER_ERROR",
  "root_cause": "State Bank of India Core Banking System experienced 503 gateway outage during 3DS authentication.",
  "can_retry": true,
  "risk_score": 0.10,
  "recommended_action": "Dispatch reassuring notification with pre-filled 1-click retry payment link bypassing SBI Netbanking.",
  "diagnostic_notes": "Technical failure external to customer. Zero churn intent detected."
}

Example 3:
Input:
{
  "transaction_id": "txn_003",
  "razorpay_order_id": "order_Fraud_789",
  "amount": 89999.0,
  "failure_code": "CARD_DECLINED_STOLEN",
  "failure_reason": "Card reported lost or stolen by cardholder",
  "customer_name": "Unknown",
  "customer_email": "suspicious@tempmail.com",
  "customer_phone": "+919000000000",
  "previous_failed_attempts": 4,
  "total_spent": 0.0
}
Output:
{
  "transaction_id": "txn_003",
  "failure_category": "PAYMENT_DECLINED",
  "root_cause": "High-risk fraud detection: Card reported stolen by issuing bank; disposable email domain detected.",
  "can_retry": false,
  "risk_score": 0.98,
  "recommended_action": "Strictly halt automated recovery. Blacklist identifier and alert merchant compliance team.",
  "diagnostic_notes": "Immediate hard stop. Automated outreach prohibited under RBI fair practice rules."
}
"""


def heuristic_diagnosis(ctx: DiagnosticContext) -> FailureDiagnosis:
    """Deterministic, high-accuracy heuristic fallback classifier."""
    text = f"{ctx.failure_code or ''} {ctx.failure_reason or ''}".lower()

    if any(k in text for k in ["insufficient", "balance", "limit", "low_funds", "debit limit"]):
        category = FailureCategory.INSUFFICIENT_FUNDS
        root_cause = "Customer's account had insufficient funds or hit daily UPI/card debit limit."
        can_retry = True
        risk_score = 0.25
        rec_action = "Offer flexible payment link with alternative UPI/wallet options and small dynamic discount."
    elif any(k in text for k in ["otp", "auth", "3ds", "cvv", "verification", "timed out on hdfc"]):
        category = FailureCategory.AUTHENTICATION_FAILED
        root_cause = "Customer did not complete OTP / 3DS authentication in time."
        can_retry = True
        risk_score = 0.15
        rec_action = "Send quick 1-click retry payment link via WhatsApp or SMS."
    elif any(k in text for k in ["fraud", "block", "blacklist", "stolen", "decline", "card_declined"]):
        category = FailureCategory.PAYMENT_DECLINED
        root_cause = "Risk flags or security block detected by payment gateway."
        can_retry = False
        risk_score = 0.95
        rec_action = "Do not auto-retry. Flag for merchant manual review."
    elif any(k in text for k in ["gateway", "bank", "server", "downtime", "500", "502", "503", "504", "outage"]):
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
        risk_score=round(risk_score, 2),
        recommended_action=rec_action,
        diagnostic_notes=f"Processed diagnostic triage for {ctx.customer_name} ({ctx.amount} INR).",
    )


async def run_diagnostic_agent(ctx: DiagnosticContext) -> FailureDiagnosis:
    """Executes the Diagnostic Agent using LiteLLM/OpenAI with heuristic fallback."""
    user_prompt = f"""
Diagnose this failed transaction and return a JSON object matching this schema:
{{
  "transaction_id": "{ctx.transaction_id}",
  "failure_category": "one of: INSUFFICIENT_FUNDS, AUTHENTICATION_FAILED, BANK_SERVER_ERROR, EXPIRED_CARD, USER_DROPOUT, NETWORK_TIMEOUT, PAYMENT_DECLINED",
  "root_cause": "short explanation string",
  "can_retry": true or false,
  "risk_score": float between 0.0 and 1.0,
  "recommended_action": "action description",
  "diagnostic_notes": "optional notes"
}}

Transaction Details:
{ctx.model_dump_json(indent=2)}
"""
    parsed = await complete_json_prompt(DIAGNOSTIC_SYSTEM_PROMPT, user_prompt)
    if parsed:
        try:
            cat_str = str(parsed.get("failure_category", "")).strip().upper().replace(" ", "_")
            if cat_str in FailureCategory.__members__:
                parsed["failure_category"] = FailureCategory[cat_str]
            else:
                parsed["failure_category"] = FailureCategory.USER_DROPOUT
            parsed["transaction_id"] = ctx.transaction_id
            return FailureDiagnosis(**parsed)
        except Exception as e:
            logger.warning(f"Failed to parse LLM diagnostic JSON into schema ({e}). Fallback to heuristic.")

    return heuristic_diagnosis(ctx)
