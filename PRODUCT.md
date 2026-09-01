# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Indian D2C founders, e-commerce merchants, and SaaS growth/finance operations teams managing payment failures and dropped checkouts on Razorpay. They require automated, hands-free revenue recovery without manual support overhead or customer annoyance.

## Product Purpose

SharkRecovery intercepts Razorpay payment failures and checkout dropouts in real time, diagnoses the exact technical or behavioral root cause (e.g., UPI daily limit exceeded, 3DS authentication timeouts, bank outages, insufficient balance), computes an optimal dynamic incentive (0%–15% discount), generates a fresh Razorpay Payment Link, and dispatches proactive recovery outreach via WhatsApp (Twilio Sandbox/Templates) and Email (SMTP). Success is measured by net recovered revenue (INR) and checkout conversion lift while preserving margin.

## Positioning

Unlike generic abandoned cart SMS drip campaigns or static retry webhooks, SharkRecovery operates a deterministic multi-agent loop with contextual root-cause intelligence, strict retry bounding (maximum 2 interventions per transaction), and verifiable end-to-end auditability.

## Operating Context

- **Webhook Ingestion**: Real-time Razorpay event listener (payment.failed, payment_link.paid) with HMAC-SHA256 signature verification.
- **Simulation & Testing**: Single failure replicator and bulk CSV upload for live demonstrations and integration testing.
- **Ledger & Audit Trail**: High-density transaction ledger with live disposition tracking (Active Triage, Captured/Recovered, Dropped, Failed) and chronological agent reasoning telemetry.
- **Runtime Environment**: Configurable multi-model AI engine (LiteLLM with Groq/Google Gemini presets), Razorpay API keys, Twilio WhatsApp credentials, and SMTP email parameters.

## Capabilities and Constraints

- **Multi-Agent Pipeline**: Diagnostic Agent (root cause categorization), Strategy Agent (dynamic discounting & channel decision), Execution Layer (Razorpay Payment Link generation, WhatsApp and SMTP delivery).
- **Deterministic Guardrails**: Hard limit of 2 retries per order to avoid spamming customers or violating gateway policies.
- **Data Persistence**: Local SQLite database with transaction state, recovery links, paid amounts, and immutable audit logs.
- **UI & Aesthetic Direction (Confirmed Open)**: The current theme is open for full redesign and exploration of modern, high-contrast, premium fintech visual aesthetics beyond default styling.

## Brand Commitments

- **Name**: SHARKRECOVERY / Razorpay Autonomous Recovery
- **Tone**: Transparent, professional, trustworthy, non-intrusive.
- **Visual Mandate**: Modernize beyond legacy styling; explore high-craft, distinct fintech aesthetics with strong typographic hierarchy and crisp contrast.

## Evidence on Hand

- Live FastAPI backend (backend/server.py) with Pydantic-AI agent architecture (backend/agents/).
- Complete React 19 + TypeScript + Tailwind CSS dashboard (frontend/).
- Verified test suite for agent loop (backend/test_agents.py).

## Product Principles

1. **Autonomous but Bounded**: Intervene intelligently without merchant micro-management, strictly constrained to 2 retry attempts.
2. **Contextual Root-Cause Matching**: Tailor the recovery channel, discount percentage, and message copy directly to the specific failure code (UPI limits vs. bank server outages).
3. **Auditable Integrity**: Every agent prompt, LLM reasoning step, and tool execution is persisted in an immutable ledger.
4. **Frictionless Resolution**: The customer receives a direct one-click Razorpay payment link with their discount already applied.

## Accessibility & Inclusion

- WCAG AA compliant contrast across light and dark modes.
- Clear visual indicators, semantic tables, keyboard navigation for modal selectors, and legible numeric formatting (INR currency standards).
