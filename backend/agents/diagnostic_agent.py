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


def calculate_dynamic_risk_score(
    category: FailureCategory,
    amount: float,
    previous_failed_attempts: int = 0,
    total_spent: float = 0.0,
    failure_code: Optional[str] = None,
    failure_reason: Optional[str] = None,
) -> float:
    """
    Computes a continuous, multi-factor statistical risk score (0.0 to 1.0) combining:
    1. Base Category Vulnerability
    2. Order Ticket Size & Outlier Exposure Factor
    3. Failure Frequency & Prior Dropout Velocity Penalty
    4. Customer Lifetime Value (LTV) Loyalty Trust Mitigation
    5. Specific Error Keyword Sensitivity (Fraud vs External Gateway downtime)
    """
    # 1. Base category vulnerability
    base_map = {
        FailureCategory.PAYMENT_DECLINED: 0.85,
        FailureCategory.EXPIRED_CARD: 0.30,
        FailureCategory.INSUFFICIENT_FUNDS: 0.22,
        FailureCategory.USER_DROPOUT: 0.18,
        FailureCategory.AUTHENTICATION_FAILED: 0.14,
        FailureCategory.NETWORK_TIMEOUT: 0.08,
        FailureCategory.BANK_SERVER_ERROR: 0.05,
    }
    base_risk = base_map.get(category, 0.20)

    # 2. Ticket Size & Exposure Factor (larger carts carry higher customer dropout anxiety or fraud exposure)
    amount_factor = min(0.15, max(0.0, (amount / 100000.0) * 0.15))

    # 3. Repeat Failure Velocity Penalty (+0.08 per prior failure, up to 0.32)
    history_penalty = min(0.32, max(0.0, previous_failed_attempts * 0.08))

    # 4. Customer LTV Trust Mitigation (loyal customers with high total spend reduce churn risk up to -0.15)
    ltv_mitigation = min(0.15, max(0.0, (total_spent / 50000.0) * 0.15))

    # 5. Specific Error Keyword Sensitivity
    keyword_delta = 0.0
    text = f"{failure_code or ''} {failure_reason or ''}".lower()
    if any(k in text for k in ["stolen", "fraud", "blacklist", "blocked"]):
        keyword_delta += 0.14
    elif any(k in text for k in ["503", "gateway_error", "bank downtime", "cbs", "server outage"]):
        keyword_delta -= 0.04  # purely external banking gateway failure

    computed_risk = base_risk + amount_factor + history_penalty - ltv_mitigation + keyword_delta
    return round(max(0.02, min(0.99, computed_risk)), 2)


def heuristic_diagnosis(ctx: DiagnosticContext) -> FailureDiagnosis:
    """Deterministic, high-accuracy heuristic fallback classifier."""
    text = f"{ctx.failure_code or ''} {ctx.failure_reason or ''}".lower()

    # 1. Fraud & Hard Declined
    if any(k in text for k in ["fraud", "block", "blacklist", "stolen", "decline", "card_declined", "stolen_card"]):
        category = FailureCategory.PAYMENT_DECLINED
        root_cause = "Risk flags or security block detected by payment gateway."
        can_retry = False
        rec_action = "Do not auto-retry. Flag for merchant manual review."
    # 2. Network & Socket Disconnects
    elif any(k in text for k in ["network", "socket", "connection", "dropped", "network_timeout"]) or (ctx.failure_code and "network" in ctx.failure_code.lower()):
        category = FailureCategory.NETWORK_TIMEOUT
        root_cause = "Network connection timed out or socket dropped during gateway handshake."
        can_retry = True
        rec_action = "Immediate retry link dispatched via preferred channel."
    # 3. Insufficient Funds & Debit Limits
    elif any(k in text for k in ["insufficient", "balance", "limit", "low_funds", "debit limit"]):
        category = FailureCategory.INSUFFICIENT_FUNDS
        root_cause = "Customer's account had insufficient funds or hit daily UPI/card debit limit."
        can_retry = True
        rec_action = "Offer flexible payment link with alternative UPI/wallet options and small dynamic discount."
    # 4. Bank Server Outages & Gateway Downtime
    elif any(k in text for k in ["server", "downtime", "500", "502", "503", "504", "outage"]) or (ctx.failure_code == "GATEWAY_ERROR" and "sbi" in text):
        category = FailureCategory.BANK_SERVER_ERROR
        root_cause = "Issuer bank or gateway experienced temporary technical downtime."
        can_retry = True
        rec_action = "Reassure customer with system recovery notification and valid retry link."
    # 5. OTP / Authentication Failures
    elif any(k in text for k in ["otp", "auth", "3ds", "cvv", "verification"]):
        category = FailureCategory.AUTHENTICATION_FAILED
        root_cause = "Customer did not complete OTP / 3DS authentication in time."
        can_retry = True
        rec_action = "Send quick 1-click retry payment link via WhatsApp or SMS."
    # 6. Expired Card
    elif any(k in text for k in ["expire", "expired", "invalid_card"]):
        category = FailureCategory.EXPIRED_CARD
        root_cause = "Payment card details were expired or invalid."
        can_retry = True
        rec_action = "Prompt customer to retry using UPI, NetBanking, or a new card."
    # 7. Abandoned Checkout / Dropout
    else:
        category = FailureCategory.USER_DROPOUT
        root_cause = "Customer dropped out during payment window."
        can_retry = True
        rec_action = "Send gentle abandoned cart recovery reminder."

    # Dynamically compute statistical risk score
    risk_score = calculate_dynamic_risk_score(
        category=category,
        amount=ctx.amount,
        previous_failed_attempts=ctx.previous_failed_attempts,
        total_spent=ctx.total_spent,
        failure_code=ctx.failure_code,
        failure_reason=ctx.failure_reason,
    )

    return FailureDiagnosis(
        transaction_id=ctx.transaction_id,
        failure_category=category,
        root_cause=root_cause,
        can_retry=can_retry,
        risk_score=risk_score,
        recommended_action=rec_action,
        diagnostic_notes=f"Processed dynamic statistical triage for {ctx.customer_name} ({ctx.amount} INR, {ctx.previous_failed_attempts} prior failures, spent {ctx.total_spent} INR).",
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
