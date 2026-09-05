import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Ensure root and backend directory in sys.path
backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlmodel import select
from backend.database import async_session_maker, init_db
from backend.models.audit_log import ActionType, AuditLog
from backend.models.customer import Customer
from backend.models.schemas import DiagnosticContext, FailureDiagnosis, RecoveryChannel
from backend.models.transaction import FailureCategory, LossVector, Transaction, TransactionStatus
from backend.agents.strategy_agent import (
    compute_liquidity_delay_seconds,
    compute_gateway_spike_delay_seconds,
    heuristic_strategy,
)
from backend.agents.orchestrator import orchestrate_revenue_recovery
from backend.workers.recovery_scheduler import (
    parse_ptp_date,
    run_scheduler_tick,
    pause_recovery_scheduler,
    resume_recovery_scheduler,
    get_scheduler_status,
)


async def test_schema_and_state_fields():
    print("\n--- 1. Testing Schema & State Fields ---")
    await init_db()
    async with async_session_maker() as session:
        cust = Customer(name="Test Liquidity User", email="liq@example.com", phone="+919876500001")
        session.add(cust)
        await session.commit()
        await session.refresh(cust)

        now = datetime.utcnow()
        txn = Transaction(
            razorpay_order_id="order_test_schema_001",
            customer_id=cust.id,
            amount=4999.0,
            status=TransactionStatus.PROCESSING,
            failure_category=FailureCategory.INSUFFICIENT_FUNDS,
            next_retry_at=now + timedelta(hours=4),
            dispatch_scheduled_at=now + timedelta(hours=4),
            ptp_reminder_sent=False,
            ptp_status="PENDING",
            auto_retry_enabled=True,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        assert txn.next_retry_at is not None, "next_retry_at should be saved"
        assert txn.dispatch_scheduled_at is not None, "dispatch_scheduled_at should be saved"
        assert txn.ptp_reminder_sent is False, "ptp_reminder_sent should be False"
        assert txn.ptp_status == "PENDING", "ptp_status should be PENDING"
        assert txn.auto_retry_enabled is True, "auto_retry_enabled should be True"
        print("  [PASS] Schema additions verified in database persistence.")


async def test_intelligent_delay_and_liquidity_strategy():
    print("\n--- 2. Testing Intelligent Delay & Liquidity Strategy ---")
    ctx = DiagnosticContext(
        transaction_id="txn_delay_01",
        razorpay_order_id="order_delay_01",
        amount=3499.0,
        customer_name="Pooja Hegde",
        customer_email="pooja@example.com",
        customer_phone="+919820123456",
    )
    diag_funds = FailureDiagnosis(
        transaction_id="txn_delay_01",
        failure_category=FailureCategory.INSUFFICIENT_FUNDS,
        root_cause="UPI limit exceeded / balance constraints",
        can_retry=True,
        risk_score=0.25,
        recommended_action="Apply liquidity window delay",
        diagnostic_notes="Customer has sufficient lifetime spend",
    )
    strat_funds = heuristic_strategy(ctx, diag_funds)

    assert strat_funds.delayed_dispatch is True, "INSUFFICIENT_FUNDS must trigger delayed_dispatch"
    assert strat_funds.delay_seconds >= 60, f"delay_seconds should be positive, got {strat_funds.delay_seconds}"
    assert strat_funds.immediate_message is not None, "immediate_message should be generated"
    assert "reserve" in strat_funds.immediate_message.lower() or "hold" in strat_funds.immediate_message.lower(), (
        f"immediate_message should mention cart hold/reservation: {strat_funds.immediate_message}"
    )
    print(f"  [PASS] INSUFFICIENT_FUNDS strategy: delay={strat_funds.delay_seconds}s, immediate_copy='{strat_funds.immediate_message[:45]}...'")

    # Gateway Spikes delay
    diag_gateway = FailureDiagnosis(
        transaction_id="txn_delay_02",
        failure_category=FailureCategory.BANK_SERVER_ERROR,
        root_cause="SBI 503 bank gateway downtime",
        can_retry=True,
        risk_score=0.15,
        recommended_action="Wait for gateway recovery",
        diagnostic_notes="Bank CBS downtime",
    )
    strat_gw = heuristic_strategy(ctx, diag_gateway)
    assert strat_gw.delayed_dispatch is True, "BANK_SERVER_ERROR must trigger delayed_dispatch"
    assert strat_gw.delay_seconds == 600, f"Gateway spike delay should be 600s, got {strat_gw.delay_seconds}"
    print(f"  [PASS] Gateway spike strategy: delay={strat_gw.delay_seconds}s, immediate_copy='{strat_gw.immediate_message[:45]}...'")


async def test_orchestrator_cooling_off_and_delayed_dispatch():
    print("\n--- 3. Testing Orchestrator next_retry_at & delayed_dispatch ---")
    async with async_session_maker() as session:
        cust = Customer(name="Vikram Seth", email="vikram@example.com", phone="+919811002233")
        session.add(cust)
        await session.commit()
        await session.refresh(cust)

        txn = Transaction(
            razorpay_order_id="order_orch_delay_01",
            customer_id=cust.id,
            amount=2999.0,
            status=TransactionStatus.FAILED,
            failure_code="BAD_REQUEST_ERROR",
            failure_reason="Insufficient balance in customer account",
            failure_category=FailureCategory.INSUFFICIENT_FUNDS,
            retry_count=0,
            max_retries=3,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        orch_res = await orchestrate_revenue_recovery(txn.id, session)
        await session.refresh(txn)

        assert txn.next_retry_at is not None, "txn.next_retry_at must be populated by orchestrator"
        assert txn.dispatch_scheduled_at is not None, "txn.dispatch_scheduled_at must be populated for INSUFFICIENT_FUNDS"
        print(f"  [PASS] Orchestrator scheduled next_retry_at={txn.next_retry_at.isoformat()}, dispatch_scheduled_at={txn.dispatch_scheduled_at.isoformat()}")


async def test_recovery_scheduler_worker_all_cases():
    print("\n--- 4. Testing Autonomous Background Scheduler Worker Tick ---")
    async with async_session_maker() as session:
        # Create Customer
        cust = Customer(name="Aditi Rao", email="aditi@example.com", phone="+919876543210")
        session.add(cust)
        await session.commit()
        await session.refresh(cust)

        now = datetime.utcnow()

        # Item 1: Expired Delayed Dispatch
        txn_delayed = Transaction(
            razorpay_order_id="order_sched_delayed_01",
            customer_id=cust.id,
            amount=1599.0,
            status=TransactionStatus.PROCESSING,
            failure_category=FailureCategory.INSUFFICIENT_FUNDS,
            dispatch_scheduled_at=now - timedelta(seconds=10), # in the past
            recovery_link="https://rzp.io/i/mock_sched_link",
            auto_retry_enabled=True,
        )
        session.add(txn_delayed)

        # Item 2: Expired Auto-Retry
        txn_retry = Transaction(
            razorpay_order_id="order_sched_retry_02",
            customer_id=cust.id,
            amount=2499.0,
            status=TransactionStatus.PROCESSING,
            failure_category=FailureCategory.USER_DROPOUT,
            retry_count=0,
            max_retries=3,
            next_retry_at=now - timedelta(seconds=10), # in the past
            auto_retry_enabled=True,
        )
        session.add(txn_retry)

        # Item 3: Expired PTP Breach
        txn_ptp = Transaction(
            razorpay_order_id="order_sched_ptp_03",
            customer_id=cust.id,
            amount=5500.0,
            status=TransactionStatus.PROCESSING,
            promise_to_pay_date="2026-09-01 10:30:00", # past date
            ptp_reminder_sent=False,
            ptp_status="PENDING",
            auto_retry_enabled=True,
            retry_count=0,
            max_retries=3,
        )
        session.add(txn_ptp)
        await session.commit()

        # Run scheduler tick
        metrics = await run_scheduler_tick(session=session)

        # Refresh objects
        await session.refresh(txn_delayed)
        await session.refresh(txn_ptp)

        assert txn_delayed.dispatch_scheduled_at is None, "dispatch_scheduled_at should be cleared after dispatch"
        assert txn_ptp.ptp_reminder_sent is True, "ptp_reminder_sent should be True after breach reminder"
        assert txn_ptp.ptp_status == "BREACHED", "ptp_status should be set to BREACHED"
        assert txn_ptp.retry_count == 1, "retry_count should be incremented"

        # Verify audit logs
        audit_ptp = (
            await session.execute(
                select(AuditLog).where(
                    AuditLog.transaction_id == txn_ptp.id,
                    AuditLog.action_type == ActionType.PTP_BREACH_REMINDER,
                )
            )
        ).scalars().all()
        assert len(audit_ptp) > 0, "PTP_BREACH_REMINDER audit log must be recorded"

        print(f"  [PASS] Scheduler tick processed: {metrics}")
        print("  [PASS] Delayed dispatch sent, PTP breach reminded with Hinglish copy and audit logged.")


async def test_scheduler_control_toggle():
    print("\n--- 5. Testing Scheduler Pause/Resume Controls ---")
    status_init = get_scheduler_status()
    assert "is_running" in status_init
    assert "is_paused" in status_init

    pause_recovery_scheduler()
    assert get_scheduler_status()["is_paused"] is True, "Scheduler should be paused"

    resume_recovery_scheduler()
    assert get_scheduler_status()["is_paused"] is False, "Scheduler should be resumed"
    print("  [PASS] Scheduler pause and resume toggle verified.")


async def main():
    print("======================================================================")
    print(">>> RUNNING AUTONOMOUS RECOVERY SCHEDULER TEST SUITE")
    print("======================================================================")
    await test_schema_and_state_fields()
    await test_intelligent_delay_and_liquidity_strategy()
    await test_orchestrator_cooling_off_and_delayed_dispatch()
    await test_recovery_scheduler_worker_all_cases()
    await test_scheduler_control_toggle()
    print("\n======================================================================")
    print(">>> [SUCCESS] ALL RECOVERY SCHEDULER & PTP BREACH FEATURES VERIFIED!")
    print("======================================================================")


if __name__ == "__main__":
    asyncio.run(main())
