import React from 'react';
import { MetricCards } from '../components/MetricCards';
import { AgentStepFlow } from '../components/AgentStepFlow';
import {
  Play,
  Database,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
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

  return (
    <div className="space-y-6">
      {/* 1. Hero Executive Strip */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs transition-colors">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 dark:bg-[#18181b] border border-blue-200 dark:border-[#27272a] text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span>AUTONOMOUS REVENUE ENGINE</span>
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-zinc-900 dark:text-white tracking-tight leading-tight">
            Revenue Recovery for Indian Payment Dropouts
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-body leading-relaxed">
            Intercept Razorpay checkout dropouts, diagnose root causes (UPI limits, 3DS bank outages, card decline), and dispatch dynamic discount recovery links via Twilio WhatsApp & SMTP email.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={onSimulateBatch}
            disabled={simulating}
            className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-subheading font-semibold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{simulating ? 'Processing Batch...' : 'Simulate 5 Failures'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onSeedDB}
              className="h-9 px-3.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a] text-xs font-subheading font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Populate realistic transactions"
            >
              <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Seed</span>
            </button>

            <button
              onClick={onClearDB}
              className="h-9 px-3.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-white border border-zinc-200 dark:border-[#27272a] text-xs font-subheading font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
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

      {/* 3. Interactive Visual Multi-Agent Node/Step Flow */}
      <AgentStepFlow />

      {/* 4. Active Recovery Pipeline */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs transition-colors space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-[#27272a]">
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>In-Flight Intervention Pipeline</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
              Transactions actively undergoing automated diagnostic and dynamic discount outreach.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-subheading font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTxns.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400 rounded-md border border-dashed border-zinc-200 dark:border-[#27272a]">
            <Activity className="w-6 h-6 mx-auto text-zinc-400 dark:text-zinc-500 mb-1.5" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 font-subheading">No active recovery tasks in flight.</p>
            <p className="text-zinc-500 dark:text-zinc-400 font-body mt-0.5">Use "Simulate 5 Failures" or Ingestion tab to start.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-[#27272a]/60">
            {activeTxns.slice(0, 5).map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold font-subheading text-zinc-900 dark:text-white">{t.customer_name}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {t.failure_category.replace(/_/g, ' ').toUpperCase()} • {t.razorpay_order_id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-bold text-zinc-900 dark:text-white text-sm">
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

        <div className="pt-3.5 border-t border-zinc-100 dark:border-[#27272a] flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-body">Deterministic Guardrail: Bounded to 2 Retries</span>
          <button
            onClick={() => onNavigateTab('ingest')}
            className="text-blue-600 dark:text-blue-400 hover:underline font-subheading font-semibold cursor-pointer inline-flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate / CSV &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
