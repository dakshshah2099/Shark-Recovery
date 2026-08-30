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
    <div className="space-y-8">
      {/* 1. Hero Executive Strip */}
      <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs transition-colors">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Autonomous Revenue Intelligence</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight leading-tight">
            Revenue Recovery for Indian Payment Dropouts
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            Intercept Razorpay payment dropouts, diagnose root causes (UPI limits, netbanking 3DS timeouts, SBI 503 outages), and dispatch personalized dynamic discount links via live WhatsApp & SMTP email.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={onSimulateBatch}
            disabled={simulating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{simulating ? 'Orchestrating Batch...' : 'Simulate 5 Failed Payments'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onSeedDB}
              className="flex-1 sm:flex-initial bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08] text-xs font-semibold px-4 py-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Populate realistic transactions"
            >
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>Seed Data</span>
            </button>

            <button
              onClick={onClearDB}
              className="flex-1 sm:flex-initial bg-slate-100 hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-300 border border-slate-200 hover:border-rose-200 dark:border-white/[0.08] dark:hover:border-rose-900 text-xs font-semibold px-4 py-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Recovery Pipeline */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-8 flex flex-col justify-between shadow-xs transition-colors">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-white/[0.06] mb-5">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                  <span>In-Flight Intervention Pipeline</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Transactions undergoing automated recovery triage and discount outreach.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {activeTxns.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 dark:text-zinc-500 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                <Activity className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-zinc-300">No active recovery tasks in flight.</p>
                <p className="text-slate-500 dark:text-zinc-500 mt-1">Use "Simulate 5 Failed Payments" or Ingestion tab to start.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {activeTxns.slice(0, 5).map((t) => (
                  <div key={t.id} className="py-4 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.customer_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        {t.failure_category.replace(/_/g, ' ').toUpperCase()} • {t.razorpay_order_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading font-bold text-slate-900 dark:text-white text-sm">
                        ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-medium">
                        {t.recovery_channel === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'} ({t.discount_applied_percent}% OFF)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>Deterministic Guardrail: Bounded to 2 Retries Max</span>
            <button
              onClick={() => onNavigateTab('ingest')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Inject Single / CSV Failure &rarr;</span>
            </button>
          </div>
        </div>

        {/* Right Column: Architecture & Disposition */}
        <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-8 flex flex-col justify-between shadow-xs transition-colors">
          <div className="space-y-5">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Multi-Agent Workflow</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
                <div className="text-slate-500 dark:text-zinc-400 font-medium">1. Diagnostic Agent</div>
                <div className="text-slate-900 dark:text-white font-mono text-[11px] mt-1 font-semibold">
                  Root-Cause Failure Categorization
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
                <div className="text-slate-500 dark:text-zinc-400 font-medium">2. Strategy Agent</div>
                <div className="text-slate-900 dark:text-white font-mono text-[11px] mt-1 font-semibold">
                  Dynamic Discounting & Hinglish Copy
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
                <div className="text-slate-500 dark:text-zinc-400 font-medium">3. Execution Layer</div>
                <div className="text-slate-900 dark:text-white font-mono text-[11px] mt-1 font-semibold">
                  Razorpay Payment Links + Twilio / SMTP
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-400">Total Recovered:</span>
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
