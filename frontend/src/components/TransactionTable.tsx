import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Download,
  Calendar,
} from 'lucide-react';
import { CustomSelect, type SelectOption } from './CustomSelect';
import { VoiceCallModal } from './VoiceCallModal';
import type { TransactionItem, TransactionStatus } from '../types';
import { formatToIST } from '../utils/date';

const ACRONYM_GLOSSARY: Record<string, string> = {
  UPI: 'Unified Payments Interface - Instant real-time payment system developed by NPCI',
  '3DS': '3-Domain Secure - Multi-factor netbanking / card authentication timeout',
  CBS: 'Core Banking System - Bank mainframe/host timeout (503 Service Unavailable)',
  PTP: 'Promise-To-Pay - Customer verbally or digitally confirmed agreement to pay',
  NPCI: 'National Payments Corporation of India - Retail payments governing body',
  HMAC: 'Hash-based Message Authentication Code - Cryptographic webhook signature',
};

const getAcronymExplanation = (category: string): string | undefined => {
  for (const [acronym, desc] of Object.entries(ACRONYM_GLOSSARY)) {
    if (category.toUpperCase().includes(acronym)) {
      return `${acronym}: ${desc}`;
    }
  }
  return undefined;
};

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
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState<string>('');
  const [batchRetrying, setBatchRetrying] = useState<boolean>(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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
        data.promise_to_pay_date = txn.promise_to_pay_date || data.promise_to_pay_date || null;
      }
      setSelectedVoiceSession(data);
      setIsVoiceModalOpen(true);
    } catch (e) {
      console.error('Failed to parse voice transcript:', e);
    }
  };

  const handleOpenVoiceForTxn = (txn: TransactionItem) => {
    if (txn.voice_call_transcript) {
      handleOpenVoiceTranscript(txn.voice_call_transcript, txn);
    } else {
      const data = {
        call_id: `call_${txn.id.slice(0, 8)}`,
        transaction_id: txn.id,
        customer_name: txn.customer_name,
        customer_phone: txn.customer_phone,
        customer_email: txn.customer_email,
        order_amount: txn.amount,
        discount_offered: txn.discount_applied_percent ?? 0,
        dialogue: [],
        customer_intent: txn.promise_to_pay_date ? 'PROMISE_TO_PAY' : 'UNKNOWN',
        promise_to_pay_date: txn.promise_to_pay_date || null,
        call_outcome: txn.promise_to_pay_date ? 'PROMISED' : 'PENDING',
        call_duration_seconds: 0,
        sms_payment_link_triggered: !!txn.recovery_link,
        failure_reason: txn.failure_reason,
      };
      setSelectedVoiceSession(data);
      setIsVoiceModalOpen(true);
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

  const toggleSelectRow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((txn) => selectedIds.has(txn.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleBatchRetry = async () => {
    const idsToRetry = Array.from(selectedIds).filter((id) => {
      const txn = transactions.find((t) => t.id === id);
      return txn && txn.status !== 'recovered';
    });
    if (idsToRetry.length === 0) return;
    setBatchRetrying(true);
    try {
      for (const id of idsToRetry) {
        await onRetry(id);
      }
      setSelectedIds(new Set());
    } finally {
      setBatchRetrying(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Amount (INR)',
      'Recovered Amount',
      'Status',
      'Failure Category',
      'Failure Reason',
      'Recovery Channel',
      'Created At (IST)',
    ];

    const rows = filteredTransactions.map((t) => [
      `"${t.razorpay_order_id || ''}"`,
      `"${(t.customer_name || '').replace(/"/g, '""')}"`,
      `"${t.customer_email || ''}"`,
      `"${t.customer_phone || ''}"`,
      t.amount,
      t.recovered_amount ?? '',
      `"${t.status}"`,
      `"${t.failure_category}"`,
      `"${(t.failure_reason || '').replace(/"/g, '""')}"`,
      `"${t.recovery_channel || ''}"`,
      `"${formatToIST(t.created_at, true)}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `shark_recovery_ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  React.useEffect(() => {
    if (selectedRowIndex >= 0 && selectedRowIndex < filteredTransactions.length) {
      const current = filteredTransactions[selectedRowIndex];
      if (current) {
        setAnnouncement(
          `Row ${selectedRowIndex + 1} of ${filteredTransactions.length}: Order ${current.razorpay_order_id}, ${current.customer_name}, amount ₹${current.amount}, status ${current.status}`
        );
      }
    }
  }, [selectedRowIndex, filteredTransactions]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      // "/" focuses search input when not already typing
      if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Inside search input: Escape blurs
      if (e.key === 'Escape' && activeEl === searchInputRef.current) {
        searchInputRef.current?.blur();
        return;
      }

      // Keyboard navigation for table rows
      if (!isInputActive && filteredTransactions.length > 0) {
        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedRowIndex((prev) =>
            prev < filteredTransactions.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedRowIndex((prev) =>
            prev > 0 ? prev - 1 : filteredTransactions.length - 1
          );
        } else if (e.key === 'r' && selectedRowIndex >= 0 && selectedRowIndex < filteredTransactions.length) {
          const targetTxn = filteredTransactions[selectedRowIndex];
          if (targetTxn && targetTxn.status !== 'recovered') {
            e.preventDefault();
            handleRowRetry(targetTxn.id);
          }
        } else if ((e.key === 'x' || e.key === 'X') && selectedRowIndex >= 0 && selectedRowIndex < filteredTransactions.length) {
          const targetTxn = filteredTransactions[selectedRowIndex];
          if (targetTxn) {
            e.preventDefault();
            toggleSelectRow(targetTxn.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredTransactions, selectedRowIndex]);

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

  const renderSchedulerBadges = (txn: TransactionItem) => {
    const badges: React.ReactNode[] = [];

    // 1. Auto-Attempt Badge: 🔄 Auto-Attempt 2/3
    if (txn.status !== 'recovered') {
      if (txn.auto_retry_enabled === false) {
        badges.push(
          <span
            key="retry-off"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-mono"
            title="Auto-retry killswitch disabled for this order"
          >
            <span>⏸️ Auto-Retry Off</span>
          </span>
        );
      } else if (txn.retry_count > 0 || txn.max_retries > 0) {
        badges.push(
          <span
            key="auto-attempt"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono"
            title={`Autonomous retry attempt ${txn.retry_count} of ${txn.max_retries}`}
          >
            <span>🔄 Auto-Attempt {txn.retry_count}/{txn.max_retries}</span>
          </span>
        );
      }
    }

    // 2. Retry Due Badge: ⏳ Retry Due in Xh
    if (txn.status === 'processing' && txn.auto_retry_enabled !== false) {
      if (txn.dispatch_scheduled_at) {
        const dispatchMs = new Date(txn.dispatch_scheduled_at).getTime() - Date.now();
        if (dispatchMs > 0) {
          const hours = Math.max(1, Math.ceil(dispatchMs / (1000 * 60 * 60)));
          badges.push(
            <span
              key="dispatch-due"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono animate-pulse"
              title={`Liquidity window primary dispatch scheduled in ${hours}h`}
            >
              <span>⏳ Push in {hours}h</span>
            </span>
          );
        }
      } else if (txn.next_retry_at) {
        const retryMs = new Date(txn.next_retry_at).getTime() - Date.now();
        if (retryMs > 0) {
          const hours = Math.max(1, Math.ceil(retryMs / (1000 * 60 * 60)));
          badges.push(
            <span
              key="retry-due"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-mono"
              title={`Cooling-off window active. Next retry scheduled in ${hours}h`}
            >
              <span>⏳ Retry Due in {hours}h</span>
            </span>
          );
        } else {
          badges.push(
            <span
              key="retry-now"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-mono"
              title="Cooling-off completed. Eligible for automated retry."
            >
              <span>⏳ Retry Due Now</span>
            </span>
          );
        }
      }
    }

    // 3. PTP Breached Badge: ⏰ PTP Breached (Reminding)
    const isPtpBreached =
      txn.status !== 'recovered' &&
      (txn.ptp_status === 'BREACHED' ||
        txn.ptp_reminder_sent ||
        (txn.promise_to_pay_date && new Date(txn.promise_to_pay_date).getTime() < Date.now()));

    if (isPtpBreached) {
      badges.push(
        <span
          key="ptp-breached"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-mono"
          title="Committed promise-to-pay date passed. Autonomous breach reminder active."
        >
          <span>⏰ PTP Breached {txn.ptp_reminder_sent ? '(Reminded)' : '(Reminding)'}</span>
        </span>
      );
    }

    return badges;
  };

  return (
    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg overflow-hidden shadow-xs transition-colors w-full">
      {/* Search & Filter Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-200 dark:border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#0c0c0e]">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search customer, order ID, failure reason..."
            aria-label="Search customer, order ID, or failure reason"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md pl-10 pr-9 focus-rzp transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-body"
          />
          <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-[#27272a] border border-zinc-200 dark:border-zinc-700 rounded absolute right-2.5 top-1/2 -translate-y-1/2 select-none pointer-events-none" title="Press / to search">
            /
          </kbd>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="transaction-status-filter" className="text-xs font-subheading font-semibold text-zinc-700 dark:text-zinc-300 hidden sm:inline">
            Status:
          </label>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-full sm:w-52"
            align="right"
          />
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            aria-label="Export filtered transactions as CSV"
            className="h-9 px-3 rounded-md bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a] text-xs font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50 focus-rzp shrink-0"
            title="Export filtered transactions to CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Screen reader live announcement for keyboard navigation (Sam Persona: Accessibility) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Batch Action Bar (Alex Persona: FinOps Bulk Triage) */}
      {selectedIds.size > 0 && (
        <div
          role="region"
          aria-label="Batch action bar"
          className="p-2.5 px-4 bg-blue-50/90 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900 dark:text-blue-200 font-subheading">
              {selectedIds.size} {selectedIds.size === 1 ? 'order' : 'orders'} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-mono cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchRetry}
              disabled={batchRetrying}
              className="h-7.5 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-subheading font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors focus-rzp disabled:opacity-50"
            >
              <RotateCw className={`w-3 h-3 ${batchRetrying ? 'animate-spin' : ''}`} />
              <span>{batchRetrying ? 'Retrying...' : `Retry Selected (${selectedIds.size})`}</span>
            </button>
          </div>
        </div>
      )}

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
          filteredTransactions.map((txn) => {
            const isRowChecked = selectedIds.has(txn.id);
            const acronymInfo = getAcronymExplanation(txn.failure_category);
            return (
            <div
              key={txn.id}
              className={`p-4 space-y-3 transition-colors ${
                isRowChecked
                  ? 'bg-blue-50/50 dark:bg-blue-950/20'
                  : 'bg-white dark:bg-[#121215]'
              }`}
            >
              {/* Top Row: Customer, Amount, Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isRowChecked}
                    onChange={(e) => toggleSelectRow(txn.id, e as any)}
                    aria-label={`Select transaction ${txn.razorpay_order_id}`}
                    className="mt-0.5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 shrink-0"
                  />
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
                </div>
                <div className="text-right shrink-0">
                  <div className="font-heading font-extrabold text-zinc-900 dark:text-white text-sm tabular-nums">
                    ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 flex flex-col items-end gap-1">
                    {getStatusBadge(txn.status)}
                    {renderSchedulerBadges(txn)}
                  </div>
                </div>
              </div>

              {/* Middle Row: Failure Diagnostics */}
              <div className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-[#27272a] rounded p-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span
                    className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight cursor-help"
                    title={acronymInfo || txn.failure_category}
                  >
                    {txn.failure_category.replace(/_/g, ' ')}
                  </span>
                  {txn.status === 'recovered' && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                      Paid: ₹{(txn.recovered_amount ?? txn.amount).toFixed(2)}
                    </span>
                  )}
                </div>
                {acronymInfo && (
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans italic">
                    ℹ️ {acronymInfo}
                  </div>
                )}
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-body leading-relaxed line-clamp-2" title={txn.failure_reason || ''}>
                  {txn.failure_reason || 'No description provided'}
                </p>
              </div>

              {/* Bottom Row: Outreach & Actions */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-2 text-xs flex-wrap">
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

                  <button
                    type="button"
                    onClick={() => handleOpenVoiceForTxn(txn)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[10px] font-mono font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer transition-colors focus-rzp"
                    title="Open Hinglish Voice AI & Promise-to-Pay Screening"
                  >
                    <Phone className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span>Voice AI</span>
                  </button>

                  {txn.promise_to_pay_date && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-mono font-bold truncate max-w-[130px]"
                      title={`Promise-to-Pay Confirmed: ${txn.promise_to_pay_date}`}
                    >
                      <Calendar className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="truncate">PTP: {txn.promise_to_pay_date}</span>
                    </span>
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
            );
          })
        )}
      </div>

      {/* Desktop & Tablet Table (>= 640px) */}
      <div className="hidden sm:block w-full overflow-x-auto">
        <table
          id="transaction-table"
          aria-activedescendant={
            selectedRowIndex >= 0 && filteredTransactions[selectedRowIndex]
              ? `txn-row-${filteredTransactions[selectedRowIndex].id}`
              : undefined
          }
          className="w-full text-left border-collapse text-xs table-fixed min-w-[700px]"
        >
          <thead>
            <tr className="border-b border-zinc-200 dark:border-[#27272a] bg-zinc-50/80 dark:bg-[#09090b] text-zinc-600 dark:text-zinc-400 uppercase font-mono font-bold text-[10px] tracking-wider">
              <th scope="col" className="py-3 px-3 w-[4%] text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all transactions"
                  className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                />
              </th>
              <th scope="col" className="py-3 px-4 w-[23%]">Customer & Order ID</th>
              <th scope="col" className="py-3 px-4 w-[13%]">Amount</th>
              <th scope="col" className="py-3 px-4 w-[25%]">Diagnostics</th>
              <th scope="col" className="py-3 px-4 w-[12%]">Status</th>
              <th scope="col" className="py-3 px-4 w-[12%]">Outreach</th>
              <th scope="col" className="py-3 px-4 w-[11%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#27272a]/70 text-zinc-800 dark:text-zinc-200 font-body">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                  Loading transaction ledger...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                  No matching transactions found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn, index) => {
                const isSelected = selectedRowIndex === index;
                const isRowChecked = selectedIds.has(txn.id);
                const acronymInfo = getAcronymExplanation(txn.failure_category);
                return (
                  <tr
                    key={txn.id}
                    id={`txn-row-${txn.id}`}
                    role="row"
                    aria-selected={isSelected}
                    onClick={() => setSelectedRowIndex(index)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-inset ring-blue-500/40'
                        : isRowChecked
                        ? 'bg-blue-50/30 dark:bg-blue-950/20'
                        : 'hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isRowChecked}
                        onChange={(e) => toggleSelectRow(txn.id, e as any)}
                        aria-label={`Select transaction ${txn.razorpay_order_id}`}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                      />
                    </td>

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
                          Paid: ₹{(txn.recovered_amount ?? txn.amount).toFixed(2)}
                        </div>
                      )}
                    </td>

                  {/* Failure Diagnostic */}
                  <td className="py-3 px-4 overflow-hidden">
                    <div
                      className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight truncate inline-flex items-center gap-1 cursor-help"
                      title={acronymInfo || txn.failure_category}
                    >
                      <span>{txn.failure_category.replace(/_/g, ' ')}</span>
                      {acronymInfo && (
                        <span
                          className="text-[9px] px-1 rounded border border-rose-200 dark:border-rose-900/60 font-sans font-normal"
                          title={acronymInfo}
                        >
                          Glossary
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5 font-body" title={txn.failure_reason || ''}>
                      {txn.failure_reason || 'No description provided'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col items-start gap-1">
                      {getStatusBadge(txn.status)}
                      {renderSchedulerBadges(txn)}
                    </div>
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

                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenVoiceForTxn(txn)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[10px] font-mono font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer transition-colors focus-rzp"
                        title="Open Hinglish Voice AI & Promise-to-Pay Screening"
                      >
                        <Phone className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                        <span>Voice AI</span>
                      </button>

                      {txn.promise_to_pay_date && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-mono font-bold truncate max-w-[140px]"
                          title={`Promise-to-Pay Confirmed: ${txn.promise_to_pay_date}`}
                        >
                          <Calendar className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="truncate">PTP: {txn.promise_to_pay_date}</span>
                        </span>
                      )}
                    </div>
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
              );
            })
          )}
          </tbody>
        </table>
      </div>

      {/* Keyboard Shortcut Status Bar */}
      <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-zinc-50/90 dark:bg-[#0c0c0e] border-t border-zinc-200 dark:border-[#27272a] text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
        <div className="flex items-center gap-3">
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded text-[10px]">j</kbd> / <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded text-[10px]">k</kbd> Navigate rows</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded text-[10px]">x</kbd> Select row</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded text-[10px]">r</kbd> Retry row</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded text-[10px]">/</kbd> Focus search</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded text-[10px]">esc</kbd> Dismiss</span>
        </div>
        <div>
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
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
