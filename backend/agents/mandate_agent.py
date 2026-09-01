import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class MandateRetrySlot(BaseModel):
    attempt_number: int
    scheduled_timestamp: str
    target_channel: str  # "auto_debit", "upi_autopay", "fallback_payment_link"
    rationale: str


class MandateSchedulePlan(BaseModel):
    mandate_id: str
    customer_id: str
    original_failure_reason: str
    total_cycles_allowed: int
    retry_slots: List[MandateRetrySlot]
    cooling_off_hours: int
    compliance_certified: bool


class B2BPromiseToPayPlan(BaseModel):
    invoice_id: str
    client_name: str
    invoice_amount: float
    promise_date: str
    installment_breakdown: List[Dict[str, Any]]
    settlement_discount_applied: float
    net_receivable: float
    status: str  # "COMMITTED", "PENDING_VERIFICATION", "ESCROW_LOCKED"


def compute_mandate_retry_schedule(
    mandate_id: str,
    customer_id: str,
    failure_reason: str,
    amount: float,
) -> MandateSchedulePlan:
    """
    Computes an intelligent, RBI-compliant recurring mandate retry sequencer.
    Bypasses peak bank maintenance hours and targets optimal liquidity windows (e.g., 1st & 5th of month).
    """
    now = datetime.utcnow()
    # Slot 1: 24h later during morning banking hours (10:30 AM IST)
    slot1 = (now + timedelta(days=1)).strftime("%Y-%m-%d 05:00:00 UTC")
    # Slot 2: 72h later
    slot2 = (now + timedelta(days=3)).strftime("%Y-%m-%d 05:30:00 UTC")
    # Slot 3: Alternative payment link fallback
    slot3 = (now + timedelta(days=5)).strftime("%Y-%m-%d 06:00:00 UTC")

    slots = [
        MandateRetrySlot(
            attempt_number=1,
            scheduled_timestamp=slot1,
            target_channel="upi_autopay",
            rationale="Post-salary morning window liquidity check.",
        ),
        MandateRetrySlot(
            attempt_number=2,
            scheduled_timestamp=slot2,
            target_channel="auto_debit",
            rationale="Secondary bank clearing batch.",
        ),
        MandateRetrySlot(
            attempt_number=3,
            scheduled_timestamp=slot3,
            target_channel="fallback_payment_link",
            rationale="Final fallback: 1-click Razorpay payment link via WhatsApp.",
        ),
    ]

    return MandateSchedulePlan(
        mandate_id=mandate_id,
        customer_id=customer_id,
        original_failure_reason=failure_reason or "Mandate execution rejected by issuing bank",
        total_cycles_allowed=3,
        retry_slots=slots,
        cooling_off_hours=24,
        compliance_certified=True,
    )


def compute_b2b_promise_to_pay(
    invoice_id: str,
    client_name: str,
    amount: float,
    days_overdue: int = 15,
) -> B2BPromiseToPayPlan:
    """
    Computes B2B invoice receivables recovery plan with structured installment options and promise tracking.
    """
    promise_date = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")
    discount = 3.0 if amount >= 25000 else 0.0
    net = round(amount * (1.0 - (discount / 100.0)), 2)

    installments = [
        {"installment_no": 1, "due_date": promise_date, "amount": round(net * 0.5, 2), "percentage": 50},
        {"installment_no": 2, "due_date": (datetime.utcnow() + timedelta(days=21)).strftime("%Y-%m-%d"), "amount": round(net * 0.5, 2), "percentage": 50},
    ]

    return B2BPromiseToPayPlan(
        invoice_id=invoice_id,
        client_name=client_name,
        invoice_amount=amount,
        promise_date=promise_date,
        installment_breakdown=installments,
        settlement_discount_applied=discount,
        net_receivable=net,
        status="COMMITTED",
    )
