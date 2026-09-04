import hmac
import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
try:
    from backend.agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from backend.config import settings
    from backend.database import get_session
    from backend.models.audit_log import ActionType, AuditStatus
    from backend.models.customer import Customer
    from backend.models.transaction import (
        FailureCategory,
        LossVector,
        Transaction,
        TransactionStatus,
    )
except ImportError:
    from agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from config import settings
    from database import get_session
    from models.audit_log import ActionType, AuditStatus
    from models.customer import Customer
    from models.transaction import (
        FailureCategory,
        LossVector,
        Transaction,
        TransactionStatus,
    )

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["Webhooks"])


def verify_signature(body_bytes: bytes, signature: Optional[str], secret: str) -> bool:
    """Verifies HMAC SHA256 signature from Razorpay."""
    if not secret:
        return True  # Sandbox permissive mode if webhook secret is unset
    if not signature:
        return False
    try:
        expected_sig = hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_sig, signature)
    except Exception as e:
        logger.warning(f"Signature verification error: {e}")
        return False


@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """
    Receives and processes incoming Razorpay Webhook events.
    Supports payment.failed and payment_link.paid / payment.captured events.
    """
    raw_body = await request.body()

    if settings.RAZORPAY_WEBHOOK_SECRET and not verify_signature(
        raw_body, x_razorpay_signature, settings.RAZORPAY_WEBHOOK_SECRET
    ):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON payload")

    event = data.get("event", "unknown")
    logger.info(f"Webhook received: {event}")

    # Case 1: Payment Failed Event
    if event == "payment.failed":
        payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})
        error_code = payment_entity.get("error_code")
        error_desc = payment_entity.get("error_description") or "Payment processing failed"
        order_id = payment_entity.get("order_id") or f"order_{payment_entity.get('id', 'unknown')}"
        payment_id = payment_entity.get("id")
        amount_inr = round(float(payment_entity.get("amount", 0)) / 100.0, 2)
        currency = payment_entity.get("currency", "INR")
        customer_email = payment_entity.get("email") or "customer@example.com"
        customer_contact = payment_entity.get("contact") or "+919876543210"
        notes = payment_entity.get("notes", {})
        customer_name = notes.get("customer_name") or "Valued Customer"

        # Find or create customer
        cust_query = await session.execute(
            select(Customer).where(Customer.email == customer_email)
        )
        customer = cust_query.scalar_one_or_none()

        if not customer:
            customer = Customer(
                name=customer_name,
                email=customer_email,
                phone=customer_contact,
                failed_transactions_count=1,
            )
            session.add(customer)
            await session.commit()
            await session.refresh(customer)
        else:
            customer.failed_transactions_count += 1
            customer.updated_at = datetime.utcnow()
            session.add(customer)
            await session.commit()

        # Infer Loss Vector from error code & description
        loss_vector = LossVector.CHECKOUT_DROPOFF
        desc_lower = f"{error_code or ''} {error_desc or ''}".lower()
        if any(k in desc_lower for k in ["sbi", "503", "502", "gateway", "server_error", "outage"]):
            loss_vector = LossVector.GATEWAY_SPIKE
        elif any(k in desc_lower for k in ["mandate", "subscription", "recurring", "autopay"]):
            loss_vector = LossVector.FAILED_SUBSCRIPTION
        elif any(k in desc_lower for k in ["invoice", "b2b", "receivable"]):
            loss_vector = LossVector.B2B_RECEIVABLE
        elif amount_inr >= 5000.0:
            loss_vector = LossVector.VOICE_RECOVERY

        # Create Transaction
        transaction = Transaction(
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            customer_id=customer.id,
            amount=amount_inr if amount_inr > 0 else 1999.0,
            currency=currency,
            status=TransactionStatus.FAILED,
            loss_vector=loss_vector,
            failure_code=error_code,
            failure_reason=error_desc,
            retry_count=0,
            max_retries=settings.MAX_RETRY_ATTEMPTS,
        )
        session.add(transaction)
        await session.commit()
        await session.refresh(transaction)

        # Trigger Autonomous Recovery Orchestration
        recovery_result = await orchestrate_revenue_recovery(transaction.id, session)

        return {
            "status": "processed",
            "event": event,
            "transaction_id": transaction.id,
            "recovery": recovery_result,
        }

    # Case 2: Recovery Payment Completed (payment_link.paid / payment.captured)
    elif event in ["payment_link.paid", "payment.captured", "order.paid"]:
        entity = (
            data.get("payload", {}).get("payment_link", {}).get("entity")
            or data.get("payload", {}).get("payment", {}).get("entity")
            or {}
        )
        notes = entity.get("notes", {})
        txn_id = notes.get("transaction_id")
        amount_inr = round(float(entity.get("amount", 0)) / 100.0, 2)

        txn = None
        if txn_id:
            txn_query = await session.execute(select(Transaction).where(Transaction.id == txn_id))
            txn = txn_query.scalar_one_or_none()

        if not txn:
            order_id = entity.get("order_id")
            if order_id:
                txn_query = await session.execute(
                    select(Transaction).where(Transaction.razorpay_order_id == order_id)
                )
                txn = txn_query.scalar_one_or_none()

        if txn:
            txn.status = TransactionStatus.RECOVERED
            txn.recovered_amount = amount_inr if amount_inr > 0 else txn.amount
            txn.updated_at = datetime.utcnow()
            session.add(txn)

            # Update customer metrics
            cust_query = await session.execute(select(Customer).where(Customer.id == txn.customer_id))
            cust = cust_query.scalar_one_or_none()
            if cust:
                cust.total_spent += txn.recovered_amount
                cust.successful_transactions_count += 1
                cust.updated_at = datetime.utcnow()
                session.add(cust)

            await session.commit()

            # Record audit verification
            await record_audit_log(
                session=session,
                agent_name="WebhookVerifier",
                action_type=ActionType.RECOVERY_VERIFIED,
                status=AuditStatus.SUCCESS,
                transaction_id=txn.id,
                customer_id=txn.customer_id,
                input_payload=json.dumps({"event": event, "amount": amount_inr}),
                output_payload=f"Revenue recovered successfully: INR {txn.recovered_amount:.2f}",
            )

            return {
                "status": "processed",
                "event": event,
                "transaction_id": txn.id,
                "recovered_amount": txn.recovered_amount,
            }

        return {"status": "ignored", "event": event, "reason": "No matching transaction record found"}

    return {"status": "ignored", "event": event}
