import React, { useState } from 'react';
import { AuditLogTimeline } from '../components/AuditLogTimeline';
import { Activity, Filter } from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditViewProps {
  logs: AuditLogItem[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  const agents = ['all', 'DiagnosticAgent', 'StrategyAgent', 'RazorpayPaymentLinkTool', 'WhatsAppDispatchTool', 'SMTPDispatchTool', 'RecoveryOrchestrator'];

  const filteredLogs = logs.filter((log) => {
    if (selectedAgent === 'all') return true;
    return log.agent_name.toLowerCase().includes(selectedAgent.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>Autonomous Agent Audit Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Immutable chronological trace of LLM reasoning chains, tool inputs/outputs, and guardrail decisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
          >
            {agents.map((ag) => (
              <option key={ag} value={ag}>
                {ag === 'all' ? 'All Agents & Tools' : ag}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AuditLogTimeline logs={filteredLogs} />
    </div>
  );
};
