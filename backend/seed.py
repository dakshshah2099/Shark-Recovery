"""
Database seeder script for AI Revenue Recovery Agent.
Populates SQLite with realistic Indian SaaS & E-commerce payment failure and recovery records.
"""

import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

try:
    from backend.database import async_session_maker, init_db
    from backend.models.audit_log import ActionType, AuditLog, AuditStatus
    from backend.models.customer import Customer
    from backend.models.schemas import (
        DiagnosticContext,
        EmailPayload,
        RazorpayPaymentLinkCreate,
        RecoveryChannel,
        WhatsAppPayload,
    )
    from backend.models.transaction import (
        FailureCategory,
        Transaction,
        TransactionStatus,
    )
    from backend.tools.whatsapp_tool import _mock_whatsapp_message_store
except ImportError:
    from database import async_session_maker, init_db
    from models.audit_log import ActionType, AuditLog, AuditStatus
    from models.customer import Customer
    from models.schemas import (
        DiagnosticContext,
        EmailPayload,
        RazorpayPaymentLinkCreate,
        RecoveryChannel,
        WhatsAppPayload,
    )
    from models.transaction import (
        FailureCategory,
        Transaction,
        TransactionStatus,
    )
    from tools.whatsapp_tool import _mock_whatsapp_message_store

SEED_CUSTOMERS = [
    {
        "name": "Pooja Hegde",
        "email": "pooja.hegde@techflow.in",
        "phone": "+919820123456",
        "total_spent": 14200.0,
        "txns": 5,
        "failed_txns": 1,
        "amount": 3499.0,
        "code": "BAD_REQUEST_ERROR",
        "reason": "Payment failed due to daily UPI debit limit exceeded",
        "category": FailureCategory.INSUFFICIENT_FUNDS,
        "status": TransactionStatus.RECOVERED,
        "discount": 10.0,
        "channel": "whatsapp",
        "recovered": 3149.10,
        "retries": 1,
        "minutes_ago": 15,
    },
    {
        "name": "Rohan Verma",
        "email": "rohan.verma@quickpay.co",
        "phone": "+919811987654",
        "total_spent": 8500.0,
        "txns": 3,
        "failed_txns": 1,
        "amount": 1899.0,
        "code": "GATEWAY_ERROR",
        "reason": "OTP verification timed out on HDFC netbanking portal",
        "category": FailureCategory.AUTHENTICATION_FAILED,
        "status": TransactionStatus.RECOVERED,
        "discount": 5.0,
        "channel": "whatsapp",
        "recovered": 1804.05,
        "retries": 1,
        "minutes_ago": 30,
    },
    {
        "name": "Deepak Gupta",
        "email": "deepak.gupta@enterprise.io",
        "phone": "+919711002233",
        "total_spent": 24900.0,
        "txns": 8,
        "failed_txns": 1,
        "amount": 5499.0,
        "code": "GATEWAY_ERROR",
        "reason": "SBI gateway server 503 temporary outage during 3DS redirect",
        "category": FailureCategory.BANK_SERVER_ERROR,
        "status": TransactionStatus.RECOVERED,
        "discount": 0.0,
        "channel": "email",
        "recovered": 5499.00,
        "retries": 1,
        "minutes_ago": 45,
    },
    {
        "name": "Sneha Reddy",
        "email": "sneha.reddy@gmail.com",
        "phone": "+919886098765",
        "total_spent": 4200.0,
        "txns": 2,
        "failed_txns": 1,
        "amount": 2799.0,
        "code": "INSUFFICIENT_FUNDS",
        "reason": "Insufficient balance in Kotak savings account",
        "category": FailureCategory.INSUFFICIENT_FUNDS,
        "status": TransactionStatus.PROCESSING,
        "discount": 10.0,
        "channel": "whatsapp",
        "recovered": 0.0,
        "retries": 1,
        "minutes_ago": 10,
    },
    {
        "name": "Ananya Sen",
        "email": "ananya.sen@designstudio.org",
        "phone": "+919933445566",
        "total_spent": 3100.0,
        "txns": 1,
        "failed_txns": 1,
        "amount": 1299.0,
        "code": "USER_DROPOUT",
        "reason": "Customer closed payment modal prior to authentication",
        "category": FailureCategory.USER_DROPOUT,
        "status": TransactionStatus.PROCESSING,
        "discount": 10.0,
        "channel": "whatsapp",
        "recovered": 0.0,
        "retries": 1,
        "minutes_ago": 8,
    },
    {
        "name": "Vikram Malhotra",
        "email": "vikram.m@corporatesys.com",
        "phone": "+919845012345",
        "total_spent": 0.0,
        "txns": 0,
        "failed_txns": 3,
        "amount": 7999.0,
        "code": "BAD_REQUEST_ERROR",
        "reason": "Card expired / repeatedly declined by issuing bank",
        "category": FailureCategory.EXPIRED_CARD,
        "status": TransactionStatus.ABANDONED,
        "discount": 0.0,
        "channel": "email",
        "recovered": 0.0,
        "retries": 2,
        "minutes_ago": 120,
    },
]


