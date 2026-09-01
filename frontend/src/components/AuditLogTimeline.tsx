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
    <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 sm:p-7 shadow-xs transition-colors">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-[#172a46] mb-5">
        <div>
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-sky-400" />
            <span>Multi-Agent Execution Ledger</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Deterministic audit trail of diagnostic and strategy agents with payload inspection.
          </p>
        </div>
        <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#080d1a] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#172a46]">
          {logs.length} Steps Recorded
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500 dark:text-slate-400 font-medium">
          No audit logs recorded yet. Ingest a payment failure to see the live trace.
        </div>
      ) : (
        <div className="relative pl-5 space-y-3.5 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200 dark:before:bg-[#172a46]">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="relative group">
                {/* Status Dot */}
                <div className="absolute -left-5 top-1.5 w-4.5 h-4.5 rounded-full bg-white dark:bg-[#0c182b] border-2 border-slate-200 dark:border-[#172a46] flex items-center justify-center -translate-x-1/2">
                  {getStatusIcon(log.status)}
                </div>

                <div
                  onClick={() => toggleExpand(log.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isExpanded
                      ? 'bg-slate-50 dark:bg-[#080d1a] border-[#0c83ff]/60 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-[#09111e]/60 border-slate-200/80 dark:border-[#172a46] hover:border-slate-300 dark:hover:border-[#223e66]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-slate-900 dark:text-white">
                        {log.agent_name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-700/60">
                        {log.action_type}
                      </span>
                      {log.transaction_id && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden md:inline">
                          {log.transaction_id}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                      {log.execution_duration_ms && (
                        <span>{log.execution_duration_ms.toFixed(1)}ms</span>
                      )}
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-500 transition-transform ${
                          isExpanded ? 'rotate-90 text-blue-600 dark:text-sky-400' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Output Preview */}
                  {log.output_payload && (
                    <div className="mt-1.5 text-xs text-slate-700 dark:text-slate-200 font-sans line-clamp-2">
                      {log.output_payload}
                    </div>
                  )}

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#172a46] space-y-2.5">
                      {log.input_payload && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <Code className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                            <span>Input Payload</span>
                          </div>
                          <pre className="p-3 rounded-md bg-slate-900 dark:bg-[#050811] text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 dark:border-[#172a46]">
                            {log.input_payload}
                          </pre>
                        </div>
                      )}

                      {log.metadata_json && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Execution Metadata</span>
                          </div>
                          <pre className="p-3 rounded-md bg-slate-900 dark:bg-[#050811] text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 dark:border-[#172a46]">
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
