import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon, Zap } from 'lucide-react';

interface GatewayNode {
  gateway_name: string;
  channel_type: string;
  success_rate: number;
  latency_ms: number;
  status: string;
  total_failures_logged?: number;
  recommendation: string;
}

interface DegradationReport {
  timestamp: string;
  overall_system_health: string;
  active_anomalies: GatewayNode[];
  routing_adjustment_recommended: boolean;
  summary: string;
}

export const SentinelTelemetryCard: React.FC = () => {
  const [report, setReport] = useState<DegradationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const fetchTelemetry = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/sentinel/telemetry');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('Failed to fetch sentinel telemetry:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    // Real-time live polling every 10 seconds
    const interval = setInterval(() => {
      fetchTelemetry(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  return (
    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-200 dark:border-[#27272a]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 shrink-0">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white flex flex-wrap items-center gap-2">
              <span>Sentinel Degradation Monitor</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                report?.overall_system_health === 'OPTIMAL'
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : report?.overall_system_health === 'CRITICAL'
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 animate-pulse'
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              }`}>
                {report?.overall_system_health || 'MONITORING'}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#18181b] text-zinc-500 dark:text-zinc-400 text-[10px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live DB Feed</span>
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
              Autonomous telemetry analyzing live banking gateway success rates, CBS latency & routing anomalies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
          {lastSyncTime && <span className="hidden sm:inline">Synced {lastSyncTime}</span>}
          <button
            type="button"
            onClick={() => fetchTelemetry()}
            disabled={loading}
            aria-label="Refresh gateway telemetry"
            className="h-8 px-2.5 rounded-md border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-600 dark:text-zinc-300 text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-rzp"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Gateway Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(report?.active_anomalies || []).map((node, idx) => {
          const isHealthy = node.status === 'HEALTHY';
          const isCritical = node.status === 'CRITICAL_OUTAGE';
          const failures = node.total_failures_logged ?? 0;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border text-xs space-y-2.5 transition-colors ${
                isCritical
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50'
                  : !isHealthy
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                  : 'bg-zinc-50/80 dark:bg-[#18181b]/80 border-zinc-200 dark:border-[#27272a]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  {isCritical ? (
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  ) : !isHealthy ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="font-heading font-bold text-zinc-900 dark:text-white truncate">
                    {node.gateway_name}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-[#27272a] text-zinc-700 dark:text-zinc-300 shrink-0">
                  {node.channel_type}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-mono text-[11px] tabular-nums">
                <span>
                  SR:{' '}
                  <strong
                    className={
                      isCritical
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : !isHealthy
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-emerald-600 dark:text-emerald-400 font-bold'
                    }
                  >
                    {node.success_rate}%
                  </strong>
                </span>
                <span>Latency: {node.latency_ms}ms</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {failures > 0 ? `${failures} DB Failures` : '0 Failures'}
                </span>
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-body leading-relaxed line-clamp-2">
                {node.recommendation}
              </p>
            </div>
          );
        })}
      </div>

      {report?.summary && (
        <div className="pt-2 border-t border-zinc-100 dark:border-[#27272a] flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
          <span className="truncate flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-blue-500" />
            <span>{report.summary}</span>
          </span>
          {report.routing_adjustment_recommended && (
            <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0 ml-2">
              Routing Bypass Active
            </span>
          )}
        </div>
      )}
    </div>
  );
};