async def seed_database():
    await init_db()
    print("[*] Seeding database with realistic transactions, customers, and audit logs...")

    async with async_session_maker() as session:
        # Check existing count
        existing = (await session.execute(select(Transaction))).scalars().all()
        if len(existing) >= 6:
            print(f"[*] Database already contains {len(existing)} transactions. Adding fresh records...")

        for data in SEED_CUSTOMERS:
            # Create Customer
            cust = Customer(
                name=data["name"],
                email=data["email"],
                phone=data["phone"],
                risk_score=0.15 if data["status"] == TransactionStatus.RECOVERED else 0.40,
                total_spent=data["total_spent"] + data["recovered"],
                successful_transactions_count=data["txns"] + (1 if data["status"] == TransactionStatus.RECOVERED else 0),
                failed_transactions_count=data["failed_txns"],
            )
            session.add(cust)
            await session.commit()
            await session.refresh(cust)

            order_id = f"order_{uuid.uuid4().hex[:10]}"
            payment_id = f"pay_{uuid.uuid4().hex[:10]}"
            link_id = f"plink_{uuid.uuid4().hex[:8]}"
            recovery_link = f"https://rzp.io/i/{link_id}"

            created_time = datetime.utcnow() - timedelta(minutes=data["minutes_ago"])

            # Create Transaction
            txn = Transaction(
                razorpay_order_id=order_id,
                razorpay_payment_id=payment_id,
                customer_id=cust.id,
                amount=data["amount"],
                currency="INR",
                status=data["status"],
                failure_code=data["code"],
                failure_reason=data["reason"],
                failure_category=data["category"],
                retry_count=data["retries"],
                max_retries=2,
                recovery_link=recovery_link,
                recovery_channel=data["channel"],
                discount_applied_percent=data["discount"],
                recovered_amount=data["recovered"],
                created_at=created_time,
                updated_at=datetime.utcnow() - timedelta(minutes=data["minutes_ago"] - 2),
            )
            session.add(txn)
            await session.commit()
            await session.refresh(txn)

            # Create Diagnostic Audit Log
            diag_log = AuditLog(
                transaction_id=txn.id,
                customer_id=cust.id,
                agent_name="DiagnosticAgent",
                action_type=ActionType.DIAGNOSIS_COMPLETED,
                status=AuditStatus.SUCCESS,
                input_payload=json.dumps({
                    "order_id": order_id,
                    "amount": data["amount"],
                    "failure_code": data["code"],
                    "reason": data["reason"],
                }),
                output_payload=json.dumps({
                    "category": data["category"].value,
                    "can_retry": data["status"] != TransactionStatus.ABANDONED,
                    "risk_score": cust.risk_score,
                    "recommendation": f"Initiate recovery via {data['channel']} with {data['discount']}% discount.",
                }),
                execution_duration_ms=round(random.uniform(32.0, 85.0), 2),
                created_at=created_time + timedelta(seconds=2),
            )
            session.add(diag_log)

            # Create Strategy Audit Log
            strat_log = AuditLog(
                transaction_id=txn.id,
                customer_id=cust.id,
                agent_name="StrategyAgent",
                action_type=ActionType.STRATEGY_DECIDED,
                status=AuditStatus.SUCCESS,
                input_payload=json.dumps({"diagnosis_category": data["category"].value}),
                output_payload=json.dumps({
                    "channel": data["channel"],
                    "discount_percent": data["discount"],
                    "offer_code": f"SAVE{int(data['discount'])}" if data["discount"] > 0 else None,
                    "tone": "casual_hinglish" if data["channel"] == "whatsapp" else "professional",
                }),
                execution_duration_ms=round(random.uniform(40.0, 95.0), 2),
                created_at=created_time + timedelta(seconds=4),
            )
            session.add(strat_log)

            # Create Payment Link Tool Audit Log
            link_log = AuditLog(
                transaction_id=txn.id,
                customer_id=cust.id,
                agent_name="RazorpayPaymentLinkTool",
                action_type=ActionType.PAYMENT_LINK_GENERATED,
                status=AuditStatus.SUCCESS,
                input_payload=json.dumps({"amount": data["amount"], "discount": data["discount"]}),
                output_payload=json.dumps({"short_url": recovery_link, "link_id": link_id}),
                execution_duration_ms=round(random.uniform(15.0, 45.0), 2),
                created_at=created_time + timedelta(seconds=6),
            )
            session.add(link_log)

            # Create Dispatch Audit Log
            first_name = data["name"].split()[0]
            if data["channel"] == "whatsapp":
                msg_text = (
                    f"Hey {first_name}! Aapka payment complete nahi hua. "
                    f"Special {int(data['discount'])}% discount apply kar diya hai. "
                    f"Click below to complete checkout securely!"
                )
                wa_log = AuditLog(
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    agent_name="WhatsAppDispatchTool",
                    action_type=ActionType.WHATSAPP_DISPATCHED,
                    status=AuditStatus.SUCCESS,
                    input_payload=json.dumps({"recipient": data["phone"], "message": msg_text}),
                    output_payload=json.dumps({"status": "delivered", "read": True}),
                    execution_duration_ms=round(random.uniform(10.0, 25.0), 2),
                    created_at=created_time + timedelta(seconds=8),
                )
                session.add(wa_log)

                # Add to in-memory store
                _mock_whatsapp_message_store.append({
                    "message_id": f"wam_{uuid.uuid4().hex[:10]}",
                    "transaction_id": txn.id,
                    "recipient_phone": data["phone"],
                    "recipient_name": data["name"],
                    "message": f"{msg_text}\n\n👉 Complete Payment: {recovery_link}",
                    "payment_link": recovery_link,
                    "template_name": "cart_recovery_incentive",
                    "status": "delivered",
                    "read_receipt": True,
                    "timestamp": (created_time + timedelta(seconds=8)).isoformat(),
                })
            else:
                em_log = AuditLog(
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    agent_name="SMTPDispatchTool",
                    action_type=ActionType.EMAIL_DISPATCHED,
                    status=AuditStatus.SUCCESS,
                    input_payload=json.dumps({"recipient": data["email"]}),
                    output_payload=json.dumps({"delivered": True, "mode": "smtp_gateway"}),
                    execution_duration_ms=round(random.uniform(60.0, 120.0), 2),
                    created_at=created_time + timedelta(seconds=8),
                )
                session.add(em_log)

            if data["status"] == TransactionStatus.RECOVERED:
                rec_log = AuditLog(
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    agent_name="WebhookVerifier",
                    action_type=ActionType.RECOVERY_VERIFIED,
                    status=AuditStatus.SUCCESS,
                    input_payload=json.dumps({"payment_link": recovery_link, "amount": data["recovered"]}),
                    output_payload=f"Revenue recovered successfully: INR {data['recovered']:.2f}",
                    created_at=created_time + timedelta(minutes=random.randint(1, 5)),
                )
                session.add(rec_log)
            elif data["status"] == TransactionStatus.ABANDONED:
                gate_log = AuditLog(
                    transaction_id=txn.id,
                    customer_id=cust.id,
                    agent_name="RecoveryOrchestrator",
                    action_type=ActionType.GATING_RULE_BLOCKED,
                    status=AuditStatus.SKIPPED,
                    input_payload=json.dumps({"retry_count": 2, "max_retries": 2}),
                    output_payload="Max retry threshold reached (2/2). Automated recovery stopped.",
                    created_at=created_time + timedelta(minutes=10),
                )
                session.add(gate_log)

            await session.commit()

        print("[PASS] Database successfully seeded with rich transactions, audit logs, and WhatsApp messages!")


if __name__ == "__main__":
    asyncio.run(seed_database())
