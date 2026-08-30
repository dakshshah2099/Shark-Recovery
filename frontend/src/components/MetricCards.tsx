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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Recovered Revenue */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-44">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Recovered Revenue
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
              <ArrowUpRight className="w-3 h-3" />
              {recoveryRate}% Rate
            </span>
          </div>
          <div className="font-heading font-black text-3xl text-white mt-3 tracking-tight">
            ₹{recoveredRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>Recovery Efficiency</span>
            <span className="text-emerald-400 font-mono font-bold">{recoveryRate}%</span>
          </div>
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(recoveryRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Active Revenue At Risk (Decreases as recovered) */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between h-44">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Revenue At Risk
            </span>
            <div className="p-1.5 bg-rose-950/80 text-rose-400 rounded-lg border border-rose-800/60">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-white mt-3 tracking-tight">
            ₹{revAtRisk.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
          <span>Ingested Orders: <strong className="text-white font-mono">{totalCount}</strong></span>
          <span className="text-zinc-500 font-mono">{activeCount} In Pipeline</span>
        </div>
      </div>

      {/* 3. Discount Loss Incurred */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between h-44">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Discount Loss Incurred
            </span>
            <div className="p-1.5 bg-amber-950/80 text-amber-400 rounded-lg border border-amber-800/60">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-amber-300 mt-3 tracking-tight">
            ₹{discountLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
          <span>CAC Incentive Cost</span>
          <span className="text-amber-400 font-mono font-medium">Dynamic 0–15%</span>
        </div>
      </div>

      {/* 4. Active Outreach & Interventions */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between h-44">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Live Outreach Dispatched
            </span>
            <div className="p-1.5 bg-blue-950/80 text-blue-400 rounded-lg border border-blue-800/60">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-white mt-3 tracking-tight">
            {whatsappCount + emailCount}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
          <span className="text-blue-400 font-mono font-semibold">{whatsappCount} WhatsApp</span>
          <span className="text-zinc-300 font-mono">{emailCount} Email</span>
        </div>
      </div>
    </div>
  );
};
