import asyncio
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

try:
    from backend.agents.compliance_agent import verify_compliance_and_stopping_rules
    from backend.agents.diagnostic_agent import run_diagnostic_agent
    from backend.agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from backend.database import async_session_maker
    from backend.models.audit_log import ActionType, AuditStatus
    from backend.models.customer import Customer
    from backend.models.schemas import (
        DiagnosticContext,
        EmailPayload,
        RazorpayPaymentLinkCreate,
        WhatsAppPayload,
    )
    from backend.models.transaction import Transaction, TransactionStatus
    from backend.tools.razorpay_tool import create_payment_link
    from backend.tools.smtp_tool import send_recovery_email
    from backend.tools.whatsapp_tool import send_whatsapp_message
except ImportError:
    from agents.compliance_agent import verify_compliance_and_stopping_rules
    from agents.diagnostic_agent import run_diagnostic_agent
    from agents.orchestrator import orchestrate_revenue_recovery, record_audit_log
    from database import async_session_maker
    from models.audit_log import ActionType, AuditStatus
    from models.customer import Customer
    from models.schemas import (
        DiagnosticContext,
        EmailPayload,
        RazorpayPaymentLinkCreate,
        WhatsAppPayload,
    )
    from models.transaction import Transaction, TransactionStatus
    from tools.razorpay_tool import create_payment_link
    from tools.smtp_tool import send_recovery_email
    from tools.whatsapp_tool import send_whatsapp_message

logger = logging.getLogger(__name__)

# Global worker control state
_scheduler_task: Optional[asyncio.Task] = None
_is_paused: bool = False
_is_running: bool = False
_last_tick_at: Optional[datetime] = None
_last_tick_metrics: Dict[str, int] = {
    "delayed_dispatches": 0,
    "retries_triggered": 0,
    "ptp_breaches_handled": 0,
    "blocked": 0,
}


def parse_ptp_date(pdate_str: Optional[str]) -> Optional[datetime]:
    """
    Robust datetime parser for customer promise-to-pay commitments.
    Handles ISO formats, standard date strings, relative terms ('Today', 'Tomorrow').
    Returns a naive UTC datetime for standardized comparison with datetime.utcnow().
    """
    if not pdate_str or not isinstance(pdate_str, str):
        return None

    cleaned = pdate_str.strip()
    if not cleaned:
        return None

    # Strip trailing UTC/IST timezone labels for strptime
    clean_no_tz = re.sub(r"\s+(UTC|IST)$", "", cleaned, flags=re.IGNORECASE)

    # 1. Check relative phrasing: 'Today' or 'Tomorrow'
    ist_now = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    lower = cleaned.lower()

    if "today" in lower or "tomorrow" in lower:
        base_ist = ist_now + (timedelta(days=1) if "tomorrow" in lower else timedelta(0))
        # Check for time pattern e.g. '10:30 AM' or '06:37'
        time_match = re.search(r"(\d{1,2}):(\d{2})\s*(am|pm)?", lower)
        if time_match:
            hr = int(time_match.group(1))
            mn = int(time_match.group(2))
            meridiem = time_match.group(3)
            if meridiem == "pm" and hr < 12:
                hr += 12
            elif meridiem == "am" and hr == 12:
                hr = 0
            target_ist = base_ist.replace(hour=hr, minute=mn, second=0, microsecond=0)
        else:
            target_ist = base_ist.replace(hour=10, minute=30, second=0, microsecond=0)
        # Convert IST to UTC (subtract 5h 30m)
        target_utc = target_ist - timedelta(hours=5, minutes=30)
        return target_utc.replace(tzinfo=None)

    # 2. Try standard ISO formats
    iso_clean = clean_no_tz.replace("T", " ")
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
        "%d-%m-%Y",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
    ):
        try:
            parsed = datetime.strptime(iso_clean, fmt)
            # If "IST" was explicitly in string, convert from IST to UTC
            if "IST" in cleaned.upper():
                parsed = parsed - timedelta(hours=5, minutes=30)
            return parsed
        except ValueError:
            pass

    return None


