import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  ShieldCheck,
  Search,
  Copy,
  Check,
  Layers,
  X,
  Radio,
  Activity,
  Sparkles,
  Phone,
  Repeat,
  Building2,
  CreditCard,
  MessageSquare,
  Mail,
  ExternalLink,
  Terminal,
  Zap,
} from 'lucide-react';
import type { AuditLogItem } from '../types';
import { formatToIST, formatFullIST } from '../utils/date';
import { formatIndianCurrency, formatIndianWords } from '../utils/currency';
import { VoiceCallModal } from './VoiceCallModal';

interface AuditLogTimelineProps {
  logs: AuditLogItem[];
}

interface AgentMeta {
  icon: React.ElementType;
  label: string;
  badgeClass: string;
  dotColor: string;
}

const getAgentMeta = (agentName: string): AgentMeta => {
  const norm = agentName.toLowerCase();
  if (norm.includes('sentinel')) {
    return {
      icon: Radio,
      label: 'Sentinel Telemetry',
      badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      dotColor: 'bg-cyan-500',
    };
  }
  if (norm.includes('diagnostic')) {
    return {
      icon: Activity,
      label: 'Diagnostic Triage',
      badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      dotColor: 'bg-indigo-500',
    };
  }
  if (norm.includes('compliance') || norm.includes('guardian')) {
    return {
      icon: ShieldCheck,
      label: 'Guardian Compliance',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dotColor: 'bg-emerald-500',
    };
  }
  if (norm.includes('strategy')) {
    return {
      icon: Sparkles,
      label: 'Master Strategy',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dotColor: 'bg-amber-500',
    };
  }
  if (norm.includes('voice') || norm.includes('hinglish')) {
    return {
      icon: Phone,
      label: 'Hinglish Voice AI',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dotColor: 'bg-rose-500',
    };
  }
  if (norm.includes('mandate')) {
    return {
      icon: Repeat,
      label: 'Mandate Sequencer',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      dotColor: 'bg-blue-500',
    };
  }
  if (norm.includes('b2b') || norm.includes('receivable')) {
    return {
      icon: Building2,
      label: 'B2B Receivables',
      badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      dotColor: 'bg-teal-500',
    };
  }
  if (norm.includes('razorpay') || norm.includes('link')) {
    return {
      icon: CreditCard,
      label: 'Razorpay Links',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      dotColor: 'bg-blue-500',
    };
  }
  if (norm.includes('whatsapp') || norm.includes('twilio')) {
    return {
      icon: MessageSquare,
      label: 'WhatsApp Outreach',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dotColor: 'bg-emerald-500',
    };
  }
  if (norm.includes('smtp') || norm.includes('email')) {
    return {
      icon: Mail,
      label: 'Email Outreach',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dotColor: 'bg-amber-500',
    };
  }
  return {
    icon: Terminal,
    label: agentName,
    badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    dotColor: 'bg-zinc-500',
  };
};

interface ParsedIntelligence {
  headline: string;
  keyValues: { label: string; value: string; highlight?: boolean }[];
  messageBody?: string;
  paymentUrl?: string;
  voiceSessionData?: any;
}

