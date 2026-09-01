import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
try:
    from backend.agents.compliance_agent import verify_compliance_and_stopping_rules
    from backend.agents.diagnostic_agent import run_diagnostic_agent
    from backend.agents.mandate_agent import compute_b2b_promise_to_pay, compute_mandate_retry_schedule
    from backend.agents.sentinel_agent import run_sentinel_monitor
    from backend.agents.strategy_agent import run_strategy_agent
    from backend.agents.voice_agent import run_voice_recovery_agent
    from backend.models.audit_log import ActionType, AuditLog, AuditStatus
    from backend.models.customer import Customer
    from backend.models.schemas import (
        DiagnosticContext,
        EmailPayload,
        RazorpayPaymentLinkCreate,
        RecoveryChannel,
        WhatsAppPayload,
    )
    from backend.models.transaction import LossVector, Transaction, TransactionStatus
    from backend.tools.razorpay_tool import create_payment_link
    from backend.tools.smtp_tool import send_recovery_email
    from backend.tools.whatsapp_tool import send_whatsapp_message
except ImportError:
    from agents.compliance_agent import verify_compliance_and_stopping_rules
    from agents.diagnostic_agent import run_diagnostic_agent
    from agents.mandate_agent import compute_b2b_promise_to_pay, compute_mandate_retry_schedule
    from agents.sentinel_agent import run_sentinel_monitor
    from agents.strategy_agent import run_strategy_agent
    from agents.voice_agent import run_voice_recovery_agent
    from models.audit_log import ActionType, AuditLog, AuditStatus
    from models.customer import Customer
    from models.schemas import (
        DiagnosticContext,
        EmailPayload,
        RazorpayPaymentLinkCreate,
        RecoveryChannel,
        WhatsAppPayload,
    )
    from models.transaction import LossVector, Transaction, TransactionStatus
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
    Master Autonomous Multi-Agent Revenue Recovery Pipeline:
    1. Sentinel Telemetry Agent -> Gateway Anomaly Detection
    2. Diagnostic Root Cause Agent -> Risk & Churn Modeling
    3. Guardian Compliance Agent -> RBI Fair Practices & Stopping Rules
    4. Master Strategist Agent -> Dynamic Matrix & Discount Optimization
    5. Specialized Agents -> Voice AI Dialogue / Mandate Sequencer / B2B Promise-to-Pay
    6. Tool Dispatchers -> Razorpay Links + SMTP Gateway + WhatsApp Outreach
    7. Settlement & Audit Ledger -> Telemetry Audit Trail
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

    # 2. Agent 1: Sentinel Telemetry Monitor Agent
    t_sent_start = time.perf_counter()
    sentinel_report = await run_sentinel_monitor(txn.failure_code or "", txn.failure_reason or "")
    t_sent_ms = round((time.perf_counter() - t_sent_start) * 1000, 2)

    await record_audit_log(
        session=session,
        agent_name="SentinelMonitorAgent",
        action_type=ActionType.SENTINEL_ANOMALY_DETECTED,
        status=AuditStatus.SUCCESS,
        transaction_id=txn.id,
        customer_id=cust.id,
        input_payload=json.dumps({"error_code": txn.failure_code, "reason": txn.failure_reason}),
        output_payload=sentinel_report.model_dump_json(),
        duration_ms=t_sent_ms,
    )

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

    # 4. Agent 2: Diagnostic Root Cause Agent
    t_diag_start = time.perf_counter()
    diagnosis = await run_diagnostic_agent(ctx)
    t_diag_ms = round((time.perf_counter() - t_diag_start) * 1000, 2)

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

    # 5. Agent 3: Guardian Compliance & Stopping Rules Agent
    compliance = await verify_compliance_and_stopping_rules(
        ctx=ctx,
        diag=diagnosis,
        retry_count=txn.retry_count if not force else 0,
        max_retries=txn.max_retries,
    )

    if not compliance.is_compliant:
        await record_audit_log(
            session=session,
            agent_name="GuardianComplianceAgent",
            action_type=ActionType.COMPLIANCE_GATING_BLOCKED,
            status=AuditStatus.SKIPPED,
            transaction_id=txn.id,
            customer_id=cust.id,
            input_payload=json.dumps({"retry_count": txn.retry_count, "max_retries": txn.max_retries}),
            output_payload=compliance.model_dump_json(),
        )
        txn.status = TransactionStatus.ABANDONED
        session.add(txn)
        session.add(cust)
        await session.commit()
        return {
            "status": "blocked",
            "reason": compliance.rejection_reason or "Stopping rule triggered by Compliance Agent",
            "compliance": compliance.model_dump(),
            "retry_count": txn.retry_count,
        }

    await record_audit_log(
        session=session,
        agent_name="GuardianComplianceAgent",
        action_type=ActionType.COMPLIANCE_GATING_PASSED,
        status=AuditStatus.SUCCESS,
        transaction_id=txn.id,
        customer_id=cust.id,
        input_payload=json.dumps({"retry_count": txn.retry_count, "max_retries": txn.max_retries}),
        output_payload=compliance.model_dump_json(),
    )
    txn.escalation_level = compliance.escalation_stage

    # 6. Agent 4: Master Strategist Agent
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

    # 7. Tool Execution 1: Generate Payment Link with dynamic incentive (Math Audit Verified)
    discount_pct = max(0.0, min(15.0, float(strategy.discount_percentage)))
    discount_amount = round(txn.amount * (discount_pct / 100.0), 2)
    payable_amount = round(txn.amount - discount_amount, 2)

    link_create_req = RazorpayPaymentLinkCreate(
        amount=payable_amount,
        currency=txn.currency,
        description=f"Recovery order {txn.razorpay_order_id}",
        customer_name=cust.name,
        customer_email=cust.email,
        customer_contact=cust.phone,
        notes={
            "transaction_id": txn.id,
            "discount_percent": str(discount_pct),
            "discount_amount": str(discount_amount),
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

    # 8. Specialized Multi-Vector Autonomous Agent Flows
    voice_session_data: Optional[Dict[str, Any]] = None
    mandate_schedule_data: Optional[Dict[str, Any]] = None
    b2b_plan_data: Optional[Dict[str, Any]] = None

    # Vector 1: Voice AI Recovery Agent (triggered for high-value dropouts or voice channel)
    is_voice_candidate = (
        txn.loss_vector == LossVector.VOICE_RECOVERY
        or txn.amount >= 5000.0
        or (hasattr(RecoveryChannel, 'VOICE_IVR') and strategy.channel == RecoveryChannel.VOICE_IVR)
    )
    if is_voice_candidate:
        t_voice_start = time.perf_counter()
        voice_res = await run_voice_recovery_agent(
            ctx=ctx,
            diag=diagnosis,
            discount_percent=discount_pct,
            payment_link=link_resp.short_url,
        )
        t_voice_ms = round((time.perf_counter() - t_voice_start) * 1000, 2)
        voice_session_data = voice_res.model_dump()
        txn.voice_call_transcript = json.dumps(voice_session_data)
        txn.promise_to_pay_date = voice_res.promise_to_pay_date

        await record_audit_log(
            session=session,
            agent_name="HinglishVoiceAgent",
            action_type=ActionType.VOICE_CALL_DISPATCHED,
            status=AuditStatus.SUCCESS,
            transaction_id=txn.id,
            customer_id=cust.id,
            input_payload=json.dumps({"customer": cust.name, "amount": txn.amount}),
            output_payload=json.dumps(voice_session_data),
            duration_ms=t_voice_ms,
        )

        if voice_res.promise_to_pay_date:
            await record_audit_log(
                session=session,
                agent_name="PromiseToPayTracker",
                action_type=ActionType.PROMISE_TO_PAY_RECORDED,
                status=AuditStatus.SUCCESS,
                transaction_id=txn.id,
                customer_id=cust.id,
                input_payload=json.dumps({"promise_date": voice_res.promise_to_pay_date}),
                output_payload=f"Promise to pay recorded for {voice_res.promise_to_pay_date}",
            )

    # Vector 2: Mandate Retry Sequencer Agent (for recurring auto-debit failures)
    if txn.loss_vector in [LossVector.FAILED_SUBSCRIPTION, LossVector.MANDATE_DEGRADATION]:
        mandate_plan = compute_mandate_retry_schedule(
            mandate_id=f"man_{txn.razorpay_order_id[:10]}",
            customer_id=cust.id,
            failure_reason=txn.failure_reason or "Mandate rejected",
            amount=txn.amount,
        )
        mandate_schedule_data = mandate_plan.model_dump()
        txn.mandate_retry_schedule = json.dumps(mandate_schedule_data)

        await record_audit_log(
            session=session,
            agent_name="MandateSequencerAgent",
            action_type=ActionType.MANDATE_RETRY_SCHEDULED,
            status=AuditStatus.SUCCESS,
            transaction_id=txn.id,
            customer_id=cust.id,
            input_payload=json.dumps({"mandate_id": mandate_plan.mandate_id}),
            output_payload=json.dumps(mandate_schedule_data),
        )

    # Vector 3: B2B Receivables Chaser & Installment Restructuring
    if txn.loss_vector == LossVector.B2B_RECEIVABLE:
        b2b_plan = compute_b2b_promise_to_pay(
            invoice_id=f"inv_{txn.razorpay_order_id[:8]}",
            client_name=cust.name,
            amount=txn.amount,
        )
        b2b_plan_data = b2b_plan.model_dump()
        txn.promise_to_pay_date = b2b_plan.promise_date

        await record_audit_log(
            session=session,
            agent_name="B2BReceivablesAgent",
            action_type=ActionType.PROMISE_TO_PAY_RECORDED,
            status=AuditStatus.SUCCESS,
            transaction_id=txn.id,
            customer_id=cust.id,
            input_payload=json.dumps({"invoice_id": b2b_plan.invoice_id}),
            output_payload=json.dumps(b2b_plan_data),
        )

    # 9. Tool Execution 2: Channel Dispatch (Guaranteed Email + WhatsApp Outreach)
    dispatch_results: Dict[str, Any] = {}

    # 9a. Guaranteed Email Dispatch whenever customer email exists
    if cust.email and "@" in cust.email and not cust.email.endswith("@example.internal"):
        discount_rows = f"""
        <tr>
          <td style="padding: 6px 0; color: #059669; font-weight: 600;">Special Recovery Discount ({discount_pct:.1f}%):</td>
          <td style="padding: 6px 0; font-family: monospace; font-weight: 600; text-align: right; color: #059669;">-INR {discount_amount:.2f}</td>
        </tr>
        """ if discount_pct > 0 else ""

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

    # 9b. WhatsApp Outreach Dispatch if mobile phone available
    if cust.phone and strategy.channel == RecoveryChannel.WHATSAPP:
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

    # 10. Update Transaction State
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
        "loss_vector": txn.loss_vector,
        "escalation_level": txn.escalation_level,
        "retry_count": txn.retry_count,
        "max_retries": txn.max_retries,
        "sentinel": sentinel_report.model_dump(),
        "diagnosis": diagnosis.model_dump(),
        "compliance": compliance.model_dump(),
        "strategy": strategy.model_dump(),
        "payment_link": link_resp.short_url,
        "payable_amount": payable_amount,
        "voice_session": voice_session_data,
        "mandate_schedule": mandate_schedule_data,
        "b2b_plan": b2b_plan_data,
        "dispatch": dispatch_results,
    }
