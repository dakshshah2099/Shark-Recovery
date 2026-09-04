import React, { useState, useEffect, useMemo } from 'react';
import { AuditLogTimeline } from '../components/AuditLogTimeline';
import { CustomSelect, type SelectOption } from '../components/CustomSelect';
import { Activity, RefreshCw } from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditViewProps {
  logs: AuditLogItem[];
  onRefresh?: () => Promise<void> | void;
}

const KNOWN_AGENTS: { value: string; label: string; badge: string }[] = [
  { value: 'all', label: 'All Agents & Tools', badge: 'Full Ledger' },
  { value: 'SentinelMonitorAgent', label: 'Sentinel Telemetry Agent', badge: 'Anomaly' },
  { value: 'DiagnosticAgent', label: 'Diagnostic Root Cause Agent', badge: 'Triage' },
  { value: 'GuardianComplianceAgent', label: 'Guardian Compliance Agent', badge: 'Stopping Rules' },
  { value: 'StrategyAgent', label: 'Master Strategist Agent', badge: 'Discounts' },
  { value: 'HinglishVoiceAgent', label: 'Hinglish Voice Recovery AI', badge: 'Kokoro-82M' },
  { value: 'MandateSequencerAgent', label: 'Mandate Sequencer Agent', badge: 'Subscriptions' },
  { value: 'B2BReceivablesAgent', label: 'B2B Receivables Agent', badge: 'Receivables' },
  { value: 'RazorpayPaymentLinkTool', label: 'Razorpay Payment Links', badge: 'Payment API' },
  { value: 'TwilioWhatsAppDispatchTool', label: 'WhatsApp Outreach Tool', badge: 'Twilio' },
  { value: 'SMTPDispatchTool', label: 'Email Outreach Tool', badge: 'SMTP' },
  { value: 'WebhookVerifier', label: 'Webhook Settlement Verifier', badge: 'Settlement' },
  { value: 'ManualRecoveryTrigger', label: 'Manual Recovery Override', badge: 'Operator' },
  { value: 'SimulatedPayer', label: 'Simulated Customer Settlement', badge: 'Simulator' },
];

export const AuditView: React.FC<AuditViewProps> = ({ logs, onRefresh }) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Poll fresh audit logs every 4s while user is looking at this view
  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(() => {
      if (!document.hidden) {
        onRefresh();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Build dynamic options combining known agents and any new dynamic agent names in logs
  const agentOptions: SelectOption[] = useMemo(() => {
    const logAgentNames = new Set(logs.map((l) => l.agent_name));
    const options: SelectOption[] = [...KNOWN_AGENTS];

    logAgentNames.forEach((name) => {
      if (!options.some((o) => o.value.toLowerCase() === name.toLowerCase())) {
        options.push({
          value: name,
          label: name,
          badge: 'Dynamic',
        });
      }
    });

    return options;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (selectedAgent === 'all') return logs;
    return logs.filter((log) =>
      log.agent_name.toLowerCase().includes(selectedAgent.toLowerCase())
    );
  }, [logs, selectedAgent]);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      {/* Header & Filter Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Autonomous Agent Audit Ledger</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Stream ({logs.length} entries)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            Immutable chronological trace of LLM reasoning chains, stopping rule evaluations, and outreach dispatches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onRefresh && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a] text-xs font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors focus-rzp"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Logs</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-subheading font-semibold text-zinc-700 dark:text-zinc-300 hidden md:inline">
              Filter Agent:
            </span>
            <CustomSelect
              value={selectedAgent}
              onChange={setSelectedAgent}
              options={agentOptions}
              placeholder="Filter by Agent..."
              className="w-56 sm:w-64"
              align="right"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <AuditLogTimeline logs={filteredLogs} />
    </div>
  );
};
