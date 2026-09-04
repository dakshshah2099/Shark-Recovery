import React, { useState } from 'react';
import {
  Radio,
  Activity,
  ShieldCheck,
  Sparkles,
  Phone,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Code2,
} from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AgentStepFlowProps {
  latestLogs?: AuditLogItem[];
  activeTransactionId?: string;
  maxRetries?: number;
  onUpdateMaxRetries?: (retries: number) => Promise<void> | void;
}

interface StepNode {
  id: string;
  stageNumber: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  agentRole: string;
  latencyAvg: string;
  description: string;
  guardrail: string;
  sampleInput: string;
  sampleOutput: string;
}

const AGENT_STEPS: StepNode[] = [
  {
    id: 'sentinel',
    stageNumber: '01',
    title: 'Sentinel Telemetry',
    subtitle: 'Degradation & Anomaly Agent',
    icon: Radio,
    agentRole: 'SentinelMonitorAgent',
    latencyAvg: '2.8ms',
    description: 'Monitors empirical degradation across all 6 loss vectors and auto-reroutes dropouts to UPI DeepLink on bank CBS outages.',
    guardrail: 'Excludes synthetic benchmark runs from live production anomaly alerts.',
    sampleInput: '{\n  "error_code": "BAD_REQUEST_ERROR",\n  "reason": "Payment failed due to insufficient balance",\n  "is_benchmark": false\n}',
    sampleOutput: '{\n  "overall_system_health": "CRITICAL",\n  "active_anomalies_count": 2,\n  "routing_adjustment_recommended": true,\n  "summary": "2 loss vectors under active remediation"\n}',
  },
  {
    id: 'diagnostic',
    stageNumber: '02',
    title: 'Diagnostic Triage',
    subtitle: 'Root Cause & Risk Modeling',
    icon: Activity,
    agentRole: 'DiagnosticAgent',
    latencyAvg: '3.1ms',
    description: 'Classifies technical dropout (UPI limit, 3DS timeout, CBS 503, expired card) and computes statistical customer churn risk.',
    guardrail: 'Immediate non-retryable isolation on stolen/fraud cards (risk_score = 1.0).',
    sampleInput: '{\n  "transaction_id": "txn_560abf6b1081",\n  "amount": 2999.0,\n  "failure_code": "BAD_REQUEST_ERROR",\n  "previous_failed_attempts": 0\n}',
    sampleOutput: '{\n  "failure_category": "insufficient_funds",\n  "can_retry": true,\n  "risk_score": 0.21,\n  "recommended_action": "Offer flexible link with 10% discount"\n}',
  },
  {
    id: 'compliance',
    stageNumber: '03',
    title: 'Guardian Compliance',
    subtitle: 'RBI Fair Practice & Stopping Rules',
    icon: ShieldCheck,
    agentRole: 'GuardianComplianceAgent',
    latencyAvg: '1.2ms',
    description: 'Enforces statutory compliance: 10 PM–8 AM IST DND quiet windows, max 2 retry ceiling, and 24h cooling-off intervals.',
    guardrail: 'Hard stop threshold strictly halts automated retry loops to prevent customer harassment.',
    sampleInput: '{\n  "retry_count": 2,\n  "max_retries": 2,\n  "dnd_window_active": false\n}',
    sampleOutput: '{\n  "is_compliant": false,\n  "stopping_rule_triggered": true,\n  "rejection_reason": "BOUNDED_RETRY_THRESHOLD_EXCEEDED",\n  "compliance_notes": "Maximum bounded retry threshold reached (2/2). Halting automated loops."\n}',
  },
  {
    id: 'strategy',
    stageNumber: '04',
    title: 'Master Strategy',
    subtitle: 'Dynamic Incentives & Tone',
    icon: Sparkles,
    agentRole: 'StrategyAgent',
    latencyAvg: '3.5ms',
    description: 'Dynamic decision matrix optimizing discount percentage (0%–15%), urgency expiration (30m), and bespoke Hinglish messaging.',
    guardrail: 'Margin cap ensures discount incentive preserves unit economics.',
    sampleInput: '{\n  "failure_category": "insufficient_funds",\n  "amount": 2999.0,\n  "customer_spend": 3500.0,\n  "risk_score": 0.21\n}',
    sampleOutput: '{\n  "channel": "WHATSAPP",\n  "tone": "INCENTIVE_FOCUSED",\n  "discount_percentage": 10.0,\n  "offer_code": "RECOVER10",\n  "headline": "Exclusive 10% Cart Recovery"\n}',
  },
  {
    id: 'solvers',
    stageNumber: '05',
    title: 'Specialized Solvers',
    subtitle: 'Voice AI / Mandates / B2B',
    icon: Phone,
    agentRole: 'Voice / Mandate / B2B Agents',
    latencyAvg: '45ms',
    description: 'Kokoro-82M Hinglish Voice AI Agent, NPCI e-Mandate auto-debit sequencers, and B2B milestone invoice restructuring.',
    guardrail: 'Phonetic Devanagari G2P transliteration for natural vernacular pronunciation.',
    sampleInput: '{\n  "solver_type": "HINGLISH_VOICE_AI",\n  "customer": "Vikramaditya Roy",\n  "amount": 14999.0,\n  "intent_target": "PROMISE_TO_PAY"\n}',
    sampleOutput: '{\n  "voice_synthesis": "Kokoro-82M neural style blended",\n  "transcript": "Namaste Vikramaditya ji, payment complete karne ke liye 10% discount link SMS kar diya hai",\n  "promise_to_pay_date": "2026-09-05"\n}',
  },
  {
    id: 'dispatch',
    stageNumber: '06',
    title: 'Dispatch Tools',
    subtitle: 'Razorpay API, WhatsApp & SMTP',
    icon: Send,
    agentRole: 'Dispatches & Tools',
    latencyAvg: '680ms',
    description: 'Creates tamper-proof Razorpay payment link and dispatches 1-click recovery payloads via Twilio WhatsApp & SMTP.',
    guardrail: 'Automatic fallback to SMTP when WhatsApp rate limits or carrier delivery blocks trigger.',
    sampleInput: '{\n  "amount": 2699.10,\n  "recipient_phone": "+919876501234",\n  "template": "cart_recovery_incentive"\n}',
    sampleOutput: '{\n  "link_id": "plink_cf74bcf6dc",\n  "short_url": "https://rzp.io/i/rec_058f503f",\n  "delivered": true,\n  "mode": "twilio_fallback"\n}',
  },
  {
    id: 'settlement',
    stageNumber: '07',
    title: 'Settlement Verifier',
    subtitle: 'Immutable Audit Ledger',
    icon: CheckCircle2,
    agentRole: 'WebhookVerifier',
    latencyAvg: '15ms',
    description: 'HMAC-SHA256 signature verification on payment_link.paid webhook, ledger recording, and loop termination.',
    guardrail: 'Cryptographic HMAC signature validation protects against fraudulent callback injections.',
    sampleInput: '{\n  "event": "payment_link.paid",\n  "signature": "hmac_sha256_verified",\n  "amount": 2699.10\n}',
    sampleOutput: '{\n  "status": "RECOVERED",\n  "recovered_amount": 2699.10,\n  "loop_state": "TERMINATED_SUCCESS",\n  "audit_logged": true\n}',
  },
];

