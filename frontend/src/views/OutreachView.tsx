import React, { useState } from 'react';
import { WhatsAppMock } from '../components/WhatsAppMock';
import { MessageSquare, Mail, Sparkles, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { TransactionItem, WhatsAppMessage } from '../types';

interface OutreachViewProps {
  messages: WhatsAppMessage[];
  transactions: TransactionItem[];
  onSimulatePay: (id: string) => void;
}

export const OutreachView: React.FC<OutreachViewProps> = ({
  messages,
  transactions,
  onSimulatePay,
}) => {
  const [activeChannelTab, setActiveChannelTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  const emailDispatchedTxns = transactions.filter((t) => t.recovery_channel === 'email');
  const activeEmailTxn = emailDispatchedTxns.find((t) => t.id === selectedTxnId) || emailDispatchedTxns[0];

  return (
    <div className="space-y-6">
      {/* Top Bar with Channel Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121318] border border-white/[0.08] rounded-2xl p-6">
        <div>
          <h2 className="font-heading font-black text-xl text-white flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span>Autonomous Multi-Channel Outreach Hub</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time Twilio WhatsApp API & SMTP Gateway dispatch with personalized Hinglish copy and dynamic coupons.
          </p>
        </div>

        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/[0.08] text-xs">
          <button
            onClick={() => setActiveChannelTab('whatsapp')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold cursor-pointer transition-all ${
              activeChannelTab === 'whatsapp'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Outreach ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveChannelTab('email')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold cursor-pointer transition-all ${
              activeChannelTab === 'email'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>SMTP Email Gateway ({emailDispatchedTxns.length})</span>
          </button>
        </div>
      </div>

      {/* Channel Views */}
      {activeChannelTab === 'whatsapp' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: WhatsApp Gateway Details & Real API Status */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#121318] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Twilio WhatsApp Integration</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Prioritized for high-value mobile checkouts, UPI failures, and OTP timeouts. Dispatches via live Twilio WhatsApp API with fallback logging.
              </p>

              <div className="pt-3 border-t border-white/[0.06] space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>API Status:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-mono font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Live & Ready
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Copy Tone:</span>
                  <span className="text-white font-mono">Casual Hinglish</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Dynamic Discount:</span>
                  <span className="text-amber-400 font-mono font-semibold">0% – 15% Max</span>
                </div>
              </div>
            </div>

            <div className="bg-[#121318] border border-white/[0.08] rounded-2xl p-5 text-xs text-zinc-400 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>One-Click Payment Recovery:</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Click "Simulate Customer Payment" on any recipient message to simulate instant customer payment completion and watch Revenue At Risk decrease!
              </p>
            </div>
          </div>

          {/* Right: WhatsApp Phone View */}
          <div className="lg:col-span-2">
            <WhatsAppMock messages={messages} onSimulatePay={onSimulatePay} />
          </div>
        </div>
      ) : (
        /* Email Channel Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Dispatched email list */}
          <div className="lg:col-span-1 bg-[#121318] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[580px]">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">
              Dispatched Emails ({emailDispatchedTxns.length})
            </h4>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {emailDispatchedTxns.length === 0 ? (
                <div className="text-center py-16 text-xs text-zinc-500">
                  No emails dispatched yet.
                </div>
              ) : (
                emailDispatchedTxns.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTxnId(t.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      activeEmailTxn?.id === t.id
                        ? 'bg-zinc-800 border-blue-600 text-white shadow-sm'
                        : 'bg-black/40 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="font-semibold text-white">{t.customer_name}</div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{t.customer_email}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-1">
                      ₹{t.amount.toFixed(2)} • {t.failure_category.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Email HTML Preview */}
          <div className="lg:col-span-2 bg-[#121318] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col justify-between h-[580px]">
            {activeEmailTxn ? (
              <div className="space-y-4">
                <div className="border-b border-white/[0.06] pb-3">
                  <div className="text-xs text-zinc-400 font-mono">To: {activeEmailTxn.customer_email}</div>
                  <h3 className="font-heading font-bold text-base text-white mt-1">
                    Complete your pending payment - Order {activeEmailTxn.razorpay_order_id}
                  </h3>
                </div>

                <div className="bg-black/60 border border-white/[0.08] rounded-xl p-5 text-xs text-zinc-300 space-y-3 font-sans leading-relaxed">
                  <p>Dear {activeEmailTxn.customer_name},</p>
                  <p>
                    We noticed your recent payment of <strong>INR {activeEmailTxn.amount.toFixed(2)}</strong> was interrupted due to a {activeEmailTxn.failure_category.replace(/_/g, ' ')}.
                  </p>
                  <p>
                    Your cart has been securely preserved. You can finalize your transaction securely using the link below without re-entering checkout items:
                  </p>

                  <div className="bg-[#121318] p-4 rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-zinc-400">Payable Amount:</div>
                      <div className="font-heading font-bold text-white text-base">
                        INR {activeEmailTxn.amount.toFixed(2)}
                      </div>
                    </div>
                    {activeEmailTxn.recovery_link && (
                      <a
                        href={activeEmailTxn.recovery_link}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Complete Payment</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-xs text-zinc-500">
                Select a dispatched email from the left pane to preview HTML payload.
              </div>
            )}

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Async SMTP Engine: aiosmtplib</span>
              <span>Gateway Status: Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
