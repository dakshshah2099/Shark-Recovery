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
    <div className="space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215] border border-zinc-800 rounded-lg p-4">
        <div>
          <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span>Autonomous Agent Audit Ledger</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Immutable chronological trace of LLM reasoning chains, tool inputs/outputs, and guardrail decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
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
