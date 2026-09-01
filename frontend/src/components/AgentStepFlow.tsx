import React, { useState } from 'react';
import {
  Webhook,
  Activity,
  Percent,
  Link2,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  ShieldCheck,
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
  title: string;
  subtitle: string;
  icon: React.ElementType;
  agentRole: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
}

const AGENT_STEPS: StepNode[] = [
  {
    id: 'webhook',
    title: '1. Ingestion',
    subtitle: 'Webhook & Replicator',
    icon: Webhook,
    agentRole: 'Razorpay Ingester',
    description: 'Captures payment.failed event with HMAC-SHA256 signature verification.',
    sampleInput: '{\n  "event": "payment.failed",\n  "error_code": "BAD_REQUEST_ERROR",\n  "description": "Daily UPI limit exceeded",\n  "order_id": "order_OD94827104"\n}',
    sampleOutput: '{\n  "status": "INGESTED",\n  "retry_count": 1,\n  "action": "ROUTE_TO_DIAGNOSTIC_AGENT"\n}',
  },
  {
    id: 'diagnostic',
    title: '2. Diagnostic Agent',
    subtitle: 'Root-Cause Intelligence',
    icon: Activity,
    agentRole: 'DiagnosticAgent',
    description: 'Categorizes technical failure (UPI limit, 3DS timeout, bank outage) with confidence scoring.',
    sampleInput: '{\n  "gateway_error": "UPI_LIMIT_EXCEEDED",\n  "bank_issuer": "HDFC",\n  "method": "upi"\n}',
    sampleOutput: '{\n  "failure_category": "UPI_LIMIT_EXCEEDED",\n  "severity": "RECOVERABLE",\n  "recommended_channel": "WHATSAPP"\n}',
  },
  {
    id: 'strategy',
    title: '3. Strategy Agent',
    subtitle: 'Dynamic Incentives',
    icon: Percent,
    agentRole: 'StrategyAgent',
    description: 'Calculates optimal discount (0%–15%) and crafts high-conversion personalized copy.',
    sampleInput: '{\n  "cart_value": 4999,\n  "customer_loyalty": "NEW_USER",\n  "historical_conversion": 0.42\n}',
    sampleOutput: '{\n  "discount_percent": 10,\n  "discounted_amount": 4499,\n  "urgency_expiry_minutes": 30,\n  "channel": "WHATSAPP"\n}',
  },
  {
    id: 'link',
    title: '4. Link Generation',
    subtitle: 'Razorpay API Tool',
    icon: Link2,
    agentRole: 'PaymentLinkTool',
    description: 'Creates tamper-proof discounted Razorpay Payment Link with auto-expire timestamp.',
    sampleInput: '{\n  "amount_in_paisa": 449900,\n  "currency": "INR",\n  "expire_by": 1756708800\n}',
    sampleOutput: '{\n  "payment_link_id": "plink_Q918274a",\n  "short_url": "https://rzp.io/i/plink_Q918274a"\n}',
  },
  {
    id: 'outreach',
    title: '5. Dispatch Engine',
    subtitle: 'WhatsApp & SMTP Gateway',
    icon: Send,
    agentRole: 'WhatsApp / SMTP',
    description: 'Transmits branded recovery prompt via Twilio pre-approved templates or SMTP email.',
    sampleInput: '{\n  "recipient": "+919820123456",\n  "template": "appointment",\n  "params": ["https://rzp.io/i/plink_Q918274a"]\n}',
    sampleOutput: '{\n  "status": "DELIVERED",\n  "sid": "SM9482017381",\n  "timestamp": "2026-09-01T09:45:00Z"\n}',
  },
  {
    id: 'settlement',
    title: '6. Settlement',
    subtitle: 'Revenue Captured',
    icon: CheckCircle2,
    agentRole: 'Settlement Ledger',
    description: 'Confirms payment_link.paid webhook, updates ledger, and terminates loop.',
    sampleInput: '{\n  "event": "payment_link.paid",\n  "payment_id": "pay_98240174",\n  "amount": 449900\n}',
    sampleOutput: '{\n  "status": "RECOVERED",\n  "recovered_revenue": 4499.00,\n  "loop_state": "TERMINATED_SUCCESS"\n}',
  },
];

