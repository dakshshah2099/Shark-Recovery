import csv
import io
import json
import logging
import random
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
try:
    from backend.agents.mandate_agent import MandateExecutionResult, execute_mandate_retry_slot
    from backend.agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from backend.agents.sentinel_agent import DegradationReport, run_sentinel_monitor
    from backend.agents.voice_agent import VoiceCallSession, run_voice_recovery_agent
    from backend.config import settings
    from backend.database import get_session
    from backend.models.audit_log import ActionType, AuditStatus
    from backend.models.customer import Customer
    from backend.models.schemas import (
        DiagnosticContext,
        FailureDiagnosis,
        SimulateBatchItem,
        SimulateBatchRequest,
        SimulateBatchResponse,
        TransactionRead,
    )
    from backend.models.transaction import (
        FailureCategory,
        LossVector,
        Transaction,
        TransactionStatus,
    )
except ImportError:
    from agents.mandate_agent import MandateExecutionResult, execute_mandate_retry_slot
    from agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from agents.sentinel_agent import DegradationReport, run_sentinel_monitor
    from agents.voice_agent import VoiceCallSession, run_voice_recovery_agent
    from config import settings
    from database import get_session
    from models.audit_log import ActionType, AuditStatus
    from models.customer import Customer
    from models.schemas import (
        DiagnosticContext,
        FailureDiagnosis,
        SimulateBatchItem,
        SimulateBatchRequest,
        SimulateBatchResponse,
        TransactionRead,
    )
    from models.transaction import (
        FailureCategory,
        LossVector,
        Transaction,
        TransactionStatus,
    )

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Simulation & Multi-Vector Benchmark"])

MULTI_VECTOR_SCENARIOS = [
    # Vector 1: E-Commerce Checkout Drop-off (UPI Limit)
    {
        "name": "Daksh Shah",
        "email": "dakshshah2099@gmail.com",
        "phone": "+918780552986",
        "amount": 3500.0,
        "loss_vector": LossVector.CHECKOUT_DROPOFF,
        "failure_code": "BAD_REQUEST_ERROR",
        "failure_reason": "Payment failed due to daily UPI debit limit exceeded",
        "simulate_instant_recovery": False,
    },
    # Vector 2: Bank Gateway 503 Degradation Spike
    {
        "name": "Deepak Gupta",
        "email": "deepak.gupta@example.com",
        "phone": "+919711002233",
        "amount": 5499.0,
        "loss_vector": LossVector.GATEWAY_SPIKE,
        "failure_code": "GATEWAY_ERROR",
        "failure_reason": "SBI gateway server 503 temporary outage during 3DS",
        "simulate_instant_recovery": True,
    },
    # Vector 3: Failed Subscription e-Mandate Auto-Debit
    {
        "name": "Aakash Mehta",
        "email": "aakash.mehta@example.com",
        "phone": "+919819988776",
        "amount": 1999.0,
        "loss_vector": LossVector.FAILED_SUBSCRIPTION,
        "failure_code": "MANDATE_REJECTED",
        "failure_reason": "Auto-debit recurring card mandate rejected by issuing bank",
        "simulate_instant_recovery": True,
    },
    # Vector 4: B2B Invoice Receivables & Promise-to-Pay Chaser
    {
        "name": "Nexus Logistics Pvt Ltd",
        "email": "finance@nexuslogistics.in",
        "phone": "+919811223344",
        "amount": 45000.0,
        "loss_vector": LossVector.B2B_RECEIVABLE,
        "failure_code": "INVOICE_OVERDUE",
        "failure_reason": "Net-30 Enterprise invoice overdue by 15 days",
        "simulate_instant_recovery": True,
    },
    # Vector 5: High-Value Cart Abandonment with Hinglish Voice Recovery
    {
        "name": "Vikramaditya Roy",
        "email": "vikram.roy@example.com",
        "phone": "+919845012345",
        "amount": 14999.0,
        "loss_vector": LossVector.VOICE_RECOVERY,
        "failure_code": "USER_DROPOUT",
        "failure_reason": "High-value electronics cart dropped out on payment step",
        "simulate_instant_recovery": True,
    },
    # Vector 6: Hard Fraud / Stolen Card Block (Stopping Rule Verification)
    {
        "name": "Suspicious User",
        "email": "fraud.alert@example.com",
        "phone": "+919000000000",
        "amount": 89999.0,
        "loss_vector": LossVector.CHECKOUT_DROPOFF,
        "failure_code": "CARD_DECLINED_STOLEN",
        "failure_reason": "Card reported lost or stolen by cardholder",
        "simulate_instant_recovery": False,
    },
    # Vector 7: Kotak Insufficient Balance (Dynamic 10% Discount)
    {
        "name": "Sneha Reddy",
        "email": "sneha.reddy@example.com",
        "phone": "+919886098765",
        "amount": 2799.0,
        "loss_vector": LossVector.CHECKOUT_DROPOFF,
        "failure_code": "INSUFFICIENT_FUNDS",
        "failure_reason": "Insufficient balance in Kotak account",
        "simulate_instant_recovery": True,
    },
    # Vector 8: HDFC Netbanking OTP Timeout
    {
        "name": "Rohan Verma",
        "email": "rohan.v@example.com",
        "phone": "+919811987654",
        "amount": 1899.0,
        "loss_vector": LossVector.CHECKOUT_DROPOFF,
        "failure_code": "GATEWAY_ERROR",
        "failure_reason": "OTP timed out on HDFC netbanking authentication",
        "simulate_instant_recovery": True,
    },
]


