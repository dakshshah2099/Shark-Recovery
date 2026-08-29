import React, { useState } from 'react';
import { CheckCheck, Send, Phone, Video, MoreVertical, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import type { WhatsAppMessage } from '../types';

interface WhatsAppMockProps {
  messages: WhatsAppMessage[];
  onSimulatePay?: (transactionId: string) => void;
}

export const WhatsAppMock: React.FC<WhatsAppMockProps> = ({ messages, onSimulatePay }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  if (!messages || messages.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 flex flex-col items-center justify-center min-h-[460px]">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
          <Send className="w-6 h-6" />
        </div>
        <h4 className="text-white font-semibold mb-1">WhatsApp Live Replica Feed</h4>
        <p className="text-xs max-w-xs text-slate-400">
          No outreach dispatched yet. Trigger "Simulate Failed Batch" to watch AI agent send personalized Hinglish recovery messages in real time!
        </p>
      </div>
    );
  }

  const currentMsg = messages[selectedIdx] || messages[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[560px]">
      {/* WhatsApp Header */}
      <div className="bg-[#128C7E] px-4 py-3 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center border-2 border-white/40">
              {currentMsg.recipient_name.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#128C7E]" />
          </div>
          <div>
            <div className="font-semibold text-sm flex items-center gap-1.5">
              {currentMsg.recipient_name}
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div className="text-xs text-emerald-100/90 font-mono">
              {currentMsg.recipient_phone}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-emerald-100">
          <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
          <Video className="w-4 h-4 cursor-pointer hover:text-white" />
          <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Customer Quick Selector Pills */}
      <div className="bg-slate-950/80 px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap pl-1">Chats:</span>
        {messages.map((m, idx) => (
          <button
            key={m.message_id || idx}
            onClick={() => setSelectedIdx(idx)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              selectedIdx === idx
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {m.recipient_name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* WhatsApp Chat Canvas */}
      <div
        className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col justify-end bg-[#0b141a]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(18, 140, 126, 0.04) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <div className="mx-auto bg-slate-800/80 text-[10px] text-slate-400 px-3 py-1 rounded-full font-mono">
          TODAY • ENCRYPTED END-TO-END
        </div>

        {/* Speech Bubble */}
        <div className="max-w-[90%] self-end bg-[#005c4b] text-white rounded-2xl rounded-tr-xs p-3.5 shadow-md relative">
          <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium mb-1">
            <Sparkles className="w-3 h-3" />
            <span>AI Shark Agent Outreach</span>
          </div>

          <p className="text-xs leading-relaxed whitespace-pre-line text-slate-100 font-sans">
            {currentMsg.message}
          </p>

          {/* Embedded Razorpay Action Button */}
          {currentMsg.payment_link && (
            <div className="mt-3 pt-2.5 border-t border-emerald-600/40 flex flex-col gap-1.5">
              <a
                href={currentMsg.payment_link}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <span>Pay via Razorpay Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {onSimulatePay && (
                <button
                  onClick={() => onSimulatePay(currentMsg.transaction_id)}
                  className="w-full bg-slate-800/90 hover:bg-slate-700 text-emerald-400 font-semibold text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 border border-emerald-500/30 transition-all cursor-pointer"
                >
                  ⚡ Simulate Customer Paying Now
                </button>
              )}
            </div>
          )}

          {/* Timestamp & Double Blue Ticks */}
          <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-emerald-200/70">
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

      {/* Fake Input Footer */}
      <div className="bg-[#202c33] px-3 py-2.5 flex items-center gap-2 border-t border-slate-800">
        <div className="flex-1 bg-[#2a3942] text-xs text-slate-400 px-3 py-2 rounded-lg font-sans">
          Customer can reply directly...
        </div>
        <div className="p-2 bg-[#00a884] text-white rounded-full">
          <Send className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
