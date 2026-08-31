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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3" />
            <span>Captured</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#0c83ff]/10 text-[#0c83ff] dark:text-[#3395ff] border border-[#0c83ff]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0c83ff] animate-pulse" />
            <span>Active Triage</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-[#132238] text-slate-600 dark:text-[#8ea5c8] border border-slate-200 dark:border-[#172a46]">
            <Clock className="w-3 h-3" />
            <span>Dropped</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-[#132238] text-slate-700 dark:text-[#8ea5c8]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-xl overflow-hidden shadow-xs transition-colors w-full">
      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#172a46] flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#09111e]/40">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#52719c] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, order ID, failure reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-[#172a46] text-xs text-slate-900 dark:text-white rounded-lg pl-10 pr-4 focus:outline-none focus:border-[#0c83ff] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 dark:text-[#7a95b8] hidden sm:inline">
            Status:
          </span>
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto h-10 bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-[#172a46] text-xs text-slate-900 dark:text-white rounded-lg pl-3 pr-8 focus:outline-none focus:border-[#0c83ff] appearance-none font-medium cursor-pointer"
            >
              <option value="ALL">All Dispositions ({transactions.length})</option>
              <option value="PROCESSING">Active Triage</option>
              <option value="RECOVERED">Captured / Recovered</option>
              <option value="FAILED">Failed</option>
              <option value="ABANDONED">Dropped</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#52719c] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* High Density Razorpay Styled Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#172a46] bg-slate-50/80 dark:bg-[#080d1a]/80 text-slate-500 dark:text-[#7a95b8] uppercase font-bold text-[10px] tracking-wider">
              <th className="py-3 px-4 w-[24%]">Customer & Order ID</th>
              <th className="py-3 px-4 w-[13%]">Amount</th>
              <th className="py-3 px-4 w-[25%]">Diagnostics</th>
              <th className="py-3 px-4 w-[13%]">Status</th>
              <th className="py-3 px-4 w-[13%]">Outreach</th>
              <th className="py-3 px-4 w-[12%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#172a46]/70 text-slate-700 dark:text-[#cad8ec]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-[#52719c] font-medium">
                  Loading transaction ledger...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-[#52719c] font-medium">
                  No matching transactions found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="hover:bg-slate-50/90 dark:hover:bg-[#0f1e36]/40 transition-colors"
                >
                  {/* Customer & Order */}
                  <td className="py-3 px-4 truncate">
                    <div className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                      {txn.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#7a95b8] font-mono truncate mt-0.5">
                      {txn.customer_email}
                    </div>
                    <div className="text-[10px] text-[#0c83ff] dark:text-[#3395ff] font-mono truncate mt-0.5">
                      {txn.razorpay_order_id}
                    </div>
                  </td>

                  {/* Amount & Recovered */}
                  <td className="py-3 px-4">
                    <div className="font-heading font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                      ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {txn.status === 'recovered' && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 whitespace-nowrap font-medium">
                        Paid: ₹{txn.recovered_amount.toFixed(2)}
                      </div>
                    )}
                  </td>

                  {/* Failure Diagnostic */}
                  <td className="py-3 px-4 overflow-hidden">
                    <div className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight truncate">
                      {txn.failure_category.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#7a95b8] truncate mt-0.5" title={txn.failure_reason || ''}>
                      {txn.failure_reason || 'No description provided'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {getStatusBadge(txn.status)}
                  </td>

                  {/* Outreach Channel & Link */}
                  <td className="py-3 px-4">
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
                        className="text-[10px] text-[#0c83ff] dark:text-[#3395ff] hover:underline inline-flex items-center gap-1 mt-0.5 font-mono"
                      >
                        <span>Razorpay Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-[#52719c]">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {txn.status !== 'recovered' && (
                        <>
                          <button
                            onClick={() => handleRowPay(txn.id)}
                            disabled={payingIds[txn.id] || retryingIds[txn.id]}
                            className="h-7.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                            title="Simulate customer completing payment"
                          >
                            <CheckCircle2 className={`w-3 h-3 ${payingIds[txn.id] ? 'animate-spin' : ''}`} />
                            <span>{payingIds[txn.id] ? 'Saving' : 'Paid'}</span>
                          </button>

                          <button
                            onClick={() => handleRowRetry(txn.id)}
                            disabled={retryingIds[txn.id] || payingIds[txn.id]}
                            className="h-7.5 w-7.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#132238] dark:hover:bg-[#1c3252] text-slate-700 dark:text-[#8ea5c8] inline-flex items-center justify-center cursor-pointer border border-slate-200 dark:border-[#172a46] disabled:opacity-50 transition-colors"
                            title="Re-run AI Triage"
                          >
                            <RotateCw className={`w-3 h-3 ${retryingIds[txn.id] ? 'animate-spin text-[#0c83ff]' : ''}`} />
                          </button>
                        </>
                      )}

                      {txn.status === 'recovered' && (
                        <span className="h-7.5 px-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold inline-flex items-center gap-1 whitespace-nowrap">
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
