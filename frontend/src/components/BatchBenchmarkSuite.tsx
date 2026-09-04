import React, { useState } from 'react';
import { Play, PhoneCall, Calendar, Loader2, Sparkles, Layers, RotateCcw } from 'lucide-react';
import { VoiceCallModal } from './VoiceCallModal';

interface TransactionItem {
  id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: string;
  loss_vector?: string;
  escalation_level?: number;
  failure_code: string | null;
  failure_reason: string | null;
  failure_category: string;
  recovery_channel: string | null;
  discount_applied_percent: number;
  recovered_amount: number;
  promise_to_pay_date?: string | null;
  mandate_retry_schedule?: string | null;
  voice_call_transcript?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface BenchmarkReport {
  batch_id: string;
  total_transactions: number;
  total_revenue_at_risk: number;
  total_money_recovered: number;
  net_recovery_rate_percent: number;
  discount_margin_cost: number;
  roi_multiple: number;
  compliance_halts_count: number;
  voice_ai_calls_executed: number;
  mandate_retries_scheduled: number;
  promise_to_pay_commitments: number;
  transactions: TransactionItem[];
  summary: string;
}

interface BatchBenchmarkSuiteProps {
  onSuccess: () => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

export const BatchBenchmarkSuite: React.FC<BatchBenchmarkSuiteProps> = ({ onSuccess, showNotification }) => {
  const [running, setRunning] = useState<boolean>(false);
  const [report, setReport] = useState<BenchmarkReport | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('shark_benchmark_report');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedVoiceSession, setSelectedVoiceSession] = useState<any | null>(null);

  const handleClearReport = () => {
    setReport(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('shark_benchmark_report');
    }
  };