const parsePayloadIntelligence = (log: AuditLogItem): ParsedIntelligence => {
  let outputObj: Record<string, any> = {};
  let inputObj: Record<string, any> = {};

  try {
    if (log.output_payload) {
      outputObj = typeof log.output_payload === 'string' ? JSON.parse(log.output_payload) : log.output_payload;
    }
  } catch {}

  try {
    if (log.input_payload) {
      inputObj = typeof log.input_payload === 'string' ? JSON.parse(log.input_payload) : log.input_payload;
    }
  } catch {}

  const keyValues: { label: string; value: string; highlight?: boolean }[] = [];
  let headline = log.action_type.replace(/_/g, ' ').toUpperCase();
  let messageBody: string | undefined;
  let paymentUrl: string | undefined;
  let voiceSessionData: any | undefined;

  // Hinglish Voice AI Call
  if (
    outputObj.dialogue ||
    outputObj.call_id ||
    log.agent_name.toLowerCase().includes('voice') ||
    log.action_type === 'VOICE_CALL_DISPATCHED'
  ) {
    headline = `Voice AI Outreach${outputObj.customer_intent ? `: ${outputObj.customer_intent.replace(/_/g, ' ').toUpperCase()}` : ''}`;
    if (outputObj.call_id) keyValues.push({ label: 'Call ID', value: String(outputObj.call_id), highlight: true });
    if (outputObj.call_duration_seconds !== undefined) keyValues.push({ label: 'Duration', value: `${outputObj.call_duration_seconds}s` });
    const voiceDisc = outputObj.discount_offered ?? outputObj.discount_percent ?? outputObj.discount_percentage;
    if (voiceDisc !== undefined) keyValues.push({ label: 'Discount', value: `${voiceDisc}%` });
    if (outputObj.promise_to_pay_date) keyValues.push({ label: 'Promise Date', value: String(outputObj.promise_to_pay_date) });
    if (outputObj.call_outcome) messageBody = String(outputObj.call_outcome);
    if (outputObj.dialogue && Array.isArray(outputObj.dialogue)) {
      voiceSessionData = outputObj;
    }
  }

  // Diagnostic Agent
  if (outputObj.failure_category || outputObj.root_cause) {
    if (outputObj.failure_category) {
      headline = `Root Cause: ${String(outputObj.failure_category).replace(/_/g, ' ').toUpperCase()}`;
      keyValues.push({ label: 'Category', value: String(outputObj.failure_category), highlight: true });
    }
    if (outputObj.risk_score !== undefined) {
      keyValues.push({ label: 'Risk Score', value: Number(outputObj.risk_score).toFixed(2) });
    }
    if (outputObj.can_retry !== undefined) {
      keyValues.push({ label: 'Retryable', value: outputObj.can_retry ? 'YES' : 'NO', highlight: !outputObj.can_retry });
    }
    if (outputObj.recommended_action) {
      messageBody = String(outputObj.recommended_action);
    }
  }

  // Strategy Agent
  const discountVal = outputObj.discount_percentage ?? outputObj.discount_percent ?? outputObj.discount;
  if (outputObj.channel || discountVal !== undefined || outputObj.offer_code || log.agent_name === 'StrategyAgent' || log.action_type === 'STRATEGY_DECIDED') {
    const discNum = discountVal !== undefined && discountVal !== null ? Number(discountVal) : 0;
    headline = `Strategy: ${outputObj.channel ? String(outputObj.channel).toUpperCase() : 'Multi-Channel'} with ${discNum}% Incentive`;
    if (outputObj.channel) keyValues.push({ label: 'Channel', value: String(outputObj.channel).toUpperCase(), highlight: true });
    if (discountVal !== undefined && discountVal !== null) keyValues.push({ label: 'Discount', value: `${discNum}%` });
    if (outputObj.offer_code) keyValues.push({ label: 'Coupon', value: String(outputObj.offer_code) });
    if (outputObj.rationale || outputObj.reasoning) messageBody = String(outputObj.rationale || outputObj.reasoning);
  }

  // Payment Link
  if (outputObj.short_url || outputObj.link_id || inputObj.amount) {
    const amt = outputObj.amount || inputObj.amount;
    const formattedAmt = amt
      ? `${formatIndianCurrency(Number(amt), { decimals: 0 })}${Number(amt) >= 1000 ? ` (${formatIndianWords(Number(amt))})` : ''}`
      : '';
    headline = `Payment Link Generated${formattedAmt ? ` (${formattedAmt})` : ''}`;
    if (formattedAmt) keyValues.push({ label: 'Amount', value: formattedAmt, highlight: true });
    if (outputObj.short_url) {
      paymentUrl = String(outputObj.short_url);
      keyValues.push({ label: 'Link URL', value: paymentUrl });
    }
    if (outputObj.status) keyValues.push({ label: 'Link Status', value: String(outputObj.status).toUpperCase() });
  }

  // WhatsApp / Email Outreach
  if ((outputObj.delivered !== undefined || outputObj.mode || inputObj.recipient_phone || inputObj.recipient_email) && !log.agent_name.toLowerCase().includes('voice')) {
    const recipient = inputObj.recipient_phone || inputObj.recipient_email || outputObj.recipient;
    headline = `Dispatched Outreach via ${log.agent_name.includes('WhatsApp') ? 'WhatsApp' : 'Email'}`;
    if (recipient) keyValues.push({ label: 'Recipient', value: String(recipient), highlight: true });
    if (outputObj.delivered !== undefined) keyValues.push({ label: 'Delivered', value: outputObj.delivered ? 'YES' : 'FALLBACK' });
    if (outputObj.message || inputObj.message) messageBody = String(outputObj.message || inputObj.message);
  }

  // Compliance Gating
  if (outputObj.is_compliant !== undefined || outputObj.stopping_rule_triggered !== undefined) {
    const passed = outputObj.is_compliant;
    headline = passed ? 'Compliance Gate: Cleared' : `Compliance Block: ${outputObj.rejection_reason || 'Safety Ceiling'}`;
    keyValues.push({ label: 'Gating Result', value: passed ? 'PASSED' : 'BLOCKED', highlight: !passed });
    if (outputObj.rejection_reason) keyValues.push({ label: 'Rule', value: String(outputObj.rejection_reason) });
    if (outputObj.compliance_notes) messageBody = String(outputObj.compliance_notes);
  }

  // Fallback if no specific format
  if (keyValues.length === 0 && log.output_payload) {
    if (typeof outputObj === 'object' && Object.keys(outputObj).length > 0) {
      Object.entries(outputObj).slice(0, 3).forEach(([k, v]) => {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          keyValues.push({ label: k.replace(/_/g, ' '), value: String(v) });
        }
      });
    }
  }

  return { headline, keyValues, messageBody, paymentUrl, voiceSessionData };
};

