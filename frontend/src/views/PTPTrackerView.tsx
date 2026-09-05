import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Phone,
  ExternalLink,
  Send,
  Search,
  RefreshCw,
  Check,
  Loader2,
} from 'lucide-react';
import { VoiceCallModal } from '../components/VoiceCallModal';
import { RecoverySchedulerCard } from '../components/RecoverySchedulerCard';

export interface PTPRecord {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  recovered_amount?: number;
  status: string;
  ptp_status: 'PENDING' | 'FULFILLED' | 'BREACHED' | string;
  promise_to_pay_date?: string | null;
  root_cause_discovery: string;
  customer_intent: string;
  recovery_channel: string;
  recovery_link?: string | null;
  discount_applied_percent: number;
  ptp_reminder_sent: boolean;
  dispatch_scheduled_at?: string | null;
  voice_call_transcript?: string | null;
  created_at: string;
}

export interface PTPAnalyticsResponse {
  summary: {
    total_commitments: number;
    active_commitments: number;
    fulfilled_commitments: number;
    breached_commitments: number;
    total_committed_revenue: number;
    recovered_committed_revenue: number;
    at_risk_committed_revenue: number;
    recovery_rate_percent: number;
    windows: {
      today: number;
      tomorrow: number;
      next_3_days: number;
      payday: number;
      breached: number;
    };
  };
  records: PTPRecord[];
}

interface PTPTrackerViewProps {
  onSimulatePay: (id: string) => Promise<void> | void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info' | 'loading') => void;
}

type WindowFilter = 'all' | 'today' | 'tomorrow' | 'next_3_days' | 'payday' | 'breached';
type StatusFilter = 'ALL' | 'PENDING' | 'FULFILLED' | 'BREACHED';

