import React, { useState } from 'react';
import { CheckCheck, Send, Phone, Video, MoreVertical, ExternalLink, Zap } from 'lucide-react';
import type { WhatsAppMessage } from '../types';

interface WhatsAppMockProps {
  messages: WhatsAppMessage[];
  onSimulatePay?: (transactionId: string) => void;
}

export const WhatsAppMock: React.FC<WhatsAppMockProps> = ({ messages, onSimulatePay }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  if (!messages || messages.length === 0) {
    return (
      <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-8 text-center text-zinc-400 flex flex-col items-center justify-center min-h-[540px]">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-zinc-400 flex items-center justify-center mb-4 border border-white/[0.06]">
          <Send className="w-6 h-6" />
        </div>
        <h4 className="font-heading font-bold text-base text-white mb-1.5">WhatsApp Autonomous Outreach Feed</h4>
        <p className="text-xs max-w-sm text-zinc-500 leading-relaxed">
          No messages dispatched yet. Simulate failed checkout drops or seed sample transactions to preview automated Hinglish recovery messages.
        </p>
      </div>
    );
  }

  const currentMsg = messages[selectedIdx] || messages[0];

  return (
    <div className="bg-[#121318] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col h-[580px] shadow-lg">
      {/* WhatsApp App Bar */}
      <div className="bg-[#1f2c34] px-5 py-3.5 text-white flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-xs">
            {currentMsg.recipient_name.charAt(0)}
          </div>
          <div>
            <div className="font-heading font-bold text-xs text-white">
              {currentMsg.recipient_name}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              {currentMsg.recipient_phone}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <Phone className="w-4 h-4" />
          <Video className="w-4 h-4" />
          <MoreVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Customer Quick Switcher */}
      <div className="bg-[#16171d] px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">Recipients:</span>
        {messages.map((m, idx) => (
          <button
            key={m.message_id || idx}
            onClick={() => setSelectedIdx(idx)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedIdx === idx
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/[0.04]'
            }`}
          >
            {m.recipient_name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3 flex flex-col justify-end bg-[#0b141a]">
        <div className="mx-auto bg-zinc-900/90 text-[10px] text-zinc-400 px-3 py-1 rounded-full font-mono border border-white/[0.06]">
          END-TO-END ENCRYPTED • TODAY
        </div>

        {/* WhatsApp Message Bubble */}
        <div className="max-w-[90%] self-end bg-[#005c4b] text-white rounded-2xl rounded-tr-none p-4 shadow-md space-y-2.5">
          <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
            ⚡ AI Instant Recovery Offer
          </div>

          <p className="text-xs leading-relaxed whitespace-pre-line text-zinc-100 font-sans">
            {currentMsg.message}
          </p>

          {/* Payment CTA Link */}
          {currentMsg.payment_link && (
            <div className="pt-2.5 border-t border-emerald-700/60 flex flex-col gap-2">
              <a
                href={currentMsg.payment_link}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Pay via Razorpay Secure</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {onSimulatePay && (
                <button
                  onClick={() => onSimulatePay(currentMsg.transaction_id)}
                  className="w-full bg-black/60 hover:bg-black/90 text-emerald-400 font-semibold text-[11px] py-1.5 px-2 rounded-lg border border-emerald-600/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span>Simulate Customer Payment</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-300 font-mono">
            <span>
              {new Date(currentMsg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
          </div>
        </div>
      </div>

      {/* Input Bar */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 border-t border-white/[0.06]">
        <div className="flex-1 bg-[#2a3942] text-xs text-zinc-400 px-4 py-2 rounded-xl">
          Customer reply session active...
        </div>
        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
          <Send className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
