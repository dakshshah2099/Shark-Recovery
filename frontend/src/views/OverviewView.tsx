import React from 'react';
import { MetricCards } from '../components/MetricCards';
import {
  Play,
  Database,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Bot,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import type { DashboardMetrics, TransactionItem } from '../types';

interface OverviewViewProps {
  metrics: DashboardMetrics | null;
  transactions: TransactionItem[];
  onNavigateTab: (tab: string) => void;
  onSimulateBatch: () => void;
  onSeedDB: () => void;
  onClearDB: () => void;
  simulating: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  transactions,
  onNavigateTab,
  onSimulateBatch,
  onSeedDB,
  onClearDB,
  simulating,
}) => {
  const activeTxns = transactions.filter((t) => t.status === 'processing');
  const recoveredTxns = transactions.filter((t) => t.status === 'recovered');

  return (
    <div className="space-y-6">
      {/* 1. Hero Executive Strip */}
      <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs transition-colors">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0c83ff]/10 border border-[#0c83ff]/25 text-xs font-semibold text-[#0c83ff] dark:text-[#3395ff]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0c83ff] animate-pulse" />
            <span>Autonomous Recovery Intelligence</span>
          </div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight leading-tight">
            Revenue Recovery for Indian Payment Dropouts
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#7a95b8] leading-relaxed">
            Intercept Razorpay checkout dropouts, diagnose root causes (UPI limits, 3DS bank outages, card decline), and dispatch dynamic discount recovery links via Twilio WhatsApp & SMTP email.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={onSimulateBatch}
            disabled={simulating}
            className="h-9 px-4 rounded-lg bg-[#0c83ff] hover:bg-[#006fdf] text-white font-heading font-semibold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{simulating ? 'Processing Batch...' : 'Simulate 5 Failures'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onSeedDB}
              className="h-9 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#132238] dark:hover:bg-[#1c3252] text-slate-700 dark:text-[#cad8ec] border border-slate-200 dark:border-[#172a46] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Populate realistic transactions"
            >
              <Database className="w-3.5 h-3.5 text-[#0c83ff]" />
              <span>Seed</span>
            </button>

            <button
              onClick={onClearDB}
              className="h-9 px-3.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-[#132238] dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-[#8ea5c8] dark:hover:text-rose-400 border border-slate-200 hover:border-rose-200 dark:border-[#172a46] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Clear all database records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <MetricCards metrics={metrics} />

      {/* 3. Operational Overview & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Active Recovery Pipeline */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 sm:p-6 flex flex-col justify-between shadow-xs transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#172a46] mb-4">
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0c83ff] dark:text-[#3395ff]" />
                  <span>In-Flight Intervention Pipeline</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#7a95b8] mt-0.5">
                  Transactions actively undergoing automated diagnostic and discount outreach.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-semibold text-[#0c83ff] dark:text-[#3395ff] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {activeTxns.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 dark:text-[#52719c] rounded-md border border-dashed border-slate-200 dark:border-[#172a46]">
                <Activity className="w-6 h-6 mx-auto text-slate-300 dark:text-[#2a456c] mb-1.5" />
                <p className="font-semibold text-slate-700 dark:text-zinc-300">No active recovery tasks in flight.</p>
                <p className="text-slate-500 dark:text-[#52719c] mt-0.5">Use "Simulate 5 Failures" or Ingestion tab to start.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#172a46]/60">
                {activeTxns.slice(0, 5).map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.customer_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#7a95b8] font-mono">
                        {t.failure_category.replace(/_/g, ' ').toUpperCase()} • {t.razorpay_order_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading font-bold text-slate-900 dark:text-white text-sm">
                        ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-[#0c83ff] dark:text-[#3395ff] font-mono font-medium">
                        {t.recovery_channel === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'} ({t.discount_applied_percent}% OFF)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-slate-100 dark:border-[#172a46] flex items-center justify-between text-xs text-slate-500 dark:text-[#7a95b8]">
            <span>Deterministic Guardrail: Bounded to 2 Retries</span>
            <button
              onClick={() => onNavigateTab('ingest')}
              className="text-[#0c83ff] dark:text-[#3395ff] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate / CSV &rarr;</span>
            </button>
          </div>
        </div>

        {/* Right Column: Architecture & Disposition */}
        <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 sm:p-6 flex flex-col justify-between shadow-xs transition-colors">
          <div className="space-y-3.5">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#172a46]">
              <Bot className="w-4 h-4 text-[#0c83ff] dark:text-[#3395ff]" />
              <span>Autonomous Workflow</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 dark:bg-[#080d1a] p-3 rounded-md border border-slate-200/60 dark:border-[#172a46]">
                <div className="text-slate-500 dark:text-[#7a95b8] font-medium text-[11px]">1. Diagnostic Agent</div>
                <div className="text-slate-900 dark:text-white font-mono text-[11px] mt-0.5 font-semibold">
                  Root-Cause Failure Categorization
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#080d1a] p-3 rounded-md border border-slate-200/60 dark:border-[#172a46]">
                <div className="text-slate-500 dark:text-[#7a95b8] font-medium text-[11px]">2. Strategy Agent</div>
                <div className="text-slate-900 dark:text-white font-mono text-[11px] mt-0.5 font-semibold">
                  Dynamic Discounting & Copy
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#080d1a] p-3 rounded-md border border-slate-200/60 dark:border-[#172a46]">
                <div className="text-slate-500 dark:text-[#7a95b8] font-medium text-[11px]">3. Execution Layer</div>
                <div className="text-slate-900 dark:text-white font-mono text-[11px] mt-0.5 font-semibold">
                  Razorpay Links + WhatsApp / SMTP
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 dark:border-[#172a46] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-[#7a95b8]">Total Captured:</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {recoveredTxns.length} Transactions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
