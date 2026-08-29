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
  Search,
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3" /> RECOVERED
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800/80">
            <Clock className="w-3 h-3" /> IN RECOVERY
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80">
            <XCircle className="w-3 h-3" /> FAILED
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <AlertOctagon className="w-3 h-3" /> GATED (MAX)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] bg-zinc-800 text-zinc-400">
            {status}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    const label = category.replace(/_/g, ' ').toUpperCase();
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-white/[0.06]">
        {label}
      </span>
    );
  };

  return (
    <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-6 space-y-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search order ID, customer name, failure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/[0.08] text-xs text-white rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 placeholder-zinc-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/[0.08] text-xs overflow-x-auto">
          {['all', 'failed', 'processing', 'recovered', 'abandoned'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize font-medium cursor-pointer transition-all whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {st === 'abandoned' ? 'Gated (Max Retries)' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider text-[10px] font-bold border-b border-white/[0.06]">
            <tr>
              <th className="py-3 px-4">Customer Details</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Diagnosis & Root Cause</th>
              <th className="py-3 px-4">Intervention Strategy</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] bg-[#0f1015]/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs">
                  No transaction records matching active criteria.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors">
                  {/* Customer */}
                  <td className="py-4 px-4">
                    <div className="font-semibold text-white text-sm">{t.customer_name}</div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{t.customer_phone}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{t.razorpay_order_id}</div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-4">
                    <div className="font-heading font-black text-white text-sm">
                      ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {t.status === 'recovered' && (
                      <div className="text-[11px] text-emerald-400 font-semibold font-mono mt-0.5">
                        +₹{t.recovered_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </td>

                  {/* Diagnosis */}
                  <td className="py-4 px-4 max-w-xs">
                    <div className="mb-1.5">{getCategoryBadge(t.failure_category)}</div>
                    <div className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed" title={t.failure_reason || ''}>
                      {t.failure_reason || 'Checkout session dropped'}
                    </div>
                  </td>

                  {/* Strategy */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      {t.recovery_channel === 'whatsapp' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-semibold">
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </span>
                      ) : t.recovery_channel === 'email' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 font-semibold">
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
                  <td className="py-4 px-4">
                    {getStatusBadge(t.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {t.status !== 'recovered' && (
                        <>
                          <button
                            onClick={() => onRetry(t.id)}
                            disabled={t.retry_count >= t.max_retries}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                              t.retry_count >= t.max_retries
                                ? 'bg-zinc-900 text-zinc-600 border border-white/[0.04] cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            }`}
                            title="Re-run AI Recovery Orchestrator"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>

                          <button
                            onClick={() => onSimulatePay(t.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="Simulate customer paying via link"
                          >
                            <Zap className="w-3 h-3 fill-white" />
                            <span>Pay</span>
                          </button>
                        </>
                      )}

                      {t.recovery_link && (
                        <a
                          href={t.recovery_link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-white/[0.08]"
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
