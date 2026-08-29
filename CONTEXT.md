# AI Revenue Recovery Agent

## 1. Core Objective
Build an autonomous, bounded multi-agent system that detects revenue at risk (failed payments, abandoned checkouts), determines the correct intervention, and executes a recovery workflow. 

## 2. Architecture & Tech Stack
*   **Backend & Orchestration:** Python, FastAPI, Pydantic-AI.
*   **Frontend & Dashboard:** Vite, React, TailwindCSS, TypeScript.
*   **Database:** Local SQLite (async SQLModel / SQLAlchemy).
*   **Integrations:** Razorpay Test-Mode APIs (Payment Links, Orders).
*   **Outreach Channels:** 
    *   Email: `aiosmtplib` (SMTP via Mailtrap/Gmail).
    *   WhatsApp/SMS: Simulated in-memory ledger rendered via React UI replica.

## 3. System Workflow (The Recovery Loop)
1.  **Ingestion:** Receive live Razorpay webhooks (`payment.failed`) OR trigger a synthetic batch payload via `/simulate-batch`.
2.  **Diagnostics:** Parse error codes and customer history to determine the failure root cause.
3.  **Strategy Selection:** Pydantic-AI agent selects an intervention (e.g., generate a new payment link with a discount, send a Hinglish reminder).
4.  **Execution & Gating:** Enforce stopping rules (max 2 retries per transaction). Execute the chosen tool (Email or UI Mock).
5.  **Audit Trail:** Log every decision, tool call, and recovered revenue amount into SQLite for real-time dashboard visualization.