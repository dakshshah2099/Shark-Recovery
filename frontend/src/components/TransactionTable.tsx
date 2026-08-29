import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Zap,
  ExternalLink,
  MessageSquare,
  Mail,
  Percent,
} from 'lucide-react';
import type { TransactionItem, TransactionStatus } from '../types';

interface TransactionTableProps {
  transactions: TransactionItem[];
  loading?: boolean;
  onRetry: (id: string) => void;
  onSimulatePay: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onRetry,
  onSimulatePay,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = transactions.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.customer_name.toLowerCase().includes(q) ||
      t.customer_email.toLowerCase().includes(q) ||
      t.customer_phone.includes(q) ||
      t.razorpay_order_id.toLowerCase().includes(q) ||
      (t.failure_reason && t.failure_reason.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'recovered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> RECOVERED
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> IN RECOVERY
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertOctagon className="w-3.5 h-3.5" /> GATED/STOPPED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    const label = category.replace(/_/g, ' ').toUpperCase();
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
        {label}
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Transaction Recovery Ledger</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {filtered.length} entries
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Live stream of detected payment dropouts, agent triage, and revenue status.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search order, customer, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 w-48"
          />

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'failed', 'processing', 'recovered', 'abandoned'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'abandoned' ? 'Gated' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Failure Diagnosis</th>
              <th className="py-3 px-3">AI Intervention</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No transactions match the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Customer Info */}
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-white">{t.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{t.customer_phone}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{t.razorpay_order_id}</div>
                  </td>

                  {/* Amount & Recovered */}
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white text-sm">
                      ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {t.status === 'recovered' && (
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        +₹{t.recovered_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Recovered
                      </div>
                    )}
                  </td>

                  {/* Failure Diagnosis */}
                  <td className="py-3.5 px-3 max-w-xs">
                    <div className="mb-1">{getCategoryBadge(t.failure_category)}</div>
                    <div className="text-[11px] text-slate-300 line-clamp-2" title={t.failure_reason || ''}>
                      {t.failure_reason || 'Checkout session dropped'}
                    </div>
                  </td>

                  {/* AI Strategy */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      {t.recovery_channel === 'whatsapp' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </span>
                      ) : t.recovery_channel === 'email' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                          <Mail className="w-3 h-3" /> Email
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Pending</span>
                      )}

                      {t.discount_applied_percent > 0 && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
                          <Percent className="w-2.5 h-2.5" />
                          {t.discount_applied_percent}% OFF
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Retries: {t.retry_count}/{t.max_retries}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3">
                    {getStatusBadge(t.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.status !== 'recovered' && (
                        <>
                          <button
                            onClick={() => onRetry(t.id)}
                            disabled={t.retry_count >= t.max_retries}
                            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                              t.retry_count >= t.max_retries
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-blue-600/80 hover:bg-blue-600 text-white shadow-sm'
                            }`}
                            title="Re-run AI Recovery Orchestrator"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Retry</span>
                          </button>

                          <button
                            onClick={() => onSimulatePay(t.id)}
                            className="bg-emerald-600/80 hover:bg-emerald-600 text-white p-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all"
                            title="Simulate customer paying via link"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Simulate Pay</span>
                          </button>
                        </>
                      )}

                      {t.recovery_link && (
                        <a
                          href={t.recovery_link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                          title="Open Razorpay Payment Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