export const PTPTrackerView: React.FC<PTPTrackerViewProps> = ({
  onSimulatePay,
  showNotification,
}) => {
  const [data, setData] = useState<PTPAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [remindingIds, setRemindingIds] = useState<Record<string, boolean>>({});
  const [fulfillingIds, setFulfillingIds] = useState<Record<string, boolean>>({});

  // Voice Modal State
  const [selectedVoiceSession, setSelectedVoiceSession] = useState<any>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const fetchPtpData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/ptp/analytics');
      if (!res.ok) throw new Error(`Failed to fetch PTP analytics: ${res.status}`);
      const json: PTPAnalyticsResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error fetching PTP analytics:', err);
      if (showNotification) {
        showNotification('Failed to load Promise-to-Pay analytics.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchPtpData();
  }, [fetchPtpData]);

  // Filter records based on window, status, and search query
  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];

    return data.records.filter((rec) => {
      // Status filter
      if (statusFilter !== 'ALL' && rec.ptp_status !== statusFilter) {
        return false;
      }

      // Liquidity Window filter
      const pDate = (rec.promise_to_pay_date || '').toLowerCase();
      if (windowFilter === 'today' && !pDate.includes('today') && !pDate.includes('urgent')) {
        return false;
      }
      if (windowFilter === 'tomorrow' && !pDate.includes('tomorrow') && !pDate.includes('next day')) {
        return false;
      }
      if (windowFilter === 'payday' && !pDate.includes('salary') && !pDate.includes('1st') && !pDate.includes('payday') && !pDate.includes('3rd')) {
        return false;
      }
      if (windowFilter === 'breached' && rec.ptp_status !== 'BREACHED') {
        return false;
      }
      if (windowFilter === 'next_3_days') {
        if (pDate.includes('today') || pDate.includes('tomorrow') || pDate.includes('salary') || rec.ptp_status === 'BREACHED') {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = rec.customer_name.toLowerCase().includes(q);
        const matchPhone = rec.customer_phone.toLowerCase().includes(q);
        const matchEmail = rec.customer_email.toLowerCase().includes(q);
        const matchOrder = rec.order_id.toLowerCase().includes(q);
        const matchDiscovery = rec.root_cause_discovery.toLowerCase().includes(q);
        const matchIntent = rec.customer_intent.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchOrder && !matchDiscovery && !matchIntent) {
          return false;
        }
      }

      return true;
    });
  }, [data?.records, windowFilter, statusFilter, searchQuery]);

  const handleSendReminder = async (rec: PTPRecord) => {
    setRemindingIds((prev) => ({ ...prev, [rec.id]: true }));
    try {
      const res = await fetch(`/api/ptp/transactions/${rec.id}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: rec.recovery_channel || 'whatsapp' }),
      });
      if (!res.ok) throw new Error(`Reminder dispatch failed: ${res.status}`);
      const resJson = await res.json();

      // Optimistically mark reminder as sent
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          records: prev.records.map((r) =>
            r.id === rec.id ? { ...r, ptp_reminder_sent: true } : r
          ),
        };
      });

      if (showNotification) {
        showNotification(resJson.message || `Reminder sent to ${rec.customer_name}!`, 'success');
      }
    } catch (err: any) {
      console.error('Error sending PTP reminder:', err);
      if (showNotification) {
        showNotification(`Failed to send reminder to ${rec.customer_name}`, 'error');
      }
    } finally {
      setRemindingIds((prev) => ({ ...prev, [rec.id]: false }));
    }
  };

  const handleFulfillCommitment = async (rec: PTPRecord) => {
    setFulfillingIds((prev) => ({ ...prev, [rec.id]: true }));
    try {
      await onSimulatePay(rec.id);

      // Also trigger status update
      await fetch(`/api/ptp/transactions/${rec.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FULFILLED' }),
      });

      if (showNotification) {
        showNotification(`Commitment fulfilled! ₹${rec.amount.toLocaleString('en-IN')} recovered.`, 'success');
      }
      await fetchPtpData(true);
    } catch (err: any) {
      console.error('Error fulfilling commitment:', err);
      if (showNotification) {
        showNotification('Failed to fulfill commitment.', 'error');
      }
    } finally {
      setFulfillingIds((prev) => ({ ...prev, [rec.id]: false }));
    }
  };

  const handleOpenVoiceTranscript = (rec: PTPRecord) => {
    if (rec.voice_call_transcript) {
      try {
        const transcriptObj = JSON.parse(rec.voice_call_transcript);
        setSelectedVoiceSession({
          call_id: transcriptObj.call_id || `call_${rec.id.slice(0, 8)}`,
          transaction_id: rec.id,
          customer_name: rec.customer_name,
          customer_phone: rec.customer_phone,
          customer_email: rec.customer_email,
          order_amount: rec.amount,
          discount_offered: rec.discount_applied_percent,
          dialogue: transcriptObj.dialogue || [],
          customer_intent: rec.customer_intent || transcriptObj.customer_intent || 'PROMISE_TO_PAY',
          promise_to_pay_date: rec.promise_to_pay_date || transcriptObj.promise_to_pay_date,
          call_outcome: rec.ptp_status === 'FULFILLED' ? 'FULFILLED' : (rec.ptp_status === 'BREACHED' ? 'BREACHED' : 'PROMISED'),
          call_duration_seconds: transcriptObj.call_duration_seconds || 75,
          sms_payment_link_triggered: !!rec.recovery_link,
          failure_reason: rec.root_cause_discovery,
        });
        setIsVoiceModalOpen(true);
        return;
      } catch (e) {
        console.error('Failed to parse voice transcript JSON:', e);
      }
    }

    // Synthesize fallback session
    setSelectedVoiceSession({
      call_id: `call_${rec.id.slice(0, 8)}`,
      transaction_id: rec.id,
      customer_name: rec.customer_name,
      customer_phone: rec.customer_phone,
      customer_email: rec.customer_email,
      order_amount: rec.amount,
      discount_offered: rec.discount_applied_percent,
      dialogue: [
        {
          speaker: 'agent',
          text: `Namaste ${rec.customer_name.split(' ')[0]} ji, Priya calling from Shark Recovery. We noticed your checkout couldn't be completed.`,
        },
        {
          speaker: 'customer',
          text: rec.root_cause_discovery || 'Haan Priya, hamara liquidity window adjust ho raha hai.',
        },
        {
          speaker: 'agent',
          text: `Samajh sakti hoon! Humne aapka order reserve kiya hai aur ${rec.promise_to_pay_date || 'scheduled time'} ka commitment lock kar diya hai.`,
        },
      ],
      customer_intent: rec.customer_intent,
      promise_to_pay_date: rec.promise_to_pay_date,
      call_outcome: rec.ptp_status,
      call_duration_seconds: 60,
      sms_payment_link_triggered: !!rec.recovery_link,
      failure_reason: rec.root_cause_discovery,
    });
    setIsVoiceModalOpen(true);
  };

  const summary = data?.summary || {
    total_commitments: 0,
    active_commitments: 0,
    fulfilled_commitments: 0,
    breached_commitments: 0,
    total_committed_revenue: 0,
    recovered_committed_revenue: 0,
    at_risk_committed_revenue: 0,
    recovery_rate_percent: 0,
    windows: { today: 0, tomorrow: 0, next_3_days: 0, payday: 0, breached: 0 },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs transition-colors">
        <div className="space-y-1">
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <span>Promise-to-Pay (PTP) Commitment Tracker</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading max-w-3xl leading-relaxed">
            Monitor, screen, and convert deferred liquidity commitments locked via Priya Hinglish Voice AI and multi-turn outreach. Automates smart reminder dispatches before payment deadlines expire.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => fetchPtpData(true)}
            disabled={refreshing || loading}
            aria-label="Refresh PTP commitments"
            className="h-9 px-3 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a] text-xs font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-rzp"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-600 dark:text-purple-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Commitments */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-4 sm:p-5 shadow-xs transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-mono font-medium">
            <span>Total Locked Commitments</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-zinc-900 dark:text-white">
              {summary.total_commitments}
            </span>
            <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">
              (₹{summary.total_committed_revenue.toLocaleString('en-IN')})
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading flex items-center gap-1">
            <span>Customer commitments secured across all channels</span>
          </div>
        </div>

        {/* Card 2: In-Flight Pipeline */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-4 sm:p-5 shadow-xs transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-mono font-medium">
            <span>Active Liquidity Pipeline</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-amber-600 dark:text-amber-400">
              {summary.active_commitments}
            </span>
            <span className="text-xs font-mono font-semibold text-amber-700/80 dark:text-amber-400/80">
              ₹{summary.at_risk_committed_revenue.toLocaleString('en-IN')} pending
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Awaiting liquidity event or scheduled window</span>
          </div>
        </div>

        {/* Card 3: Recovered Commitments */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-4 sm:p-5 shadow-xs transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-mono font-medium">
            <span>Fulfilled / Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
              {summary.fulfilled_commitments}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-700/80 dark:text-emerald-400/80">
              ₹{summary.recovered_committed_revenue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-subheading font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{summary.recovery_rate_percent}% commitment fulfillment rate</span>
          </div>
        </div>

        {/* Card 4: Breached Commitments */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-4 sm:p-5 shadow-xs transition-colors space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-mono font-medium">
            <span>Breached / Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-rose-600 dark:text-rose-400">
              {summary.breached_commitments}
            </span>
            <span className="text-xs font-mono font-semibold text-rose-700/80 dark:text-rose-400/80">
              {summary.breached_commitments > 0 ? 'Urgent retarget needed' : 'Zero breaches'}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-subheading flex items-center gap-1">
            <span>Deadline expired without payment confirmation</span>
          </div>
        </div>
      </div>

      {/* 2.5 Autonomous Recovery Scheduler Engine & Live Telemetry */}
      <RecoverySchedulerCard
        onTickCompleted={() => fetchPtpData(true)}
        showNotification={showNotification}
      />

      {/* 3. Liquidity Window Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mr-1 select-none">
          Liquidity Window:
        </span>

        <button
          type="button"
          onClick={() => setWindowFilter('all')}
          className={`px-3 py-1.5 rounded-full font-subheading font-semibold transition-colors cursor-pointer shrink-0 focus-rzp ${
            windowFilter === 'all'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#27272a]'
          }`}
        >
          All Windows ({summary.total_commitments})
        </button>

        <button
          type="button"
          onClick={() => setWindowFilter('today')}
          className={`px-3 py-1.5 rounded-full font-subheading font-semibold transition-colors cursor-pointer shrink-0 focus-rzp ${
            windowFilter === 'today'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#27272a]'
          }`}
        >
          ⚡ Today / Urgent ({summary.windows.today})
        </button>

        <button
          type="button"
          onClick={() => setWindowFilter('tomorrow')}
          className={`px-3 py-1.5 rounded-full font-subheading font-semibold transition-colors cursor-pointer shrink-0 focus-rzp ${
            windowFilter === 'tomorrow'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#27272a]'
          }`}
        >
          🌅 Tomorrow ({summary.windows.tomorrow})
        </button>

        <button
          type="button"
          onClick={() => setWindowFilter('next_3_days')}
          className={`px-3 py-1.5 rounded-full font-subheading font-semibold transition-colors cursor-pointer shrink-0 focus-rzp ${
            windowFilter === 'next_3_days'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#27272a]'
          }`}
        >
          📅 Next 3-5 Days ({summary.windows.next_3_days})
        </button>

        <button
          type="button"
          onClick={() => setWindowFilter('payday')}
          className={`px-3 py-1.5 rounded-full font-subheading font-semibold transition-colors cursor-pointer shrink-0 focus-rzp ${
            windowFilter === 'payday'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#27272a]'
          }`}
        >
          💰 Payday Cycle (1st-5th) ({summary.windows.payday})
        </button>

        <button
          type="button"
          onClick={() => setWindowFilter('breached')}
          className={`px-3 py-1.5 rounded-full font-subheading font-semibold transition-colors cursor-pointer shrink-0 focus-rzp ${
            windowFilter === 'breached'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#27272a]'
          }`}
        >
          ⚠️ Breached ({summary.windows.breached})
        </button>
      </div>

      {/* 4. Filter Toolbar & Search Bar */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, phone, intent, or discovery..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white placeholder-zinc-400 focus-rzp"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'FULFILLED', 'BREACHED'] as StatusFilter[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`h-7 px-2.5 rounded text-[11px] font-subheading font-semibold transition-colors cursor-pointer shrink-0 focus-rzp ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {st === 'ALL' && 'All Dispositions'}
              {st === 'PENDING' && 'In-Flight Commitments'}
              {st === 'FULFILLED' && 'Fulfilled'}
              {st === 'BREACHED' && 'Breached'}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Commitments List / Ledger */}
      {loading ? (
        <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-subheading font-medium">Loading Promise-to-Pay commitments...</span>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="py-14 text-center rounded-lg border border-dashed border-zinc-200 dark:border-[#27272a] bg-white/50 dark:bg-[#121215]/50 p-6 space-y-2">
          <CalendarCheck className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="font-heading font-bold text-sm text-zinc-800 dark:text-zinc-200">No Promise-to-Pay commitments found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto font-subheading">
            No records matched your selected liquidity window or search filter. Clear filters or trigger recovery calls to screen customer commitments.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((rec) => {
            const isFulfilled = rec.ptp_status === 'FULFILLED' || rec.status === 'recovered';
            const isBreached = rec.ptp_status === 'BREACHED';
            const isPending = !isFulfilled && !isBreached;

            return (
              <div
                key={rec.id}
                className={`bg-white dark:bg-[#121215] border rounded-lg p-4 sm:p-5 shadow-xs transition-all hover:border-purple-300 dark:hover:border-purple-800/60 ${
                  isBreached
                    ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/10'
                    : isFulfilled
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10'
                    : 'border-zinc-200 dark:border-[#27272a]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Customer Info & Commitment Target */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                        {rec.customer_name}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                        {rec.customer_phone}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 truncate max-w-[200px]">
                        {rec.customer_email}
                      </span>

                      {/* Status Tag */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-mono font-bold">
                          <Clock className="w-2.5 h-2.5 animate-pulse" />
                          <span>Active Commitment</span>
                        </span>
                      )}
                      {isFulfilled && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-mono font-bold">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Fulfilled & Captured</span>
                        </span>
                      )}
                      {isBreached && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[10px] font-mono font-bold">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Deadline Breached</span>
                        </span>
                      )}
                    </div>

                    {/* Discovery & Intent Box */}
                    <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-[#27272a] space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="uppercase font-bold text-zinc-400">Root Cause Discovery:</span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-100/80 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">
                          {rec.customer_intent.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 font-subheading leading-relaxed italic">
                        "{rec.root_cause_discovery}"
                      </p>
                    </div>

                    {/* Channel & Link Info */}
                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      <span>Channel: <strong className="text-zinc-700 dark:text-zinc-300 uppercase">{rec.recovery_channel}</strong></span>
                      {rec.discount_applied_percent > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          ({rec.discount_applied_percent}% Incentive)
                        </span>
                      )}
                      {rec.ptp_reminder_sent && (
                        <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Check className="w-3 h-3" />
                          <span>Reminder Dispatched</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Target Date, Amount & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                    <div className="text-left lg:text-right space-y-1">
                      <div className="text-[10px] uppercase font-mono font-bold text-zinc-400">
                        Promised Liquidity Target
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3 text-purple-500 shrink-0" />
                        <span>{rec.promise_to_pay_date || 'Immediate'}</span>
                      </div>
                      <div className="text-sm font-mono font-black text-zinc-900 dark:text-white pt-1">
                        ₹{rec.amount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Voice AI Transcript & Playback Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenVoiceTranscript(rec)}
                        className="h-8 px-2.5 rounded-md bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-rzp"
                        title="View Hinglish Voice Transcript & Kokoro Audio"
                      >
                        <Phone className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>Voice AI Log</span>
                      </button>

                      {/* Reminder Button */}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleSendReminder(rec)}
                          disabled={remindingIds[rec.id]}
                          className="h-8 px-2.5 rounded-md bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-rzp"
                          title="Send Contextual Reminder via WhatsApp / SMS"
                        >
                          <Send className={`w-3 h-3 ${remindingIds[rec.id] ? 'animate-spin' : ''}`} />
                          <span>{remindingIds[rec.id] ? 'Sending...' : 'Send Reminder'}</span>
                        </button>
                      )}

                      {/* Fulfill / Pay Button */}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleFulfillCommitment(rec)}
                          disabled={fulfillingIds[rec.id]}
                          className="h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-subheading font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-rzp shadow-xs"
                          title="Simulate customer fulfilling promise-to-pay via link"
                        >
                          <CheckCircle2 className={`w-3 h-3 ${fulfillingIds[rec.id] ? 'animate-spin' : ''}`} />
                          <span>{fulfillingIds[rec.id] ? 'Capturing...' : 'Mark Fulfilled'}</span>
                        </button>
                      )}

                      {/* Razorpay Link */}
                      {rec.recovery_link && (
                        <a
                          href={rec.recovery_link}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 w-8 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-[#27272a] inline-flex items-center justify-center transition-colors focus-rzp"
                          title="Open Razorpay Checkout Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Voice Call & Transcript Modal */}
      <VoiceCallModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        sessionData={selectedVoiceSession}
      />
    </div>
  );
};
