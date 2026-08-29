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

## 3. Package & Environment Setup
*   Managed via `uv` with fast dependency resolution and reproducible `.venv`.
*   Zero hallucinated environment variables: all settings mapped via `pydantic-settings` to `.env`.