# Agent Coordination & Handoff Protocol

## 1. Git Guardrails & Commit Standards
All agents must adhere to the following strict commit message format to maintain an auditable timeline:
*   `feat(scope): description`
*   `fix(scope): description`
*   `chore(scope): description`
*   `docs(scope): description`
*   *Example:* `feat(agent): implement bounded retry logic for Pydantic-AI strategy tool`

## 3. Implementation Rules
*   **No Hallucinated Env Vars:** Always expect `.env` configurations for Razorpay keys and SMTP credentials.
*   **Type Safety:** Python functions must use strict type hinting.
*   **Graceful Failures:** All Razorpay API calls and SMTP dispatches must be wrapped in `try/except` blocks and logged to the Audit ledger.