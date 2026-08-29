import React from 'react';
import { MetricCards } from '../components/MetricCards';
import { Play, RotateCcw, Database, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
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
  const recentTxns = transactions.slice(0, 5);
  const activeTxns = transactions.filter((t) => t.status === 'processing');

  return (
    <div className="space-y-6">
      {/* Top Financial Metric Cards */}
      <MetricCards metrics={metrics} />

      {/* Quick Action Banner */}
      <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span>Autonomous Recovery Engine Controls</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Trigger synthetic payment failure drops or reset database state for clean live testing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onSimulateBatch}
            disabled={simulating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs px-3.5 py-2 rounded flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{simulating ? 'Orchestrating AI Agents...' : 'Simulate 5 Failed Payments'}</span>
          </button>

          <button
            onClick={onSeedDB}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium px-3 py-2 rounded flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Seed Sample Data</span>
          </button>

          <button
            onClick={onClearDB}
            className="bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-900 text-xs font-medium px-3 py-2 rounded flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear DB</span>
          </button>
        </div>
      </div>

      {/* Two Column Summary: In-Flight Recoveries & Recent Outreach Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Recovery Pipeline */}
        <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Active In-Flight Recoveries ({activeTxns.length})</span>
              </h4>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {activeTxns.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded">
                No transactions currently in active recovery. Click "Simulate 5 Failed Payments" to start.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {activeTxns.slice(0, 4).map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{t.customer_name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {t.failure_category.replace(/_/g, ' ').toUpperCase()} • ₹{t.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-blue-400 font-medium font-mono">
                        {t.recovery_channel === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'} ({t.discount_applied_percent}% OFF)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>Max Bound: 2 Retries per order</span>
            <span className="text-zinc-400">Autonomous stopping guardrails active</span>
          </div>
        </div>

        {/* Right: Recent Completed Interventions */}
        <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-bold text-sm text-white">
                Recent Ingested Orders ({recentTxns.length})
              </h4>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentTxns.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded">
                Database is currently empty.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {recentTxns.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{t.customer_name}</div>
                      <div className="text-[11px] text-zinc-400 line-clamp-1 max-w-[260px]">
                        {t.failure_reason || 'Checkout session dropped'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading font-bold text-white">
                        ₹{t.amount.toFixed(2)}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          t.status === 'recovered'
                            ? 'text-emerald-400 bg-emerald-950'
                            : t.status === 'processing'
                            ? 'text-blue-400 bg-blue-950'
                            : 'text-rose-400 bg-rose-950'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>Live Webhook Endpoint: /webhook/razorpay</span>
            <button
              onClick={() => onNavigateTab('outreach')}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              Open WhatsApp Replica &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
