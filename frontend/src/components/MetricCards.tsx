import React from 'react';
import { ArrowUpRight, MessageSquare, AlertCircle, Percent } from 'lucide-react';
import type { DashboardMetrics } from '../types';

interface MetricCardsProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  const recoveredRev = metrics?.total_recovered_revenue ?? 0;
  const revAtRisk = metrics?.revenue_at_risk ?? 0;
  const discountLoss = metrics?.discount_loss_amount ?? 0;
  const recoveryRate = metrics?.recovery_rate_percent ?? 0;
  const activeCount = metrics?.active_recovery_count ?? 0;
  const totalCount = metrics?.total_transactions_count ?? 0;
  const whatsappCount = metrics?.whatsapp_dispatched_count ?? 0;
  const emailCount = metrics?.email_dispatched_count ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 1. Total Recovered Revenue */}
      <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-48 sm:h-52 shadow-xs transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Recovered Revenue
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {recoveryRate}% Rate
            </span>
          </div>
          <div className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white mt-3.5 tracking-tight">
            ₹{recoveredRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-2">
            <span>Recovery Efficiency</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{recoveryRate}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(recoveryRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Active Revenue At Risk */}
      <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-48 sm:h-52 shadow-xs transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Active Revenue At Risk
            </span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/60">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white mt-3.5 tracking-tight">
            ₹{revAtRisk.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <span>Ingested: <strong className="text-slate-800 dark:text-white font-mono font-semibold">{totalCount}</strong></span>
          <span className="text-rose-600 dark:text-rose-400 font-mono font-medium">{activeCount} In Pipeline</span>
        </div>
      </div>

      {/* 3. Discount Loss Incurred */}
      <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-48 sm:h-52 shadow-xs transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Discount Loss Incurred
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-3xl sm:text-4xl text-amber-600 dark:text-amber-300 mt-3.5 tracking-tight">
            ₹{discountLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <span>CAC Incentive Cost</span>
          <span className="text-amber-600 dark:text-amber-400 font-mono font-medium">Dynamic 0–15%</span>
        </div>
      </div>

      {/* 4. Live Outreach Dispatched */}
      <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-48 sm:h-52 shadow-xs transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Live Outreach Dispatched
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800/60">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white mt-3.5 tracking-tight">
            {whatsappCount + emailCount}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <span className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{whatsappCount} WhatsApp</span>
          <span className="text-slate-600 dark:text-zinc-300 font-mono">{emailCount} Email</span>
        </div>
      </div>
    </div>
  );
};
