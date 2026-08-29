import json
import logging
import random
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
try:
    from backend.agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from backend.config import settings
    from backend.database import get_session
    from backend.models.audit_log import ActionType, AuditStatus
    from backend.models.customer import Customer
    from backend.models.schemas import (
        SimulateBatchItem,
        SimulateBatchRequest,
        SimulateBatchResponse,
        TransactionRead,
    )
    from backend.models.transaction import (
        FailureCategory,
        Transaction,
        TransactionStatus,
    )
except ImportError:
    from agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from config import settings
    from database import get_session
    from models.audit_log import ActionType, AuditStatus
    from models.customer import Customer
    from models.schemas import (
        SimulateBatchItem,
        SimulateBatchRequest,
        SimulateBatchResponse,
        TransactionRead,
    )
    from models.transaction import (
        FailureCategory,
        Transaction,
        TransactionStatus,
    )

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Simulation"])

SYNTHETIC_SCENARIOS = [
    {
        "name": "Pooja Hegde",
        "email": "pooja.hegde@example.com",
        "phone": "+919820123456",
        "amount": 3499.0,
        "failure_code": "BAD_REQUEST_ERROR",
        "failure_reason": "Payment failed due to daily UPI debit limit exceeded",
        "simulate_instant_recovery": True,
    },
    {
        "name": "Rohan Verma",
        "email": "rohan.v@example.com",
        "phone": "+919811987654",
        "amount": 1899.0,
        "failure_code": "GATEWAY_ERROR",
        "failure_reason": "OTP timed out on HDFC netbanking authentication",
        "simulate_instant_recovery": True,
    },
    {
        "name": "Deepak Gupta",
        "email": "deepak.gupta@example.com",
        "phone": "+919711002233",
        "amount": 5499.0,
        "failure_code": "GATEWAY_ERROR",
        "failure_reason": "SBI gateway server 503 temporary outage",
        "simulate_instant_recovery": True,
    },
    {
        "name": "Ananya Sen",
        "email": "ananya.sen@example.com",
        "phone": "+919933445566",
        "amount": 1299.0,
        "failure_code": "USER_DROPOUT",
        "failure_reason": "User dropped out during checkout confirmation",
        "simulate_instant_recovery": False,
    },
    {
        "name": "Vikram Malhotra",
        "email": "vikram.m@example.com",
        "phone": "+919845012345",
        "amount": 7999.0,
        "failure_code": "BAD_REQUEST_ERROR",
        "failure_reason": "Credit card expired or invalid CVV provided",
        "simulate_instant_recovery": False,
    },
    {
        "name": "Sneha Reddy",
        "email": "sneha.reddy@example.com",
        "phone": "+919886098765",
        "amount": 2799.0,
        "failure_code": "INSUFFICIENT_FUNDS",
        "failure_reason": "Insufficient balance in Kotak account",
        "simulate_instant_recovery": True,
    },
    {
        "name": "Arjun Singhal",
        "email": "arjun.s@example.com",
        "phone": "+919765432100",
        "amount": 4199.0,
        "failure_code": "NETWORK_ERROR",
        "failure_reason": "Socket timeout during 3DS redirect",
        "simulate_instant_recovery": True,
    },
]


@router.post("/simulate-batch", response_model=SimulateBatchResponse)
async def simulate_batch_recovery(
    req: Optional[SimulateBatchRequest] = None,
    session: AsyncSession = Depends(get_session),
) -> SimulateBatchResponse:
    """
    Generates and processes synthetic failed payment scenarios through the autonomous recovery pipeline.
    Instantly demonstrates real-time revenue recovery metrics on the dashboard.
    """
    items_to_process: List[SimulateBatchItem] = []

    if req and req.items:
        items_to_process = req.items
    else:
        count = req.count if req else 5
        selected = SYNTHETIC_SCENARIOS[:count]
        for s in selected:
            items_to_process.append(
                SimulateBatchItem(
                    customer_name=s["name"],
                    customer_email=s["email"],
                    customer_phone=s["phone"],
                    amount=s["amount"],
                    failure_code=s["failure_code"],
                    failure_reason=s["failure_reason"],
                    simulate_instant_recovery=s["simulate_instant_recovery"],
                )
            )

    processed_txns: List[TransactionRead] = []

    for item in items_to_process:
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

        # 2. Create Failed Transaction
        order_id = f"order_{uuid.uuid4().hex[:10]}"
        payment_id = f"pay_{uuid.uuid4().hex[:10]}"

        txn = Transaction(
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            customer_id=customer.id,
            amount=item.amount,
            currency="INR",
            status=TransactionStatus.FAILED,
            failure_code=item.failure_code,
            failure_reason=item.failure_reason,
            retry_count=0,
            max_retries=settings.MAX_RETRY_ATTEMPTS,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        # 3. Autonomous Orchestrator Call
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
                action_type=ActionType.RECOVERY_VERIFIED,
                status=AuditStatus.SUCCESS,
                transaction_id=txn.id,
                customer_id=customer.id,
                input_payload=json.dumps({"payment_link": txn.recovery_link, "amount": payable}),
                output_payload=f"Customer clicked recovery link and completed payment of INR {payable:.2f}",
            )

        await session.refresh(txn)
        processed_txns.append(
            TransactionRead(
                id=txn.id,
                razorpay_order_id=txn.razorpay_order_id,
                razorpay_payment_id=txn.razorpay_payment_id,
                customer_id=txn.customer_id,
                amount=txn.amount,
                currency=txn.currency,
                status=txn.status,
                failure_code=txn.failure_code,
                failure_reason=txn.failure_reason,
                failure_category=txn.failure_category,
                retry_count=txn.retry_count,
                max_retries=txn.max_retries,
                recovery_link=txn.recovery_link,
                recovery_channel=txn.recovery_channel,
                discount_applied_percent=txn.discount_applied_percent,
                recovered_amount=txn.recovered_amount,
                created_at=txn.created_at,
                updated_at=txn.updated_at,
            )
        )

    return SimulateBatchResponse(
        processed_count=len(processed_txns),
        transactions=processed_txns,
        message=f"Successfully simulated and orchestrated {len(processed_txns)} payment recovery workflows.",
    )
