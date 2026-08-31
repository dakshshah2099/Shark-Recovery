import React, { useState } from 'react';
import { AuditLogTimeline } from '../components/AuditLogTimeline';
import { Activity, ChevronDown } from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditViewProps {
  logs: AuditLogItem[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  const agents = [
    'all',
    'DiagnosticAgent',
    'StrategyAgent',
    'RazorpayPaymentLinkTool',
    'WhatsAppDispatchTool',
    'SMTPDispatchTool',
    'RecoveryOrchestrator',
  ];

  const filteredLogs = logs.filter((log) => {
    if (selectedAgent === 'all') return true;
    return log.agent_name.toLowerCase().includes(selectedAgent.toLowerCase());
  });

  return (
    <div className="space-y-6 w-full">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-xl p-5 sm:p-6 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#0c83ff] dark:text-[#3395ff]" />
            <span>Autonomous Agent Audit Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#7a95b8] mt-0.5">
            Immutable chronological trace of LLM reasoning chains, tool inputs/outputs, and guardrail decisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 dark:text-[#7a95b8] hidden sm:inline">
            Agent:
          </span>
          <div className="relative">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-[#172a46] text-xs text-slate-900 dark:text-white font-medium rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-[#0c83ff] appearance-none cursor-pointer transition-colors shadow-xs"
            >
              {agents.map((ag) => (
                <option
                  key={ag}
                  value={ag}
                  className="bg-white dark:bg-[#0c182b] text-slate-900 dark:text-white py-1.5"
                >
                  {ag === 'all' ? 'All Agents & Tools' : ag}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#52719c] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <AuditLogTimeline logs={filteredLogs} />
    </div>
  );
};
