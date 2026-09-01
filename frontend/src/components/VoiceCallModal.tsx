import React from 'react';
import { Phone, CheckCircle2, X, Volume2 } from 'lucide-react';

interface DialogueTurn {
  speaker: string;
  text: string;
  emotion: string;
  timestamp_sec: number;
}

interface VoiceSession {
  call_id: string;
  customer_name: string;
  customer_phone: string;
  order_amount: number;
  discount_offered: number;
  dialogue: DialogueTurn[];
  customer_intent: string;
  promise_to_pay_date: string | null;
  call_outcome: string;
  call_duration_seconds: number;
  sms_payment_link_triggered: boolean;
}

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData?: VoiceSession | null;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ isOpen, onClose, sessionData }) => {
  if (!isOpen || !sessionData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Phone className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Hinglish Voice Recovery AI Session</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  {sessionData.call_id}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading">
                Autonomous conversational voice outreach for high-value dropout: {sessionData.customer_name} (₹{sessionData.order_amount.toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intent & Promise to Pay Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-subheading block">Customer Intent</span>
            <strong className="font-heading font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {sessionData.customer_intent.replace('_', ' ')}
            </strong>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-subheading block">Promise-To-Pay Target</span>
            <strong className="font-mono font-bold text-zinc-900 dark:text-white text-xs">
              {sessionData.promise_to_pay_date || 'Immediate Retarget'}
            </strong>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-subheading block">Dynamic Discount</span>
            <strong className="font-heading font-bold text-blue-600 dark:text-blue-400 text-sm">
              {sessionData.discount_offered}% Off
            </strong>
          </div>
        </div>

        {/* Turn-by-turn Conversation Stream */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-heading font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 font-subheading">
            <Volume2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Turn-by-Turn Conversational Dialogue Transcript:</span>
          </h4>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {sessionData.dialogue.map((turn, i) => {
              const isAgent = turn.speaker === 'AI_Agent';
              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-xs leading-relaxed transition-all ${
                    isAgent
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-950 dark:text-blue-200 ml-4'
                      : 'bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-zinc-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] font-mono opacity-70">
                    <span className="font-bold">
                      {isAgent ? '🤖 Shark AI Voice Agent' : `👤 ${sessionData.customer_name}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-[#27272a]">{turn.emotion}</span>
                      <span>+{turn.timestamp_sec}s</span>
                    </span>
                  </div>
                  <p className="font-body text-xs">{turn.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outcome Footer */}
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-body">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{sessionData.call_outcome}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-heading font-semibold text-xs cursor-pointer focus-rzp shrink-0"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  );
};
