import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RotateCw,
  Loader2,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

interface RecoverySchedulerCardProps {
  onTickCompleted?: () => void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info' | 'loading') => void;
  className?: string;
}

export interface SchedulerMetrics {
  delayed_dispatches: number;
  retries_triggered: number;
  ptp_breaches_handled: number;
  blocked: number;
}

export interface SchedulerStatus {
  is_running: boolean;
  is_paused: boolean;
  last_tick_at?: string | null;
  metrics?: SchedulerMetrics;
}

export const RecoverySchedulerCard: React.FC<RecoverySchedulerCardProps> = ({
  onTickCompleted,
  showNotification,
  className = '',
}) => {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [toggling, setToggling] = useState<boolean>(false);
  const [ticking, setTicking] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduler/status');
      if (res.ok) {
        const data: SchedulerStatus = await res.json();
        setStatus(data);
      }
    } catch {
      // Background poll failure ignored
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await fetch('/api/scheduler/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: !status?.is_paused }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStatus(updated);
        showNotification?.(
          updated.is_paused
            ? 'Recovery Scheduler paused. Autonomous retry loop suspended.'
            : 'Recovery Scheduler resumed. Autonomous background recovery active.',
          'success'
        );
      }
    } catch (e: any) {
      showNotification?.(`Failed to toggle scheduler: ${e.message}`, 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleTriggerTick = async () => {
    setTicking(true);
    try {
      const res = await fetch('/api/scheduler/tick', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.scheduler);
        showNotification?.(
          `Scheduler tick executed: ${data.metrics.retries_triggered} retries, ${data.metrics.delayed_dispatches} delayed pushes, ${data.metrics.ptp_breaches_handled} PTP breaches handled.`,
          'success'
        );
        onTickCompleted?.();
      }
    } catch (e: any) {
      showNotification?.(`Scheduler tick pass failed: ${e.message}`, 'error');
    } finally {
      setTicking(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs transition-colors space-y-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-[#27272a] pb-4">
        <div className="space-y-1">
          <h3 className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Autonomous Recovery Scheduler Worker</span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-body">
            Autonomous background worker polling for delayed liquidity window dispatches, eligible cooling-off retries, and breached promise-to-pay commitments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono border ${
              status?.is_paused
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status?.is_paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span>{status?.is_paused ? 'Worker Paused' : 'Active (30s loop)'}</span>
          </span>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            className={`h-8 px-3 rounded-md text-xs font-subheading font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs focus-rzp ${
              status?.is_paused
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a]'
            }`}
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : status?.is_paused ? (
              <span>Resume Worker</span>
            ) : (
              <span>Pause Worker</span>
            )}
          </button>

          {/* Manual Tick Pass Button */}
          <button
            type="button"
            onClick={handleTriggerTick}
            disabled={ticking}
            className="h-8 px-3 rounded-md bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-subheading font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-rzp"
            title="Force execute one evaluation pass right now across all pending windows & commitments"
          >
            <RotateCw className={`w-3 h-3 ${ticking ? 'animate-spin text-purple-500' : ''}`} />
            <span>Force Tick</span>
          </button>
        </div>
      </div>

      {/* Worker Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
        <div className="bg-zinc-50 dark:bg-[#18181b] p-3 rounded-md border border-zinc-100 dark:border-[#27272a]">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-500" />
            <span>Delayed Pushes</span>
          </div>
          <div className="font-heading font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white mt-0.5 tabular-nums">
            {status?.metrics?.delayed_dispatches ?? 0}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-[#18181b] p-3 rounded-md border border-zinc-100 dark:border-[#27272a]">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading flex items-center gap-1">
            <RotateCw className="w-3 h-3 text-blue-500" />
            <span>Auto-Retries</span>
          </div>
          <div className="font-heading font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white mt-0.5 tabular-nums">
            {status?.metrics?.retries_triggered ?? 0}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-[#18181b] p-3 rounded-md border border-zinc-100 dark:border-[#27272a]">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>PTP Breaches</span>
          </div>
          <div className="font-heading font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white mt-0.5 tabular-nums">
            {status?.metrics?.ptp_breaches_handled ?? 0}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-[#18181b] p-3 rounded-md border border-zinc-100 dark:border-[#27272a]">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Compliance Blocked</span>
          </div>
          <div className="font-heading font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white mt-0.5 tabular-nums">
            {status?.metrics?.blocked ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
};