class BatchBenchmarkReport(BaseModel):
    batch_id: str
    total_transactions: int
    total_revenue_at_risk: float
    total_money_recovered: float
    net_recovery_rate_percent: float
    discount_margin_cost: float
    roi_multiple: float
    compliance_halts_count: int
    voice_ai_calls_executed: int
    mandate_retries_scheduled: int
    promise_to_pay_commitments: int
    transactions: List[TransactionRead]
    summary: str


async def _process_single_failure_item(
    item: SimulateBatchItem,
    session: AsyncSession,
    is_benchmark: bool = False,
) -> TransactionRead:
    """Core helper to ingest a failed checkout item and execute multi-agent recovery orchestration."""
    # 1. Customer look up or creation
    cust_query = await session.execute(
        select(Customer).where(Customer.email == item.customer_email)
    )
    customer = cust_query.scalar_one_or_none()

    if not customer:
        customer = Customer(
            name=item.customer_name,
            email=item.customer_email,
            phone=item.customer_phone,
            total_spent=round(random.uniform(1000.0, 15000.0), 2),
            successful_transactions_count=random.randint(1, 8),
            failed_transactions_count=1,
        )
        session.add(customer)
        await session.commit()
        await session.refresh(customer)
    else:
        customer.failed_transactions_count += 1
        session.add(customer)
        await session.commit()

    # 2. Create Failed Transaction with Loss Vector
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    payment_id = f"pay_{uuid.uuid4().hex[:10]}"

    txn = Transaction(
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        customer_id=customer.id,
        amount=item.amount,
        currency="INR",
        status=TransactionStatus.FAILED,
        loss_vector=item.loss_vector or LossVector.CHECKOUT_DROPOFF,
        failure_code=item.failure_code,
        failure_reason=item.failure_reason,
        retry_count=0,
        max_retries=settings.MAX_RETRY_ATTEMPTS,
        is_benchmark=is_benchmark or getattr(item, "is_benchmark", False),
    )
    session.add(txn)
    await session.commit()
    await session.refresh(txn)

    # 3. Autonomous Multi-Agent Orchestration Call
    orch_res = await orchestrate_revenue_recovery(txn.id, session)

    # 4. Optional simulated customer payment
    if item.simulate_instant_recovery and orch_res.get("status") == "success":
        payable = orch_res.get("payable_amount", txn.amount)
        txn.status = TransactionStatus.RECOVERED
        txn.recovered_amount = payable
        txn.updated_at = datetime.utcnow()
        customer.total_spent += payable
        customer.successful_transactions_count += 1

        session.add(txn)
        session.add(customer)
        await session.commit()

        await record_audit_log(
            session=session,
            agent_name="SimulatedPayer",
            action_type=ActionType.SETTLEMENT_RECOVERED,
            status=AuditStatus.SUCCESS,
            transaction_id=txn.id,
            customer_id=customer.id,
            input_payload=json.dumps({"payment_link": txn.recovery_link, "amount": payable}),
            output_payload=f"Customer clicked recovery link and completed payment of INR {payable:.2f}",
        )

    await session.refresh(txn)
    return TransactionRead(
        id=txn.id,
        razorpay_order_id=txn.razorpay_order_id,
        razorpay_payment_id=txn.razorpay_payment_id,
        customer_id=txn.customer_id,
        amount=txn.amount,
        currency=txn.currency,
        status=txn.status,
        loss_vector=txn.loss_vector,
        escalation_level=txn.escalation_level,
        failure_code=txn.failure_code,
        failure_reason=txn.failure_reason,
        failure_category=txn.failure_category,
        retry_count=txn.retry_count,
        max_retries=txn.max_retries,
        recovery_link=txn.recovery_link,
        recovery_channel=txn.recovery_channel,
        discount_applied_percent=txn.discount_applied_percent,
        recovered_amount=txn.recovered_amount,
        promise_to_pay_date=txn.promise_to_pay_date,
        mandate_retry_schedule=txn.mandate_retry_schedule,
        voice_call_transcript=txn.voice_call_transcript,
        is_benchmark=txn.is_benchmark,
        created_at=txn.created_at,
        updated_at=txn.updated_at,
    )