  const handleRunBenchmark = async () => {
    setRunning(true);
    showNotification('⚡ Executing Multi-Vector Autonomous Recovery Benchmark Suite...', 'loading', 0);

    try {
      const res = await fetch('/api/batch-benchmark', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('shark_benchmark_report', JSON.stringify(data));
          } catch (e) {
            console.warn('SessionStorage quota exceeded:', e);
          }
        }
        showNotification(`🎉 Benchmark Completed! Measured ₹${data.total_money_recovered.toLocaleString('en-IN')} recovered (${data.net_recovery_rate_percent}% recovery rate).`, 'success', 5000);
        onSuccess();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification(`Benchmark failed: ${err.detail || 'Could not complete benchmark'}`, 'error');
      }
    } catch (e) {
      console.error('Failed to run benchmark:', e);
      showNotification('Network error while running benchmark suite.', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-7 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Multi-Vector Revenue Recovery Benchmark Suite</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
              Demonstrates closed-loop recovery across all 6 core revenue loss vectors: Checkout dropouts, Gateway 503 spikes, Mandate retries, B2B receivables, Hinglish Voice AI, and Fraud stopping rules.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {report && (
              <button
                type="button"
                onClick={handleClearReport}
                disabled={running}
                className="h-10 px-4 rounded-md border border-zinc-200 dark:border-[#27272a] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#222227] text-zinc-700 dark:text-zinc-300 font-heading font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Benchmark</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRunBenchmark}
              disabled={running}
              className="h-10 px-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all focus-rzp"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Orchestrating Multi-Agent Suite...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{report ? 'Re-run Benchmark' : 'Execute Multi-Vector Benchmark'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 6 Loss Vectors Overview Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {[
            { label: 'UPI Limits & Carts', sub: 'Hinglish WhatsApp + 10%', color: 'border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300' },
            { label: 'Gateway 503 Spikes', sub: 'Empathic 1-click retry', color: 'border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300' },
            { label: 'Subscription Mandates', sub: '3-Slot Cooling-off Sequencer', color: 'border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-300' },
            { label: 'B2B Receivables', sub: 'Installment & Promise-to-Pay', color: 'border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300' },
            { label: 'Hinglish Voice AI', sub: 'High-Value Conversational IVR', color: 'border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
            { label: 'Fraud Stopping Rules', sub: 'RBI DND & Stolen Card Halt', color: 'border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300' },
          ].map((v, idx) => (
            <div key={idx} className={`p-2.5 rounded-md border bg-zinc-50/60 dark:bg-[#18181b]/60 ${v.color} text-xs space-y-0.5`}>
              <div className="font-heading font-bold text-[11px] truncate">{v.label}</div>
              <div className="text-[10px] opacity-80 font-subheading truncate">{v.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Measured Money Recovered Metrics */}
      {report && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] shadow-xs">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading block">Revenue At Risk</span>
              <strong className="font-mono font-bold text-sm sm:text-base text-zinc-900 dark:text-white tabular-nums">
                ₹{report.total_revenue_at_risk.toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-subheading block">Measured Money Recovered</span>
              <strong className="font-mono font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                ₹{report.total_money_recovered.toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 shadow-xs">
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-subheading block">Net Recovery Rate</span>
              <strong className="font-mono font-bold text-sm sm:text-base text-blue-600 dark:text-blue-400 tabular-nums">
                {report.net_recovery_rate_percent}%
              </strong>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] shadow-xs">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading block">Recovery ROI Multiple</span>
              <strong className="font-mono font-bold text-sm sm:text-base text-purple-600 dark:text-purple-400 tabular-nums">
                {report.roi_multiple}x
              </strong>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] shadow-xs">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading block">Voice AI Calls</span>
              <strong className="font-mono font-bold text-sm sm:text-base text-zinc-900 dark:text-white tabular-nums">
                {report.voice_ai_calls_executed}
              </strong>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] shadow-xs">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading block">Compliance Halts</span>
              <strong className="font-mono font-bold text-sm sm:text-base text-rose-600 dark:text-rose-400 tabular-nums">
                {report.compliance_halts_count} stopped
              </strong>
            </div>
          </div>

          {/* Benchmark Transaction Telemetry Table */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between">
              <span className="font-heading font-bold text-xs sm:text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Multi-Vector Batch Benchmark Telemetry</span>
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                  Batch: {report.batch_id} • {report.total_transactions} Scenarios
                </span>
                <button
                  type="button"
                  onClick={handleClearReport}
                  className="px-2 py-1 rounded text-[11px] font-subheading font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] cursor-pointer transition-colors"
                >
                  Clear Results
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-[#27272a]">
                  <tr>
                    <th scope="col" className="p-3">Order & Loss Vector</th>
                    <th scope="col" className="p-3">At Risk</th>
                    <th scope="col" className="p-3">Failure Diagnostics</th>
                    <th scope="col" className="p-3">Intervention Strategy</th>
                    <th scope="col" className="p-3">Settlement / Status</th>
                    <th scope="col" className="p-3 text-right">Voice AI Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-[#27272a]">
                  {report.transactions.map((t, idx) => {
                    const isRecovered = t.status === 'recovered';
                    const isHalted = t.status === 'abandoned';
                    let voiceData: any = null;
                    if (t.voice_call_transcript) {
                      try { voiceData = JSON.parse(t.voice_call_transcript); } catch (e) {}
                    }

                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#18181b]/50 transition-colors">
                        <td className="p-3">
                          <span className="font-heading font-semibold text-zinc-900 dark:text-white block">
                            {t.razorpay_order_id}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                            {t.loss_vector?.replace('_', ' ') || 'Checkout Dropoff'}
                          </span>
                        </td>

                        <td className="p-3 font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                          ₹{t.amount.toLocaleString('en-IN')}
                        </td>

                        <td className="p-3 max-w-xs truncate text-zinc-600 dark:text-zinc-400 font-body">
                          {t.failure_reason}
                        </td>

                        <td className="p-3">
                          <span className="font-mono text-[11px] capitalize px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#27272a] text-zinc-800 dark:text-zinc-200">
                            {t.recovery_channel || 'Multi-Channel'}
                          </span>
                          {t.discount_applied_percent > 0 && (
                            <span className="ml-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              -{t.discount_applied_percent}%
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          {isRecovered ? (
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ₹{t.recovered_amount.toLocaleString('en-IN')}
                            </span>
                          ) : isHalted ? (
                            <span className="font-mono text-rose-600 dark:text-rose-400 text-[11px]">
                              Halted (Stopping Rule)
                            </span>
                          ) : (
                            <span className="font-mono text-amber-600 dark:text-amber-400 text-[11px]">
                              Dispatched / In Flight
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          {voiceData ? (
                            <button
                              type="button"
                              onClick={() => setSelectedVoiceSession(voiceData)}
                              className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-rzp"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>View Voice Call Script</span>
                            </button>
                          ) : t.promise_to_pay_date ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                              <Calendar className="w-3 h-3" />
                              <span>Promise: {t.promise_to_pay_date}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-400 font-mono">
                              Automated Link Dispatched
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Voice Call Script Modal */}
      <VoiceCallModal
        isOpen={Boolean(selectedVoiceSession)}
        onClose={() => setSelectedVoiceSession(null)}
        sessionData={selectedVoiceSession}
      />
    </div>
  );
};
