import React from 'react';
import { MetricCards } from '../components/MetricCards';
import {
  Play,
  Database,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Sparkles,
} from 'lucide-react';
import type { DashboardMetrics, TransactionItem, WhatsAppMessage } from '../types';

interface OverviewViewProps {
  metrics: DashboardMetrics | null;
  transactions: TransactionItem[];
  whatsappFeed?: WhatsAppMessage[];
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
      {/* 1. Hero Command Strip */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/80 text-[11px] font-semibold text-blue-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Autonomous Multi-Agent Recovery Engine</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            Revenue Recovery for Indian Payment Dropouts
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
            Instantly intercept Razorpay checkout failures, diagnose root causes (UPI limits, 3DS timeouts, SBI 503s), and dispatch personalized dynamic discount links via WhatsApp and Email.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={onSimulateBatch}
            disabled={simulating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{simulating ? 'Orchestrating Batch...' : 'Simulate 5 Failed Payments'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onSeedDB}
              className="flex-1 sm:flex-initial bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] text-xs font-medium px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              title="Populate realistic transactions"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Seed Data</span>
            </button>

            <button
              onClick={onClearDB}
              className="flex-1 sm:flex-initial bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-900 text-xs font-medium px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              title="Clear all database records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <MetricCards metrics={metrics} />

      {/* 3. Operational Overview & Recovery Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Recovery Pipeline */}
        <div className="lg:col-span-2 bg-[#121318] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>In-Flight Intervention Pipeline</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Transactions currently undergoing automated recovery triage and discount outreach.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>View Full Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {activeTxns.length === 0 ? (
              <div className="py-14 text-center text-xs text-zinc-500 rounded-lg border border-dashed border-zinc-800">
                <Activity className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                <p className="font-medium text-zinc-400">No active recovery tasks in flight.</p>
                <p className="text-zinc-600 mt-1">Click "Simulate 5 Failed Payments" to watch the AI orchestrator trigger.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activeTxns.slice(0, 5).map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white">{t.customer_name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {t.failure_category.replace(/_/g, ' ').toUpperCase()} • {t.razorpay_order_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading font-bold text-white">
                        ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-blue-400 font-mono font-medium">
                        {t.recovery_channel === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'} ({t.discount_applied_percent}% OFF)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
            <span>Deterministic Guardrail: Max 2 Retries Bounded</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigateTab('ingest')}
                className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                + Inject Custom Failure / CSV &rarr;
              </button>
              <button
                onClick={() => onNavigateTab('outreach')}
                className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                Outreach Hub &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Recovery Intelligence Stats */}
        <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2 pb-4 border-b border-white/[0.06]">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Recovery Architecture</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                <div className="text-zinc-400 font-medium">1. Diagnostic Agent:</div>
                <div className="text-white font-mono text-[11px] mt-0.5">Root-Cause Failure Categorization</div>
              </div>

              <div className="bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                <div className="text-zinc-400 font-medium">2. Strategy Agent:</div>
                <div className="text-white font-mono text-[11px] mt-0.5">Dynamic Discounting & Hinglish Copy</div>
              </div>

              <div className="bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                <div className="text-zinc-400 font-medium">3. Execution Tools:</div>
                <div className="text-white font-mono text-[11px] mt-0.5">Razorpay Payment Links + WhatsApp/SMTP</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-zinc-400">Recovered Orders:</span>
            <span className="text-emerald-400 font-mono font-bold">{recoveredTxns.length} Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
