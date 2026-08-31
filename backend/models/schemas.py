import enum
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from .audit_log import ActionType, AuditStatus
from .transaction import FailureCategory, TransactionStatus


class RecoveryChannel(str, enum.Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    NONE = "none"


class CommunicationTone(str, enum.Enum):
    URGENT = "urgent"
    EMPATHETIC = "empathetic"
    INCENTIVE_FOCUSED = "incentive_focused"
    PROFESSIONAL = "professional"
    CASUAL_HINGLISH = "casual_hinglish"


# ---------------------------------------------------------------------------
# Agent I/O Schemas
# ---------------------------------------------------------------------------

class DiagnosticContext(BaseModel):
    """Input payload provided to the Diagnostic Agent."""
    model_config = ConfigDict(extra="ignore")

    transaction_id: str = Field(description="Unique transaction ID")
    razorpay_order_id: str = Field(description="Razorpay order ID")
    razorpay_payment_id: Optional[str] = Field(default=None, description="Razorpay payment ID if any")
    amount: float = Field(description="Transaction amount in INR")
    failure_code: Optional[str] = Field(default=None, description="Raw failure code from gateway")
    failure_reason: Optional[str] = Field(default=None, description="Raw failure description")
    customer_name: str = Field(description="Name of the customer")
    customer_email: str = Field(description="Email of the customer")
    customer_phone: str = Field(description="Phone number of the customer")
    previous_failed_attempts: int = Field(default=0, description="Previous failure count for this customer")
    total_spent: float = Field(default=0.0, description="Customer lifetime spend")


class FailureDiagnosis(BaseModel):
    """Deterministic output from the Diagnostic Agent."""
    model_config = ConfigDict(extra="ignore")

    transaction_id: str = Field(description="Target transaction ID")
    failure_category: FailureCategory = Field(description="Categorized root cause")
    root_cause: str = Field(description="Human readable explanation of why the payment failed")
    can_retry: bool = Field(description="Whether the transaction qualifies for automated recovery")
    risk_score: float = Field(ge=0.0, le=1.0, description="Calculated churn or fraud risk between 0.0 and 1.0")
    recommended_action: str = Field(description="High-level guidance for the Strategy Agent")
    diagnostic_notes: str = Field(description="Internal reasoning chain")


class RecoveryStrategy(BaseModel):
    """Deterministic output from the Strategy Selection Agent."""
    model_config = ConfigDict(extra="ignore")

    transaction_id: str = Field(description="Target transaction ID")
    channel: RecoveryChannel = Field(description="Selected outreach channel (email, whatsapp, sms, none)")
    tone: CommunicationTone = Field(description="Tone of communication to maximize conversion")
    discount_percentage: float = Field(
        default=0.0,
        ge=0.0,
        le=50.0,
        description="Dynamic incentive discount percentage (0 to 50%)",
    )
    offer_code: Optional[str] = Field(
        default=None,
        description="Coupon/promo code generated if discount is applied",
    )
    custom_headline: str = Field(description="Catchy notification headline or subject prefix")
    message_content: str = Field(description="Personalized message body tailored to the user and channel")
    urgency_level: str = Field(default="medium", description="Urgency tag (low, medium, high)")
    rationale: str = Field(description="Strategic justification for channel, tone, and discount selection")


class EmailPayload(BaseModel):
    """Payload dispatched to the SMTP/Email delivery service."""
    model_config = ConfigDict(extra="ignore")

    transaction_id: str = Field(description="Associated transaction ID")
    recipient_email: EmailStr = Field(description="Destination email address")
    recipient_name: str = Field(description="Name of recipient")
    subject: str = Field(description="Email subject line")
    body_html: str = Field(description="Rendered HTML body of the recovery email")
    body_text: str = Field(description="Plain text fallback body")
    payment_link: str = Field(description="Razorpay recovery payment link URL")
    discount_applied: float = Field(default=0.0, description="Discount percentage applied")
    original_amount: float = Field(description="Original order amount in INR")
    final_amount: float = Field(description="Final payable amount after discount in INR")


class WhatsAppPayload(BaseModel):
    """Payload dispatched to the WhatsApp mock ledger and client UI."""
    model_config = ConfigDict(extra="ignore")

    transaction_id: str = Field(description="Associated transaction ID")
    recipient_phone: str = Field(description="Destination phone number in E.164 format")
    recipient_name: str = Field(description="Name of the recipient")
    message: str = Field(description="Personalized WhatsApp message text")
    payment_link: str = Field(description="Razorpay recovery payment link URL")
    template_name: Optional[str] = Field(default=None, description="Pre-approved WhatsApp template name if used")
    params: Dict[str, Any] = Field(default_factory=dict, description="Template variable substitutions")


# ---------------------------------------------------------------------------
# Razorpay Tool Models
# ---------------------------------------------------------------------------

class RazorpayPaymentLinkCreate(BaseModel):
    """Parameters to create a Razorpay payment link."""
    amount: float = Field(description="Amount in INR")
    currency: str = Field(default="INR", description="Currency (default INR)")
    description: str = Field(description="Payment link description / order reference")
    customer_name: str = Field(description="Customer name")
    customer_email: str = Field(description="Customer email")
    customer_contact: str = Field(description="Customer contact phone")
    expire_by_minutes: int = Field(default=1440, description="Link validity in minutes (default 24 hours)")
    notes: Dict[str, str] = Field(default_factory=dict, description="Custom metadata notes")


class RazorpayPaymentLinkResponse(BaseModel):
    """Response returned from Razorpay Payment Link API or mock generator."""
    link_id: str = Field(description="Razorpay payment link ID (e.g. plink_xxx)")
    short_url: str = Field(description="Hosted payment URL")
    amount: float = Field(description="Payable amount in INR")
    currency: str = Field(default="INR")
    status: str = Field(description="Payment link status (created, paid, expired)")
    created_at: int = Field(description="Unix timestamp of creation")


# ---------------------------------------------------------------------------
# API Request / Response Schemas
# ---------------------------------------------------------------------------

class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    risk_score: float = 0.0


class CustomerRead(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    risk_score: float
    total_spent: float
    successful_transactions_count: int
    failed_transactions_count: int
    created_at: datetime
    updated_at: datetime


class TransactionCreate(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    customer_id: str
    amount: float
    currency: str = "INR"
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    failure_category: Optional[FailureCategory] = FailureCategory.UNKNOWN


class TransactionRead(BaseModel):
    id: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str]
    customer_id: str
    amount: float
    currency: str
    status: TransactionStatus
    failure_code: Optional[str]
    failure_reason: Optional[str]
    failure_category: FailureCategory
    retry_count: int
    max_retries: int
    recovery_link: Optional[str]
    recovery_channel: Optional[str]
    discount_applied_percent: float
    recovered_amount: float
    created_at: datetime
    updated_at: datetime


class AuditLogRead(BaseModel):
    id: str
    transaction_id: Optional[str]
    customer_id: Optional[str]
    agent_name: str
    action_type: ActionType
    status: AuditStatus
    input_payload: Optional[str]
    output_payload: Optional[str]
    metadata_json: Optional[str]
    execution_duration_ms: Optional[float]
    created_at: datetime


class DashboardMetrics(BaseModel):
    total_failed_revenue: float = Field(description="Cumulative value of all ingested transactions in INR")
    revenue_at_risk: float = Field(description="Active unrecovered revenue at risk in INR")
    total_recovered_revenue: float = Field(description="Total value of recovered revenue in INR")
    discount_loss_amount: float = Field(default=0.0, description="Total loss incurred due to recovery discount incentives in INR")
    recovery_rate_percent: float = Field(description="Percentage of failed transactions successfully recovered")
    total_transactions_count: int = Field(description="Total transactions ingested")
    active_recovery_count: int = Field(description="Transactions currently in recovery pipeline")
    email_dispatched_count: int = Field(description="Emails sent")
    whatsapp_dispatched_count: int = Field(description="WhatsApp messages sent")


class SimulateBatchItem(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    amount: float
    failure_code: str
    failure_reason: str
    simulate_instant_recovery: bool = Field(
        default=False,
        description="If true, simulate customer completing payment via link",
    )


class SimulateBatchRequest(BaseModel):
    items: Optional[List[SimulateBatchItem]] = None
    count: int = Field(default=5, description="Number of synthetic failed payments to generate if items not provided")


class SimulateBatchResponse(BaseModel):
    processed_count: int
    transactions: List[TransactionRead]
    message: str


class EnvConfigRead(BaseModel):
    debug_mode: bool
    groq_api_key: Optional[str] = ""
    gemini_api_key: Optional[str] = ""
    google_api_key: Optional[str] = ""
    openai_api_key: Optional[str] = ""
    llm_model: Optional[str] = "groq/openai/gpt-oss-120b"
    razorpay_key_id: Optional[str] = ""
    razorpay_key_secret: Optional[str] = ""
    razorpay_webhook_secret: Optional[str] = ""
    twilio_account_sid: Optional[str] = ""
    twilio_api_key: Optional[str] = ""
    twilio_api_secret: Optional[str] = ""
    twilio_auth_token: Optional[str] = ""
    twilio_whatsapp_from: Optional[str] = "whatsapp:+14155238886"
    smtp_host: Optional[str] = "smtp.gmail.com"
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = ""
    smtp_password: Optional[str] = ""
    smtp_from: Optional[str] = "recovery@sharkagent.local"
    max_retry_attempts: Optional[int] = 2


class EnvConfigUpdate(BaseModel):
    groq_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    llm_model: Optional[str] = None
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    razorpay_webhook_secret: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_api_key: Optional[str] = None
    twilio_api_secret: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_whatsapp_from: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
    max_retry_attempts: Optional[int] = None


