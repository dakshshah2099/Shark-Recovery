import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, MessageSquare, Mail } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Recovered Revenue */}
      <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Recovered Revenue
          </span>
          <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="font-heading font-extrabold text-2xl text-white tracking-tight">
          ₹{recoveredRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-emerald-400 font-semibold">{recoveryRate}% Recovery Rate</span>
          <span className="text-zinc-500">Autonomous</span>
        </div>
        <div className="w-full bg-zinc-800 h-1 rounded-full mt-2.5 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full"
            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Revenue At Risk */}
      <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Total Revenue At Risk
          </span>
          <div className="p-1.5 bg-zinc-800 text-zinc-400 rounded">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="font-heading font-extrabold text-2xl text-white tracking-tight">
          ₹{failedRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span>{totalCount} Total Ingested</span>
          <span className="text-zinc-300 font-medium">{activeCount} In Recovery</span>
        </div>
      </div>

      {/* Active Recovery Pipelines */}
      <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Active Recovery Pipelines
          </span>
          <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="font-heading font-extrabold text-2xl text-white tracking-tight">
          {activeCount}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span>Max Bounded: 2 Retries</span>
          <span className="text-zinc-500">Guardrails Enforced</span>
        </div>
      </div>

      {/* Dispatched Outreach */}
      <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Dispatched Outreach
          </span>
          <div className="p-1.5 bg-zinc-800 text-zinc-400 rounded">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="font-heading font-extrabold text-2xl text-white tracking-tight">
          {whatsappCount + emailCount}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1 text-zinc-300">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> {whatsappCount} WhatsApp
          </span>
          <span className="flex items-center gap-1 text-zinc-300">
            <Mail className="w-3.5 h-3.5 text-zinc-400" /> {emailCount} Email
          </span>
        </div>
      </div>
    </div>
  );
};
