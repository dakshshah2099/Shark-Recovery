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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Recovered Revenue */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 flex flex-col justify-between h-40 sm:h-44 shadow-xs hover:border-blue-500/50 dark:hover:border-zinc-700 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recovered Revenue
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-mono">
              <ArrowUpRight className="w-3 h-3" />
              {recoveryRate}%
            </span>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-zinc-900 dark:text-white mt-2.5 tracking-tight">
            ₹{recoveredRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono text-[11px]">
            <span className="font-body">Recovery Efficiency</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{recoveryRate}%</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-[#18181b] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(recoveryRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Active Revenue At Risk */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 flex flex-col justify-between h-40 sm:h-44 shadow-xs hover:border-blue-500/50 dark:hover:border-zinc-700 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Revenue At Risk
            </span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-800/60">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-zinc-900 dark:text-white mt-2.5 tracking-tight">
            ₹{revAtRisk.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-[#27272a] font-mono">
          <span>Dropouts: <strong className="text-zinc-900 dark:text-white font-semibold">{totalCount}</strong></span>
          <span className="text-rose-600 dark:text-rose-400 font-medium">{activeCount} In Pipeline</span>
        </div>
      </div>

      {/* 3. Discount Loss Incurred */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 flex flex-col justify-between h-40 sm:h-44 shadow-xs hover:border-blue-500/50 dark:hover:border-zinc-700 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Incentive Loss
            </span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800/60">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-amber-700 dark:text-amber-400 mt-2.5 tracking-tight">
            ₹{discountLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-[#27272a] font-mono">
          <span className="font-body">AI Discount Range</span>
          <span className="text-amber-700 dark:text-amber-400 font-semibold">0% – 15%</span>
        </div>
      </div>

      {/* 4. Live Outreach Dispatched */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 flex flex-col justify-between h-40 sm:h-44 shadow-xs hover:border-blue-500/50 dark:hover:border-zinc-700 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Outreach Sent
            </span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800/60">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-zinc-900 dark:text-white mt-2.5 tracking-tight">
            {whatsappCount + emailCount}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-[#27272a] font-mono">
          <span className="text-blue-700 dark:text-blue-400 font-semibold">{whatsappCount} WhatsApp</span>
          <span className="text-zinc-700 dark:text-zinc-200 font-medium">{emailCount} Email</span>
        </div>
      </div>
    </div>
  );
};
