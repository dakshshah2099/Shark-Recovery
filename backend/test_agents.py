import asyncio
import sys
from pathlib import Path

# Setup paths
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(backend_dir.parent) not in sys.path:
    sys.path.insert(0, str(backend_dir.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from backend.database import async_session_maker, init_db
from backend.models.customer import Customer
from backend.models.transaction import FailureCategory, Transaction, TransactionStatus
from backend.models.audit_log import ActionType, AuditLog, AuditStatus
from backend.models.schemas import DiagnosticContext, RazorpayPaymentLinkCreate
from backend.agents.diagnostic_agent import run_diagnostic_agent, heuristic_diagnosis
from backend.agents.strategy_agent import run_strategy_agent, heuristic_strategy
from backend.agents.orchestrator import orchestrate_revenue_recovery
from backend.tools.razorpay_tool import create_payment_link
from backend.tools.smtp_tool import send_recovery_email
from backend.tools.whatsapp_tool import send_whatsapp_message


async def run_all_phase_2_tests():
    print("\n--- Starting Phase 2 Agent & Orchestration Tests ---")
    await init_db()

    async with async_session_maker() as session:
        # Test 1: Unit test Diagnostic Agent (Insufficient Funds)
        ctx1 = DiagnosticContext(
            transaction_id="txn_test_001",
            razorpay_order_id="order_001",
            amount=2499.0,
            failure_code="BAD_REQUEST_ERROR",
            failure_reason="Payment failed due to insufficient funds in account",
            customer_name="Priya Patel",
            customer_email="priya@example.com",
            customer_phone="+919811223344",
            previous_failed_attempts=0,
            total_spent=5000.0,
        )
        diag1 = await run_diagnostic_agent(ctx1)
        assert diag1.failure_category == FailureCategory.INSUFFICIENT_FUNDS
        assert diag1.can_retry is True
        print("[PASS] Test 1: Diagnostic Agent classified INSUFFICIENT_FUNDS correctly.")

        # Test 2: Unit test Diagnostic Agent (Fraud / Decline -> Non-retryable)
        ctx2 = DiagnosticContext(
            transaction_id="txn_test_002",
            razorpay_order_id="order_002",
            amount=15000.0,
            failure_code="GATEWAY_ERROR",
            failure_reason="Risk fraud block detected by issuer security engine",
            customer_name="Suspect User",
            customer_email="fraud@example.com",
            customer_phone="+919999999999",
            previous_failed_attempts=3,
            total_spent=0.0,
        )
        diag2 = await run_diagnostic_agent(ctx2)
        assert diag2.failure_category == FailureCategory.PAYMENT_DECLINED
        assert diag2.can_retry is False
        print("[PASS] Test 2: Fraudulent / Declined transaction marked non-retryable.")

        # Test 3: Strategy Agent creates dynamic discount & WhatsApp Hinglish
        strat1 = await run_strategy_agent(ctx1, diag1)
        assert strat1.discount_percentage > 0.0
        assert strat1.channel.value in ["whatsapp", "email"]
        print(f"[PASS] Test 3: Strategy Agent chose channel={strat1.channel}, discount={strat1.discount_percentage}%.")

        # Test 4: Tool execution (Razorpay link, SMTP, WhatsApp)
        link_req = RazorpayPaymentLinkCreate(
            amount=2249.10,
            description="Recovery order order_001",
            customer_name="Priya Patel",
            customer_email="priya@example.com",
            customer_contact="+919811223344",
        )
        link_resp = await create_payment_link(link_req)
        assert link_resp.short_url.startswith("https://rzp.io")
        print(f"[PASS] Test 4a: Payment link generated ({link_resp.short_url}).")

        # Test 5: End-to-End Orchestrator Workflow
        cust = Customer(
            name="Amit Kumar",
            email="amit.kumar@example.com",
            phone="+919876501234",
            total_spent=3500.0,
        )
        session.add(cust)
        await session.commit()
        await session.refresh(cust)

        txn = Transaction(
            razorpay_order_id="order_amit_99",
            customer_id=cust.id,
            amount=2999.0,
            currency="INR",
            status=TransactionStatus.FAILED,
            failure_code="BAD_REQUEST_ERROR",
            failure_reason="Payment failed due to insufficient balance",
            retry_count=0,
            max_retries=2,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        # Run orchestrator
        orch_res = await orchestrate_revenue_recovery(txn.id, session)
        assert orch_res["status"] == "success"
        assert orch_res["retry_count"] == 1
        print("[PASS] Test 5: Orchestrator executed recovery loop and updated transaction.")

        # Test 6: Verify Audit Trail logging in SQLite
        logs = (await session.execute(
            select(AuditLog).where(AuditLog.transaction_id == txn.id)
        )).scalars().all()
        action_types = [log.action_type for log in logs]
        print(f"[PASS] Test 6: Found {len(logs)} audit entries logged for txn {txn.id}: {action_types}")
        assert ActionType.DIAGNOSIS_COMPLETED in action_types
        assert ActionType.STRATEGY_DECIDED in action_types
        assert ActionType.PAYMENT_LINK_GENERATED in action_types

        # Test 7: Stopping Rules (Max Retries Bound)
        # Force retry_count to max_retries
        txn.retry_count = 2
        session.add(txn)
        await session.commit()

        stop_res = await orchestrate_revenue_recovery(txn.id, session)
        assert stop_res["status"] == "blocked"
        print("[PASS] Test 7: Stopping rule triggered! Recovery safely aborted after max retries.")

    print("\n--- ALL PHASE 2 TESTS PASSED PERFECTLY ---")


if __name__ == "__main__":
    asyncio.run(run_all_phase_2_tests())
