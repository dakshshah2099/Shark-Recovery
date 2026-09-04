import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, select
try:
    from backend.agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from backend.config import settings
    from backend.database import get_session
    from backend.models.audit_log import ActionType, AuditLog, AuditStatus
    from backend.models.customer import Customer
    from backend.models.schemas import (
        AuditLogRead,
        CustomerRead,
        DashboardMetrics,
        EnvConfigRead,
        EnvConfigUpdate,
        TransactionRead,
    )
    from backend.models.transaction import Transaction, TransactionStatus
    from backend.tools.razorpay_tool import create_razorpay_order
except ImportError:
    from agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from config import settings
    from database import get_session
    from models.audit_log import ActionType, AuditLog, AuditStatus
    from models.customer import Customer
    from models.schemas import (
        AuditLogRead,
        CustomerRead,
        DashboardMetrics,
        EnvConfigRead,
        EnvConfigUpdate,
        TransactionRead,
    )
    from models.transaction import Transaction, TransactionStatus
    from tools.razorpay_tool import create_razorpay_order

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    session: AsyncSession = Depends(get_session),
) -> DashboardMetrics:
    """Calculates real-time financial and operational metrics for the recovery dashboard."""
    # Transactions summary
    txns = (await session.execute(select(Transaction))).scalars().all()

    total_failed_revenue = sum(t.amount for t in txns)
    # Active Revenue at risk decreases as transactions are recovered
    revenue_at_risk = sum(t.amount for t in txns if t.status != TransactionStatus.RECOVERED)
    total_recovered_revenue = sum(t.recovered_amount for t in txns if t.status == TransactionStatus.RECOVERED)
    # Total revenue loss incurred due to recovery discount incentives
    discount_loss_amount = sum(
        max(0.0, t.amount - t.recovered_amount) for t in txns if t.status == TransactionStatus.RECOVERED
    )
    total_count = len(txns)
    active_recovery_count = sum(1 for t in txns if t.status == TransactionStatus.PROCESSING)

    recovery_rate = (
        round((total_recovered_revenue / total_failed_revenue) * 100, 1)
        if total_failed_revenue > 0
        else 0.0
    )

    # Dispatch counts from AuditLog
    email_count_res = await session.execute(
        select(func.count(AuditLog.id)).where(AuditLog.action_type == ActionType.EMAIL_DISPATCHED)
    )
    email_count = email_count_res.scalar() or 0

    whatsapp_count_res = await session.execute(
        select(func.count(AuditLog.id)).where(AuditLog.action_type == ActionType.WHATSAPP_DISPATCHED)
    )
    whatsapp_count = whatsapp_count_res.scalar() or 0

    return DashboardMetrics(
        total_failed_revenue=round(total_failed_revenue, 2),
        revenue_at_risk=round(revenue_at_risk, 2),
        total_recovered_revenue=round(total_recovered_revenue, 2),
        discount_loss_amount=round(discount_loss_amount, 2),
        recovery_rate_percent=recovery_rate,
        total_transactions_count=total_count,
        active_recovery_count=active_recovery_count,
        email_dispatched_count=email_count,
        whatsapp_dispatched_count=whatsapp_count,
    )


