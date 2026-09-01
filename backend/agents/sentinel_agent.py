import logging
import random
from datetime import datetime
from typing import Any, Dict, List
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class GatewayHealth(BaseModel):
    gateway_name: str
    channel_type: str  # "UPI", "Netbanking", "Cards", "AutoDebit"
    success_rate: float  # 0.0 to 100.0%
    latency_ms: int
    status: str  # "HEALTHY", "DEGRADED", "CRITICAL_OUTAGE"
    recommendation: str


class DegradationReport(BaseModel):
    timestamp: datetime
    overall_system_health: str
    active_anomalies: List[GatewayHealth]
    routing_adjustment_recommended: bool
    summary: str


# Real-time mock telemetry benchmarks for Indian payment infrastructure
GATEWAY_BENCHMARKS = [
    {"gateway_name": "HDFC Bank UPI", "channel_type": "UPI", "base_sr": 91.5, "latency": 450},
    {"gateway_name": "State Bank of India", "channel_type": "Netbanking", "base_sr": 84.0, "latency": 1100},
    {"gateway_name": "ICICI Bank Instant", "channel_type": "UPI", "base_sr": 96.2, "latency": 320},
    {"gateway_name": "Razorpay Smart Routing", "channel_type": "Cards", "base_sr": 94.8, "latency": 580},
    {"gateway_name": "NPCI e-Mandate Hub", "channel_type": "AutoDebit", "base_sr": 88.5, "latency": 890},
    {"gateway_name": "Axis Bank UPI", "channel_type": "UPI", "base_sr": 93.0, "latency": 410},
]


async def run_sentinel_monitor(error_code: str = "", failure_reason: str = "") -> DegradationReport:
    """
    Sentinel Telemetry Agent:
    Monitors live gateway health spikes, bank downtime, and routing anomalies.
    """
    anomalies: List[GatewayHealth] = []
    has_gateway_spike = any(k in (error_code + failure_reason).lower() for k in ["gateway", "bank", "timeout", "server", "degraded", "down"])

    for item in GATEWAY_BENCHMARKS:
        # Inject dynamic telemetry variations
        sr_jitter = random.uniform(-3.0, 2.0)
        current_sr = max(10.0, min(99.5, item["base_sr"] + sr_jitter))
        current_latency = int(item["latency"] + random.uniform(-50, 150))

        if has_gateway_spike and "SBI" in item["gateway_name"]:
            current_sr = 58.4
            current_latency = 2800
            status = "DEGRADED"
            rec = "Reroute incoming checkouts to UPI DeepLink (PhonePe/GPay) to bypass SBI Netbanking lag."
        elif current_sr < 80.0:
            status = "DEGRADED"
            rec = "Trigger alternate gateway fallback switch."
        elif current_sr < 65.0:
            status = "CRITICAL_OUTAGE"
            rec = "Halt automated direct retries; dispatch delayed WhatsApp payment link."
        else:
            status = "HEALTHY"
            rec = "Normal operational routing."

        gh = GatewayHealth(
            gateway_name=item["gateway_name"],
            channel_type=item["channel_type"],
            success_rate=round(current_sr, 1),
            latency_ms=current_latency,
            status=status,
            recommendation=rec,
        )
        anomalies.append(gh)

    degraded_count = sum(1 for g in anomalies if g.status != "HEALTHY")
    overall = "DEGRADED" if degraded_count >= 2 else ("WARNING" if degraded_count == 1 else "OPTIMAL")

    return DegradationReport(
        timestamp=datetime.utcnow(),
        overall_system_health=overall,
        active_anomalies=anomalies,
        routing_adjustment_recommended=degraded_count > 0,
        summary=f"Sentinel Agent monitored {len(anomalies)} gateway endpoints. {degraded_count} degraded nodes identified.",
    )
