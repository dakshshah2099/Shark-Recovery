import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    FAILED = "failed"
    PROCESSING = "processing"
    RECOVERED = "recovered"
    ABANDONED = "abandoned"


class FailureCategory(str, enum.Enum):
    INSUFFICIENT_FUNDS = "insufficient_funds"
    AUTHENTICATION_FAILED = "authentication_failed"
    BANK_SERVER_ERROR = "bank_server_error"
    EXPIRED_CARD = "expired_card"
    USER_DROPOUT = "user_dropout"
    NETWORK_TIMEOUT = "network_timeout"
    PAYMENT_DECLINED = "payment_declined"
    UNKNOWN = "unknown"


def generate_transaction_id() -> str:
    return f"txn_{uuid.uuid4().hex[:12]}"


class LossVector(str, enum.Enum):
    CHECKOUT_DROPOFF = "checkout_dropoff"
    FAILED_SUBSCRIPTION = "failed_subscription"
    B2B_RECEIVABLE = "b2b_receivable"
    MANDATE_DEGRADATION = "mandate_degradation"
    VOICE_RECOVERY = "voice_recovery"
    GATEWAY_SPIKE = "gateway_spike"


class TransactionBase(SQLModel):
    razorpay_order_id: str = Field(index=True, description="Razorpay order identifier")
    razorpay_payment_id: Optional[str] = Field(
        default=None,
        index=True,
        description="Razorpay payment identifier if initiated",
    )
    customer_id: str = Field(
        foreign_key="customer.id",
        index=True,
        description="Foreign key referencing Customer",
    )
    amount: float = Field(description="Transaction amount in INR")
    currency: str = Field(default="INR", description="Currency code (e.g. INR)")
    status: TransactionStatus = Field(
        default=TransactionStatus.FAILED,
        index=True,
        description="Lifecycle status of the transaction",
    )
    loss_vector: LossVector = Field(
        default=LossVector.CHECKOUT_DROPOFF,
        index=True,
        description="Revenue loss vector category",
    )
    escalation_level: int = Field(
        default=1,
        description="Compliance escalation stage (1=gentle, 2=incentive, 3=voice, 4=mandate reschedule, 5=promise-to-pay)",
    )
    failure_code: Optional[str] = Field(
        default=None,
        index=True,
        description="Razorpay error code (e.g. BAD_REQUEST_ERROR, GATEWAY_ERROR)",
    )
    failure_reason: Optional[str] = Field(
        default=None,
        description="Detailed failure message or reason",
    )
    failure_category: FailureCategory = Field(
        default=FailureCategory.UNKNOWN,
        index=True,
        description="Classified failure category for agent decision making",
    )
    retry_count: int = Field(
        default=0,
        description="Number of recovery retries executed so far",
    )
    max_retries: int = Field(
        default=2,
        description="Upper bound guardrail for retry attempts",
    )
    recovery_link: Optional[str] = Field(
        default=None,
        description="Razorpay payment link generated for recovery",
    )
    recovery_channel: Optional[str] = Field(
        default=None,
        description="Channel utilized for recovery outreach (email, whatsapp, sms, voice_ivr)",
    )
    discount_applied_percent: float = Field(
        default=0.0,
        description="Discount percentage applied in the recovery link",
    )
    recovered_amount: float = Field(
        default=0.0,
        description="Actual amount successfully recovered",
    )
    promise_to_pay_date: Optional[str] = Field(
        default=None,
        description="Agreed customer promise-to-pay timestamp",
    )
    mandate_retry_schedule: Optional[str] = Field(
        default=None,
        description="JSON array of compliant scheduled retry timestamps",
    )
    voice_call_transcript: Optional[str] = Field(
        default=None,
        description="Hinglish Voice AI conversational transcript and intent score",
    )
    is_benchmark: bool = Field(
        default=False,
        index=True,
        description="Flag indicating if transaction is generated as part of a batch benchmark suite",
    )
    next_retry_at: Optional[datetime] = Field(
        default=None,
        index=True,
        description="Timestamp for next scheduled recovery attempt",
    )
    dispatch_scheduled_at: Optional[datetime] = Field(
        default=None,
        index=True,
        description="Delayed dispatch timestamp for liquidity windows",
    )
    ptp_reminder_sent: bool = Field(
        default=False,
        description="Flags whether expired PTP reminder already dispatched",
    )
    ptp_status: Optional[str] = Field(
        default=None,
        index=True,
        description="PTP status: PENDING, FULFILLED, BREACHED",
    )
    auto_retry_enabled: bool = Field(
        default=True,
        description="Per-transaction automated recovery kill-switch",
    )


class Transaction(TransactionBase, table=True):
    __tablename__ = "transaction"
    __table_args__ = {"extend_existing": True}

    id: str = Field(
        default_factory=generate_transaction_id,
        primary_key=True,
        index=True,
        description="Internal unique transaction ID",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        index=True,
        description="Timestamp when transaction was recorded",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when transaction was last modified",
    )