export const AgentStepFlow: React.FC<AgentStepFlowProps> = ({
  maxRetries = 2,
  onUpdateMaxRetries,
}) => {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [localRetries, setLocalRetries] = useState<number>(maxRetries);
  const [updating, setUpdating] = useState<boolean>(false);

  React.useEffect(() => {
    setLocalRetries(maxRetries);
  }, [maxRetries]);

  const toggleStep = (id: string) => {
    setActiveStep(activeStep === id ? null : id);
  };

  const handleAdjust = async (delta: number) => {
    const nextVal = Math.max(1, Math.min(10, localRetries + delta));
    if (nextVal === localRetries) return;
    setLocalRetries(nextVal);
    setUpdating(true);
    try {
      if (onUpdateMaxRetries) {
        await onUpdateMaxRetries(nextVal);
      } else {
        await fetch('/api/env-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ max_retry_attempts: nextVal }),
        });
      }
    } catch (e) {
      console.error('Failed to update max retries:', e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 space-y-4 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-[#27272a]">
        <div>
          <h3 className="font-heading font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-500" aria-hidden="true" />
            <span>Autonomous Multi-Agent Step Flow</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            Deterministic step-by-step reasoning pipeline from checkout dropout to revenue capture.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Bounded Retries:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded border border-emerald-200 dark:border-emerald-800/60">
              {localRetries}
            </span>
          </div>

          <div className="inline-flex items-center rounded border border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#18181b] overflow-hidden">
            <button
              type="button"
              disabled={localRetries <= 1 || updating}
              onClick={() => handleAdjust(-1)}
              title="Decrease MAX_RETRY_ATTEMPTS in environment"
              aria-label="Decrease maximum bounded retry attempts"
              className="px-2 py-0.5 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#27272a] disabled:opacity-30 cursor-pointer transition-colors focus-rzp"
            >
              -
            </button>
            <div className="w-[1px] h-4 bg-zinc-200 dark:border-[#27272a]" />
            <button
              type="button"
              disabled={localRetries >= 10 || updating}
              onClick={() => handleAdjust(1)}
              title="Increase MAX_RETRY_ATTEMPTS in environment"
              aria-label="Increase maximum bounded retry attempts"
              className="px-2 py-0.5 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#27272a] disabled:opacity-30 cursor-pointer transition-colors focus-rzp"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Nodes */}
      <div role="region" aria-label="Agent Pipeline Steps" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {AGENT_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => toggleStep(step.id)}
              aria-expanded={isSelected}
              aria-controls={isSelected ? `step-inspector-${step.id}` : undefined}
              aria-label={`Inspect step ${idx + 1}: ${step.title}, ${step.subtitle}`}
              className={`p-3 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative focus-rzp ${
                isSelected
                  ? 'bg-blue-50/70 dark:bg-[#18181b] border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/30 dark:ring-blue-500/40 text-blue-950 dark:text-white shadow-xs'
                  : 'bg-zinc-50/60 dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100/80 dark:hover:bg-[#18181b] hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-500'
                    : 'bg-white dark:bg-[#1c1c21] border-zinc-200 dark:border-[#27272a] text-zinc-600 dark:text-zinc-200'
                }`} aria-hidden="true">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-semibold" aria-hidden="true">
                  0{idx + 1}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold font-subheading text-zinc-900 dark:text-zinc-100 truncate">{step.title}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-body truncate mt-0.5">{step.subtitle}</div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 pt-1 border-t border-zinc-200/60 dark:border-[#27272a]/60">
                <span className="font-mono text-[9px] uppercase tracking-wider">{step.agentRole}</span>
                {isSelected ? <ChevronUp className="w-3 h-3 text-blue-600 dark:text-blue-400" aria-hidden="true" /> : <ChevronDown className="w-3 h-3 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Node Inspector */}
      {activeStep && (
        <div
          id={`step-inspector-${activeStep}`}
          aria-live="polite"
          className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-md p-4 space-y-3 animate-in fade-in duration-150"
        >
          {(() => {
            const current = AGENT_STEPS.find((s) => s.id === activeStep);
            if (!current) return null;
            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-subheading text-zinc-900 dark:text-zinc-100">{current.title} — {current.subtitle}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-200/80 dark:bg-[#27272a] text-zinc-700 dark:text-zinc-300 rounded font-semibold">
                      Role: {current.agentRole}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 font-body">{current.description}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Input Telemetry</span>
                    </div>
                    <pre className="p-3 rounded bg-zinc-900 dark:bg-[#09090b] border border-zinc-800 dark:border-[#27272a] text-zinc-200 dark:text-zinc-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                      {current.sampleInput}
                    </pre>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Deterministic Decision Output</span>
                    </div>
                    <pre className="p-3 rounded bg-zinc-900 dark:bg-[#09090b] border border-zinc-800 dark:border-[#27272a] text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
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