import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
try:
    from backend.agents.diagnostic_agent import run_diagnostic_agent
    from backend.agents.strategy_agent import run_strategy_agent
    from backend.models.audit_log import ActionType, AuditLog, AuditStatus
    from backend.models.customer import Customer
    from backend.models.schemas import (
        DiagnosticContext,
        EmailPayload,
        RazorpayPaymentLinkCreate,
        RecoveryChannel,
        WhatsAppPayload,
    )
    from backend.models.transaction import Transaction, TransactionStatus
    from backend.tools.razorpay_tool import create_payment_link
    from backend.tools.smtp_tool import send_recovery_email
    from backend.tools.whatsapp_tool import send_whatsapp_message
except ImportError:
    from agents.diagnostic_agent import run_diagnostic_agent
    from agents.strategy_agent import run_strategy_agent
    from models.audit_log import ActionType, AuditLog, AuditStatus
    from models.customer import Customer
    from models.schemas import (
        DiagnosticContext,
        EmailPayload,
        RazorpayPaymentLinkCreate,
        RecoveryChannel,
        WhatsAppPayload,
    )
    from models.transaction import Transaction, TransactionStatus
    from tools.razorpay_tool import create_payment_link
    from tools.smtp_tool import send_recovery_email
    from tools.whatsapp_tool import send_whatsapp_message

logger = logging.getLogger(__name__)


async def record_audit_log(
    session: AsyncSession,
    agent_name: str,
    action_type: ActionType,
    status: AuditStatus,
    transaction_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    input_payload: Optional[str] = None,
    output_payload: Optional[str] = None,
    metadata_json: Optional[str] = None,
    duration_ms: Optional[float] = None,
) -> AuditLog:
    """Helper to persist audit ledger entries to SQLite."""
    log_entry = AuditLog(
        transaction_id=transaction_id,
        customer_id=customer_id,
        agent_name=agent_name,
        action_type=action_type,
        status=status,
        input_payload=input_payload,
        output_payload=output_payload,
        metadata_json=metadata_json,
        execution_duration_ms=duration_ms,
        created_at=datetime.utcnow(),
    )
    session.add(log_entry)
    await session.commit()
    await session.refresh(log_entry)
    return log_entry