@router.get("/transactions")
async def list_transactions(
    limit: int = Query(default=50, ge=1, le=200),
    status: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    """Lists transactions with embedded customer metadata."""
    query = (
        select(Transaction, Customer)
        .outerjoin(Customer, Transaction.customer_id == Customer.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    if status:
        query = (
            select(Transaction, Customer)
            .outerjoin(Customer, Transaction.customer_id == Customer.id)
            .where(Transaction.status == status)
            .order_by(Transaction.created_at.desc())
            .limit(limit)
        )

    rows = (await session.execute(query)).all()
    results: List[Dict[str, Any]] = []

    for t, cust in rows:
        results.append({
            "id": t.id,
            "razorpay_order_id": t.razorpay_order_id,
            "razorpay_payment_id": t.razorpay_payment_id,
            "customer_id": t.customer_id,
            "customer_name": cust.name if cust else "Unknown",
            "customer_email": cust.email if cust else "Unknown",
            "customer_phone": cust.phone if cust else "Unknown",
            "amount": t.amount,
            "currency": t.currency,
            "status": t.status.value if hasattr(t.status, "value") else str(t.status),
            "failure_code": t.failure_code,
            "failure_reason": t.failure_reason,
            "failure_category": t.failure_category.value if t.failure_category and hasattr(t.failure_category, "value") else (str(t.failure_category) if t.failure_category else "unknown"),
            "retry_count": t.retry_count,
            "max_retries": t.max_retries,
            "recovery_link": t.recovery_link,
            "recovery_channel": t.recovery_channel,
            "discount_applied_percent": t.discount_applied_percent,
            "recovered_amount": t.recovered_amount,
            "created_at": t.created_at.isoformat() if t.created_at else "",
            "updated_at": t.updated_at.isoformat() if t.updated_at else "",
        })

    return results


@router.get("/audit-logs", response_model=List[AuditLogRead])
async def list_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    transaction_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
) -> List[AuditLogRead]:
    """Retrieves immutable audit ledger logs for real-time observability."""
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if transaction_id:
        query = select(AuditLog).where(AuditLog.transaction_id == transaction_id).order_by(AuditLog.created_at.desc()).limit(limit)

    logs = (await session.execute(query)).scalars().all()
    return [
        AuditLogRead(
            id=log.id,
            transaction_id=log.transaction_id,
            customer_id=log.customer_id,
            agent_name=log.agent_name,
            action_type=log.action_type,
            status=log.status,
            input_payload=log.input_payload,
            output_payload=log.output_payload,
            metadata_json=log.metadata_json,
            execution_duration_ms=log.execution_duration_ms,
            created_at=log.created_at,
        )
        for log in logs
    ]


@router.get("/whatsapp-feed")
async def get_whatsapp_feed(
    limit: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    """Returns recent dispatched WhatsApp outreach messages from the audit ledger."""
    query = (
        select(AuditLog)
        .where(AuditLog.action_type == ActionType.WHATSAPP_DISPATCHED)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    logs = (await session.execute(query)).scalars().all()
    
    # Collect customer IDs and transaction IDs to batch fetch
    cust_ids = {log.customer_id for log in logs if log.customer_id}
    txn_ids = {log.transaction_id for log in logs if log.transaction_id}
    
    customers_map: Dict[str, Customer] = {}
    if cust_ids:
        c_res = await session.execute(select(Customer).where(Customer.id.in_(cust_ids)))
        customers_map = {c.id: c for c in c_res.scalars().all()}
        
    transactions_map: Dict[str, Transaction] = {}
    if txn_ids:
        t_res = await session.execute(select(Transaction).where(Transaction.id.in_(txn_ids)))
        transactions_map = {t.id: t for t in t_res.scalars().all()}

    feed: List[Dict[str, Any]] = []
    for log in logs:
        try:
            payload = json.loads(log.input_payload or "{}")
        except Exception:
            payload = {}

        cust = customers_map.get(log.customer_id) if log.customer_id else None
        txn = transactions_map.get(log.transaction_id) if log.transaction_id else None

        customer_name = (
            payload.get("recipient_name")
            or (cust.name if cust else None)
            or "Customer"
        )
        recipient_phone = (
            payload.get("recipient_phone")
            or payload.get("recipient")
            or (cust.phone if cust else "Unknown")
        )
        payment_link = payload.get("payment_link") or (
            f"https://rzp.io/i/{log.transaction_id[:8]}" if log.transaction_id else None
        )
        discount_pct = 0.0
        if isinstance(payload.get("params"), dict):
            discount_pct = float(payload.get("params", {}).get("discount", 0.0))
        elif txn and txn.discount_applied_percent:
            discount_pct = float(txn.discount_applied_percent)

        feed.append({
            "id": log.id,
            "transaction_id": log.transaction_id,
            "recipient_phone": recipient_phone,
            "customer_name": customer_name,
            "message": payload.get("message", ""),
            "payment_link": payment_link,
            "discount_percentage": discount_pct,
            "status": log.status.value if hasattr(log.status, "value") else str(log.status),
            "sent_at": log.created_at.isoformat() if log.created_at else "",
        })
    return feed


@router.post("/transactions/{transaction_id}/retry")
async def manual_retry_transaction(
    transaction_id: str,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Manually re-triggers the autonomous recovery loop for a transaction with force override."""
    return await orchestrate_revenue_recovery(transaction_id, session, force=True)


@router.post("/transactions/{transaction_id}/mark-recovered")
async def mark_transaction_recovered(
    transaction_id: str,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Simulates customer completing payment via link."""
    txn_res = await session.execute(select(Transaction).where(Transaction.id == transaction_id))
    txn = txn_res.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    payable = round(txn.amount * (1.0 - txn.discount_applied_percent / 100.0), 2)
    txn.status = TransactionStatus.RECOVERED
    txn.recovered_amount = payable
    txn.updated_at = datetime.utcnow()
    session.add(txn)

    cust_res = await session.execute(select(Customer).where(Customer.id == txn.customer_id))
    cust = cust_res.scalar_one_or_none()
    if cust:
        cust.total_spent += payable
        cust.successful_transactions_count += 1
        cust.updated_at = datetime.utcnow()
        session.add(cust)

    await session.commit()

    await record_audit_log(
        session=session,
        agent_name="ManualRecoveryTrigger",
        action_type=ActionType.RECOVERY_VERIFIED,
        status=AuditStatus.SUCCESS,
        transaction_id=txn.id,
        customer_id=txn.customer_id,
        input_payload=json.dumps({"action": "mark_recovered", "amount": payable}),
        output_payload=f"Marked recovered via manual trigger: INR {payable:.2f}",
    )

    return {
        "status": "success",
        "transaction_id": txn.id,
        "recovered_amount": txn.recovered_amount,
        "message": f"Successfully marked transaction {txn.id} as recovered.",
    }


@router.post("/db/clear")
async def clear_database(session: AsyncSession = Depends(get_session)) -> Dict[str, Any]:
    """Clears all transactions, customers, and audit logs."""
    is_debug = bool(getattr(settings, "DEBUG_MODE", False) or getattr(settings, "DEBUG", False))
    if not is_debug:
        raise HTTPException(
            status_code=403,
            detail="Database wipe is disabled outside debug mode.",
        )
    from sqlalchemy import text
    from sqlmodel import delete
    try:
        from backend.database import is_postgres
    except ImportError:
        from database import is_postgres

    if is_postgres:
        await session.execute(text("TRUNCATE TABLE audit_log, transaction, customer RESTART IDENTITY CASCADE;"))
        await session.commit()
    else:
        await session.execute(delete(AuditLog))
        await session.execute(delete(Transaction))
        await session.execute(delete(Customer))
        await session.commit()
    return {"status": "success", "message": "Database records cleared successfully."}


@router.post("/db/seed")
async def trigger_seed_database() -> Dict[str, Any]:
    """Re-seeds database with realistic transactions."""
    is_debug = bool(getattr(settings, "DEBUG_MODE", False) or getattr(settings, "DEBUG", False))
    if not is_debug:
        raise HTTPException(
            status_code=403,
            detail="Database seeding is disabled outside debug mode.",
        )
    try:
        from backend.seed import seed_database
    except ImportError:
        from seed import seed_database

    await seed_database()
    return {"status": "success", "message": "Database successfully seeded."}


@router.get("/env-config", response_model=EnvConfigRead)
async def get_env_config() -> EnvConfigRead:
    """Returns current environment variables and debug_mode status."""
    is_debug = bool(getattr(settings, "DEBUG_MODE", False) or getattr(settings, "DEBUG", False))
    if not is_debug:
        return EnvConfigRead(debug_mode=False)

    return EnvConfigRead(
        debug_mode=True,
        groq_api_key=settings.GROQ_API_KEY,
        gemini_api_key=settings.GEMINI_API_KEY,
        llm_model=settings.LLM_MODEL,
        gemini_live_model=settings.GEMINI_LIVE_MODEL,
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
        razorpay_key_secret=settings.RAZORPAY_KEY_SECRET,
        razorpay_webhook_secret=settings.RAZORPAY_WEBHOOK_SECRET,
        twilio_api_key=settings.TWILIO_API_KEY,
        twilio_api_secret=settings.TWILIO_API_SECRET,
        twilio_whatsapp_from=settings.TWILIO_WHATSAPP_FROM,
        twilio_sandbox_template=settings.TWILIO_SANDBOX_TEMPLATE,
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_username=settings.SMTP_USERNAME,
        smtp_password=settings.SMTP_PASSWORD,
        smtp_from=settings.SMTP_FROM,
        max_retry_attempts=settings.MAX_RETRY_ATTEMPTS,
    )


@router.post("/env-config", response_model=EnvConfigRead)
async def update_env_config(payload: EnvConfigUpdate) -> EnvConfigRead:
    """Updates and strictly persists environment configuration to .env file."""
    is_debug = bool(getattr(settings, "DEBUG_MODE", False) or getattr(settings, "DEBUG", False))
    if not is_debug:
        raise HTTPException(
            status_code=403,
            detail="Environment variables can only be edited when DEBUG_MODE is True.",
        )

    try:
        from backend.config import save_settings_to_env
    except ImportError:
        from config import save_settings_to_env

    updates: Dict[str, Any] = {}
    if payload.groq_api_key is not None:
        updates["GROQ_API_KEY"] = payload.groq_api_key
    if payload.gemini_api_key is not None:
        updates["GEMINI_API_KEY"] = payload.gemini_api_key
    if payload.llm_model is not None:
        updates["LLM_MODEL"] = payload.llm_model
    if payload.gemini_live_model is not None:
        updates["GEMINI_LIVE_MODEL"] = payload.gemini_live_model
    if payload.razorpay_key_id is not None:
        updates["RAZORPAY_KEY_ID"] = payload.razorpay_key_id
    if payload.razorpay_key_secret is not None:
        updates["RAZORPAY_KEY_SECRET"] = payload.razorpay_key_secret
    if payload.razorpay_webhook_secret is not None:
        updates["RAZORPAY_WEBHOOK_SECRET"] = payload.razorpay_webhook_secret
    if payload.twilio_api_key is not None:
        updates["TWILIO_API_KEY"] = payload.twilio_api_key
    if payload.twilio_api_secret is not None:
        updates["TWILIO_API_SECRET"] = payload.twilio_api_secret
    if payload.twilio_whatsapp_from is not None:
        updates["TWILIO_WHATSAPP_FROM"] = payload.twilio_whatsapp_from
    if payload.twilio_sandbox_template is not None:
        updates["TWILIO_SANDBOX_TEMPLATE"] = payload.twilio_sandbox_template
    if payload.smtp_host is not None:
        updates["SMTP_HOST"] = payload.smtp_host
    if payload.smtp_port is not None:
        updates["SMTP_PORT"] = payload.smtp_port
    if payload.smtp_username is not None:
        updates["SMTP_USERNAME"] = payload.smtp_username
    if payload.smtp_password is not None:
        updates["SMTP_PASSWORD"] = payload.smtp_password
    if payload.smtp_from is not None:
        updates["SMTP_FROM"] = payload.smtp_from
    if payload.max_retry_attempts is not None:
        updates["MAX_RETRY_ATTEMPTS"] = payload.max_retry_attempts

    save_settings_to_env(updates)
    return await get_env_config()


@router.get("/groq-models", response_model=List[str])
async def list_groq_models() -> List[str]:
    """Fetches real-time available chat models directly from Groq API."""
    groq_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY")
    default_models = [
        "groq/openai/gpt-oss-120b",
        "groq/openai/gpt-oss-20b",
        "groq/qwen/qwen3.6-27b",
        "groq/qwen/qwen3.8-27b",
        "groq/allam-2-7b",
    ]
    if not groq_key:
        return default_models

    try:
        import httpx
        headers = {"Authorization": f"Bearer {groq_key}"}
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get("https://api.groq.com/openai/v1/models", headers=headers)
            if res.status_code == 200:
                data = res.json()
                models = [
                    f"groq/{m['id']}" for m in data.get("data", [])
                    if not m.get("id", "").startswith("whisper")
                    and not "guard" in m.get("id", "").lower()
                ]
                if models:
                    return models
    except Exception as e:
        logger.warning(f"Could not fetch dynamic Groq models: {e}")

    return default_models


class CheckoutOrderRequest(BaseModel):
    amount: float = 2499.0
    currency: str = "INR"
    customer_name: Optional[str] = "Priya Sharma"
    customer_email: Optional[str] = "priya.sharma@example.com"
    customer_phone: Optional[str] = "+919876543210"


class CheckoutOrderResponse(BaseModel):
    order_id: str
    amount: float
    currency: str
    key_id: str
    customer_name: str
    customer_email: str
    customer_phone: str


class CheckoutFailureReport(BaseModel):
    order_id: Optional[str] = None
    payment_id: Optional[str] = None
    error_code: Optional[str] = "BAD_REQUEST_ERROR"
    error_description: Optional[str] = "Payment failed during checkout authentication"
    error_source: Optional[str] = "bank"
    error_step: Optional[str] = "payment_authentication"
    error_reason: Optional[str] = "payment_failed"
    amount: float = 2499.0
    customer_name: Optional[str] = "Priya Sharma"
    customer_email: Optional[str] = "priya.sharma@example.com"
    customer_phone: Optional[str] = "+919876543210"


@router.post("/checkout/create-order", response_model=CheckoutOrderResponse)
async def create_checkout_order_endpoint(payload: CheckoutOrderRequest) -> CheckoutOrderResponse:
    """
    Creates a Razorpay order and returns standard checkout parameters to open the official modal.
    """
    notes = {
        "customer_name": payload.customer_name or "Valued Customer",
        "customer_email": payload.customer_email or "customer@example.com",
        "customer_phone": payload.customer_phone or "+919876543210",
    }
    order_info = await create_razorpay_order(
        amount=payload.amount,
        currency=payload.currency,
        notes=notes,
    )
    return CheckoutOrderResponse(
        order_id=order_info["order_id"],
        amount=order_info["amount"],
        currency=order_info["currency"],
        key_id=order_info["key_id"],
        customer_name=payload.customer_name or "Valued Customer",
        customer_email=payload.customer_email or "customer@example.com",
        customer_phone=payload.customer_phone or "+919876543210",
    )


@router.post("/checkout/report-failure")
async def report_checkout_failure_endpoint(
    payload: CheckoutFailureReport,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """
    Receives failure callback directly from Razorpay standard checkout client
    and invokes the autonomous revenue recovery orchestration pipeline.
    """
    cust_query = await session.execute(
        select(Customer).where(Customer.email == payload.customer_email)
    )
    customer = cust_query.scalar_one_or_none()

    if not customer:
        customer = Customer(
            name=payload.customer_name or "Valued Customer",
            email=payload.customer_email or "customer@example.com",
            phone=payload.customer_phone or "+919876543210",
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

    # Create Transaction
    transaction = Transaction(
        razorpay_order_id=payload.order_id or f"order_demo_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        razorpay_payment_id=payload.payment_id or f"pay_demo_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        customer_id=customer.id,
        amount=payload.amount,
        currency="INR",
        status=TransactionStatus.FAILED,
        failure_code=payload.error_code or "BAD_REQUEST_ERROR",
        failure_reason=payload.error_description or "Payment failed during checkout authentication",
        retry_count=0,
        max_retries=settings.MAX_RETRY_ATTEMPTS,
    )
    session.add(transaction)
    await session.commit()
    await session.refresh(transaction)

    # Trigger Autonomous Multi-Agent Recovery Pipeline
    recovery_result = await orchestrate_revenue_recovery(transaction.id, session)

    return {
        "status": "processed",
        "event": "checkout.payment_failed",
        "transaction_id": transaction.id,
        "recovery": recovery_result,
    }