async def run_scheduler_tick(session: Optional[AsyncSession] = None) -> Dict[str, int]:
    """
    Executes a single evaluation pass of the autonomous recovery scheduler:
    1. Delayed Dispatches: dispatch_scheduled_at <= now and outreach pending.
    2. Eligible Auto-Retries: status == PROCESSING, retry_count < max_retries, next_retry_at <= now.
    3. Expired PTPs: promise_to_pay_date < now, status != RECOVERED, ptp_reminder_sent == False.
    Enforces compliance gating and IST DND suppression (8 PM - 8 AM IST).
    """
    global _last_tick_at, _last_tick_metrics

    metrics = {
        "delayed_dispatches": 0,
        "retries_triggered": 0,
        "ptp_breaches_handled": 0,
        "blocked": 0,
    }

    if _is_paused:
        logger.info("RecoveryScheduler is currently paused. Skipping tick.")
        return metrics

    now = datetime.utcnow()
    _last_tick_at = now

    own_session = False
    if session is None:
        session = async_session_maker()
        own_session = True

    try:
        # -------------------------------------------------------------------
        # 1. Delayed Dispatches (Liquidity & Gateway cooldown windows)
        # -------------------------------------------------------------------
        delayed_query = (
            select(Transaction, Customer)
            .join(Customer, Transaction.customer_id == Customer.id)
            .where(
                Transaction.dispatch_scheduled_at.isnot(None),
                Transaction.dispatch_scheduled_at <= now,
                Transaction.status == TransactionStatus.PROCESSING,
                Transaction.auto_retry_enabled == True,
            )
        )
        delayed_rows = (await session.execute(delayed_query)).all()

        for txn, cust in delayed_rows:
            ctx = DiagnosticContext(
                transaction_id=txn.id,
                razorpay_order_id=txn.razorpay_order_id,
                razorpay_payment_id=txn.razorpay_payment_id,
                amount=txn.amount,
                failure_code=txn.failure_code,
                failure_reason=txn.failure_reason,
                customer_name=cust.name,
                customer_email=cust.email,
                customer_phone=cust.phone,
                previous_failed_attempts=cust.failed_transactions_count,
                total_spent=cust.total_spent,
            )
            diag = await run_diagnostic_agent(ctx)
            compliance = await verify_compliance_and_stopping_rules(
                ctx=ctx,
                diag=diag,
                retry_count=txn.retry_count,
                max_retries=txn.max_retries,
            )

            if not compliance.is_compliant or diag.risk_score >= 0.85:
                txn.status = TransactionStatus.ABANDONED
                txn.dispatch_scheduled_at = None
                txn.updated_at = datetime.utcnow()
                session.add(txn)
                await session.commit()
                await record_audit_log(
                    session=session,
                    agent_name="RecoverySchedulerWorker",
                    action_type=ActionType.COMPLIANCE_GATING_BLOCKED,
                    status=AuditStatus.SKIPPED,
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    input_payload=json.dumps({"stage": "delayed_dispatch", "risk_score": diag.risk_score}),
                    output_payload="Delayed dispatch halted: High churn/fraud risk threshold breached.",
                )
                metrics["blocked"] += 1
                continue

            # Check DND window (8 PM - 8 AM IST)
            if compliance.dnd_window_active:
                logger.info(f"Delayed dispatch for txn {txn.id} suppressed during DND window.")
                continue

            # Generate/refresh Razorpay recovery link if missing
            if not txn.recovery_link:
                payable = round(txn.amount * (1.0 - (txn.discount_applied_percent or 0.0) / 100.0), 2)
                link_req = RazorpayPaymentLinkCreate(
                    amount=payable,
                    currency=txn.currency,
                    description=f"Scheduled recovery {txn.razorpay_order_id}",
                    customer_name=cust.name,
                    customer_email=cust.email,
                    customer_contact=cust.phone,
                )
                link_res = await create_payment_link(link_req)
                txn.recovery_link = link_res.short_url

            first_name = cust.name.split()[0] if cust.name else "ji"
            if cust.phone and txn.recovery_channel != "email":
                wa_msg = (
                    f"Namaste {first_name} ji! Aapka cart safe rakha gaya tha. "
                    f"Banking window open hai; neeche click karke 1-click complete karein:\n\n"
                    f"👉 Pay Now: {txn.recovery_link}"
                )
                wa_payload = WhatsAppPayload(
                    transaction_id=txn.id,
                    recipient_phone=cust.phone,
                    recipient_name=cust.name,
                    message=wa_msg,
                    payment_link=txn.recovery_link,
                    template_name="cart_recovery_incentive",
                )
                wa_res = await send_whatsapp_message(wa_payload)
                await record_audit_log(
                    session=session,
                    agent_name="RecoverySchedulerWorker",
                    action_type=ActionType.WHATSAPP_DISPATCHED,
                    status=AuditStatus.SUCCESS if wa_res.get("delivered") else AuditStatus.FAILURE,
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    input_payload=wa_payload.model_dump_json(),
                    output_payload=json.dumps(wa_res),
                )
            elif cust.email:
                payable = round(txn.amount * (1.0 - (txn.discount_applied_percent or 0.0) / 100.0), 2)
                email_payload = EmailPayload(
                    transaction_id=txn.id,
                    recipient_email=cust.email,
                    recipient_name=cust.name,
                    subject="Your Reserved Order - Ready for Payment",
                    body_html=f"<p>Hello {first_name}, your cart was reserved. Complete your payment securely: <a href='{txn.recovery_link}'>Pay Now</a></p>",
                    body_text=f"Your cart was reserved. Pay now: {txn.recovery_link}",
                    payment_link=txn.recovery_link,
                    original_amount=txn.amount,
                    final_amount=payable,
                )
                em_res = await send_recovery_email(email_payload)
                await record_audit_log(
                    session=session,
                    agent_name="RecoverySchedulerWorker",
                    action_type=ActionType.EMAIL_DISPATCHED,
                    status=AuditStatus.SUCCESS if em_res.get("delivered") else AuditStatus.FAILURE,
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    input_payload=email_payload.model_dump_json(),
                    output_payload=json.dumps(em_res),
                )

            txn.dispatch_scheduled_at = None
            txn.updated_at = datetime.utcnow()
            session.add(txn)
            await session.commit()

            await record_audit_log(
                session=session,
                agent_name="RecoverySchedulerWorker",
                action_type=ActionType.DELAYED_DISPATCH_TRIGGERED,
                status=AuditStatus.SUCCESS,
                transaction_id=txn.id,
                customer_id=cust.id,
                input_payload=json.dumps({"reason": "liquidity_or_gateway_window_reached"}),
                output_payload=f"Dispatched delayed payment link {txn.recovery_link} to {cust.name}",
            )
            metrics["delayed_dispatches"] += 1

        # -------------------------------------------------------------------
        # 2. Eligible Auto-Retries (Cooling-off intervals expired)
        # -------------------------------------------------------------------
        retry_query = (
            select(Transaction, Customer)
            .join(Customer, Transaction.customer_id == Customer.id)
            .where(
                Transaction.status == TransactionStatus.PROCESSING,
                Transaction.auto_retry_enabled == True,
                Transaction.retry_count < Transaction.max_retries,
                Transaction.next_retry_at.isnot(None),
                Transaction.next_retry_at <= now,
                Transaction.dispatch_scheduled_at.is_(None),
            )
        )
        retry_rows = (await session.execute(retry_query)).all()

        for txn, cust in retry_rows:
            ctx = DiagnosticContext(
                transaction_id=txn.id,
                razorpay_order_id=txn.razorpay_order_id,
                razorpay_payment_id=txn.razorpay_payment_id,
                amount=txn.amount,
                failure_code=txn.failure_code,
                failure_reason=txn.failure_reason,
                customer_name=cust.name,
                customer_email=cust.email,
                customer_phone=cust.phone,
                previous_failed_attempts=cust.failed_transactions_count,
                total_spent=cust.total_spent,
            )
            diag = await run_diagnostic_agent(ctx)
            compliance = await verify_compliance_and_stopping_rules(
                ctx=ctx,
                diag=diag,
                retry_count=txn.retry_count,
                max_retries=txn.max_retries,
            )

            if not compliance.is_compliant or diag.risk_score >= 0.85:
                txn.status = TransactionStatus.ABANDONED
                txn.updated_at = datetime.utcnow()
                session.add(txn)
                await session.commit()
                await record_audit_log(
                    session=session,
                    agent_name="RecoverySchedulerWorker",
                    action_type=ActionType.COMPLIANCE_GATING_BLOCKED,
                    status=AuditStatus.SKIPPED,
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    input_payload=json.dumps({"stage": "auto_retry", "retry_count": txn.retry_count}),
                    output_payload="Auto-retry blocked by compliance stopping rules.",
                )
                metrics["blocked"] += 1
                continue

            if compliance.dnd_window_active:
                logger.info(f"Auto-retry for txn {txn.id} postponed during DND.")
                continue

            await record_audit_log(
                session=session,
                agent_name="RecoverySchedulerWorker",
                action_type=ActionType.RECOVERY_AUTO_RETRY,
                status=AuditStatus.SUCCESS,
                transaction_id=txn.id,
                customer_id=cust.id,
                input_payload=json.dumps({"attempt": txn.retry_count + 1, "max_retries": txn.max_retries}),
                output_payload="Automated retry triggered by RecoverySchedulerWorker after cooling-off period.",
            )
            await orchestrate_revenue_recovery(txn.id, session)
            metrics["retries_triggered"] += 1

        # -------------------------------------------------------------------
        # 3. Expired PTPs (Promise-to-pay breach detector)
        # -------------------------------------------------------------------
        ptp_query = (
            select(Transaction, Customer)
            .join(Customer, Transaction.customer_id == Customer.id)
            .where(
                Transaction.promise_to_pay_date.isnot(None),
                Transaction.status != TransactionStatus.RECOVERED,
                Transaction.status != TransactionStatus.ABANDONED,
                Transaction.ptp_reminder_sent == False,
                Transaction.auto_retry_enabled == True,
            )
        )
        ptp_rows = (await session.execute(ptp_query)).all()

        for txn, cust in ptp_rows:
            ptp_dt = parse_ptp_date(txn.promise_to_pay_date)
            if not ptp_dt or ptp_dt > now:
                continue

            # PTP Breach confirmed
            txn.ptp_status = "BREACHED"

            ctx = DiagnosticContext(
                transaction_id=txn.id,
                razorpay_order_id=txn.razorpay_order_id,
                razorpay_payment_id=txn.razorpay_payment_id,
                amount=txn.amount,
                failure_code=txn.failure_code,
                failure_reason=txn.failure_reason,
                customer_name=cust.name,
                customer_email=cust.email,
                customer_phone=cust.phone,
                previous_failed_attempts=cust.failed_transactions_count,
                total_spent=cust.total_spent,
            )
            diag = await run_diagnostic_agent(ctx)
            compliance = await verify_compliance_and_stopping_rules(
                ctx=ctx,
                diag=diag,
                retry_count=txn.retry_count,
                max_retries=txn.max_retries,
            )

            is_viable = (
                compliance.is_compliant
                and diag.risk_score < 0.85
                and txn.retry_count < txn.max_retries
            )

            if is_viable:
                if compliance.dnd_window_active:
                    logger.info(f"PTP reminder for txn {txn.id} delayed due to DND window.")
                    continue

                # Refresh / ensure Razorpay recovery link
                if not txn.recovery_link:
                    payable = round(txn.amount * (1.0 - (txn.discount_applied_percent or 0.0) / 100.0), 2)
                    link_req = RazorpayPaymentLinkCreate(
                        amount=payable,
                        currency=txn.currency,
                        description=f"PTP breach recovery {txn.razorpay_order_id}",
                        customer_name=cust.name,
                        customer_email=cust.email,
                        customer_contact=cust.phone,
                    )
                    link_res = await create_payment_link(link_req)
                    txn.recovery_link = link_res.short_url

                first_name = cust.name.split()[0] if cust.name else "ji"
                reminder_copy = (
                    f"Namaste {first_name} ji! Aapka ₹{txn.amount:,.0f} payment ka committed time "
                    f"({txn.promise_to_pay_date}) complete ho chuka hai. Order cancel hone se "
                    f"bachane ke liye neeche diye link se 1-click complete karein.\n\n"
                    f"👉 Complete Payment: {txn.recovery_link}"
                )

                if cust.phone:
                    wa_payload = WhatsAppPayload(
                        transaction_id=txn.id,
                        recipient_phone=cust.phone,
                        recipient_name=cust.name,
                        message=reminder_copy,
                        payment_link=txn.recovery_link or "",
                        template_name="ptp_breach_reminder",
                    )
                    wa_res = await send_whatsapp_message(wa_payload)
                    await record_audit_log(
                        session=session,
                        agent_name="RecoverySchedulerWorker",
                        action_type=ActionType.WHATSAPP_DISPATCHED,
                        status=AuditStatus.SUCCESS if wa_res.get("delivered") else AuditStatus.FAILURE,
                        transaction_id=txn.id,
                        customer_id=cust.id,
                        input_payload=wa_payload.model_dump_json(),
                        output_payload=json.dumps(wa_res),
                    )
                elif cust.email:
                    email_payload = EmailPayload(
                        transaction_id=txn.id,
                        recipient_email=cust.email,
                        recipient_name=cust.name,
                        subject=f"Urgent: Payment Commitment Expired ({txn.razorpay_order_id})",
                        body_html=f"<p>{reminder_copy}</p>",
                        body_text=reminder_copy,
                        payment_link=txn.recovery_link or "",
                        original_amount=txn.amount,
                        final_amount=txn.amount,
                    )
                    em_res = await send_recovery_email(email_payload)
                    await record_audit_log(
                        session=session,
                        agent_name="RecoverySchedulerWorker",
                        action_type=ActionType.EMAIL_DISPATCHED,
                        status=AuditStatus.SUCCESS if em_res.get("delivered") else AuditStatus.FAILURE,
                        transaction_id=txn.id,
                        customer_id=cust.id,
                        input_payload=email_payload.model_dump_json(),
                        output_payload=json.dumps(em_res),
                    )

                txn.ptp_reminder_sent = True
                txn.retry_count += 1
                txn.updated_at = datetime.utcnow()
                session.add(txn)
                await session.commit()

                await record_audit_log(
                    session=session,
                    agent_name="RecoverySchedulerWorker",
                    action_type=ActionType.PTP_BREACH_REMINDER,
                    status=AuditStatus.SUCCESS,
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    input_payload=json.dumps({"ptp_date": txn.promise_to_pay_date, "amount": txn.amount}),
                    output_payload=f"PTP breached commitment reminder dispatched to {cust.name}. Retry count updated to {txn.retry_count}.",
                )
                metrics["ptp_breaches_handled"] += 1
            else:
                txn.status = TransactionStatus.ABANDONED
                txn.updated_at = datetime.utcnow()
                session.add(txn)
                await session.commit()
                await record_audit_log(
                    session=session,
                    agent_name="RecoverySchedulerWorker",
                    action_type=ActionType.COMPLIANCE_GATING_BLOCKED,
                    status=AuditStatus.SKIPPED,
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    input_payload=json.dumps({"ptp_date": txn.promise_to_pay_date, "retry_count": txn.retry_count, "risk_score": diag.risk_score}),
                    output_payload="PTP commitment breach non-viable under compliance ceilings. Status transitioned to ABANDONED.",
                )
                metrics["blocked"] += 1

    except Exception as e:
        logger.error(f"Error during RecoveryScheduler tick: {e}", exc_info=True)
    finally:
        if own_session and session:
            await session.close()

    _last_tick_metrics = metrics
    return metrics