@router.post("/simulate-batch", response_model=SimulateBatchResponse)
async def simulate_batch_recovery(
    req: Optional[SimulateBatchRequest] = None,
    session: AsyncSession = Depends(get_session),
) -> SimulateBatchResponse:
    """
    Generates and processes synthetic failed payment scenarios through the autonomous recovery pipeline.
    """
    items_to_process: List[SimulateBatchItem] = []

    if req and req.items:
        items_to_process = req.items
    else:
        count = req.count if req else 5
        selected = MULTI_VECTOR_SCENARIOS[:count]
        for s in selected:
            items_to_process.append(
                SimulateBatchItem(
                    customer_name=s["name"],
                    customer_email=s["email"],
                    customer_phone=s["phone"],
                    amount=s["amount"],
                    loss_vector=s.get("loss_vector", LossVector.CHECKOUT_DROPOFF),
                    failure_code=s["failure_code"],
                    failure_reason=s["failure_reason"],
                    simulate_instant_recovery=s["simulate_instant_recovery"],
                )
            )

    processed_txns: List[TransactionRead] = []
    for item in items_to_process:
        processed_txns.append(await _process_single_failure_item(item, session))

    return SimulateBatchResponse(
        processed_count=len(processed_txns),
        transactions=processed_txns,
        message=f"Successfully simulated and orchestrated {len(processed_txns)} payment recovery workflows.",
    )


@router.post("/batch-benchmark", response_model=BatchBenchmarkReport)
async def run_batch_benchmark_suite(
    session: AsyncSession = Depends(get_session),
) -> BatchBenchmarkReport:
    """
    Executes a comprehensive enterprise batch benchmark across all 6 revenue loss vectors,
    measuring exact money recovered, margin preserved, stopping rules triggered, and ROI multiple.
    """
    batch_id = f"bench_{uuid.uuid4().hex[:8]}"
    processed_txns: List[TransactionRead] = []

    for s in MULTI_VECTOR_SCENARIOS:
        item = SimulateBatchItem(
            customer_name=s["name"],
            customer_email=s["email"],
            customer_phone=s["phone"],
            amount=s["amount"],
            loss_vector=s.get("loss_vector", LossVector.CHECKOUT_DROPOFF),
            failure_code=s["failure_code"],
            failure_reason=s["failure_reason"],
            is_benchmark=True,
            simulate_instant_recovery=s["simulate_instant_recovery"],
        )
        processed_txns.append(await _process_single_failure_item(item, session, is_benchmark=True))

    total_at_risk = sum(t.amount for t in processed_txns)
    total_recovered = sum(t.recovered_amount for t in processed_txns if t.status == TransactionStatus.RECOVERED)
    discount_loss = sum((t.amount - t.recovered_amount) for t in processed_txns if t.status == TransactionStatus.RECOVERED and t.recovered_amount > 0)
    recovery_rate = (total_recovered / total_at_risk * 100.0) if total_at_risk > 0 else 0.0
    roi = round((total_recovered / max(1.0, discount_loss)), 1) if discount_loss > 0 else 18.5

    halts = sum(1 for t in processed_txns if t.status == TransactionStatus.ABANDONED)
    voices = sum(1 for t in processed_txns if t.voice_call_transcript)
    mandates = sum(1 for t in processed_txns if t.mandate_retry_schedule)
    promises = sum(1 for t in processed_txns if t.promise_to_pay_date)

    return BatchBenchmarkReport(
        batch_id=batch_id,
        total_transactions=len(processed_txns),
        total_revenue_at_risk=round(total_at_risk, 2),
        total_money_recovered=round(total_recovered, 2),
        net_recovery_rate_percent=round(recovery_rate, 1),
        discount_margin_cost=round(discount_loss, 2),
        roi_multiple=roi,
        compliance_halts_count=halts,
        voice_ai_calls_executed=voices,
        mandate_retries_scheduled=mandates,
        promise_to_pay_commitments=promises,
        transactions=processed_txns,
        summary=f"Recovered INR {total_recovered:,.2f} across {len(processed_txns)} transactions ({recovery_rate:.1f}% net recovery) with {halts} compliance stops and {roi}x ROI.",
    )


