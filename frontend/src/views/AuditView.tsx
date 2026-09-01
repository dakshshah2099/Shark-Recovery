import React, { useState } from 'react';
import { AuditLogTimeline } from '../components/AuditLogTimeline';
import { CustomSelect, type SelectOption } from '../components/CustomSelect';
import { Activity } from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditViewProps {
  logs: AuditLogItem[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  const agentOptions: SelectOption[] = [
    { value: 'all', label: 'All Agents & Tools' },
    { value: 'DiagnosticAgent', label: 'Diagnostic Agent', badge: 'Root Cause' },
    { value: 'StrategyAgent', label: 'Strategy Agent', badge: 'Discounting' },
    { value: 'RazorpayPaymentLinkTool', label: 'Razorpay Links', badge: 'Payment API' },
    { value: 'WhatsAppDispatchTool', label: 'WhatsApp Outreach', badge: 'Twilio' },
    { value: 'SMTPDispatchTool', label: 'Email Outreach', badge: 'SMTP' },
    { value: 'RecoveryOrchestrator', label: 'Recovery Orchestrator', badge: 'Core Engine' },
  ];

  const filteredLogs = logs.filter((log) => {
    if (selectedAgent === 'all') return true;
    return log.agent_name.toLowerCase().includes(selectedAgent.toLowerCase());
  });

  return (
    <div className="space-y-6 w-full">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 sm:p-6 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-sky-400" />
            <span>Autonomous Agent Audit Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Immutable chronological trace of LLM reasoning chains, tool inputs/outputs, and guardrail decisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
            Agent:
          </span>
          <CustomSelect
            value={selectedAgent}
            onChange={setSelectedAgent}
            options={agentOptions}
            className="w-56"
            align="right"
          />
        </div>
      </div>

      <AuditLogTimeline logs={filteredLogs} />
    </div>
  );
};
