import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Code,
  ShieldCheck,
} from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditLogTimelineProps {
  logs: AuditLogItem[];
}

export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ logs }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'failure':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-9 shadow-xs transition-colors">
      <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-white/[0.06] mb-6">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>Multi-Agent Execution Ledger</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Deterministic audit trail of diagnostic and strategy agents with payload inspection.
          </p>
        </div>
        <div className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/40 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.06]">
          {logs.length} Recorded Steps
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-20 text-xs text-slate-400 dark:text-zinc-500 font-medium">
          No audit logs recorded yet. Ingest a payment failure to see the live trace.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="relative group">
                {/* Status Dot */}
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white dark:bg-[#111217] border-2 border-slate-200 dark:border-zinc-800 flex items-center justify-center -translate-x-1/2">
                  {getStatusIcon(log.status)}
                </div>

                <div
                  onClick={() => toggleExpand(log.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isExpanded
                      ? 'bg-slate-50 dark:bg-black/40 border-blue-500/50 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-black/20 border-slate-200/80 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-heading font-bold text-slate-900 dark:text-white">
                        {log.agent_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                        {log.action_type}
                      </span>
                      {log.transaction_id && (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono hidden md:inline">
                          {log.transaction_id}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                      {log.execution_duration_ms && (
                        <span>{log.execution_duration_ms.toFixed(1)}ms</span>
                      )}
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-90 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Output Preview */}
                  {log.output_payload && (
                    <div className="mt-2 text-xs text-slate-600 dark:text-zinc-300 font-sans line-clamp-2">
                      {log.output_payload}
                    </div>
                  )}

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/[0.06] space-y-3">
                      {log.input_payload && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1.5">
                            <Code className="w-3.5 h-3.5" />
                            <span>Input Payload</span>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-slate-900 dark:bg-black text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800">
                            {log.input_payload}
                          </pre>
                        </div>
                      )}

                      {log.metadata_json && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Execution Metadata</span>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-slate-900 dark:bg-black text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800">
                            {log.metadata_json}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
