import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  RefreshCw,
  ExternalLink,
  CheckCheck,
  Tag,
  Clock,
  ShieldCheck,
  Search,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  User,
  Lock,
  Smile,
  Paperclip,
  Mic,
} from 'lucide-react';
import type { WhatsAppMessage } from '../types';
import { formatToIST } from '../utils/date';

interface WhatsAppFeedViewProps {
  onSimulatePay?: (transactionId: string) => Promise<void> | void;
  showNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

export const WhatsAppFeedView: React.FC<WhatsAppFeedViewProps> = ({
  onSimulatePay,
  showNotification,
}) => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp-feed?limit=50');
      if (res.ok) {
        const data: WhatsAppMessage[] = await res.json();
        setMessages(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching WhatsApp feed:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchFeed();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  const filtered = messages.filter(
    (m) =>
      m.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.recipient_phone.includes(searchQuery) ||
      m.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMsg = messages.find((m) => m.id === selectedId) || filtered[0] || null;

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    showNotification?.('📋 Payment link copied to clipboard!', 'info', 2500);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handlePay = async (txnId: string) => {
    if (!txnId || txnId.startsWith('unknown')) return;
    setPayingId(txnId);
    try {
      if (onSimulatePay) {
        await onSimulatePay(txnId);
      } else {
        const res = await fetch(`/api/transactions/${txnId}/mark-recovered`, { method: 'POST' });
        if (res.ok) {
          showNotification?.(`🎉 Payment recovered for ${txnId}!`, 'success', 4000);
          await fetchFeed();
        }
      }
    } catch (err) {
      console.error('Payment simulation error:', err);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg px-4 py-3 sm:px-5 sm:py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white">
              WhatsApp Outreach Feed & Simulator
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading">
            Live stream of autonomous WhatsApp payment recovery outreach messages.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchFeed()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#202024] border border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Device Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Dispatches List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg shadow-xs overflow-hidden flex flex-col h-[540px] xl:h-[580px]">
          {/* Search Header */}
          <div className="p-3 border-b border-zinc-200 dark:border-[#27272a] bg-zinc-50/70 dark:bg-[#151518]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contact, phone or txn..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-md outline-none focus:border-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
              />
            </div>
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
              <span>{filtered.length} Dispatches Recorded</span>
              <span>Auto-refresh: 8s</span>
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-100 dark:divide-[#1f1f23]">
            {filtered.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-zinc-400 dark:text-zinc-500">
                <AlertCircle className="w-6 h-6 mx-auto stroke-1" />
                <p className="text-xs">No WhatsApp outreach logged yet.</p>
                <p className="text-[11px]">Run a failure simulation or benchmark to generate dispatches.</p>
              </div>
            ) : (
              filtered.map((msg) => {
                const isSelected = selectedMsg?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => setSelectedId(msg.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-[#18231c] border-l-4 border-l-emerald-600 dark:border-l-emerald-500'
                        : 'hover:bg-zinc-50 dark:hover:bg-[#161619]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                      {msg.customer_name.slice(0, 2).toUpperCase() || 'CU'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {msg.customer_name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                          {msg.sent_at ? formatToIST(msg.sent_at) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                        {msg.recipient_phone}
                      </p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-1">
                        {msg.message.split('\n')[0]}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {msg.discount_percentage > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                            <Tag className="w-2.5 h-2.5" />
                            {msg.discount_percentage}% OFF
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" />
                          Delivered
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive WhatsApp Replica (7 cols) */}
        <div className="lg:col-span-7 bg-[#efeae2] dark:bg-[#0c1317] border border-zinc-300 dark:border-[#27272a] rounded-lg shadow-md overflow-hidden flex flex-col h-[540px] xl:h-[580px] relative">
          {/* WhatsApp Header Bar */}
          <div className="bg-[#008069] dark:bg-[#1f2c34] text-white px-4 py-3 flex items-center justify-between shadow-xs z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold leading-tight">
                    {selectedMsg ? selectedMsg.customer_name : 'Select a customer'}
                  </h3>
                  <span title="Verified Merchant Business" className="inline-flex">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 font-mono">
                  {selectedMsg ? selectedMsg.recipient_phone : '+91 ••••• •••••'}
                </p>
              </div>
            </div>

            {selectedMsg && (
              <div className="text-right">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20 text-white/90">
                  Txn: {selectedMsg.transaction_id.slice(0, 12)}
                </span>
              </div>
            )}
          </div>

          {/* WhatsApp Message Container */}
          <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[#efeae2] dark:bg-[#0b141a] bg-opacity-95 overscroll-contain">
            {/* End-to-end encryption notice pill */}
            <div className="text-center my-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-medium bg-[#ffeecd] dark:bg-[#182229] text-[#54656f] dark:text-[#ffd279] shadow-2xs">
                <Lock className="w-3 h-3 text-[#54656f] dark:text-[#ffd279] shrink-0" />
                Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
              </span>
            </div>

            {selectedMsg ? (
              <div className="space-y-3">
                {/* Agent Outbound Message Bubble */}
                <div className="flex justify-start">
                  <div className="max-w-[88%] sm:max-w-[78%] bg-white dark:bg-[#202c33] text-zinc-900 dark:text-zinc-100 rounded-lg rounded-tl-none p-3.5 shadow-sm border border-black/5 dark:border-white/5 space-y-3">
                    {/* Header line */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-700/50 pb-2">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Shark Recovery
                      </span>
                      {selectedMsg.discount_percentage > 0 && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {selectedMsg.discount_percentage}% Auto-Applied
                        </span>
                      )}
                    </div>

                    {/* Message Body */}
                    <p className="text-xs sm:text-sm font-body leading-relaxed whitespace-pre-line text-zinc-800 dark:text-zinc-200">
                      {selectedMsg.message}
                    </p>

                    {/* Razorpay 1-Click Interactive Recovery Action Card */}
                    {selectedMsg.payment_link && (
                      <div className="bg-zinc-50 dark:bg-[#111b21] border border-zinc-200 dark:border-zinc-700/60 rounded-md p-3 space-y-2.5 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" />
                            Razorpay Quick Payment Link
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">1-Click UPI/Cards</span>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#1a2329] p-2 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-blue-600 dark:text-blue-400 truncate">
                          <span className="truncate">{selectedMsg.payment_link}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(selectedMsg.payment_link!)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                            title="Copy link"
                          >
                            {copiedLink === selectedMsg.payment_link ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handlePay(selectedMsg.transaction_id)}
                            disabled={payingId === selectedMsg.transaction_id}
                            className="flex-1 py-2 px-3 rounded text-xs font-bold bg-[#008069] hover:bg-[#00705c] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <CheckCheck className="w-4 h-4" />
                            <span>
                              {payingId === selectedMsg.transaction_id
                                ? 'Simulating Settlement...'
                                : 'Complete Payment'}
                            </span>
                          </button>

                          <a
                            href={selectedMsg.payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
                            title="Open Razorpay Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 font-mono pt-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{selectedMsg.sent_at ? formatToIST(selectedMsg.sent_at) : 'Just now'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8 text-zinc-400">
                <div className="space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto stroke-1 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium">Select a conversation from the left to view outreach details.</p>
                </div>
              </div>
            )}
          </div>

          {/* Authentic WhatsApp Message Input Bar */}
          <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-3.5 py-2 flex items-center gap-2.5 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
            <button
              type="button"
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-1"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-1"
              title="Attach"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-white dark:bg-[#111b21] rounded-lg px-3 py-1.5 border border-zinc-200 dark:border-zinc-700">
              <input
                type="text"
                placeholder="Type a message"
                className="w-full bg-transparent outline-none text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
              />
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#00705c] text-white flex items-center justify-center cursor-pointer shadow-xs shrink-0"
              title="Voice Message"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