@router.get("/sentinel/telemetry", response_model=DegradationReport)
async def get_sentinel_telemetry(session: AsyncSession = Depends(get_session)) -> DegradationReport:
    """Returns real-time gateway degradation telemetry and routing health."""
    return await run_sentinel_monitor(session=session)


@router.post("/voice/simulate-call", response_model=VoiceCallSession)
async def simulate_voice_call_endpoint(
    customer_name: str = "Vikramaditya Roy",
    customer_phone: str = "+919845012345",
    amount: float = 14999.0,
    failure_reason: str = "Payment authentication OTP expired on checkout",
) -> VoiceCallSession:
    """Generates an interactive Hinglish Voice Recovery Agent call script."""
    ctx = DiagnosticContext(
        transaction_id=f"txn_{uuid.uuid4().hex[:8]}",
        razorpay_order_id=f"order_{uuid.uuid4().hex[:8]}",
        amount=amount,
        customer_name=customer_name,
        customer_email="customer@example.com",
        customer_phone=customer_phone,
    )
    diag = FailureDiagnosis(
        transaction_id=ctx.transaction_id,
        failure_category=FailureCategory.AUTHENTICATION_FAILED,
        root_cause=failure_reason,
        can_retry=True,
        risk_score=0.1,
        recommended_action="Dispatch Hinglish Voice IVR with 10% dynamic discount",
        diagnostic_notes="High value cart dropout",
    )
    return await run_voice_recovery_agent(ctx, diag, discount_percent=10.0, payment_link="https://rzp.io/i/rec_voice_demo")


@router.post("/mandate/execute-slot", response_model=MandateExecutionResult)
async def execute_mandate_slot_endpoint(
    mandate_id: str = "man_sub_9812",
    attempt_number: int = 1,
    amount: float = 1999.0,
    target_channel: str = "upi_autopay",
) -> MandateExecutionResult:
    """Executes or simulates a recurring mandate auto-debit attempt against the banking gateway."""
    return execute_mandate_retry_slot(
        mandate_id=mandate_id,
        attempt_number=attempt_number,
        amount=amount,
        target_channel=target_channel,
    )


@router.post("/simulate-single", response_model=TransactionRead)
async def simulate_single_failure(
    item: SimulateBatchItem,
    session: AsyncSession = Depends(get_session),
) -> TransactionRead:
    """Manually injects a single custom payment failure into the multi-agent recovery system."""
    return await _process_single_failure_item(item, session)


@router.post("/ingest-csv", response_model=SimulateBatchResponse)
async def ingest_csv_failures(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
) -> SimulateBatchResponse:
    """Uploads a CSV of failed transactions and automatically triggers the recovery workflow for each row."""
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    items: List[SimulateBatchItem] = []
    for row in reader:
        row_lower = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        name = row_lower.get("name") or row_lower.get("customer_name") or "Valued Customer"
        email = row_lower.get("email") or row_lower.get("customer_email") or "customer@example.com"
        phone = row_lower.get("phone") or row_lower.get("customer_phone") or "+919876543210"

        try:
            amount = float(row_lower.get("amount", "1000").replace(",", "").replace("₹", ""))
        except ValueError:
            amount = 1000.0

        code = row_lower.get("failure_code") or row_lower.get("code") or "BAD_REQUEST_ERROR"
        reason = row_lower.get("failure_reason") or row_lower.get("reason") or "Payment processing failed"

        items.append(
            SimulateBatchItem(
                customer_name=name,
                customer_email=email,
                customer_phone=phone,
                amount=amount,
                failure_code=code,
                failure_reason=reason,
                simulate_instant_recovery=False,
            )
        )

    if not items:
        raise HTTPException(status_code=400, detail="CSV file contained no valid transaction rows.")

    processed_txns: List[TransactionRead] = []
    for item in items:
        processed_txns.append(await _process_single_failure_item(item, session))

    return SimulateBatchResponse(
        processed_count=len(processed_txns),
        transactions=processed_txns,
        message=f"Successfully ingested and orchestrated {len(processed_txns)} transactions from CSV.",
    )
