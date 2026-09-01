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
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'failure':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-7 shadow-xs transition-colors">
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-[#27272a] mb-5">
        <div>
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Multi-Agent Execution Ledger</span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            Deterministic audit trail of diagnostic and strategy agents with payload inspection.
          </p>
        </div>
        <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-zinc-100 dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a]">
          {logs.length} Steps Recorded
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          No audit logs recorded yet. Ingest a payment failure to see the live trace.
        </div>
      ) : (
        <div className="relative pl-5 space-y-3.5 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-zinc-200 dark:before:bg-[#27272a]">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="relative group">
                {/* Status Dot */}
                <div className="absolute -left-5 top-1.5 w-4.5 h-4.5 rounded-full bg-white dark:bg-[#121215] border-2 border-zinc-200 dark:border-[#27272a] flex items-center justify-center -translate-x-1/2">
                  {getStatusIcon(log.status)}
                </div>

                <div
                  onClick={() => toggleExpand(log.id)}
                  className={`p-3.5 rounded-md border transition-all cursor-pointer ${
                    isExpanded
                      ? 'bg-zinc-50 dark:bg-[#18181b] border-blue-500/60 shadow-xs'
                      : 'bg-zinc-50/50 dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-subheading font-bold text-zinc-900 dark:text-white">
                        {log.agent_name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                        {log.action_type}
                      </span>
                      {log.transaction_id && (
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono hidden md:inline">
                          {log.transaction_id}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono font-medium">
                      {log.execution_duration_ms && (
                        <span>{log.execution_duration_ms.toFixed(1)}ms</span>
                      )}
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-zinc-400 transition-transform ${
                          isExpanded ? 'rotate-90 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Output Preview */}
                  {log.output_payload && (
                    <div className="mt-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-body line-clamp-2">
                      {log.output_payload}
                    </div>
                  )}

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-[#27272a] space-y-2.5">
                      {log.input_payload && (
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 mb-1">
                            <Code className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Input Payload</span>
                          </div>
                          <pre className="p-3 rounded bg-zinc-900 dark:bg-[#09090b] text-zinc-200 dark:text-zinc-300 font-mono text-[11px] overflow-x-auto border border-zinc-800 dark:border-[#27272a]">
                            {log.input_payload}
                          </pre>
                        </div>
                      )}

                      {log.metadata_json && (
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 mb-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Execution Metadata</span>
                          </div>
                          <pre className="p-3 rounded bg-zinc-900 dark:bg-[#09090b] text-zinc-200 dark:text-zinc-300 font-mono text-[11px] overflow-x-auto border border-zinc-800 dark:border-[#27272a]">
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
