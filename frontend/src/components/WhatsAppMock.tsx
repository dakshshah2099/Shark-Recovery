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
      <div className="bg-[#121215] border border-zinc-800 rounded-lg p-6 text-center text-zinc-400 flex flex-col items-center justify-center min-h-[520px]">
        <div className="w-12 h-12 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
          <Send className="w-5 h-5" />
        </div>
        <h4 className="font-heading font-bold text-sm text-white mb-1">WhatsApp Live Replica Feed</h4>
        <p className="text-xs max-w-xs text-zinc-500">
          No outreach dispatched yet. Click "Simulate 5 Failed Payments" to watch the AI recovery agent dispatch personalized Hinglish messages.
        </p>
      </div>
    );
  }

  const currentMsg = messages[selectedIdx] || messages[0];

  return (
    <div className="bg-[#121215] border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-[560px]">
      {/* Header */}
      <div className="bg-[#1f2c34] px-4 py-3 text-white flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-xs">
            {currentMsg.recipient_name.charAt(0)}
          </div>
          <div>
            <div className="font-heading font-semibold text-xs text-white">
              {currentMsg.recipient_name}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              {currentMsg.recipient_phone}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-zinc-400">
          <Phone className="w-3.5 h-3.5" />
          <Video className="w-3.5 h-3.5" />
          <MoreVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Customer Selector */}
      <div className="bg-[#18181b] px-3 py-2 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-zinc-500 text-[11px] font-medium whitespace-nowrap pl-1">Chats:</span>
        {messages.map((m, idx) => (
          <button
            key={m.message_id || idx}
            onClick={() => setSelectedIdx(idx)}
            className={`px-2.5 py-0.5 rounded text-xs font-medium whitespace-nowrap cursor-pointer ${
              selectedIdx === idx
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {m.recipient_name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col justify-end bg-[#0b141a]">
        <div className="mx-auto bg-zinc-800 text-[10px] text-zinc-400 px-2.5 py-0.5 rounded font-mono">
          TODAY • ENCRYPTED
        </div>

        {/* Message Bubble */}
        <div className="max-w-[92%] self-end bg-[#005c4b] text-white rounded-lg p-3 relative">
          <div className="text-[11px] text-emerald-300 font-semibold mb-1">
            Autonomous Recovery Dispatch
          </div>

          <p className="text-xs leading-relaxed whitespace-pre-line text-zinc-100">
            {currentMsg.message}
          </p>

          {/* Action Links */}
          {currentMsg.payment_link && (
            <div className="mt-3 pt-2.5 border-t border-emerald-700/50 flex flex-col gap-1.5">
              <a
                href={currentMsg.payment_link}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1.5"
              >
                <span>Pay via Razorpay</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {onSimulatePay && (
                <button
                  onClick={() => onSimulatePay(currentMsg.transaction_id)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-medium text-[11px] py-1.5 px-2 rounded border border-zinc-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Simulate Customer Payment</span>
                </button>
              )}
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-zinc-300">
            <span>
              {new Date(currentMsg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#202c33] px-3 py-2 flex items-center gap-2 border-t border-zinc-800">
        <div className="flex-1 bg-[#2a3942] text-xs text-zinc-400 px-3 py-1.5 rounded">
          Customer reply window...
        </div>
        <div className="p-1.5 bg-blue-600 text-white rounded">
          <Send className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