export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ logs }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTabs, setActiveTabs] = useState<Record<string, 'intel' | 'input' | 'output' | 'meta'>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure' | 'skipped'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedVoiceSession, setSelectedVoiceSession] = useState<any | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Toggle individual step
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all steps
  const toggleExpandAll = () => {
    if (expandedIds.size === filteredLogs.length && filteredLogs.length > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredLogs.map((l) => l.id)));
    }
  };

  // Copy helper with visual feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Safe JSON formatting
  const formatJson = (content: string | null | undefined): string => {
    if (!content) return '';
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  };

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: logs.length,
      success: logs.filter((l) => l.status.toLowerCase() === 'success').length,
      failure: logs.filter((l) => l.status.toLowerCase() === 'failure').length,
      skipped: logs.filter((l) => l.status.toLowerCase() === 'skipped').length,
    };
  }, [logs]);

  // Filter logs by search query and status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== 'all') {
        if (log.status.toLowerCase() !== statusFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAgent = log.agent_name.toLowerCase().includes(q);
        const matchAction = log.action_type.toLowerCase().includes(q);
        const matchTxn = (log.transaction_id || '').toLowerCase().includes(q);
        const matchInput = (log.input_payload || '').toLowerCase().includes(q);
        const matchOutput = (log.output_payload || '').toLowerCase().includes(q);
        if (!matchAgent && !matchAction && !matchTxn && !matchInput && !matchOutput) {
          return false;
        }
      }

      return true;
    });
  }, [logs, statusFilter, searchQuery]);

  const allExpanded = filteredLogs.length > 0 && expandedIds.size === filteredLogs.length;

  return (
    <div className="space-y-4 w-full">
      {/* Consolidated Toolbar Strip */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar with Keyboard Visual */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trace by Txn ID, Agent, or keywords..."
              aria-label="Search trace"
              className="w-full h-8 pl-8 pr-8 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md font-mono focus:outline-none focus:border-blue-500 placeholder:text-zinc-400 placeholder:font-body focus-rzp"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-1 top-0.5 w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Segmented Status Tabs & Bulk Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Segmented Control */}
            <div
              role="group"
              aria-label="Filter trace by status"
              className="inline-flex p-0.5 bg-zinc-100 dark:bg-[#18181b] rounded-md border border-zinc-200 dark:border-[#27272a]"
            >
              {(
                [
                  { id: 'all', label: 'All', count: counts.all },
                  { id: 'success', label: 'Success', count: counts.success },
                  { id: 'failure', label: 'Failed', count: counts.failure },
                  { id: 'skipped', label: 'Fallback', count: counts.skipped },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  aria-pressed={statusFilter === tab.id}
                  className={`h-7 px-2.5 rounded text-[11px] font-subheading font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer focus-rzp ${
                    statusFilter === tab.id
                      ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white font-semibold shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                      statusFilter === tab.id
                        ? 'bg-zinc-100 dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200 font-bold'
                        : 'text-zinc-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Expand / Collapse All */}
            <button
              type="button"
              onClick={toggleExpandAll}
              disabled={filteredLogs.length === 0}
              aria-label={allExpanded ? 'Collapse All' : 'Expand All'}
              className="h-8 px-2.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a] text-[11px] font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors focus-rzp"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>

            {/* Live Count Pill */}
            <span className="h-8 px-2.5 inline-flex items-center text-[11px] font-mono font-semibold rounded-md bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a]">
              {filteredLogs.length} Events
            </span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {logs.length === 0 ? (
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium space-y-2 shadow-xs">
          <Layers className="w-8 h-8 text-zinc-400 mx-auto stroke-1" aria-hidden="true" />
          <div className="font-heading font-semibold text-sm text-zinc-900 dark:text-white pt-1">
            No audit ledger entries
          </div>
          <p className="font-subheading text-xs max-w-sm mx-auto text-zinc-500 dark:text-zinc-400">
            Trigger a recovery triage or inject a failure to stream live multi-agent execution telemetry.
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-10 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium space-y-2.5 shadow-xs">
          <div>
            No logs match filter criteria:{' '}
            <span className="font-mono text-zinc-800 dark:text-zinc-200">
              "{searchQuery || statusFilter}"
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-3 py-1.5 rounded text-xs font-subheading font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors focus-rzp"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* The Obsidian Trace Stream */
        <div className="border border-zinc-200 dark:border-[#27272a] rounded-lg bg-white dark:bg-[#121215] divide-y divide-zinc-200 dark:divide-[#27272a] overflow-hidden shadow-xs">
          {filteredLogs.map((log) => {
            const isExpanded = expandedIds.has(log.id);
            const agentMeta = getAgentMeta(log.agent_name);
            const AgentIcon = agentMeta.icon;
            const intel = parsePayloadIntelligence(log);
            const formattedInput = formatJson(log.input_payload);
            const formattedOutput = formatJson(log.output_payload);
            const formattedMetadata = formatJson(log.metadata_json);
            const currentTab = activeTabs[log.id] || 'intel';

            const isSuccess = log.status.toLowerCase() === 'success';
            const isFailure = log.status.toLowerCase() === 'failure';

            return (
              <div
                key={log.id}
                className={`transition-colors ${
                  isExpanded ? 'bg-blue-500/[0.02] dark:bg-blue-500/[0.03]' : 'hover:bg-zinc-50/70 dark:hover:bg-[#18181b]/50'
                }`}
              >
                {/* Clickable Ledger Row Header */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`audit-details-${log.id}`}
                  id={`audit-header-${log.id}`}
                  onClick={() => toggleExpand(log.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(log.id);
                    }
                  }}
                  className="p-3.5 sm:p-4 cursor-pointer select-none space-y-2 focus:outline-none focus-visible:bg-zinc-100 dark:focus-visible:bg-[#18181b]"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                    {/* Left: Agent Badge, Action Pill, Txn ID */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Agent Badge with Icon */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-heading font-semibold border ${agentMeta.badgeClass}`}>
                        <AgentIcon className="w-3.5 h-3.5" />
                        <span>{agentMeta.label}</span>
                      </span>

                      {/* Action Type Chip */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a]">
                        {log.action_type}
                      </span>

                      {/* Transaction ID Pill */}
                      {log.transaction_id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(log.transaction_id || '', `txn-${log.id}`);
                          }}
                          aria-label={`Copy transaction ID ${log.transaction_id}`}
                          className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] px-1.5 py-0.5 rounded hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors focus-rzp"
                          title="Click to copy Transaction ID"
                        >
                          <span>{log.transaction_id}</span>
                          {copiedKey === `txn-${log.id}` ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-50" />
                          )}
                        </button>
                      )}

                      {/* Voice AI Transcript Playback Pill */}
                      {intel.voiceSessionData && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVoiceSession(intel.voiceSessionData);
                            setIsVoiceModalOpen(true);
                          }}
                          aria-label="Listen to Hinglish Voice AI Call Transcript"
                          className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-mono bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer transition-colors focus-rzp font-semibold"
                          title="Listen to Hinglish Voice AI Call Transcript"
                        >
                          <Phone className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
                          <span>🎙️ Play Transcript</span>
                        </button>
                      )}
                    </div>

                    {/* Right: Latency, Status Indicator, IST Time, Chevron */}
                    <div className="flex items-center gap-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono font-medium self-end lg:self-auto shrink-0 tabular-nums">
                      {/* Latency */}
                      {log.execution_duration_ms != null && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#18181b] border border-zinc-200/80 dark:border-[#27272a] text-[10px] text-zinc-700 dark:text-zinc-300">
                          <Zap className="w-2.5 h-2.5 text-amber-500" />
                          <span>{log.execution_duration_ms.toFixed(1)}ms</span>
                        </span>
                      )}

                      {/* Status Dot */}
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSuccess ? 'bg-emerald-500' : isFailure ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className={isSuccess ? 'text-emerald-600 dark:text-emerald-400' : isFailure ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                          {log.status}
                        </span>
                      </span>

                      <span className="text-zinc-400">•</span>
                      <span>{formatToIST(log.created_at)}</span>

                      <div className="w-4 h-4 flex items-center justify-center text-zinc-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* High-Contrast Excerpt Headline */}
                  <div className="flex items-center gap-2 pt-0.5 text-xs text-zinc-700 dark:text-zinc-300 font-subheading">
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {intel.headline}
                    </span>
                    {intel.keyValues.length > 0 && (
                      <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500 font-mono text-[11px]">
                        — {intel.keyValues.map((kv) => `${kv.label}: ${kv.value}`).join(' • ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded High-Density Deep Inspector */}
                {isExpanded && (
                  <div
                    id={`audit-details-${log.id}`}
                    aria-labelledby={`audit-header-${log.id}`}
                    className="px-4 pb-4 pt-3 border-t border-zinc-200 dark:border-[#27272a] space-y-3 bg-zinc-50/60 dark:bg-[#09090b]/50"
                  >
                    {/* Navigation Sub-Tabs */}
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#27272a] pb-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveTabs((prev) => ({ ...prev, [log.id]: 'intel' }))}
                          className={`px-2.5 py-1 rounded text-xs font-subheading font-medium transition-colors cursor-pointer ${
                            currentTab === 'intel'
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          Structured Analysis
                        </button>
                        {formattedOutput && (
                          <button
                            type="button"
                            onClick={() => setActiveTabs((prev) => ({ ...prev, [log.id]: 'output' }))}
                            className={`px-2.5 py-1 rounded text-xs font-subheading font-medium transition-colors cursor-pointer ${
                              currentTab === 'output'
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                          >
                            Decision JSON
                          </button>
                        )}
                        {formattedInput && (
                          <button
                            type="button"
                            onClick={() => setActiveTabs((prev) => ({ ...prev, [log.id]: 'input' }))}
                            className={`px-2.5 py-1 rounded text-xs font-subheading font-medium transition-colors cursor-pointer ${
                              currentTab === 'input'
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                          >
                            Input Payload JSON
                          </button>
                        )}
                        {formattedMetadata && (
                          <button
                            type="button"
                            onClick={() => setActiveTabs((prev) => ({ ...prev, [log.id]: 'meta' }))}
                            className={`px-2.5 py-1 rounded text-xs font-subheading font-medium transition-colors cursor-pointer ${
                              currentTab === 'meta'
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                          >
                            Metadata
                          </button>
                        )}
                      </div>

                      {/* Header Timestamp & Customer context */}
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 hidden sm:flex items-center gap-2">
                        <span>{formatFullIST(log.created_at)}</span>
                        {log.customer_id && <span>(Cust: {log.customer_id})</span>}
                      </div>
                    </div>

                    {/* Tab Content 1: Structured Intelligence Matrix */}
                    {currentTab === 'intel' && (
                      <div className="space-y-3">
                        {/* Extracted Attributes Matrix */}
                        {intel.keyValues.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {intel.keyValues.map((kv, idx) => (
                              <div
                                key={idx}
                                className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded p-2.5"
                              >
                                <div className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                                  {kv.label}
                                </div>
                                <div
                                  className={`text-xs font-mono font-bold mt-0.5 truncate ${
                                    kv.highlight
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-zinc-900 dark:text-white'
                                  }`}
                                  title={kv.value}
                                >
                                  {kv.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Executive Message / Notes Callout */}
                        {intel.messageBody && (
                          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded p-3 text-xs text-zinc-700 dark:text-zinc-300 font-subheading leading-relaxed">
                            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                              Reasoning / Action Detail:
                            </span>
                            {intel.messageBody}
                          </div>
                        )}

                        {/* Direct Payment Link Action Button */}
                        {intel.paymentUrl && (
                          <div className="flex items-center gap-2">
                            <a
                              href={intel.paymentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-rzp"
                            >
                              <span>Open Recovery Payment Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(intel.paymentUrl || '', `link-${log.id}`)}
                              className="h-8 px-2.5 rounded bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white cursor-pointer focus-rzp"
                            >
                              {copiedKey === `link-${log.id}` ? 'Copied URL' : 'Copy URL'}
                            </button>
                          </div>
                        )}

                        {/* Hinglish Voice AI Interactive Playback Button */}
                        {intel.voiceSessionData && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVoiceSession(intel.voiceSessionData);
                                setIsVoiceModalOpen(true);
                              }}
                              className="h-8 px-3.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-subheading font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs focus-rzp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Open Voice Call Interactive Player</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab Content 2: Decision Output JSON */}
                    {currentTab === 'output' && formattedOutput && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>OUTPUT JSON PAYLOAD</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(formattedOutput, `out-${log.id}`)}
                            className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                          >
                            {copiedKey === `out-${log.id}` ? (
                              <span className="text-emerald-500">Copied!</span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 rounded bg-zinc-950 dark:bg-[#09090b] text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 border border-zinc-800 dark:border-[#27272a] leading-relaxed">
                          {formattedOutput}
                        </pre>
                      </div>
                    )}

                    {/* Tab Content 3: Input Payload JSON */}
                    {currentTab === 'input' && formattedInput && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>INPUT JSON PAYLOAD</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(formattedInput, `in-${log.id}`)}
                            className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                          >
                            {copiedKey === `in-${log.id}` ? (
                              <span className="text-emerald-500">Copied!</span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 rounded bg-zinc-950 dark:bg-[#09090b] text-zinc-300 font-mono text-[11px] overflow-x-auto max-h-72 border border-zinc-800 dark:border-[#27272a] leading-relaxed">
                          {formattedInput}
                        </pre>
                      </div>
                    )}

                    {/* Tab Content 4: Metadata */}
                    {currentTab === 'meta' && formattedMetadata && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>EXECUTION METADATA</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(formattedMetadata, `meta-${log.id}`)}
                            className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                          >
                            {copiedKey === `meta-${log.id}` ? (
                              <span className="text-emerald-500">Copied!</span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 rounded bg-zinc-950 dark:bg-[#09090b] text-zinc-300 font-mono text-[11px] overflow-x-auto max-h-72 border border-zinc-800 dark:border-[#27272a] leading-relaxed">
                          {formattedMetadata}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Voice Call Playback Modal */}
      <VoiceCallModal
        isOpen={isVoiceModalOpen}
        onClose={() => {
          setIsVoiceModalOpen(false);
          setSelectedVoiceSession(null);
        }}
        sessionData={selectedVoiceSession}
      />
    </div>
  );
};