export const AgentStepFlow: React.FC<AgentStepFlowProps> = ({
  maxRetries = 2,
}) => {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const toggleStep = (id: string) => {
    setActiveStep(activeStep === id ? null : id);
  };

  return (
    <div className="w-full bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 space-y-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-100 dark:border-[#27272a]">
        <div>
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-500" aria-hidden="true" />
            <span>Autonomous Multi-Agent Architecture & Reasoning Pipeline</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            End-to-end deterministic 7-stage pipeline from gateway anomaly triage to verified settlement.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Stopping Rule Ceiling:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 rounded border border-emerald-200 dark:border-emerald-800/60">
              {maxRetries} Retries
            </span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Nodes */}
      <div role="region" aria-label="Agent Pipeline Steps" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {AGENT_STEPS.map((step) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => toggleStep(step.id)}
              aria-expanded={isSelected}
              aria-controls={isSelected ? `step-inspector-${step.id}` : undefined}
              aria-label={`Inspect stage ${step.stageNumber}: ${step.title}, ${step.subtitle}`}
              className={`p-3 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between h-32 relative focus-rzp ${
                isSelected
                  ? 'bg-blue-50/80 dark:bg-[#18181b] border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/40 text-blue-950 dark:text-white shadow-xs'
                  : 'bg-zinc-50/60 dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100/90 dark:hover:bg-[#18181b] hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-[#1c1c21] border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300'
                }`} aria-hidden="true">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-zinc-200/70 dark:bg-[#1c1c21] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-[#27272a]'
                }`} aria-hidden="true">
                  {step.stageNumber}
                </span>
              </div>

              <div className="my-1">
                <div className="text-xs font-bold font-subheading text-zinc-900 dark:text-white truncate">{step.title}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-body truncate mt-0.5">{step.subtitle}</div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-1.5 border-t border-zinc-200/70 dark:border-[#27272a]/80">
                <span className="font-mono text-[9px] uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[70%]">
                  ⚡ {step.latencyAvg}
                </span>
                {isSelected ? <ChevronUp className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" /> : <ChevronDown className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" aria-hidden="true" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Node Deep Inspector */}
      {activeStep && (
        <div
          id={`step-inspector-${activeStep}`}
          aria-live="polite"
          className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg p-4 sm:p-5 space-y-3.5 animate-in fade-in duration-150"
        >
          {(() => {
            const current = AGENT_STEPS.find((s) => s.id === activeStep);
            if (!current) return null;
            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-200 dark:border-[#27272a]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold font-subheading text-zinc-900 dark:text-zinc-100">
                      Stage {current.stageNumber}: {current.title} — {current.subtitle}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded font-semibold">
                      Agent: {current.agentRole}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-200 dark:bg-[#27272a] text-zinc-700 dark:text-zinc-300 rounded">
                      Avg Latency: {current.latencyAvg}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-[#121215] p-3 rounded border border-zinc-200 dark:border-[#27272a] space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 block">
                      Core Mission & Processing:
                    </span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-body leading-relaxed">
                      {current.description}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#121215] p-3 rounded border border-zinc-200 dark:border-[#27272a] space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-500 block">
                      Compliance & Guardrail Rule:
                    </span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-body leading-relaxed">
                      {current.guardrail}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Input Telemetry Payload</span>
                    </div>
                    <pre className="p-3 rounded bg-zinc-950 dark:bg-[#09090b] border border-zinc-800 dark:border-[#27272a] text-zinc-300 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-56">
                      {current.sampleInput}
                    </pre>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Deterministic Decision Output</span>
                    </div>
                    <pre className="p-3 rounded bg-zinc-950 dark:bg-[#09090b] border border-zinc-800 dark:border-[#27272a] text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-56">
                      {current.sampleOutput}
                    </pre>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};