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
  onRetry: (id: string) => Promise<void> | void;
  onSimulatePay: (id: string) => Promise<void> | void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  loading = false,
  onRetry,
  onSimulatePay,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [retryingIds, setRetryingIds] = useState<Record<string, boolean>>({});
  const [payingIds, setPayingIds] = useState<Record<string, boolean>>({});

  const handleRowRetry = async (id: string) => {
    setRetryingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onRetry(id);
    } finally {
      setRetryingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRowPay = async (id: string) => {
    setPayingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onSimulatePay(id);
    } finally {
      setPayingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3" />
            <span>Recovered</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Active Triage</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
            <Clock className="w-3 h-3" />
            <span>Abandoned</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xs transition-colors w-full">
      {/* Search & Filter Toolbar */}
      <div className="p-5 border-b border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
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

      {/* Perfectly Fitted Table (No Horizontal Scrollbar on Standard Displays) */}
      <div className="w-full overflow-hidden">
        <table className="w-full text-left border-collapse text-xs table-fixed">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-black/20 text-slate-500 dark:text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
              <th className="py-3.5 px-4 w-[23%]">Customer & Order</th>
              <th className="py-3.5 px-4 w-[13%]">Amount</th>
              <th className="py-3.5 px-4 w-[26%]">Failure Diagnostics</th>
              <th className="py-3.5 px-4 w-[13%]">Status</th>
              <th className="py-3.5 px-4 w-[13%]">Outreach & Link</th>
              <th className="py-3.5 px-4 w-[12%] text-right">Actions</th>
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
                  <td className="py-3.5 px-4 truncate">
                    <div className="font-semibold text-slate-900 dark:text-white text-xs truncate">{txn.customer_name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate mt-0.5">{txn.customer_email}</div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate mt-0.5">{txn.razorpay_order_id}</div>
                  </td>

                  {/* Amount & Recovered */}
                  <td className="py-3.5 px-4">
                    <div className="font-heading font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                      ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {txn.status === 'recovered' && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 whitespace-nowrap">
                        Paid: ₹{txn.recovered_amount.toFixed(2)}
                      </div>
                    )}
                  </td>

                  {/* Failure Diagnostic */}
                  <td className="py-3.5 px-4 overflow-hidden">
                    <div className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight truncate">
                      {txn.failure_category.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5" title={txn.failure_reason || ''}>
                      {txn.failure_reason || 'No description provided'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(txn.status)}
                  </td>

                  {/* Outreach Channel & Link */}
                  <td className="py-3.5 px-4">
                    <div className="text-[11px] font-medium text-slate-800 dark:text-zinc-200 truncate">
                      {txn.recovery_channel === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}
                      {txn.discount_applied_percent > 0 && (
                        <span className="ml-1 text-amber-600 dark:text-amber-400 font-mono font-semibold">
                          ({txn.discount_applied_percent}%)
                        </span>
                      )}
                    </div>

                    {txn.recovery_link ? (
                      <a
                        href={txn.recovery_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-0.5 font-mono"
                      >
                        <span>Razorpay Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {txn.status !== 'recovered' && (
                        <>
                          <button
                            onClick={() => handleRowPay(txn.id)}
                            disabled={payingIds[txn.id] || retryingIds[txn.id]}
                            className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                            title="Simulate customer clicking payment link"
                          >
                            <CheckCircle2 className={`w-3 h-3 ${payingIds[txn.id] ? 'animate-spin' : ''}`} />
                            <span>{payingIds[txn.id] ? 'Saving...' : 'Paid'}</span>
                          </button>

                          <button
                            onClick={() => handleRowRetry(txn.id)}
                            disabled={retryingIds[txn.id] || payingIds[txn.id]}
                            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 inline-flex items-center justify-center cursor-pointer border border-slate-200 dark:border-zinc-700 disabled:opacity-50 transition-colors"
                            title="Re-run AI Triage"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${retryingIds[txn.id] ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
                          </button>
                        </>
                      )}

                      {txn.status === 'recovered' && (
                        <span className="h-8 px-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold inline-flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
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
