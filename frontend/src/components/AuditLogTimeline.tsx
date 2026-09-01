import React, { useState, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Code,
  ShieldCheck,
  Search,
  Copy,
  Check,
  Layers,
  Cpu,
  X,
} from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditLogTimelineProps {
  logs: AuditLogItem[];
}

export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ logs }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure' | 'skipped'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Toggle individual step
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all steps
  const toggleExpandAll = () => {
    if (expandedIds.size === filteredLogs.length && filteredLogs.length > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredLogs.map((l) => l.id)));
    }
  };

  // Copy helper with visual feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Safe JSON formatting
  const formatJson = (content: string | null | undefined): string => {
    if (!content) return '';
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  };

  // Filter logs by search query and status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (log.status.toLowerCase() !== statusFilter) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAgent = log.agent_name.toLowerCase().includes(q);
        const matchAction = log.action_type.toLowerCase().includes(q);
        const matchTxn = (log.transaction_id || '').toLowerCase().includes(q);
        const matchInput = (log.input_payload || '').toLowerCase().includes(q);
        const matchOutput = (log.output_payload || '').toLowerCase().includes(q);
        if (!matchAgent && !matchAction && !matchTxn && !matchInput && !matchOutput) {
          return false;
        }
      }

      return true;
    });
  }, [logs, statusFilter, searchQuery]);

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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </span>
        );
      case 'failure':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>WARNING</span>
          </span>
        );
    }
  };

  const allExpanded = filteredLogs.length > 0 && expandedIds.size === filteredLogs.length;

  return (
    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-7 shadow-xs">
      {/* Header & Controls */}
      <div className="space-y-4 pb-4 border-b border-zinc-200 dark:border-[#27272a] mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Multi-Agent Execution Ledger</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
              Deterministic audit trail of diagnostic reasoning, strategy agents, and tool dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={toggleExpandAll}
              disabled={filteredLogs.length === 0}
              className="h-8 px-3 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a] text-xs font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>

            <div className="text-xs font-mono font-semibold px-2.5 py-1.5 rounded bg-zinc-100 dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a]">
              {filteredLogs.length} / {logs.length} Steps
            </div>
          </div>
        </div>

        {/* Inline Search & Status Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Txn ID, Agent, Action, or Payload..."
              className="w-full h-9 pl-9 pr-8 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md font-mono focus:outline-none focus:border-blue-500 placeholder:text-zinc-400 placeholder:font-body"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: 'All Steps' },
                { id: 'success', label: 'Success' },
                { id: 'failure', label: 'Failed' },
                { id: 'skipped', label: 'Warning / Fallback' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-2.5 py-1 rounded text-xs font-subheading font-medium whitespace-nowrap cursor-pointer ${
                  statusFilter === filter.id
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-zinc-100 dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-[#27272a]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Zero State / Empty Stream */}
      {logs.length === 0 ? (
        <div className="text-center py-16 text-xs text-zinc-500 dark:text-zinc-400 font-medium space-y-1">
          <Layers className="w-8 h-8 text-zinc-400 mx-auto stroke-1" />
          <div className="font-heading font-semibold text-zinc-800 dark:text-zinc-200 pt-2">No audit logs recorded yet</div>
          <p className="font-subheading text-[11px]">Inject a payment failure from Ingestion Hub to stream live multi-agent execution telemetry.</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-500 dark:text-zinc-400 font-medium space-y-2">
          <div>No logs match your filter criteria: <span className="font-mono text-zinc-800 dark:text-zinc-200">"{searchQuery || statusFilter}"</span></div>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-3 py-1 text-xs font-subheading font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Timeline Tree */
        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-zinc-200 dark:before:bg-[#27272a]">
          {filteredLogs.map((log) => {
            const isExpanded = expandedIds.has(log.id);
            const formattedInput = formatJson(log.input_payload);
            const formattedOutput = formatJson(log.output_payload);
            const formattedMetadata = formatJson(log.metadata_json);

            return (
              <div key={log.id} className="relative group">
                {/* Status Dot Node */}
                <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-white dark:bg-[#121215] border-2 border-zinc-200 dark:border-[#27272a] flex items-center justify-center -translate-x-1/2">
                  {getStatusIcon(log.status)}
                </div>

                <div
                  className={`rounded-md border ${
                    isExpanded
                      ? 'bg-zinc-50 dark:bg-[#18181b] border-blue-500/60 shadow-xs'
                      : 'bg-zinc-50/50 dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {/* Step Card Header Trigger */}
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="p-3.5 cursor-pointer select-none space-y-1.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-subheading font-bold text-zinc-900 dark:text-white">
                          {log.agent_name}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                          {log.action_type}
                        </span>

                        {getStatusBadge(log.status)}

                        {log.transaction_id && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(log.transaction_id || '', `txn-${log.id}`);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-200/60 dark:bg-[#27272a] px-1.5 py-0.5 rounded hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                            title="Click to copy Transaction ID"
                          >
                            <span>{log.transaction_id}</span>
                            {copiedKey === `txn-${log.id}` ? (
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 opacity-60" />
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono font-medium self-end sm:self-auto">
                        {log.execution_duration_ms != null && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-zinc-200/50 dark:bg-[#27272a]/60 text-zinc-700 dark:text-zinc-300">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{log.execution_duration_ms.toFixed(1)}ms</span>
                          </span>
                        )}
                        <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    </div>

                    {/* Compact One-Line Preview when collapsed */}
                    {!isExpanded && log.output_payload && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-300 font-body line-clamp-1 truncate">
                        {log.output_payload}
                      </div>
                    )}
                  </div>

                  {/* Expanded Inspector Terminal */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-zinc-200 dark:border-[#27272a] space-y-3">
                      {/* Telemetry Header Pill Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-[#09090b] p-2 rounded border border-zinc-200/80 dark:border-[#27272a]">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-semibold">
                            <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Agent: {log.agent_name}</span>
                          </span>
                          <span>•</span>
                          <span>Timestamp: {new Date(log.created_at).toISOString()}</span>
                        </div>
                        {log.customer_id && (
                          <span className="text-[10px]">Customer: {log.customer_id}</span>
                        )}
                      </div>

                      {/* Input Payload Block */}
                      {formattedInput && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                            <span className="flex items-center gap-1.5">
                              <Code className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Input Telemetry Payload</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(formattedInput, `in-${log.id}`)}
                              className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                            >
                              {copiedKey === `in-${log.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy JSON</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 rounded bg-zinc-900 dark:bg-[#09090b] text-zinc-200 dark:text-zinc-300 font-mono text-[11px] overflow-x-auto border border-zinc-800 dark:border-[#27272a] leading-relaxed">
                            {formattedInput}
                          </pre>
                        </div>
                      )}

                      {/* Output Decision Payload Block */}
                      {formattedOutput && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Deterministic Decision Output</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(formattedOutput, `out-${log.id}`)}
                              className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                            >
                              {copiedKey === `out-${log.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy JSON</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 rounded bg-zinc-900 dark:bg-[#09090b] text-emerald-400 font-mono text-[11px] overflow-x-auto border border-zinc-800 dark:border-[#27272a] leading-relaxed">
                            {formattedOutput}
                          </pre>
                        </div>
                      )}

                      {/* Execution Metadata Block */}
                      {formattedMetadata && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                              <span>Execution Metadata & LLM Benchmarks</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(formattedMetadata, `meta-${log.id}`)}
                              className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                            >
                              {copiedKey === `meta-${log.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy JSON</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 rounded bg-zinc-900 dark:bg-[#09090b] text-zinc-300 font-mono text-[11px] overflow-x-auto border border-zinc-800 dark:border-[#27272a] leading-relaxed">
                            {formattedMetadata}
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
