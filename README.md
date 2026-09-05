# 🦈 Shark Recovery — Autonomous Multi-Agent AI Revenue Recovery Platform

> **An enterprise-grade, autonomous multi-agent AI revenue recovery platform engineered for Razorpay merchants in India. Shark Recovery intercepts payment failures and checkout dropouts in real time, diagnoses root causes, enforces RBI regulatory guardrails, computes dynamic margin-bounded incentives ($0\%\le d\le 15\%$), and executes compliant multi-channel recovery workflows across WhatsApp, Email, and interactive Hinglish Voice AI (Real-Time Voice WebSockets & Twilio PSTN).**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React_19_+_TypeScript-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite_8-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS v4](https://img.shields.io/badge/Styling-TailwindCSS_v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay_API-0C2340.svg?logo=razorpay&logoColor=white)](https://razorpay.com)
[![Voice AI](https://img.shields.io/badge/Voice_AI-Full_Duplex_WebSockets(Using Gemini-3.1-flash-live-preview)-4285F4.svg)](https://fastapi.tiangolo.com)
[![Twilio](https://img.shields.io/badge/Telephony-Twilio_Voice_%26_WhatsApp-F22F46.svg?logo=twilio&logoColor=white)](https://twilio.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📑 Table of Contents

- [The Core Problem & "The Bar"](#-the-core-problem--the-bar)
- [Autonomous Multi-Agent Architecture](#-autonomous-multi-agent-architecture)
  - [Agent Roles & Execution Pipeline](#agent-roles--execution-pipeline)
  - [Interactive Multi-Agent Step Flow](#interactive-multi-agent-step-flow)
- [Autonomous Recovery Scheduler & Telemetry Engine](#-autonomous-recovery-scheduler--telemetry-engine)
- [Promise-to-Pay (PTP) Tracker & Liquidity Windows](#-promise-to-pay-ptp-tracker--liquidity-windows)
- [The 6 Enterprise Revenue Loss Vectors](#-the-6-enterprise-revenue-loss-vectors)
- [Dynamic FinOps Incentive Engine](#-dynamic-finops-incentive-engine)
- [Interactive Hinglish Voice Recovery AI](#-interactive-hinglish-voice-recovery-ai)
  - [3 Voice AI Operational Modes](#3-voice-ai-operational-modes)
  - [Telephony Audio Codec & Transcoding](#telephony-audio-codec--transcoding)
- [Omnichannel Messaging & Live WhatsApp Simulator](#-omnichannel-messaging--live-whatsapp-simulator)
- [FinOps Power-User & Accessibility Suite](#-finops-power-user--accessibility-suite)
- [Interactive Testing, Benchmarking & Ingestion](#-interactive-testing-benchmarking--ingestion)
- [Regulatory Compliance & Stopping Rules](#-regulatory-compliance--stopping-rules)
- [Categorized Settings & Maintenance Barrier](#-categorized-settings--maintenance-barrier)
- [Tech Stack & Infrastructure](#-tech-stack--infrastructure)
- [Quickstart & Setup Guide](#-quickstart--setup-guide)
- [Automated Test Verification](#-automated-test-verification)
- [Repository Structure](#-repository-structure)
- [License](#-license)

---

## 📌 The Core Problem & "The Bar"

Revenue loss in Indian digital commerce and SaaS rarely happens in one clean step:

1. **Payment Infrastructure Degradation**: Bank CBS 503 latency and UPI switch downtime silently abort transactions during 3DS redirects.
2. **Checkout Drop-off & Intent Friction**: High-intent shoppers drop out due to daily UPI debit limits (₹1,00,000 ceiling), OTP timeouts, or price friction.
3. **Recurring Mandate Rejections**: Subscription auto-debits reject due to salary cycle misalignment (e.g., billing on 28th before salary on 1st) or temporary bank holds.
4. **Uncollected B2B Receivables**: Enterprise Net-30/60 invoices sit unpaid without proactive negotiation.

Traditional dunning systems send static, generic emails days later. These erode brand trust, offer inappropriate blanket discounts that eat merchant margins, and fail to close the loop.

**Shark Recovery raises the bar:**
- Operates as a **collaborative swarm of specialized AI agents** that triage dropouts in real time.
- Enforces **strict RBI regulatory guardrails** (DND calling hours, bounded retry limits, cooling-off windows).
- Dynamically formulates **margin-preserving incentive tiers** ($0\%, 5\%, 10\%, 15\%$) mapped to root causes.
- Continuously runs an **Autonomous Background Recovery Scheduler** resolving cooling-off periods and breached payment promises.
- Tracks **Promise-to-Pay (PTP) commitments** with conversational date parsing and liquidity window management.
- Synthesizes **conversational Hinglish Voice AI calls** with Promise-To-Pay (PTP) commitment extraction.
- Provides a **verifiable cryptographic audit trail** tracking **Measured Money Recovered**, **Margin Preserved**, and **Recovery ROI Multiple**.

---

## 🏛️ Autonomous Multi-Agent Architecture

Shark Recovery organizes specialized AI agents into a coordinated pipeline with automated fallback chains:

```mermaid
graph TD
    A[Payment Failure / Dropout / Webhook / Batch] --> B[1. Sentinel Telemetry Agent]
    B -->|Gateway Health & Routing Telemetry| C[2. Diagnostic Root-Cause Agent]
    C -->|Failure Category & Churn Risk Score| D[3. Guardian Compliance Agent]
    D -->|RBI DND, Cooling-off & Stopping Rules| E{Compliant?}
    E -->|No: Fraud / Stolen Card / Max Retries| F[Hard Stop & Mark ABANDONED]
    E -->|Yes: Approved Escalation Stage| G[4. Master Strategist Agent]
    G -->|Tone, Channel & Dynamic Margin Discount| H[Specialized Recovery Executors]
    
    H --> H1[5a. Hinglish Voice AI Agent]
    H --> H2[5b. Mandate Retry Sequencer]
    H --> H3[5c. B2B Receivables Chaser]
    
    H1 --> I[6. Dispatcher Tools]
    H2 --> I
    H3 --> I
    
    I --> I1[Razorpay Dynamic Payment Link Tool]
    I --> I2[SMTP Async TLS Gateway]
    I --> I3[Twilio WhatsApp / Live Feed Replica]
    I --> I4[Twilio PSTN Outbound Dialer & SMS]
    
    I1 --> J[7. Immutable Audit Ledger]
    I2 --> J
    I3 --> J
    I4 --> J
    
    J --> K[Customer Settlement: payment_link.paid -> Status RECOVERED]
```

### Agent Roles & Execution Pipeline

| Agent | Module Path | Decision Logic & Responsibilities | Fallback Engine |
| :--- | :--- | :--- | :--- |
| **Sentinel Telemetry Agent** | `backend/agents/sentinel_agent.py` | Continuously monitors database transaction logs across 5 banking rails (HDFC UPI, SBI Netbanking, ICICI, Razorpay Smart Routing, NPCI e-Mandate). Calculates real-time failure spikes, rolling latency ($ms$), and triggers routing bypasses. | Statistical baseline window |
| **Diagnostic Root-Cause Agent** | `backend/agents/diagnostic_agent.py` | Analyzes failure codes, customer history, and checkout context. Categorizes root cause into 7 buckets (`INSUFFICIENT_FUNDS`, `AUTHENTICATION_FAILED`, `BANK_SERVER_ERROR`, `EXPIRED_CARD`, `USER_DROPOUT`, `NETWORK_TIMEOUT`, `PAYMENT_DECLINED`) and outputs churn risk ($0.0\text{--}1.0$). | Few-shot LLM $\to$ deterministic rule tree |
| **Guardian Compliance Agent** | `backend/agents/compliance_agent.py` | Enforces regulatory guardrails: RBI Do-Not-Disturb calling window (8:00 AM – 8:00 PM IST), bounded retry ceilings ($\le 2$ attempts), cooling-off intervals (4h–48h), and hard halts on stolen cards/fraud ($risk \ge 0.85$). | Strict programmatic rules |
| **Master Strategist Agent** | `backend/agents/strategy_agent.py` | Formulates recovery plan: communication channel (`whatsapp`, `email`, `voice_ivr`), tone (`casual_hinglish`, `incentive_focused`, `empathetic`, `professional`), and dynamic margin-bounded discount ($0\%, 5\%, 10\%, 15\%$). | Dynamic decision matrix |
| **Autonomous Recovery Scheduler** | `backend/workers/recovery_scheduler.py` | Background worker continuously evaluating delayed liquidity window pushes, cooling-off retries, and mature promise-to-pay breaches. | Asynchronous interval loop |
| **Hinglish Voice Recovery AI** | `backend/agents/voice_agent.py`<br>`backend/routers/voice_stream.py` | Multi-mode conversational voice engine: 5-turn Hinglish dialogue scripts with emotion tagging, neural TTS / Web Speech audio synthesis, full-duplex live WebSocket streaming, and Twilio PSTN outbound dialer. | Template dialogue + Web Speech |
| **Mandate Retry Sequencer & B2B Chaser** | `backend/agents/mandate_agent.py` | Computes 3-slot cooling-off retry schedules (+24h, +72h, +120h) targeting morning banking hours and salary cycles (1st–5th of month), plus B2B installment negotiation plans. | Deterministic calendar rules |

### Interactive Multi-Agent Step Flow
Accessible directly via the **Agent Flow** tab (`frontend/src/components/AgentStepFlow.tsx`), merchants inspect the real-time reasoning lifecycle:
1. **Trigger Ingestion**: Webhook payload capture.
2. **Diagnostic Evaluation**: Root-cause categorization and churn risk calculation.
3. **Compliance Gate**: DND hours, cooling-off compliance, and retry ceilings.
4. **Strategy Formulation**: Tone, channel, and margin-bounded incentive selection.
5. **Tool Execution**: Generation of dynamic Razorpay payment links and omnichannel dispatch.
6. **Audit Ledger Commitment**: Cryptographic transaction logging.

---

## ⚙️ Autonomous Recovery Scheduler & Telemetry Engine

The Autonomous Recovery Scheduler (`backend/workers/recovery_scheduler.py`) is a continuous background engine running an asynchronous evaluation loop (default: every 30s):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        AUTONOMOUS RECOVERY SCHEDULER ENGINE                            │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ 1. Delayed Pushes          │ 2. Cooling-off Retries      │ 3. PTP Commitment Breaches  │
│ • Liquidity window mature  │ • status == PROCESSING      │ • promise_to_pay_date < now │
│ • Gateway cooldown expired │ • next_retry_at <= now      │ • Unrecovered commitment    │
│ • Automated nudge dispatch │ • Bounded retry execution   │ • Urgent re-target outreach │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

- **Operational Telemetry (`RecoverySchedulerCard.tsx`)**:
  - Live status indicators (**Active loop** vs **Worker Paused**).
  - Metrics grid tracking **Delayed Pushes**, **Auto-Retries**, **PTP Breaches**, and **Compliance Blocked**.
  - Immediate manual controls: **Pause/Resume Worker** (`/api/scheduler/toggle`) and **Force Tick** (`/api/scheduler/tick`).
- **Per-Transaction Kill-Switch**:
  - Individual transactions can be opted out of automated background recovery passes via `/api/transactions/{id}/toggle-auto-retry`.

---

## 🎯 Promise-to-Pay (PTP) Tracker & Liquidity Windows

The Promise-to-Pay (PTP) Tracker (`frontend/src/views/PTPTrackerView.tsx`) manages customer commitments extracted from conversational outreach:

- **Conversational Parsing (`parse_ptp_date`)**:
  - Extracts commitments from conversational replies (e.g., *"Salary credited tomorrow, will pay 10:30 AM"* or standard ISO dates).
  - Automatically translates relative phrasing into standardized UTC deadlines.
- **Liquidity Window Chips**:
  - Filters commitments across dynamic liquidity windows: **All Windows**, **Morning Banking (8 AM - 12 PM)**, **Evening Peak (4 PM - 8 PM)**, and **Salary Cycle (1st - 5th)**.
- **Commitment Telemetry**:
  - High-visibility cards displaying **Active Commitments**, **Committed GMV**, **Mature Liquidity (Next 4h)**, and **Breached Commitments**.
- **Integrated Scheduler Telemetry**:
  - Directly embeds the **Autonomous Recovery Scheduler Worker** control card for live operational management.

---

## ⚡ The 6 Enterprise Revenue Loss Vectors

Shark Recovery natively handles all 6 revenue loss vectors:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               6 REVENUE LOSS VECTORS & TRIAGE ENGINE                               │
├───────────────────────────────┬───────────────────────────────────┬───────────────────────────────┤
│ Vector 1: Checkout Dropouts   │ Vector 2: Gateway 503 Spikes      │ Vector 3: Failed Mandates     │
│ • Daily UPI limit exceeded    │ • SBI / HDFC CBS gateway lag      │ • Subscription debit rejected │
│ • 10% coupon (RECOVER10)      │ • Zero-margin reassurance (0%)    │ • 3-slot cooling-off plan     │
│ • WhatsApp 1-click link       │ • Empathetic status update        │ • Morning liquidity windows   │
├───────────────────────────────┼───────────────────────────────────┼───────────────────────────────┤
│ Vector 4: B2B Receivables     │ Vector 5: High-Value Abandonment  │ Vector 6: Fraud / Stolen Card │
│ • Net-30 invoice overdue 15d+ │ • Order value > ₹5,000            │ • Risk score ≥ 0.85           │
│ • 2-stage installment (50/50) │ • Hinglish Voice AI call          │ • Immediate hard stop         │
│ • 3% prompt payment rebate    │ • Promise-To-Pay commitment date  │ • Zero outreach / safe audit  │
└───────────────────────────────┴───────────────────────────────────┴───────────────────────────────┘
```

1. **E-Commerce Checkout Dropouts (UPI Limits & Low Funds)**
   - **Trigger**: Customer hits ₹1,00,000 daily UPI debit limit or lacks savings balance.
   - **Intervention**: Strategist crafts a high-urgency Hinglish WhatsApp message offering a dynamic 10% coupon (`RECOVER10`) with an alternative Credit Card / Netbanking payment link.
2. **Bank Gateway 503 Degradation Spikes**
   - **Trigger**: State Bank of India (SBI) or HDFC CBS gateway outage during 3DS redirect.
   - **Intervention**: Sentinel flags node degradation; Strategist sends an empathetic zero-margin reassurance link preserving merchant margin (0% discount).
3. **Recurring Subscription e-Mandate Failures**
   - **Trigger**: Card / UPI AutoPay recurring mandate rejected by issuing bank.
   - **Intervention**: Mandate Sequencer schedules a 3-slot cooling-off retry plan (+24h, +72h, +120h) aligning with liquidity windows and sends fallback payment links.
4. **B2B Invoice Receivables & Promise-to-Pay Tracker**
   - **Trigger**: Enterprise Net-30 invoice overdue by 15+ days.
   - **Intervention**: Formal email restructuring the invoice into a 50% upfront installment with a 3% prompt payment rebate, logging Promise-to-Pay milestones.
5. **High-Value Cart Abandonment (> ₹5,000)**
   - **Trigger**: High-ticket order (e.g. ₹14,999 electronics) abandoned during payment authentication.
   - **Intervention**: Hinglish Voice AI conducts a conversational dialogue, captures customer intent (`PROMISE_TO_PAY`), records date, and dispatches 1-click link via SMS/WhatsApp.
6. **Stolen Card / Fraudulent Payment Halt**
   - **Trigger**: Stolen card or high fraud risk score ($> 0.85$).
   - **Intervention**: Guardian Compliance Agent halts autonomous outreach immediately, logging a security block to protect merchant chargeback liability.

---

## 💰 Dynamic FinOps Incentive Engine

Shark Recovery avoids arbitrary discounts that erode merchant margin. The dynamic incentive matrix enforces strict FinOps guardrails:

| Root-Cause Category | Failure Profile | Dynamic Incentive | Promo Code | FinOps Rationale |
| :--- | :--- | :---: | :---: | :--- |
| **`BANK_SERVER_ERROR`** | Bank 503 / CBS outage | **0.0%** | *None* | **Zero Margin Erosion**: Customer intent is intact; failure was technical. A discount is unnecessary and would waste merchant margin. |
| **`AUTHENTICATION_FAILED`** | 3DS / OTP timeout | **5.0%** | `QUICK5` | **Friction Nudge**: Small token gesture to compensate for authentication inconvenience and encourage immediate retry. |
| **`INSUFFICIENT_FUNDS`** | UPI limit / balance constraint | **10.0%** | `RECOVER10` | **Instrument Switch**: Clear financial incentive to unblock funds friction or motivate checkout completion via credit card or BNPL. |
| **`USER_DROPOUT`** | High-value cart abandonment | **10.0% – 15.0%** | `SPECIAL10`<br>`VIP15` | **Conversion Closure**: Preserves margin on high-ticket cart recovery ($> ₹5,000$) while providing compelling urgency. |
| **`B2B_RECEIVABLE`** | Corporate invoice overdue | **3.0%** | `EARLYPAY3` | **Cashflow Acceleration**: Prompt-payment rebate tied to a 50% upfront installment structure. |

---

## 🎙️ Interactive Hinglish Voice Recovery AI

The Voice Recovery subsystem ([`VoiceCallModal.tsx`](frontend/src/components/VoiceCallModal.tsx) & [`voice_stream.py`](backend/routers/voice_stream.py)) provides **3 complementary operational modes** hardened for both desktop and mobile viewports ($\le 375\text{px}$):

### 3 Voice AI Operational Modes

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               3 VOICE RECOVERY MODES                                   │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ 1. Recorded Transcript     │ 2. Live Mic Stream          │ 3. PSTN Outbound Dialer     │
│ • 5-turn Hinglish dialogue │ • Real-Time Live WebSocket  │ • Twilio cellular call      │
│ • Neural Audio / TTS       │ • Full-duplex PCM16 stream  │ • Real phone dispatch (+91) │
│ • Live Devanagari script   │ • Dynamic visualizer        │ • TwiML stream response     │
│ • PTP date extraction      │ • Real-time negotiation     │ • Post-call SMS link        │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

1. **Recorded Transcript & Neural Playback**:
   - Turn-by-turn dialogue inspection with speaker emotion tags (`empathetic`, `reassuring`, `helpful`).
   - Browser Web Speech API & local Neural TTS engine fallback with phonetic Hinglish normalization (`preprocessHinglishSpeech`).
   - Live Devanagari script transliteration toggle (`नमस्ते जी, मैं शार्क पेमेंट टीम से बोल रही हूँ...`).
   - Automatic extraction of Promise-To-Pay (PTP) target date and outcome status.
2. **Live Mic Stream (Full-Duplex Live Audio WebSockets)**:
   - Full-duplex browser microphone capture streaming raw PCM audio to `/api/voice/stream`.
   - Real-time Hinglish AI response with live audio visualizer and instant dynamic payment link generation.
3. **PSTN Outbound Dialer (Twilio Telephony)**:
   - Dispatches real-world cellular calls to Indian phone numbers with dynamic TwiML generation.
   - Live call state monitoring (`ringing`, `in-progress`, `completed`).
   - Automated 1-click Razorpay payment link dispatch via SMS upon call completion.

### Telephony Audio Codec & Transcoding

The telephony gateway in `backend/tools/telephony_codec.py` bridges standard cellular telephony and modern multimodal AI:
- **$\mu$-Law $\leftrightarrow$ PCM16 Transcoding**: Decodes 8kHz 8-bit $\mu$-law audio from Twilio Media Streams into linear 16-bit PCM.
- **Bi-Directional Resampling**: Resamples between 8,000 Hz (cellular PSTN), 16,000 Hz (AI Audio input), and 24,000 Hz (AI Audio output).
- **Sub-150ms Streaming Latency**: Uses asynchronous audio chunking for near-instant conversational turn-taking.

---

## 💬 Omnichannel Messaging & Live WhatsApp Simulator

Shark Recovery provides dual-delivery outreach with native simulation tooling:

- **WhatsApp Recovery Feed ([`WhatsAppFeedView.tsx`](frontend/src/views/WhatsAppFeedView.tsx))**:
  - Live interactive mobile replica widget with animated message bubbles.
  - Dynamic coupon tags (`10% Auto-Applied`), order summary, and 1-click Razorpay payment link simulation.
  - Automated customer response simulation testing conversational recovery flows.
  - Twilio WhatsApp Sandbox REST dispatch with delivery receipt tracking.
- **SMTP Async TLS Email Dispatch (`backend/tools/smtp_tool.py`)**:
  - Asynchronous dispatch via `aiosmtplib` (Gmail TLS / Port 587).
  - Responsive, dark-mode-optimized HTML recovery email with order breakdown table, dynamic discount code badge, and secure payment CTA.

---

## 🖥️ FinOps Power-User & Accessibility Suite

Designed and verified under the **Enterprise FinOps Design System** (38/40 Usability Score, 0 detector warnings):

### Alex (Power User / FinOps Lead)
- **Multi-Select Batch Triage**: Checkbox per row + select-all header with floating action bar (`Retry Selected (N)`).
- **Single-Click CSV Ledger Export**: Export filtered transactions as timestamped CSV files (`shark_recovery_ledger_YYYY-MM-DD.csv`).
- **Power-User Keyboard Traversal**:
  - `j` / `k`: Move highlight up/down across rows.
  - `x`: Toggle row selection for batch triage.
  - `r`: Re-run AI recovery triage on highlighted transaction.
  - `/`: Quick focus on search input.
  - `esc`: Clear search and dismiss modals.

### Sam (Accessibility & Screen Readers)
- ARIA table semantics (`aria-activedescendant`, `id="txn-row-${txn.id}"`, `role="row"`, `aria-selected`).
- Polite live screen reader announcements (`aria-live="polite"`) announcing row selection, order ID, customer name, amount, and status during keyboard traversal.

### Jordan (First-Timer / Junior Merchant)
- Plain-language banking acronym glossary tooltips across failure diagnostics:
  - **`UPI`**: Unified Payments Interface - Instant real-time payment system developed by NPCI.
  - **`3DS`**: 3-Domain Secure - Multi-factor netbanking / card authentication timeout.
  - **`CBS`**: Core Banking System - Bank mainframe/host timeout (503 Service Unavailable).
  - **`PTP`**: Promise-To-Pay - Customer verbally or digitally confirmed agreement to pay.
  - **`NPCI`**: National Payments Corporation of India - Retail payments governing body.
  - **`HMAC`**: Hash-based Message Authentication Code - Cryptographic webhook signature.

### Mobile Viewport Hardening
- Adaptive stacked card view on mobile screens ($< 640\text{px}$).
- Viewport adaptation for small mobile screens ($\le 375\text{px}$) in [`VoiceCallModal.tsx`](frontend/src/components/VoiceCallModal.tsx) with compact tab headers and audio controls.

---

## 🧪 Interactive Testing, Benchmarking & Ingestion

Shark Recovery includes 4 interactive testing and benchmarking tools:

1. **Multi-Vector Benchmark Suite ([`BatchBenchmarkSuite.tsx`](frontend/src/components/BatchBenchmarkSuite.tsx))**:
   - Executes 8 realistic failure scenarios across all loss vectors in a single click.
   - Computes exact financial metrics: Total Revenue at Risk (₹1,69,694), Money Recovered (₹68,545), Discount Margin Cost, and Recovery ROI Multiple.
2. **Official Razorpay Checkout Modal ([`RazorpayCheckoutButton.tsx`](frontend/src/components/RazorpayCheckoutButton.tsx))**:
   - Native integration of official `checkout.js` SDK.
   - Allows operators to test real card declines, OTP dropouts, and UPI failures directly against Razorpay test gateways.
3. **Batch CSV Ingestion ([`IngestionView.tsx`](frontend/src/views/IngestionView.tsx))**:
   - Upload bulk payment failure CSV files with automatic schema parsing and asynchronous recovery pipeline execution.
4. **Single Failure Manual Injector ([`SingleFailureForm.tsx`](frontend/src/components/SingleFailureForm.tsx))**:
   - Operator form to inject custom dropouts with configurable customer details, amounts, and failure codes.

---

## 🛡️ Regulatory Compliance & Stopping Rules

The Guardian Compliance Agent (`backend/agents/compliance_agent.py`) ensures that autonomous AI outreach never violates Indian regulations or customer trust:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 COMPLIANCE & STOPPING RULES                                      │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│ 1. RBI DND Calling Hours      │ 2. Bounded Retry Ceilings        │ 3. Cooling-Off Intervals      │
│ • 8:00 AM – 8:00 PM IST       │ • Ceiling: ≤ 2 retry attempts    │ • Stage 1: 0h (instant ping)  │
│ • Voice/SMS suppressed in DND │ • Hard stop on limit reached     │ • Stage 2: 4h cooling-off     │
│ • Silent digital downgrade    │ • Prevents customer harassment   │ • Stage 3: 24h cooling-off    │
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

- **RBI DND Window (8:00 AM – 8:00 PM IST)**: Voice IVR and SMS are strictly suppressed outside allowed hours. Outreach is automatically downgraded to silent digital channels (Email/WhatsApp).
- **Bounded Retry Limits**: Maximum 2 automated attempts per order. Prevents runaway retry loops.
- **Cooling-off Schedules**: 4 hours between retry 1 and 2; 24 hours before interactive voice escalation.
- **Fraud & Chargeback Halt**: Any transaction with risk score $\ge 0.85$ or non-retryable failure codes is halted immediately with zero outreach.

---

## ⚙️ Categorized Settings & Maintenance Barrier

The Settings view ([`SettingsView.tsx`](frontend/src/views/SettingsView.tsx)) provides structured configuration with security guardrails:

- **Categorized Tab Architecture**:
  - **API Credentials**: Razorpay Key ID/Secret, Webhook Secret, Twilio SID/Token, Inference LLM API Keys, SMTP credentials.
  - **Recovery Guardrails**: Maximum retry ceiling, max discount percentage clamp, cooling-off intervals.
  - **Regulatory DND**: IST calling hour windows and weekend suppression toggles.
  - **AI Strategy Prompts**: Custom system prompt overrides for Diagnostic and Strategy agents.
  - **System Maintenance**: Database reset and sample data re-seeding.
- **Two-Step Destructive Purge Modal Barrier**:
  - Prevents accidental database erasure during live operations.
  - Requires explicit confirmation step before executing `/api/settings/purge-data`.
- **Live Credential Health Validation**:
  - One-click ping test verifying live API connectivity for Razorpay, Twilio, LLM provider, and SMTP.

---

## 💻 Tech Stack & Infrastructure

### Backend
- **Framework:** Python 3.11+, FastAPI (Async), Uvicorn.
- **Database & ORM:** SQLModel, SQLAlchemy 2.0 (Async engine with `aiosqlite`).
- **AI & Voice Engines:** Enterprise Multimodal LLMs, High-Throughput Inference Engine, Local Neural TTS Engine, with deterministic rule engine fallbacks.
- **Telephony & Messaging:** Razorpay API (Orders, Payments, Payment Links), Twilio (Voice PSTN & WhatsApp), `aiosmtplib` (Gmail TLS/587).
- **Package Management:** `uv` (Fast Python package manager).

### Frontend
- **Framework:** React 19, TypeScript, Vite 8.
- **Styling:** TailwindCSS v4, Lucide Icons, Custom Indian Financial notation (₹ INR Lakhs/Crores).
- **Audio:** Web Audio API, MediaRecorder, Web Speech API (`SpeechSynthesisUtterance`).
- **Testing:** Official Razorpay `checkout.js` SDK modal.

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Python 3.11+** with `uv` installed (`pip install uv` or `winget install astral-sh.uv`)
- **Node.js 18+** and **npm**

### 2. Clone & Configure Environment
```bash
git clone https://github.com/your-username/AI_Shark_Razorpay.git
cd AI_Shark_Razorpay

# Setup Environment in repository root
cp .env.example .env
```

Configure credentials in `.env`:
```ini
# LLM & Inference Providers (Optional - deterministic rule fallbacks included)
LLM_API_KEY=your_llm_api_key
INFERENCE_API_KEY=your_inference_api_key

# Razorpay Test Credentials
RAZORPAY_KEY_ID=rzp_test_YourKeyId
RAZORPAY_KEY_SECRET=YourKeySecret
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecret

# Twilio Telephony & WhatsApp (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp

# SMTP Email Dispatch (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM_EMAIL=Shark Recovery <your_email@gmail.com>

# App Configuration
DEBUG=false
MAX_RETRY_ATTEMPTS=2
MAX_DISCOUNT_PERCENT=15.0
```

### 3. Launch Platform

#### Option A: One-Command Local Runner
From repository root:
```bash
python run_demo.py
```
- **Dashboard Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API Swagger:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Option B: Docker Compose (Production Multi-Container)
```bash
docker compose up --build
```
- **Dashboard Frontend (Nginx SPA):** [http://localhost:3000](http://localhost:3000)
- **Backend API Swagger:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Persistent SQLite Volume:** `recovery_data` mounted at `/app/data/recovery.db`

---

## 🧪 Automated Test Verification

Run all test suites to verify schemas, agent reasoning, background worker scheduling, webhooks, and financial calculation precision:

```bash
cd backend

# Phase 1: SQLModel Database Schemas & CRUD Verification
uv run python test_schemas.py

# Phase 2: Multi-Agent Swarm, Gating & Orchestrator Logic
uv run python test_agents.py

# Phase 3: Razorpay Webhooks, Simulation Engine & Telemetry APIs
uv run python test_api.py

# Phase 4: Autonomous Recovery Scheduler Worker, Liquidity Windows & PTP Breaches
uv run python test_recovery_scheduler.py
```

---

## 📁 Repository Structure

```
AI_Shark_Razorpay/
├── backend/
│   ├── agents/
│   │   ├── compliance_agent.py      # Guardian: RBI DND, stopping rules & cooling-off
│   │   ├── diagnostic_agent.py      # Diagnostic: 7-bucket root cause analysis & risk score
│   │   ├── mandate_agent.py         # Mandate Sequencer: 3-slot retry & B2B PTP chaser
│   │   ├── orchestrator.py          # Swarm orchestrator coordinating full recovery pipeline
│   │   ├── sentinel_agent.py        # Sentinel: live telemetry & 503 bank degradation monitor
│   │   ├── strategy_agent.py        # Strategist: dynamic margin-bounded incentive formulation
│   │   └── voice_agent.py           # Voice AI: 5-turn Hinglish dialogue generator & PTP tracker
│   ├── models/
│   │   ├── audit_log.py             # SQLModel immutable audit ledger model
│   │   ├── customer.py              # SQLModel customer profile & spending history
│   │   ├── schemas.py               # Pydantic request/response schemas
│   │   └── transaction.py           # SQLModel transaction record & status enums
│   ├── routers/
│   │   ├── dashboard.py             # Metrics, charts, audit timeline, scheduler & settings APIs
│   │   ├── simulate.py              # 8-scenario benchmark suite & CSV batch uploader
│   │   ├── voice.py                 # Neural TTS audio synthesis endpoint
│   │   ├── voice_stream.py          # Real-Time Voice WebSocket & Twilio PSTN gateway
│   │   └── webhook.py               # Razorpay HMAC-SHA256 verified webhook receiver
│   ├── tools/
│   │   ├── live_audio_client.py     # Full-Duplex Live Audio WebSocket client
│   │   ├── llm_client.py            # Multi-provider LLM client with heuristic fallback
│   │   ├── razorpay_tool.py         # Razorpay Payment Link generator & order API
│   │   ├── smtp_tool.py             # Asynchronous TLS email dispatcher
│   │   ├── telephony_codec.py       # μ-law ↔ PCM16 audio transcoding & resampling
│   │   └── whatsapp_tool.py         # Twilio WhatsApp REST client & message logger
│   ├── workers/
│   │   └── recovery_scheduler.py    # Autonomous background scheduler: delayed pushes, cooldowns & PTP
│   ├── database.py                  # Async SQLite session manager & schema initialization
│   ├── main.py                      # FastAPI application entrypoint & middleware
│   ├── seed.py                      # Seed dataset populating realistic transaction ledger
│   └── test_recovery_scheduler.py   # Test suite for autonomous recovery scheduler & PTP
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentStepFlow.tsx          # Interactive multi-agent pipeline visualizer
│   │   │   ├── AuditLogTimeline.tsx       # Chronological audit ledger with payload inspector
│   │   │   ├── BatchBenchmarkSuite.tsx    # 8-vector benchmark suite with ROI calculator
│   │   │   ├── CsvUploader.tsx            # Batch CSV failure uploader
│   │   │   ├── CustomSelect.tsx           # Accessible custom select dropdown
│   │   │   ├── MetricCards.tsx            # KPI metric cards (recovered, at risk, ROI)
│   │   │   ├── OverviewCharts.tsx         # Chart.js analytics (recovery trends, channels)
│   │   │   ├── RazorpayCheckoutButton.tsx # Official checkout.js drop-out simulator
│   │   │   ├── RecoverySchedulerCard.tsx  # Autonomous background scheduler worker telemetry card
│   │   │   ├── SentinelTelemetryCard.tsx  # Live bank gateway degradation monitor
│   │   │   ├── Sidebar.tsx                # Responsive navigation sidebar
│   │   │   ├── SingleFailureForm.tsx      # Manual failure injection operator form
│   │   │   ├── TransactionTable.tsx       # FinOps ledger table with batch retry & CSV export
│   │   │   └── VoiceCallModal.tsx         # 3-mode Hinglish Voice AI modal (mobile-adapted)
│   │   ├── views/
│   │   │   ├── AuditView.tsx              # Full-page audit ledger view
│   │   │   ├── IngestionView.tsx          # Batch benchmark, CSV upload & manual injector
│   │   │   ├── OverviewView.tsx           # Primary dashboard overview & metrics
│   │   │   ├── PTPTrackerView.tsx         # Promise-to-Pay (PTP) tracker & liquidity windows
│   │   │   ├── SettingsView.tsx           # Categorized settings with purge confirmation barrier
│   │   │   ├── TransactionsView.tsx       # Full transaction ledger view
│   │   │   └── WhatsAppFeedView.tsx       # Live WhatsApp message feed & phone replica
│   │   ├── types/                         # TypeScript interfaces & enums
│   │   ├── utils/                         # Date formatting & currency helpers
│   │   ├── App.tsx                        # Main application container & view router
│   │   └── index.css                      # TailwindCSS styles & focus ring design tokens
│   ├── package.json                       # Frontend dependencies & build scripts
│   └── vite.config.ts                     # Vite 8 configuration
├── docker-compose.yml                     # Multi-container production deployment
├── Dockerfile.backend                     # Backend Docker container specification
├── Dockerfile.frontend                    # Frontend Nginx container specification
├── run_demo.py                            # One-command dual runner (FastAPI + Vite)
└── README.md                              # Complete platform documentation
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
