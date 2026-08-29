import React, { useState } from 'react';
import { WhatsAppMock } from '../components/WhatsAppMock';
import { MessageSquare, Mail, Sparkles, ExternalLink } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Top Bar with Channel Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215] border border-zinc-800 rounded-lg p-4">
        <div>
          <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Customer Outreach & Interactive Channel Simulation</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Autonomous personalized copy generation in Hinglish with dynamic discount coupons.
          </p>
        </div>

        <div className="flex items-center bg-zinc-900 p-1 rounded border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveChannelTab('whatsapp')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium cursor-pointer ${
              activeChannelTab === 'whatsapp'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Replica ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveChannelTab('email')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium cursor-pointer ${
              activeChannelTab === 'email'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Gateway ({emailDispatchedTxns.length})</span>
          </button>
        </div>
      </div>

      {/* Channel Views */}
      {activeChannelTab === 'whatsapp' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: WhatsApp Guidance & Strategy Notes */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5">
              <h4 className="font-heading font-bold text-sm text-white mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Strategy Engine</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Prioritized for high-value mobile checkouts and authentication dropouts. Leverages casual Hinglish tone with dynamic urgency discounts (0–15%).
              </p>

              <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Delivery Gateway:</span>
                  <span className="text-white font-mono">Simulated Replica</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Average CTR:</span>
                  <span className="text-emerald-400 font-semibold font-mono">68.4%</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Avg Recovery Speed:</span>
                  <span className="text-blue-400 font-mono">2.4 mins</span>
                </div>
              </div>
            </div>

            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400">
              <div className="font-semibold text-white mb-1">⚡ Interactive Simulation:</div>
              <p className="text-[11px] text-zinc-500">
                Click the "Simulate Customer Payment" button inside any WhatsApp message to instantly trigger payment verification and update recovered revenue.
              </p>
            </div>
          </div>

          {/* Right: Full WhatsApp Mock Component */}
          <div className="lg:col-span-2">
            <WhatsAppMock messages={messages} onSimulatePay={onSimulatePay} />
          </div>
        </div>
      ) : (
        /* Email Channel Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Email list selector */}
          <div className="lg:col-span-1 bg-[#121215] border border-zinc-800 rounded-lg p-4 flex flex-col h-[560px]">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">
              Dispatched Emails ({emailDispatchedTxns.length})
            </h4>
            <div className="flex-1 overflow-y-auto space-y-2">
              {emailDispatchedTxns.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-500">
                  No emails dispatched yet.
                </div>
              ) : (
                emailDispatchedTxns.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTxnId(t.id)}
                    className={`p-3 rounded border text-xs cursor-pointer ${
                      activeEmailTxn?.id === t.id
                        ? 'bg-zinc-800 border-blue-600 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-white">{t.customer_name}</div>
                    <div className="text-[11px] text-zinc-400">{t.customer_email}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-1">
                      ₹{t.amount.toFixed(2)} • {t.failure_category.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Email HTML Preview */}
          <div className="lg:col-span-2 bg-[#121215] border border-zinc-800 rounded-lg p-6 flex flex-col justify-between h-[560px]">
            {activeEmailTxn ? (
              <div className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <div className="text-xs text-zinc-400 font-mono">To: {activeEmailTxn.customer_email}</div>
                  <h3 className="font-heading font-bold text-base text-white mt-1">
                    Complete your pending payment - Order {activeEmailTxn.razorpay_order_id}
                  </h3>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs text-zinc-300 space-y-3 font-sans">
                  <p>Dear {activeEmailTxn.customer_name},</p>
                  <p>
                    We noticed your recent payment of <strong>INR {activeEmailTxn.amount.toFixed(2)}</strong> was interrupted due to a {activeEmailTxn.failure_category.replace(/_/g, ' ')}.
                  </p>
                  <p>
                    Your cart has been securely preserved. You can finalize your transaction securely using the link below without re-entering checkout items:
                  </p>

                  <div className="bg-black p-3 rounded border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-zinc-400">Payable Amount:</div>
                      <div className="font-heading font-bold text-white text-sm">
                        INR {activeEmailTxn.amount.toFixed(2)}
                      </div>
                    </div>
                    {activeEmailTxn.recovery_link && (
                      <a
                        href={activeEmailTxn.recovery_link}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded flex items-center gap-1.5"
                      >
                        <span>Complete Payment</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-zinc-500">
                Select a dispatched email from the left pane to preview HTML payload.
              </div>
            )}

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Async SMTP Engine: aiosmtplib</span>
              <span>Template: HTML Responsive</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
