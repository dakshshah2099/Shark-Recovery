import React from 'react';
import { MetricCards } from '../components/MetricCards';
import { OverviewCharts } from '../components/OverviewCharts';
import {
  Table,
  ShieldCheck,
  Activity,
  Zap,
  CalendarCheck,
  Calendar,
  ArrowRight,
  Clock,
} from 'lucide-react';
import type { DashboardMetrics, TransactionItem } from '../types';
import { formatIndianCurrency, formatIndianCompact, formatIndianWords } from '../utils/currency';

interface OverviewViewProps {
  metrics: DashboardMetrics | null;
  transactions: TransactionItem[];
  maxRetries?: number;
  onNavigateTab: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  transactions,
  maxRetries = 2,
  onNavigateTab,
}) => {
  const activeTxns = transactions.filter((t) => t.status === 'processing');
  const ptpTxns = transactions.filter((t) => t.promise_to_pay_date || t.ptp_status);
  const activePtpTxns = ptpTxns.filter((t) => t.ptp_status !== 'FULFILLED' && t.status !== 'recovered');

  return (
    <div className="space-y-6">
      {/* 1. Hero Executive Strip */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs transition-colors">
        <div className="space-y-2 max-w-2xl">
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl lg:text-[1.65rem] text-zinc-900 dark:text-white tracking-tight leading-tight">
            Revenue Recovery for Indian Payment Dropouts
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-body leading-relaxed">
            Intercept Razorpay checkout dropouts, diagnose root causes (UPI limits, 3DS bank outages, card decline), and dispatch dynamic discount recovery links via Twilio WhatsApp & SMTP email.
          </p>
        </div>

        {/* Production Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('ingest')}
            aria-label="Open Autonomous Recovery Hub"
            className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-subheading font-semibold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all focus-rzp"
          >
            <Zap className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Launch Recovery Hub</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('ptp-tracker')}
            aria-label="View Promise-to-Pay commitments tracker"
            className="h-9 px-3.5 rounded-md bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-subheading font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-rzp"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span>PTP Tracker ({activePtpTxns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('transactions')}
            aria-label="View full transactions recovery ledger"
            className="h-9 px-3.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a] text-xs font-subheading font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-rzp"
          >
            <Table className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>View Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <MetricCards metrics={metrics} />

      {/* 3. Recovery Velocity & Category Breakdown Graphs */}
      <OverviewCharts metrics={metrics} transactions={transactions} />

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
        </div>

        {activeTxns.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400 rounded-md border border-dashed border-zinc-200 dark:border-[#27272a]">
            <Activity className="w-6 h-6 mx-auto text-zinc-400 dark:text-zinc-500 mb-1.5" aria-hidden="true" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 font-subheading">No active recovery tasks in flight.</p>
            <p className="text-zinc-500 dark:text-zinc-400 font-body mt-0.5">Ingest transaction events or connect live webhooks to monitor active dropouts.</p>
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
                  <div
                    className="font-heading font-bold text-zinc-900 dark:text-white text-sm flex items-center justify-end gap-1.5"
                    title={formatIndianWords(t.amount, { includeRupees: true })}
                  >
                    <span>{formatIndianCurrency(t.amount)}</span>
                    {t.amount >= 1000 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 font-normal border border-zinc-200 dark:border-[#27272a]">
                        {formatIndianCompact(t.amount, { showSymbol: false })}
                      </span>
                    )}
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
          <span className="font-body flex items-center gap-1.5">
            <span>Deterministic Guardrail:</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Bounded to {maxRetries} Retries</span>
          </span>
        </div>
      </div>

      {/* 5. Promise-to-Pay (PTP) Commitment Pipeline */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs transition-colors space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-[#27272a]">
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Promise-to-Pay (PTP) Liquidity Commitments</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
              Customers who requested deferred payment windows, locked via Priya Voice AI and multi-channel outreach.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('ptp-tracker')}
            className="text-xs font-subheading font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Open PTP Tracker</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {ptpTxns.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400 rounded-md border border-dashed border-zinc-200 dark:border-[#27272a]">
            <Calendar className="w-6 h-6 mx-auto text-zinc-400 dark:text-zinc-500 mb-1.5" aria-hidden="true" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 font-subheading">No scheduled commitments yet.</p>
            <p className="text-zinc-500 dark:text-zinc-400 font-body mt-0.5">Customer promises locked during voice recovery calls will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-[#27272a]/60">
            {ptpTxns.slice(0, 5).map((t) => {
              const isFulfilled = t.ptp_status === 'FULFILLED' || t.status === 'recovered';
              const isBreached = t.ptp_status === 'BREACHED';

              return (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-subheading text-zinc-900 dark:text-white">{t.customer_name}</span>
                      {isFulfilled && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[9px] font-mono font-bold">
                          Fulfilled
                        </span>
                      )}
                      {isBreached && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[9px] font-mono font-bold">
                          Breached
                        </span>
                      )}
                      {!isFulfilled && !isBreached && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[9px] font-mono font-bold">
                          Active Target
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-purple-500 shrink-0" />
                      <span>Target: {t.promise_to_pay_date || 'Immediate'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className="font-heading font-bold text-zinc-900 dark:text-white text-sm flex items-center justify-end gap-1.5"
                      title={formatIndianWords(t.amount, { includeRupees: true })}
                    >
                      <span>{formatIndianCurrency(t.amount)}</span>
                      {t.amount >= 1000 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 font-normal border border-zinc-200 dark:border-[#27272a]">
                          {formatIndianCompact(t.amount, { showSymbol: false })}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono font-medium">
                      PTP Locked via Voice AI
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
