import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional
from pydantic import BaseModel
try:
    from backend.models.schemas import DiagnosticContext, FailureDiagnosis, RecoveryChannel
    from backend.models.transaction import FailureCategory
except ImportError:
    from models.schemas import DiagnosticContext, FailureDiagnosis, RecoveryChannel
    from models.transaction import FailureCategory

logger = logging.getLogger(__name__)


class ComplianceVerdict(BaseModel):
    is_compliant: bool
    stopping_rule_triggered: bool
    escalation_stage: int  # 1 to 5
    dnd_window_active: bool
    max_retries_ceiling: int
    cooling_off_hours_required: int
    allowed_channels: list[str]
    compliance_notes: str
    rejection_reason: Optional[str] = None


async def verify_compliance_and_stopping_rules(
    ctx: DiagnosticContext,
    diag: FailureDiagnosis,
    retry_count: int,
    max_retries: int,
    requested_channel: Optional[str] = None,
) -> ComplianceVerdict:
    """
    Guardian Compliance Agent:
    Enforces strict RBI consumer protection guidelines, DND calling hours (8am - 8pm IST),
    bounded retry ceilings, harassment prevention, and cooling-off intervals.
    """
    # 1. Check Hard Fraud / Stolen Card Block
    if not diag.can_retry or diag.risk_score >= 0.85:
        return ComplianceVerdict(
            is_compliant=False,
            stopping_rule_triggered=True,
            escalation_stage=0,
            dnd_window_active=False,
            max_retries_ceiling=max_retries,
            cooling_off_hours_required=0,
            allowed_channels=[],
            compliance_notes="Transaction flagged high-risk or non-recoverable. Autonomous outreach strictly prohibited.",
            rejection_reason="FRAUD_OR_NON_RETRYABLE_GATEWAY_BLOCK",
        )

    # 2. Check Bounded Retry Upper Bound
    if retry_count >= max_retries:
        return ComplianceVerdict(
            is_compliant=False,
            stopping_rule_triggered=True,
            escalation_stage=retry_count + 1,
            dnd_window_active=False,
            max_retries_ceiling=max_retries,
            cooling_off_hours_required=0,
            allowed_channels=[],
            compliance_notes=f"Maximum bounded retry threshold reached ({retry_count}/{max_retries}). Halting automated loops.",
            rejection_reason="BOUNDED_RETRY_THRESHOLD_EXCEEDED",
        )

    # 3. Check Indian Standard Time (IST) DND Hours (8:00 AM - 8:00 PM allowed for voice/SMS)
    # UTC + 5:30
    utc_now = datetime.now(timezone.utc)
    ist_now = utc_now + timedelta(hours=5, minutes=30)
    ist_hour = ist_now.hour

    # DND is active from 8 PM to 8 AM (20:00 to 08:00 IST)
    dnd_active = ist_hour < 8 or ist_hour >= 20

    allowed = ["email", "whatsapp"]
    if not dnd_active:
        allowed.extend(["sms", "voice_ivr"])

    # If requested channel is Voice IVR during DND, downgrade to Email/WhatsApp
    downgrade_note = ""
    if requested_channel in ["voice_ivr", "sms"] and dnd_active:
        downgrade_note = " (Note: Voice IVR suppressed due to RBI DND 8pm-8am IST window; downgraded to silent digital outreach)."

    # Determine Escalation Stage
    if retry_count == 0:
        stage = 1  # Gentle instant ping
        cooling_off = 0
    elif retry_count == 1:
        stage = 2  # Dynamic incentive retry
        cooling_off = 4
    elif retry_count == 2:
        stage = 3  # Interactive voice / mandate reschedule
        cooling_off = 24
    else:
        stage = 4  # Promise-to-pay tracker
        cooling_off = 48

    return ComplianceVerdict(
        is_compliant=True,
        stopping_rule_triggered=False,
        escalation_stage=stage,
        dnd_window_active=dnd_active,
        max_retries_ceiling=max_retries,
        cooling_off_hours_required=cooling_off,
        allowed_channels=allowed,
        compliance_notes=f"Escalation Stage {stage} approved under RBI Fair Practice code. Cooling-off: {cooling_off}h{downgrade_note}.",
        rejection_reason=None,
    )