async def recovery_scheduler_loop(interval_seconds: int = 30) -> None:
    """
    Continuous background loop for the autonomous recovery worker.
    Runs every interval_seconds (default 30s) inside FastAPI lifespan.
    """
    global _is_running
    _is_running = True
    logger.info(f"RecoveryScheduler background loop started (interval={interval_seconds}s).")
    try:
        while _is_running:
            try:
                await run_scheduler_tick()
            except Exception as e:
                logger.error(f"RecoveryScheduler loop error: {e}")
            await asyncio.sleep(interval_seconds)
    except asyncio.CancelledError:
        logger.info("RecoveryScheduler background loop cancelled.")
    finally:
        _is_running = False


def pause_recovery_scheduler() -> None:
    global _is_paused
    _is_paused = True
    logger.info("RecoveryScheduler worker paused.")


def resume_recovery_scheduler() -> None:
    global _is_paused
    _is_paused = False
    logger.info("RecoveryScheduler worker resumed.")


def stop_recovery_scheduler() -> None:
    global _is_running
    _is_running = False
    logger.info("RecoveryScheduler worker stopped.")


def get_scheduler_status() -> Dict[str, Any]:
    return {
        "is_running": _is_running,
        "is_paused": _is_paused,
        "last_tick_at": _last_tick_at.isoformat() if _last_tick_at else None,
        "metrics": _last_tick_metrics,
    }
