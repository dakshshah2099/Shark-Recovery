import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


def generate_customer_id() -> str:
    return f"cust_{uuid.uuid4().hex[:12]}"


class CustomerBase(SQLModel):
    name: str = Field(index=True, description="Customer full name")
    email: str = Field(index=True, description="Customer email address")
    phone: str = Field(index=True, description="Customer phone number in E.164 format")
    risk_score: float = Field(default=0.0, description="Calculated churn or failure risk score (0.0 to 1.0)")
    total_spent: float = Field(default=0.0, description="Lifetime total amount spent by customer")
    successful_transactions_count: int = Field(default=0, description="Count of successful transactions")
    failed_transactions_count: int = Field(default=0, description="Count of failed transactions")


class Customer(CustomerBase, table=True):
    __tablename__ = "customer"

    id: str = Field(
        default_factory=generate_customer_id,
        primary_key=True,
        index=True,
        description="Unique identifier for the customer",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when customer record was created",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when customer record was last updated",
    )
