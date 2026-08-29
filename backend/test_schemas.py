import asyncio
import sys
from pathlib import Path

# Ensure backend directory and root are in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(backend_dir.parent) not in sys.path:
    sys.path.insert(0, str(backend_dir.parent))

try:
    from backend.database import async_session_maker, init_db
    from backend.models.customer import Customer
    from backend.models.transaction import FailureCategory, Transaction, TransactionStatus
    from backend.models.audit_log import ActionType, AuditLog, AuditStatus
    from backend.models.schemas import (
        DiagnosticContext,
        FailureDiagnosis,
        RecoveryChannel,
        RecoveryStrategy,
        EmailPayload,
        WhatsAppPayload,
    )
except ImportError:
    from database import async_session_maker, init_db
    from models.customer import Customer
    from models.transaction import FailureCategory, Transaction, TransactionStatus
    from models.audit_log import ActionType, AuditLog, AuditStatus
    from models.schemas import (
        DiagnosticContext,
        FailureDiagnosis,
        RecoveryChannel,
        RecoveryStrategy,
        EmailPayload,
        WhatsAppPayload,
    )


async def test_full_schema_lifecycle():
    await init_db()
    async with async_session_maker() as session:
        # 1. Create Customer
        cust = Customer(
            name="Rahul Sharma",
            email="rahul@example.com",
            phone="+919876543210",
            risk_score=0.15,
            total_spent=4999.0,
            successful_transactions_count=3,
            failed_transactions_count=0,
        )
        session.add(cust)
        await session.commit()
        await session.refresh(cust)
        assert cust.id.startswith("cust_")

        # 2. Create Transaction
        txn = Transaction(
            razorpay_order_id="order_test_12345",
            customer_id=cust.id,
            amount=1999.0,
            currency="INR",
            status=TransactionStatus.FAILED,
            failure_code="BAD_REQUEST_ERROR",
            failure_reason="Payment failed due to insufficient balance",
            failure_category=FailureCategory.INSUFFICIENT_FUNDS,
            retry_count=0,
            max_retries=2,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)
        assert txn.id.startswith("txn_")

        # 3. Create AuditLog
        audit = AuditLog(
            transaction_id=txn.id,
            customer_id=cust.id,
            agent_name="DiagnosticAgent",
            action_type=ActionType.DIAGNOSIS_COMPLETED,
            status=AuditStatus.SUCCESS,
            input_payload=txn.model_dump_json(),
            output_payload='{"can_retry": true, "risk_score": 0.2}',
            execution_duration_ms=45.2,
        )
        session.add(audit)
        await session.commit()
        await session.refresh(audit)
        assert audit.id.startswith("audit_")

        # 4. Verify Pydantic Agent Schemas
        diag = FailureDiagnosis(
            transaction_id=txn.id,
            failure_category=FailureCategory.INSUFFICIENT_FUNDS,
            root_cause="Insufficient account balance at issuer bank.",
            can_retry=True,
            risk_score=0.2,
            recommended_action="Offer 10% instant checkout discount via WhatsApp",
            diagnostic_notes="High value customer with 3 prior successful checkouts.",
        )
        assert diag.can_retry is True

        strat = RecoveryStrategy(
            transaction_id=txn.id,
            channel=RecoveryChannel.WHATSAPP,
            tone="casual_hinglish",
            discount_percentage=10.0,
            offer_code="RECOVER10",
            custom_headline="Payment Stuck? 10% Off For You!",
            message_content="Hey Rahul! Aapka payment complete nahi hua. Use code RECOVER10 to complete now!",
            urgency_level="high",
            rationale="WhatsApp yields highest CTR for mobile-first shoppers.",
        )
        assert strat.discount_percentage == 10.0

        wa_payload = WhatsAppPayload(
            transaction_id=txn.id,
            recipient_phone=cust.phone,
            recipient_name=cust.name,
            message=strat.message_content,
            payment_link="https://rzp.io/i/mock_link",
        )
        assert wa_payload.recipient_phone == "+919876543210"

    print("All Phase 1 schemas and DB operations passed successfully!")


if __name__ == "__main__":
    asyncio.run(test_full_schema_lifecycle())
