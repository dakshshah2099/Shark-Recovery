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
        description="Channel utilized for recovery outreach (email, whatsapp, sms)",
    )
    discount_applied_percent: float = Field(
        default=0.0,
        description="Discount percentage applied in the recovery link",
    )
    recovered_amount: float = Field(
        default=0.0,
        description="Actual amount successfully recovered",
    )


class Transaction(TransactionBase, table=True):
    __tablename__ = "transaction"

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
