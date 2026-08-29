import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, MessageSquare, Mail, RefreshCw } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Recovered Revenue */}
      <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Recovered Revenue
          </span>
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-white tracking-tight">
          ₹{recoveredRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center text-emerald-400 font-semibold">
            {recoveryRate}% Recovery Rate
          </span>
          <span>Target: &gt;50%</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Revenue At Risk (Failed) */}
      <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            Total Revenue At Risk
          </span>
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-white tracking-tight">
          ₹{failedRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{totalCount} Total Ingested Orders</span>
          <span className="text-rose-400">{activeCount} In Pipeline</span>
        </div>
      </div>

      {/* Autonomous Guardrails & Retries */}
      <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Active Recovery Tasks
          </span>
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-white tracking-tight">
          {activeCount}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Max Bound: 2 Retries</span>
          <span className="text-emerald-400 font-medium">Zero Human Overhead</span>
        </div>
      </div>

      {/* Multi-Channel Interventions */}
      <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
            Dispatched Outreach
          </span>
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-white tracking-tight">
          {whatsappCount + emailCount}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <MessageSquare className="w-3.5 h-3.5" /> {whatsappCount} WhatsApp
          </span>
          <span className="flex items-center gap-1 text-blue-400 font-medium">
            <Mail className="w-3.5 h-3.5" /> {emailCount} Email
          </span>
        </div>
      </div>
    </div>
  );
};
