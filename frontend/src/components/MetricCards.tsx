import React from 'react';
import { ArrowUpRight, ShieldCheck, MessageSquare, AlertCircle } from 'lucide-react';
import type { DashboardMetrics } from '../types';

interface MetricCardsProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  const recoveredRev = metrics?.total_recovered_revenue ?? 0;
  const failedRev = metrics?.total_failed_revenue ?? 0;
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
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/80">
              <ArrowUpRight className="w-3 h-3" />
              {recoveryRate}%
            </span>
          </div>
          <div className="font-heading font-black text-3xl text-white mt-3 tracking-tight">
            ₹{recoveredRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>Autonomous Rate</span>
            <span className="text-white font-mono">{recoveryRate}%</span>
          </div>
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(recoveryRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Total Revenue At Risk */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between h-44">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Revenue At Risk
            </span>
            <div className="p-1 bg-zinc-900 text-zinc-400 rounded border border-zinc-800">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-white mt-3 tracking-tight">
            ₹{failedRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
          <span>Ingested Orders</span>
          <span className="text-white font-mono font-semibold">{totalCount}</span>
        </div>
      </div>

      {/* 3. In-Flight Active Pipelines */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between h-44">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Interventions
            </span>
            <div className="p-1 bg-blue-950 text-blue-400 rounded border border-blue-800">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-white mt-3 tracking-tight">
            {activeCount}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
          <span>Retry Guardrails</span>
          <span className="text-blue-400 font-medium font-mono">Max 2 Retries</span>
        </div>
      </div>

      {/* 4. Dispatched Channels */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between h-44">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Dispatched Outreach
            </span>
            <div className="p-1 bg-zinc-900 text-zinc-400 rounded border border-zinc-800">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-white mt-3 tracking-tight">
            {whatsappCount + emailCount}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
          <span className="text-white font-mono">💬 {whatsappCount} WhatsApp</span>
          <span className="text-zinc-400 font-mono">✉️ {emailCount} Email</span>
        </div>
      </div>
    </div>
  );
};
