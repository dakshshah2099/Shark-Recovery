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
      <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 flex flex-col justify-between h-40 sm:h-44 shadow-xs hover:border-[#0c83ff]/40 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#7a95b8]">
              Recovered Revenue
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 font-mono">
              <ArrowUpRight className="w-3 h-3" />
              {recoveryRate}%
            </span>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white mt-2.5 tracking-tight">
            ₹{recoveredRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#7a95b8] mb-1.5 font-mono text-[11px]">
            <span>Recovery Efficiency</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{recoveryRate}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-[#132238] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(recoveryRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Active Revenue At Risk */}
      <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 flex flex-col justify-between h-40 sm:h-44 shadow-xs hover:border-[#0c83ff]/40 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#7a95b8]">
              Revenue At Risk
            </span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-md border border-rose-200 dark:border-rose-800/40">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white mt-2.5 tracking-tight">
            ₹{revAtRisk.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#7a95b8] pt-2 border-t border-slate-100 dark:border-[#172a46] font-mono">
          <span>Dropouts: <strong className="text-slate-800 dark:text-zinc-200 font-semibold">{totalCount}</strong></span>
          <span className="text-rose-600 dark:text-rose-400 font-medium">{activeCount} In Pipeline</span>
        </div>
      </div>

      {/* 3. Discount Loss Incurred */}
      <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 flex flex-col justify-between h-40 sm:h-44 shadow-xs hover:border-[#0c83ff]/40 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#7a95b8]">
              Incentive Loss
            </span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800/40">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-amber-600 dark:text-amber-400 mt-2.5 tracking-tight">
            ₹{discountLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#7a95b8] pt-2 border-t border-slate-100 dark:border-[#172a46] font-mono">
          <span>AI Discount Range</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">0% – 15%</span>
        </div>
      </div>

      {/* 4. Live Outreach Dispatched */}
      <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 flex flex-col justify-between h-40 sm:h-44 shadow-xs hover:border-[#0c83ff]/40 transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#7a95b8]">
              Outreach Sent
            </span>
            <div className="p-1.5 bg-[#0c83ff]/10 text-[#0c83ff] dark:text-[#3395ff] rounded-md border border-[#0c83ff]/20">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white mt-2.5 tracking-tight">
            {whatsappCount + emailCount}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#7a95b8] pt-2 border-t border-slate-100 dark:border-[#172a46] font-mono">
          <span className="text-[#0c83ff] dark:text-[#3395ff] font-semibold">{whatsappCount} WhatsApp</span>
          <span className="text-slate-600 dark:text-zinc-300">{emailCount} Email</span>
        </div>
      </div>
    </div>
  );
};
