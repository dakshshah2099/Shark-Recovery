import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class ActionType(str, enum.Enum):
    SENTINEL_ANOMALY_DETECTED = "sentinel_anomaly_detected"
    DIAGNOSIS_COMPLETED = "diagnosis_completed"
    COMPLIANCE_GATING_PASSED = "compliance_gating_passed"
    COMPLIANCE_GATING_BLOCKED = "compliance_gating_blocked"
    STRATEGY_DECIDED = "strategy_decided"
    PAYMENT_LINK_GENERATED = "payment_link_generated"
    EMAIL_DISPATCHED = "email_dispatched"
    WHATSAPP_DISPATCHED = "whatsapp_dispatched"
    VOICE_CALL_DISPATCHED = "voice_call_dispatched"
    MANDATE_RETRY_SCHEDULED = "mandate_retry_scheduled"
    PROMISE_TO_PAY_RECORDED = "promise_to_pay_recorded"
    GATING_RULE_BLOCKED = "gating_rule_blocked"
    RECOVERY_VERIFIED = "recovery_verified"
    SETTLEMENT_RECOVERED = "settlement_recovered"
    SYSTEM_ERROR = "system_error"


class AuditStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    SKIPPED = "skipped"


def generate_audit_id() -> str:
    return f"audit_{uuid.uuid4().hex[:12]}"


class AuditLogBase(SQLModel):
    transaction_id: Optional[str] = Field(
        default=None,
        foreign_key="transaction.id",
        index=True,
        description="Related transaction ID if applicable",
    )
    customer_id: Optional[str] = Field(
        default=None,
        foreign_key="customer.id",
        index=True,
        description="Related customer ID if applicable",
    )
    agent_name: str = Field(
        index=True,
        description="Name of the agent or component performing the action",
    )
    action_type: ActionType = Field(
        index=True,
        description="Category of action executed",
    )
    status: AuditStatus = Field(
        default=AuditStatus.SUCCESS,
        index=True,
        description="Outcome of the action execution",
    )
    input_payload: Optional[str] = Field(
        default=None,
        description="Serialized JSON input payload received by the agent/tool",
    )
    output_payload: Optional[str] = Field(
        default=None,
        description="Serialized JSON output/response produced by the agent/tool",
    )
    metadata_json: Optional[str] = Field(
        default=None,
        description="Extra context, prompt tokens, or error stack traces as serialized JSON",
    )
    execution_duration_ms: Optional[float] = Field(
        default=None,
        description="Execution duration in milliseconds",
    )


class AuditLog(AuditLogBase, table=True):
    __tablename__ = "audit_log"
    __table_args__ = {"extend_existing": True}

    id: str = Field(
        default_factory=generate_audit_id,
        primary_key=True,
        index=True,
        description="Unique identifier for the audit ledger entry",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        index=True,
        description="Timestamp when the action was logged",
    )
