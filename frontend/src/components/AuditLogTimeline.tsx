import React, { useState } from 'react';
import {
  Activity,
  Bot,
  BrainCircuit,
  CreditCard,
  MessageSquare,
  Mail,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditLogTimelineProps {
  logs: AuditLogItem[];
}

export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ logs }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getAgentIcon = (agent: string, action: string) => {
    if (agent.includes('Diagnostic')) return <BrainCircuit className="w-3.5 h-3.5 text-blue-400" />;
    if (agent.includes('Strategy')) return <Bot className="w-3.5 h-3.5 text-cyan-400" />;
    if (agent.includes('Razorpay') || action.includes('PAYMENT_LINK'))
      return <CreditCard className="w-3.5 h-3.5 text-white" />;
    if (agent.includes('WhatsApp') || action.includes('WHATSAPP'))
      return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
    if (agent.includes('SMTP') || action.includes('EMAIL'))
      return <Mail className="w-3.5 h-3.5 text-zinc-300" />;
    if (action.includes('GATING') || action.includes('BLOCKED'))
      return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
    return <Activity className="w-3.5 h-3.5 text-zinc-400" />;
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5 flex flex-col h-[520px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span>Autonomous Agent Audit Trail</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Chronological audit ledger of diagnostic reasoning, tool execution, and guardrails.
          </p>
        </div>
        <span className="text-xs bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 font-mono">
          {logs.length} events
        </span>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500">
            No agent actions logged yet.
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded p-3 text-xs"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-zinc-800 rounded border border-zinc-700">
                      {getAgentIcon(log.agent_name, log.action_type)}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{formatActionName(log.action_type)}</span>
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : log.status === 'skipped' ? (
                          <span className="text-[9px] bg-amber-950 text-amber-300 px-1 rounded border border-amber-800 font-mono">
                            GATED
                          </span>
                        ) : (
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 rounded border border-rose-800 font-mono">
                            FAIL
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                        <span>{log.agent_name}</span>
                        {log.execution_duration_ms && (
                          <span className="text-zinc-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {log.execution_duration_ms}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-[10px] font-mono">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Collapsible Payload Inspection */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-zinc-800 space-y-2">
                    {log.output_payload && (
                      <div>
                        <div className="text-[10px] font-mono text-blue-400 uppercase mb-0.5">
                          Output / Reasoning:
                        </div>
                        <pre className="bg-black p-2 rounded text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-36 border border-zinc-800">
                          {log.output_payload}
                        </pre>
                      </div>
                    )}

                    {log.input_payload && (
                      <div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase mb-0.5">
                          Input Payload:
                        </div>
                        <pre className="bg-black p-2 rounded text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-24 border border-zinc-800">
                          {log.input_payload}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
