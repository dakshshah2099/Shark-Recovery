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
    if (agent.includes('Diagnostic')) return <BrainCircuit className="w-4 h-4 text-purple-400" />;
    if (agent.includes('Strategy')) return <Bot className="w-4 h-4 text-cyan-400" />;
    if (agent.includes('Razorpay') || action.includes('PAYMENT_LINK'))
      return <CreditCard className="w-4 h-4 text-blue-400" />;
    if (agent.includes('WhatsApp') || action.includes('WHATSAPP'))
      return <MessageSquare className="w-4 h-4 text-emerald-400" />;
    if (agent.includes('SMTP') || action.includes('EMAIL'))
      return <Mail className="w-4 h-4 text-amber-400" />;
    if (action.includes('GATING') || action.includes('BLOCKED'))
      return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[560px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Autonomous Agent Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-400">
            Immutable trace of agent reasoning, tool payloads, and guardrails.
          </p>
        </div>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
          {logs.length} events
        </span>
      </div>

      {/* Timeline Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            No agent actions logged yet.
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-all text-xs"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                      {getAgentIcon(log.agent_name, log.action_type)}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{formatActionName(log.action_type)}</span>
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : log.status === 'skipped' ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded">
                            BLOCKED
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1 rounded">
                            FAIL
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{log.agent_name}</span>
                        {log.execution_duration_ms && (
                          <span className="text-slate-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {log.execution_duration_ms}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-[10px] font-mono">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Collapsible Payload Viewer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    {log.output_payload && (
                      <div>
                        <div className="text-[10px] font-mono text-cyan-400 uppercase mb-0.5">
                          Output / Reasoning:
                        </div>
                        <pre className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-36">
                          {log.output_payload}
                        </pre>
                      </div>
                    )}

                    {log.input_payload && (
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                          Input Payload:
                        </div>
                        <pre className="bg-slate-900 p-2 rounded text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-24">
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
