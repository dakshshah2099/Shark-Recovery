import asyncio
import json
import sys
from pathlib import Path

# Setup paths
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(backend_dir.parent) not in sys.path:
    sys.path.insert(0, str(backend_dir.parent))

from fastapi.testclient import TestClient
try:
    from backend.main import app
    from backend.database import init_db
except ImportError:
    from main import app
    from database import init_db


def run_all_phase_3_tests():
    print("\n--- Starting Phase 3 API, Webhook & Simulation Tests ---")
    asyncio.run(init_db())
    client = TestClient(app)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    print("[PASS] Test 1: Health endpoint responds 200 OK.")

    # 2. Ingest Razorpay Webhook `payment.failed`
    webhook_failed_payload = {
        "entity": "event",
        "account_id": "acc_test_123",
        "event": "payment.failed",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_001",
                    "order_id": "order_webhook_001",
                    "amount": 299900,  # 2999.00 INR in paise
                    "currency": "INR",
                    "status": "failed",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Payment failed due to daily card limit reached",
                    "email": "neha.kapoor@example.com",
                    "contact": "+919811122233",
                    "notes": {
                        "customer_name": "Neha Kapoor",
                    },
                }
            }
        },
    }
    wh_res = client.post("/webhook/razorpay", json=webhook_failed_payload)
    assert wh_res.status_code == 200
    wh_data = wh_res.json()
    assert wh_data["status"] == "processed"
    assert wh_data["event"] == "payment.failed"
    txn_id = wh_data["transaction_id"]
    print(f"[PASS] Test 2: Razorpay payment.failed webhook ingested & orchestrated (txn_id: {txn_id}).")

    # 3. Simulate Recovery Webhook `payment_link.paid`
    webhook_paid_payload = {
        "entity": "event",
        "account_id": "acc_test_123",
        "event": "payment_link.paid",
        "payload": {
            "payment_link": {
                "entity": {
                    "id": "plink_webhook_001",
                    "amount": 269910,  # 2699.10 INR (with 10% discount)
                    "status": "paid",
                    "order_id": "order_webhook_001",
                    "notes": {
                        "transaction_id": txn_id,
                    },
                }
            }
        },
    }
    wh_paid_res = client.post("/webhook/razorpay", json=webhook_paid_payload)
    assert wh_paid_res.status_code == 200
    assert wh_paid_res.json()["status"] == "processed"
    assert wh_paid_res.json()["recovered_amount"] > 0
    print("[PASS] Test 3: Webhook payment_link.paid processed and transaction marked RECOVERED.")

    # 4. Batch Simulation Endpoint `/api/simulate-batch`
    batch_res = client.post("/api/simulate-batch", json={"count": 4})
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    assert batch_data["processed_count"] == 4
    assert len(batch_data["transactions"]) == 4
    print(f"[PASS] Test 4: Batch simulation executed {batch_data['processed_count']} transactions successfully.")

    # 5. Dashboard Metrics `/api/metrics`
    metrics_res = client.get("/api/metrics")
    assert metrics_res.status_code == 200
    m_data = metrics_res.json()
    assert m_data["total_failed_revenue"] > 0
    assert m_data["total_recovered_revenue"] > 0
    assert m_data["recovery_rate_percent"] >= 0.0
    print(f"[PASS] Test 5: Dashboard metrics calculated: Total Failed=INR {m_data['total_failed_revenue']}, Recovered=INR {m_data['total_recovered_revenue']}, Rate={m_data['recovery_rate_percent']}%.")

    # 6. Transactions List `/api/transactions`
    txns_res = client.get("/api/transactions?limit=20")
    assert txns_res.status_code == 200
    txns_list = txns_res.json()
    assert len(txns_list) >= 5
    assert "customer_name" in txns_list[0]
    print(f"[PASS] Test 6: Listed {len(txns_list)} transactions with customer metadata.")

    # 7. Audit Logs Query `/api/audit-logs`
    audit_res = client.get("/api/audit-logs?limit=50")
    assert audit_res.status_code == 200
    audit_list = audit_res.json()
    assert len(audit_list) >= 10
    print(f"[PASS] Test 7: Queried {len(audit_list)} audit trail entries.")

    # 8. WhatsApp Simulated Feed `/api/whatsapp-feed`
    wa_res = client.get("/api/whatsapp-feed")
    assert wa_res.status_code == 200
    wa_list = wa_res.json()
    assert isinstance(wa_list, list)
    print(f"[PASS] Test 8: WhatsApp replica message stream returned {len(wa_list)} messages.")

    # 9. Manual Mark Recovered Trigger
    first_txn = txns_list[0]
    mark_res = client.post(f"/api/transactions/{first_txn['id']}/mark-recovered")
    assert mark_res.status_code == 200
    assert mark_res.json()["status"] == "success"
    print(f"[PASS] Test 9: Manual mark recovered simulated for transaction {first_txn['id']}.")

    print("\n--- ALL PHASE 3 TESTS PASSED PERFECTLY ---")


if __name__ == "__main__":
    run_all_phase_3_tests()