async def orchestrate_revenue_recovery(
    transaction_id: str,
    session: AsyncSession,
    force: bool = False,
) -> Dict[str, Any]:
    """
    Master autonomous recovery workflow orchestrator.
    Executes: Guardrail Gating -> Diagnostics -> Strategy -> Payment Link Tool -> Dispatch Tool -> Audit Logging.
    """
    # 1. Fetch Transaction and Customer records
    result = await session.execute(select(Transaction).where(Transaction.id == transaction_id))
    txn = result.scalar_one_or_none()
    if not txn:
        return {"status": "error", "message": f"Transaction {transaction_id} not found."}

    cust_result = await session.execute(select(Customer).where(Customer.id == txn.customer_id))
    cust = cust_result.scalar_one_or_none()
    if not cust:
        return {"status": "error", "message": f"Customer for transaction {transaction_id} not found."}

    # 2. Stopping Rules & Gating Check (bypassed if force=True on manual operator action)
    if not force and txn.retry_count >= txn.max_retries:
        await record_audit_log(
            session=session,
            agent_name="RecoveryOrchestrator",
            action_type=ActionType.GATING_RULE_BLOCKED,
            status=AuditStatus.SKIPPED,
            transaction_id=txn.id,
            customer_id=cust.id,
            input_payload=json.dumps({"retry_count": txn.retry_count, "max_retries": txn.max_retries}),
            output_payload="Max retry threshold exceeded. Automated recovery stopped.",
        )
        txn.status = TransactionStatus.ABANDONED
        session.add(txn)
        await session.commit()
        return {
            "status": "blocked",
            "reason": "Max retry bound exceeded",
            "retry_count": txn.retry_count,
        }

    if force and txn.retry_count >= txn.max_retries:
        # Operator override: expand threshold by 1 to record clean attempt
        txn.max_retries = txn.retry_count + 1

    # 3. Build Diagnostic Context
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

    # 4. Invoke Diagnostic Agent
    t_start = time.perf_counter()
    diagnosis = await run_diagnostic_agent(ctx)
    t_diag_ms = round((time.perf_counter() - t_start) * 1000, 2)

    await record_audit_log(
        session=session,
        agent_name="DiagnosticAgent",
        action_type=ActionType.DIAGNOSIS_COMPLETED,
        status=AuditStatus.SUCCESS,
        transaction_id=txn.id,
        customer_id=cust.id,
        input_payload=ctx.model_dump_json(),
        output_payload=diagnosis.model_dump_json(),
        duration_ms=t_diag_ms,
    )

    txn.failure_category = diagnosis.failure_category
    cust.risk_score = diagnosis.risk_score

    if not diagnosis.can_retry:
        txn.status = TransactionStatus.ABANDONED
        session.add(txn)
        session.add(cust)
        await session.commit()
        return {
            "status": "abandoned",
            "diagnosis": diagnosis.model_dump(),
            "reason": "Transaction flagged non-recoverable by Diagnostic Agent",
        }

    # 5. Invoke Strategy Agent
    t_strat_start = time.perf_counter()
    strategy = await run_strategy_agent(ctx, diagnosis)
    t_strat_ms = round((time.perf_counter() - t_strat_start) * 1000, 2)

    await record_audit_log(
        session=session,
        agent_name="StrategyAgent",
        action_type=ActionType.STRATEGY_DECIDED,
        status=AuditStatus.SUCCESS,
        transaction_id=txn.id,
        customer_id=cust.id,
        input_payload=diagnosis.model_dump_json(),
        output_payload=strategy.model_dump_json(),
        duration_ms=t_strat_ms,
    )

    # 6. Tool Execution 1: Generate Payment Link with dynamic discount
    payable_amount = round(txn.amount * (1.0 - (strategy.discount_percentage / 100.0)), 2)
    link_create_req = RazorpayPaymentLinkCreate(
        amount=payable_amount,
        currency=txn.currency,
        description=f"Recovery order {txn.razorpay_order_id}",
        customer_name=cust.name,
        customer_email=cust.email,
        customer_contact=cust.phone,
        notes={
            "transaction_id": txn.id,
            "discount_percent": str(strategy.discount_percentage),
            "offer_code": strategy.offer_code or "NONE",
        },
    )

    t_link_start = time.perf_counter()
    link_resp = await create_payment_link(link_create_req)
    t_link_ms = round((time.perf_counter() - t_link_start) * 1000, 2)

    await record_audit_log(
        session=session,
        agent_name="RazorpayPaymentLinkTool",
        action_type=ActionType.PAYMENT_LINK_GENERATED,
        status=AuditStatus.SUCCESS,
        transaction_id=txn.id,
        customer_id=cust.id,
        input_payload=link_create_req.model_dump_json(),
        output_payload=link_resp.model_dump_json(),
        duration_ms=t_link_ms,
    )

    # 7. Tool Execution 2: Channel Dispatch (Guaranteed Email + WhatsApp Outreach)
    dispatch_results: Dict[str, Any] = {}

    # 7a. Primary / Guaranteed Email Dispatch whenever customer email exists
    if cust.email and "@" in cust.email and not cust.email.endswith("@example.internal"):
        discount_rows = f"""
        <tr>
          <td style="padding: 6px 0; color: #059669; font-weight: 600;">Special Recovery Discount ({strategy.discount_percentage}%):</td>
          <td style="padding: 6px 0; font-family: monospace; font-weight: 600; text-align: right; color: #059669;">-INR {(txn.amount * strategy.discount_percentage / 100.0):.2f}</td>
        </tr>
        """ if strategy.discount_percentage > 0 else ""

        email_html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: #0c2340; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Shark Recovery</h1>
              <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">Autonomous Payment Recovery Engine</p>
            </div>
            <div style="padding: 28px 24px;">
              <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">{strategy.custom_headline}</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">{strategy.message_content}</p>

              <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Order Reference:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-weight: 600; text-align: right; color: #0f172a;">{txn.razorpay_order_id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Original Order Total:</td>
                    <td style="padding: 6px 0; font-family: monospace; text-align: right; color: #64748b;">INR {txn.amount:.2f}</td>
                  </tr>
                  {discount_rows}
                  <tr style="border-top: 1px solid #cbd5e1;">
                    <td style="padding: 10px 0 0 0; font-weight: 700; color: #0f172a;">Payable Now:</td>
                    <td style="padding: 10px 0 0 0; font-family: monospace; font-weight: 700; font-size: 16px; text-align: right; color: #2563eb;">INR {payable_amount:.2f}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 28px 0 20px 0;">
                <a href="{link_resp.short_url}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">Complete Payment Securely &rarr;</a>
              </div>
              <p style="text-align: center; font-size: 11px; color: #94a3b8; margin: 0;">Secured by Razorpay. 1-click retry with UPI, Cards, Netbanking.</p>
            </div>
            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
              &copy; Shark Recovery • Autonomous Revenue Recovery
            </div>
          </div>
        </body>
        </html>
        """
        email_payload = EmailPayload(
            transaction_id=txn.id,
            recipient_email=cust.email,
            recipient_name=cust.name,
            subject=strategy.custom_headline,
            body_html=email_html,
            body_text=f"{strategy.message_content}\n\nPay Now (INR {payable_amount:.2f}): {link_resp.short_url}",
            payment_link=link_resp.short_url,
            discount_applied=strategy.discount_percentage,
            original_amount=txn.amount,
            final_amount=payable_amount,
        )
        t_em_start = time.perf_counter()
        email_result = await send_recovery_email(email_payload)
        t_em_ms = round((time.perf_counter() - t_em_start) * 1000, 2)

        await record_audit_log(
            session=session,
            agent_name="SMTPDispatchTool",
            action_type=ActionType.EMAIL_DISPATCHED,
            status=AuditStatus.SUCCESS if email_result.get("delivered") else AuditStatus.WARNING,
            transaction_id=txn.id,
            customer_id=cust.id,
            input_payload=email_payload.model_dump_json(),
            output_payload=json.dumps(email_result),
            duration_ms=t_em_ms,
        )
        dispatch_results["email"] = email_result

    # 7b. WhatsApp Outreach Dispatch if mobile phone available
    if cust.phone and (strategy.channel == RecoveryChannel.WHATSAPP or strategy.channel == RecoveryChannel.OMNICHANNEL if hasattr(RecoveryChannel, 'OMNICHANNEL') else strategy.channel == RecoveryChannel.WHATSAPP):
        wa_payload = WhatsAppPayload(
            transaction_id=txn.id,
            recipient_phone=cust.phone,
            recipient_name=cust.name,
            message=f"{strategy.message_content}\n\n👉 Complete Payment: {link_resp.short_url}",
            payment_link=link_resp.short_url,
            template_name="cart_recovery_incentive",
            params={"discount": strategy.discount_percentage, "code": strategy.offer_code or ""},
        )
        t_wa_start = time.perf_counter()
        wa_result = await send_whatsapp_message(wa_payload)
        t_wa_ms = round((time.perf_counter() - t_wa_start) * 1000, 2)

        await record_audit_log(
            session=session,
            agent_name="WhatsAppDispatchTool",
            action_type=ActionType.WHATSAPP_DISPATCHED,
            status=AuditStatus.SUCCESS if wa_result.get("delivered") else AuditStatus.WARNING,
            transaction_id=txn.id,
            customer_id=cust.id,
            input_payload=wa_payload.model_dump_json(),
            output_payload=json.dumps(wa_result),
            duration_ms=t_wa_ms,
        )
        dispatch_results["whatsapp"] = wa_result

    # Primary channel tag
    if strategy.channel == RecoveryChannel.WHATSAPP and "whatsapp" in dispatch_results:
        txn.recovery_channel = "whatsapp"
    elif "email" in dispatch_results:
        txn.recovery_channel = "email"
    else:
        txn.recovery_channel = "whatsapp" if cust.phone else "email"

    # 8. Update Transaction State
    txn.retry_count += 1
    txn.status = TransactionStatus.PROCESSING
    txn.recovery_link = link_resp.short_url
    txn.discount_applied_percent = strategy.discount_percentage
    txn.updated_at = datetime.utcnow()

    session.add(txn)
    session.add(cust)
    await session.commit()
    await session.refresh(txn)

    return {
        "status": "success",
        "transaction_id": txn.id,
        "retry_count": txn.retry_count,
        "max_retries": txn.max_retries,
        "diagnosis": diagnosis.model_dump(),
        "strategy": strategy.model_dump(),
        "payment_link": link_resp.short_url,
        "payable_amount": payable_amount,
        "dispatch": dispatch_results,
    }
