import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
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
  loading = false,
  onRetry,
  onSimulatePay,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.razorpay_order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.failure_reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || txn.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'recovered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Recovered</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Active Triage</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Abandoned</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xs transition-colors">
      {/* Search & Filter Toolbar */}
      <div className="p-6 border-b border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, email, order ID, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 hidden sm:inline">
            Status Filter:
          </span>
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto h-11 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl pl-4 pr-9 focus:outline-none focus:border-blue-500 appearance-none font-medium cursor-pointer"
            >
              <option value="ALL">All Statuses ({transactions.length})</option>
              <option value="PROCESSING">Active Triage</option>
              <option value="RECOVERED">Recovered</option>
              <option value="FAILED">Failed</option>
              <option value="ABANDONED">Abandoned</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* High-Contrast Spacious Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-black/20 text-slate-500 dark:text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
              <th className="py-4 px-6">Customer & Order</th>
              <th className="py-4 px-6">Amount</th>
              <th className="py-4 px-6">Failure Diagnostics</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Outreach & Link</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400 dark:text-zinc-500 font-medium">
                  Loading transaction ledger...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400 dark:text-zinc-500 font-medium">
                  No matching transactions found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Customer & Order */}
                  <td className="py-4.5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">{txn.customer_name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">{txn.customer_email}</div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{txn.razorpay_order_id}</div>
                  </td>

                  {/* Amount & Recovered */}
                  <td className="py-4.5 px-6 whitespace-nowrap">
                    <div className="font-heading font-bold text-slate-900 dark:text-white text-sm">
                      ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {txn.status === 'recovered' && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        Paid: ₹{txn.recovered_amount.toFixed(2)}
                      </div>
                    )}
                  </td>

                  {/* Failure Diagnostic */}
                  <td className="py-4.5 px-6 max-w-xs">
                    <div className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      {txn.failure_category.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5" title={txn.failure_reason || ''}>
                      {txn.failure_reason || 'No description provided'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4.5 px-6 whitespace-nowrap">
                    {getStatusBadge(txn.status)}
                  </td>

                  {/* Outreach Channel & Link */}
                  <td className="py-4.5 px-6 whitespace-nowrap">
                    <div className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                      {txn.recovery_channel === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}
                      {txn.discount_applied_percent > 0 && (
                        <span className="ml-1.5 text-amber-600 dark:text-amber-400 font-mono font-semibold">
                          ({txn.discount_applied_percent}% OFF)
                        </span>
                      )}
                    </div>

                    {txn.recovery_link ? (
                      <a
                        href={txn.recovery_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1 font-mono"
                      >
                        <span>Razorpay Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4.5 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {txn.status !== 'recovered' && (
                        <>
                          <button
                            onClick={() => onSimulatePay(txn.id)}
                            className="h-8.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            title="Simulate customer clicking payment link"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>

                          <button
                            onClick={() => onRetry(txn.id)}
                            className="h-8.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-zinc-700 transition-colors"
                            title="Re-run AI Triage"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>Retry</span>
                          </button>
                        </>
                      )}

                      {txn.status === 'recovered' && (
                        <span className="h-8.5 px-3 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete</span>
                        </span>
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
