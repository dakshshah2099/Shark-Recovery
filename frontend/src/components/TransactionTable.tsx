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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3" /> RECOVERED
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800/80">
            <Clock className="w-3 h-3" /> IN RECOVERY
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80">
            <XCircle className="w-3 h-3" /> FAILED
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <AlertOctagon className="w-3 h-3" /> GATED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-400">
            {status}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    const label = category.replace(/_/g, ' ').toUpperCase();
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
        {label}
      </span>
    );
  };

  return (
    <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <span>Transaction Recovery Ledger</span>
            <span className="text-xs font-normal text-zinc-500 font-mono">
              ({filtered.length})
            </span>
          </h3>
          <p className="text-xs text-zinc-400">
            Autonomous multi-agent triage, customer risk assessment, and intervention logs.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search order, customer, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 w-52"
          />

          <div className="flex items-center bg-zinc-900 p-0.5 rounded border border-zinc-800 text-xs">
            {['all', 'failed', 'processing', 'recovered', 'abandoned'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded text-xs capitalize font-medium cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
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
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold border-b border-zinc-800">
            <tr>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Root Cause Diagnosis</th>
              <th className="py-2.5 px-3">Intervention Strategy</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                  No transaction records found matching the active filter.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-900/50">
                  {/* Customer */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{t.customer_name}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{t.customer_phone}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{t.razorpay_order_id}</div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3">
                    <div className="font-heading font-bold text-white text-sm">
                      ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {t.status === 'recovered' && (
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        +₹{t.recovered_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Recovered
                      </div>
                    )}
                  </td>

                  {/* Diagnosis */}
                  <td className="py-3 px-3 max-w-xs">
                    <div className="mb-1">{getCategoryBadge(t.failure_category)}</div>
                    <div className="text-[11px] text-zinc-300 line-clamp-2" title={t.failure_reason || ''}>
                      {t.failure_reason || 'Checkout session dropped'}
                    </div>
                  </td>

                  {/* Strategy */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      {t.recovery_channel === 'whatsapp' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </span>
                      ) : t.recovery_channel === 'email' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 font-medium">
                          <Mail className="w-3 h-3" /> Email
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500">Pending</span>
                      )}

                      {t.discount_applied_percent > 0 && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-950/80 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-amber-800/80">
                          <Percent className="w-2.5 h-2.5" />
                          {t.discount_applied_percent}% OFF
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Retries: {t.retry_count}/{t.max_retries}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    {getStatusBadge(t.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.status !== 'recovered' && (
                        <>
                          <button
                            onClick={() => onRetry(t.id)}
                            disabled={t.retry_count >= t.max_retries}
                            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer ${
                              t.retry_count >= t.max_retries
                                ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            title="Re-run AI Recovery Orchestrator"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span className="hidden sm:inline">Retry</span>
                          </button>

                          <button
                            onClick={() => onSimulatePay(t.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                            title="Simulate customer paying via link"
                          >
                            <Zap className="w-3 h-3" />
                            <span className="hidden sm:inline">Pay</span>
                          </button>
                        </>
                      )}

                      {t.recovery_link && (
                        <a
                          href={t.recovery_link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                          title="Open Razorpay Payment Link"
                        >
                          <ExternalLink className="w-3 h-3" />
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
