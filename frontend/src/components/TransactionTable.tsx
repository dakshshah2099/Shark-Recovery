import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
} from 'lucide-react';
import { CustomSelect, type SelectOption } from './CustomSelect';
import { VoiceCallModal } from './VoiceCallModal';
import type { TransactionItem, TransactionStatus } from '../types';
import { formatToIST } from '../utils/date';

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
  const [selectedVoiceSession, setSelectedVoiceSession] = useState<any | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const handleOpenVoiceTranscript = (transcriptJson: string, txn?: TransactionItem) => {
    try {
      const data = typeof transcriptJson === 'string' ? JSON.parse(transcriptJson) : transcriptJson;
      if (txn) {
        data.transaction_id = txn.id;
        data.customer_name = txn.customer_name || data.customer_name;
        data.customer_phone = txn.customer_phone || data.customer_phone;
        data.customer_email = txn.customer_email || data.customer_email;
        data.order_amount = txn.amount || data.order_amount;
        data.failure_reason = txn.failure_reason || data.failure_reason;
        data.discount_offered = txn.discount_applied_percent ?? data.discount_offered ?? 0;
      }
      setSelectedVoiceSession(data);
      setIsVoiceModalOpen(true);
    } catch (e) {
      console.error('Failed to parse voice transcript:', e);
    }
  };

  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: `All Dispositions (${transactions.length})` },
    { value: 'PROCESSING', label: 'Active Triage', badge: 'In-Flight' },
    { value: 'RECOVERED', label: 'Captured / Recovered', badge: 'Paid' },
    { value: 'FAILED', label: 'Failed Recovery', badge: 'Exhausted' },
    { value: 'ABANDONED', label: 'Dropped / Abandoned', badge: 'Dismissed' },
  ];

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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            <span>Captured</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span>Active Triage</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 font-mono">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a] font-mono">
            <Clock className="w-3 h-3" />
            <span>Dropped</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 font-mono">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg overflow-hidden shadow-xs transition-colors w-full">
      {/* Search & Filter Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-200 dark:border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#0c0c0e]">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search customer, order ID, failure reason..."
            aria-label="Search customer, order ID, or failure reason"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md pl-10 pr-4 focus-rzp transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-body"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <label htmlFor="transaction-status-filter" className="text-xs font-subheading font-semibold text-zinc-700 dark:text-zinc-300 hidden sm:inline">
            Status:
          </label>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-full sm:w-56"
            align="right"
          />
        </div>
      </div>

      {/* Mobile Stacked Card View (< 640px) */}
      <div className="block sm:hidden divide-y divide-zinc-200 dark:divide-[#27272a]">
        {loading ? (
          <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Loading transaction ledger...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            No matching transactions found.
          </div>
        ) : (
          filteredTransactions.map((txn) => (
            <div key={txn.id} className="p-4 space-y-3 bg-white dark:bg-[#121215]">
              {/* Top Row: Customer, Amount, Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold font-subheading text-zinc-900 dark:text-white text-xs truncate">
                    {txn.customer_name}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                    {txn.customer_email}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 font-medium truncate">{txn.razorpay_order_id}</span>
                    <span className="text-zinc-400 dark:text-zinc-500">•</span>
                    <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">{formatToIST(txn.created_at, true)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-heading font-extrabold text-zinc-900 dark:text-white text-sm tabular-nums">
                    ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1">{getStatusBadge(txn.status)}</div>
                </div>
              </div>

              {/* Middle Row: Failure Diagnostics */}
              <div className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-[#27272a] rounded p-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                    {txn.failure_category.replace(/_/g, ' ')}
                  </span>
                  {txn.status === 'recovered' && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                      Paid: ₹{txn.recovered_amount.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-body leading-relaxed line-clamp-2">
                  {txn.failure_reason || 'No description provided'}
                </p>
              </div>

              {/* Bottom Row: Outreach & Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                    {txn.recovery_channel === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}
                    {txn.discount_applied_percent > 0 && (
                      <span className="ml-1 text-amber-700 dark:text-amber-400 font-mono font-bold tabular-nums">
                        ({txn.discount_applied_percent}%)
                      </span>
                    )}
                  </span>
                  {txn.recovery_link && (
                    <a
                      href={txn.recovery_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 font-mono"
                    >
                      <span>Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {txn.status !== 'recovered' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRowPay(txn.id)}
                        disabled={payingIds[txn.id] || retryingIds[txn.id]}
                        aria-label={`Mark payment for ${txn.customer_name || 'order'} as recovered`}
                        className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-subheading font-semibold inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors focus-rzp"
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${payingIds[txn.id] ? 'animate-spin' : ''}`} aria-hidden="true" />
                        <span>{payingIds[txn.id] ? 'Saving' : 'Mark Paid'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRowRetry(txn.id)}
                        disabled={retryingIds[txn.id] || payingIds[txn.id]}
                        aria-label={`Re-run AI recovery triage for order ${txn.razorpay_order_id}`}
                        className="h-8 w-8 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-200 inline-flex items-center justify-center cursor-pointer border border-zinc-200 dark:border-[#27272a] disabled:opacity-50 transition-colors focus-rzp"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${retryingIds[txn.id] ? 'animate-spin text-blue-500' : ''}`} aria-hidden="true" />
                      </button>
                    </>
                  )}

                  {txn.status === 'recovered' && (
                    <span className="h-8 px-2 text-xs text-emerald-700 dark:text-emerald-400 font-mono font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Captured</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop & Tablet Table (>= 640px) */}
      <div className="hidden sm:block w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-[#27272a] bg-zinc-50/80 dark:bg-[#09090b] text-zinc-600 dark:text-zinc-400 uppercase font-mono font-bold text-[10px] tracking-wider">
              <th scope="col" className="py-3 px-4 w-[24%]">Customer & Order ID</th>
              <th scope="col" className="py-3 px-4 w-[13%]">Amount</th>
              <th scope="col" className="py-3 px-4 w-[25%]">Diagnostics</th>
              <th scope="col" className="py-3 px-4 w-[13%]">Status</th>
              <th scope="col" className="py-3 px-4 w-[13%]">Outreach</th>
              <th scope="col" className="py-3 px-4 w-[12%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#27272a]/70 text-zinc-800 dark:text-zinc-200 font-body">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                  Loading transaction ledger...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                  No matching transactions found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors"
                >
                  {/* Customer & Order */}
                  <td className="py-3 px-4 truncate">
                    <div className="font-semibold font-subheading text-zinc-900 dark:text-white text-xs truncate">
                      {txn.customer_name}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate mt-0.5">
                      {txn.customer_email}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 font-medium truncate">{txn.razorpay_order_id}</span>
                      <span className="text-zinc-400 dark:text-zinc-500">•</span>
                      <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">{formatToIST(txn.created_at, true)}</span>
                    </div>
                  </td>

                  {/* Amount & Recovered */}
                  <td className="py-3 px-4">
                    <div className="font-heading font-bold text-zinc-900 dark:text-white text-sm whitespace-nowrap tabular-nums">
                      ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {txn.status === 'recovered' && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 whitespace-nowrap font-medium tabular-nums">
                        Paid: ₹{txn.recovered_amount.toFixed(2)}
                      </div>
                    )}
                  </td>

                  {/* Failure Diagnostic */}
                  <td className="py-3 px-4 overflow-hidden">
                    <div className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight truncate">
                      {txn.failure_category.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5 font-body" title={txn.failure_reason || ''}>
                      {txn.failure_reason || 'No description provided'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {getStatusBadge(txn.status)}
                  </td>

                  {/* Outreach Channel & Link */}
                  <td className="py-3 px-4">
                    <div className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {txn.recovery_channel === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}
                      {txn.discount_applied_percent > 0 && (
                        <span className="ml-1 text-amber-700 dark:text-amber-400 font-mono font-semibold tabular-nums">
                          ({txn.discount_applied_percent}%)
                        </span>
                      )}
                    </div>

                    {txn.recovery_link ? (
                      <a
                        href={txn.recovery_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-0.5 font-mono font-medium"
                      >
                        <span>Razorpay Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">—</span>
                    )}

                    {txn.voice_call_transcript && (
                      <div>
                        <button
                          type="button"
                          onClick={() => handleOpenVoiceTranscript(txn.voice_call_transcript!, txn)}
                          className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[10px] font-mono font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer transition-colors focus-rzp"
                          title="Listen to Hinglish Voice AI Call Transcript"
                        >
                          <Phone className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                          <span>Voice AI</span>
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {txn.status !== 'recovered' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRowPay(txn.id)}
                            disabled={payingIds[txn.id] || retryingIds[txn.id]}
                            aria-label={`Mark payment for ${txn.customer_name || 'order'} as recovered`}
                            className="h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-subheading font-semibold inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors whitespace-nowrap focus-rzp"
                            title="Simulate customer completing payment"
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${payingIds[txn.id] ? 'animate-spin' : ''}`} aria-hidden="true" />
                            <span>{payingIds[txn.id] ? 'Saving' : 'Paid'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRowRetry(txn.id)}
                            disabled={retryingIds[txn.id] || payingIds[txn.id]}
                            aria-label={`Re-run AI recovery triage for order ${txn.razorpay_order_id}`}
                            className="h-8 w-8 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-200 inline-flex items-center justify-center cursor-pointer border border-zinc-200 dark:border-[#27272a] disabled:opacity-50 transition-colors focus-rzp"
                            title="Re-run AI Triage"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${retryingIds[txn.id] ? 'animate-spin text-blue-500' : ''}`} aria-hidden="true" />
                          </button>
                        </>
                      )}

                      {txn.status === 'recovered' && (
                        <span className="h-8 px-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold inline-flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
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

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        sessionData={selectedVoiceSession}
      />
    </div>
  );
};
