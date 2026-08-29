# System Architecture & Decision Map

## 1. Directory Structure (Expected)
/backend
  ├── main.py               # FastAPI entry point
  ├── agents/               # Pydantic-AI system prompts and logic
  ├── tools/                # SMTP dispatch, Razorpay API calls, Mock ledger
  ├── models/               # SQLModel/Pydantic schemas
  └── database.py           # SQLite connection and session management
/frontend
  ├── src/app/              # Next.js App Router
  ├── src/components/       # UI Reusables (WhatsAppMock, MetricCard)
  └── src/types/            # TS interfaces mapping to Python Pydantic models

## 2. Architectural Decisions
*   **Why Pydantic-AI over LangGraph?** We opted for Pydantic-AI wrapped in FastAPI for speed and type-safe deterministic outputs, critical for hitting the tight hackathon deadline while avoiding complex graph overhead.
*   **Why Mock WhatsApp?** To guarantee zero latency, zero cost, and a perfectly controlled live demo without risking third-party API limits or DLT registration issues.
*   **Why a Hybrid Trigger?** Real webhooks prove technical capability, while the `/simulate-batch` endpoint guarantees a flawless, instantly measurable demo for the judges.
*   **Database & Async Session Management:** SQLite with `aiosqlite` and `sqlmodel` provides asynchronous, non-blocking DB operations integrated directly into FastAPI's lifespan and dependency injection system.
*   **Schema Separation:** Strict separation between persistence models (`Customer`, `Transaction`, `AuditLog`) and agent contracts (`DiagnosticContext`, `FailureDiagnosis`, `RecoveryStrategy`, `EmailPayload`, `WhatsAppPayload`).
*   **Multi-Tier Agent Fallback:** Diagnostic & Strategy agents leverage Gemini (`gemini-2.5-flash`) via Pydantic-AI when API keys exist, while maintaining a 100% offline-capable, deterministic heuristic classifier fallback to prevent demo downtime.
*   **Bounded Loops & Gating:** Explicit guardrails enforce a strict maximum retry limit (default: 2 retries per transaction) logging `GATING_RULE_BLOCKED` to the audit ledger and marking transactions `ABANDONED`.
*   **Dual-Trigger Architecture:** Razorpay webhooks (`payment.failed`, `payment_link.paid`) enable real-world integration, while the batch simulation router (`/api/simulate-batch`) generates realistic Indian localized scenarios (UPI limit exceeded, OTP expiration, SBI 503 outage) for live presentations.
*   **Audit-Driven Observability:** Dashboard queries compute real-time recovery metrics and stream live WhatsApp replica messages directly from SQLite and memory stores.
*   **Zero-Dependency Live UI Replica:** The React WhatsApp simulator mirrors mobile messaging UX with chat bubble styling, localized Hinglish copywriting, discount coupon tags, and instant simulated checkout triggers.

## 3. Package & Environment Setup
*   Backend: Managed via `uv` with fast dependency resolution and reproducible `.venv`.
*   Frontend: Vite + React + TypeScript + TailwindCSS v4 with proxy forwarding to `:8000`.
*   Zero hallucinated environment variables: all settings mapped via `pydantic-settings` to `.env`.