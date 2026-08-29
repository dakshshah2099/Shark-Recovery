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
  Terminal,
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
    if (agent.includes('Diagnostic')) return <BrainCircuit className="w-4 h-4 text-blue-400" />;
    if (agent.includes('Strategy')) return <Bot className="w-4 h-4 text-cyan-400" />;
    if (agent.includes('Razorpay') || action.includes('PAYMENT_LINK'))
      return <CreditCard className="w-4 h-4 text-white" />;
    if (agent.includes('WhatsApp') || action.includes('WHATSAPP'))
      return <MessageSquare className="w-4 h-4 text-emerald-400" />;
    if (agent.includes('SMTP') || action.includes('EMAIL'))
      return <Mail className="w-4 h-4 text-zinc-300" />;
    if (action.includes('GATING') || action.includes('BLOCKED'))
      return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    return <Activity className="w-4 h-4 text-zinc-400" />;
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            <span>Autonomous Execution Stream</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Real-time audit log of multi-agent triage, tool invocation, and stopping guardrails.
          </p>
        </div>
        <span className="text-xs bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full border border-white/[0.08] font-mono font-semibold">
          {logs.length} Total Events
        </span>
      </div>

      {/* Timeline List */}
      <div className="overflow-y-auto pr-1 space-y-2.5 max-h-[640px]">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-xs text-zinc-500 rounded-lg border border-dashed border-zinc-800">
            <Activity className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
            <p className="font-medium text-zinc-400">No agent actions recorded yet.</p>
            <p className="text-zinc-600 mt-1">Ingest a payment failure batch to watch the reasoning trace.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className="bg-[#0f1015] border border-white/[0.06] rounded-xl p-4 text-xs transition-colors hover:border-white/[0.12]"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 rounded-lg border border-white/[0.08]">
                      {getAgentIcon(log.agent_name, log.action_type)}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <span>{formatActionName(log.action_type)}</span>
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded font-mono font-bold border border-emerald-800/80">
                            <CheckCircle2 className="w-3 h-3" /> SUCCESS
                          </span>
                        ) : log.status === 'skipped' ? (
                          <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.2 rounded border border-amber-800 font-mono font-bold">
                            GATED
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.2 rounded border border-rose-800 font-mono font-bold">
                            FAIL
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-3 mt-1">
                        <span>{log.agent_name}</span>
                        {log.execution_duration_ms && (
                          <span className="text-zinc-500 flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-white/[0.04]">
                            <Clock className="w-3 h-3 text-blue-400" />
                            {log.execution_duration_ms}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-zinc-500">
                    <span className="text-[11px] font-mono">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Collapsible Structured Payload View */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-3">
                    {log.output_payload && (
                      <div>
                        <div className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider mb-1">
                          Output / Reasoning Payload:
                        </div>
                        <pre className="bg-black/80 p-3 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-48 border border-white/[0.06]">
                          {log.output_payload}
                        </pre>
                      </div>
                    )}

                    {log.input_payload && (
                      <div>
                        <div className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-1">
                          Input Context:
                        </div>
                        <pre className="bg-black/80 p-3 rounded-lg text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-32 border border-white/[0.06]">
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
