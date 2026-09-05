"""
test_ptp.py
Unit tests for Promise-to-Pay (PTP) analytics, reminders, and commitment lifecycle endpoints.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.database import async_session_maker
from backend.models.customer import Customer
from backend.models.transaction import Transaction, TransactionStatus, FailureCategory, LossVector


@pytest.mark.asyncio
async def test_ptp_analytics_and_remind_flow():
    """Verifies that PTP analytics aggregated ledger and reminder dispatches work correctly."""
    # Seed a test transaction with PTP commitment
    async with async_session_maker() as session:
        cust = Customer(
            name="Rajat Kapoor",
            email="rajat.kapoor@example.com",
            phone="+919811122233",
            risk_score=0.2,
        )
        session.add(cust)
        await session.commit()
        await session.refresh(cust)

        txn = Transaction(
            razorpay_order_id="order_ptp_test_99",
            customer_id=cust.id,
            amount=12500.0,
            status=TransactionStatus.PROCESSING,
            failure_category=FailureCategory.INSUFFICIENT_FUNDS,
            failure_reason="Daily UPI limit reached",
            promise_to_pay_date="Tomorrow 11:00 AM",
            ptp_status="PENDING",
            recovery_channel="whatsapp",
            discount_applied_percent=10.0,
            recovered_amount=0.0,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)
        txn_id = txn.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test GET /api/ptp/analytics
        res = await client.get("/api/ptp/analytics")
        assert res.status_code == 200
        data = res.json()
        assert "summary" in data
        assert "records" in data
        assert data["summary"]["total_commitments"] >= 1
        assert data["summary"]["active_commitments"] >= 1

        # Locate our seeded record
        matching = [r for r in data["records"] if r["id"] == txn_id]
        assert len(matching) == 1
        rec = matching[0]
        assert rec["customer_name"] == "Rajat Kapoor"
        assert rec["amount"] == 12500.0
        assert rec["promise_to_pay_date"] == "Tomorrow 11:00 AM"
        assert rec["ptp_status"] == "PENDING"

        # 2. Test POST /api/ptp/transactions/{id}/remind
        remind_res = await client.post(
            f"/api/ptp/transactions/{txn_id}/remind",
            json={"channel": "whatsapp"},
        )
        assert remind_res.status_code == 200
        remind_data = remind_res.json()
        assert remind_data["status"] == "success"
        assert remind_data["ptp_reminder_sent"] is True

        # 3. Test POST /api/ptp/transactions/{id}/status
        status_res = await client.post(
            f"/api/ptp/transactions/{txn_id}/status",
            json={"status": "FULFILLED"},
        )
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["ptp_status"] == "FULFILLED"
        assert status_data["transaction_status"] == "recovered"
