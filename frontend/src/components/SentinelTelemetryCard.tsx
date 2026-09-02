import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

interface GatewayNode {
  gateway_name: string;
  channel_type: string;
  success_rate: number;
  latency_ms: number;
  status: string;
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

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sentinel/telemetry');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error('Failed to fetch sentinel telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  return (
    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-[#27272a]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Sentinel Degradation Monitor</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                report?.overall_system_health === 'OPTIMAL'
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              }`}>
                {report?.overall_system_health || 'MONITORING'}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading">
              Autonomous telemetry inspecting bank gateway health spikes & routing anomalies.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchTelemetry}
          disabled={loading}
          className="h-8 px-2.5 rounded-md border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-600 dark:text-zinc-300 text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-rzp"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Gateway Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(report?.active_anomalies || []).map((node, idx) => {
          const isHealthy = node.status === 'HEALTHY';
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs space-y-2 transition-colors ${
                isHealthy
                  ? 'bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a]'
                  : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-zinc-900 dark:text-white truncate">
                  {node.gateway_name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-[#27272a] text-zinc-700 dark:text-zinc-300">
                  {node.channel_type}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-mono text-[11px] tabular-nums">
                <span>SR: <strong className={isHealthy ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>{node.success_rate}%</strong></span>
                <span>Latency: {node.latency_ms}ms</span>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-body line-clamp-2">
                {node.recommendation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
