import React, { useState } from 'react';
import { Settings, Copy, Check, Shield, Database, Trash2, Key, Bot } from 'lucide-react';

interface SettingsViewProps {
  onClearDB: () => void;
  onSeedDB: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClearDB, onSeedDB }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const webhookUrl = `${window.location.origin}/webhook/razorpay`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          <span>System & Webhook Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Configure Razorpay live webhook ingesters, outbound credentials, and SQLite persistence.
        </p>
      </div>

      {/* Razorpay Webhook Configuration */}
      <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-9 space-y-6 shadow-xs transition-colors">
        <div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Razorpay Webhook Endpoint</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Register this webhook in your Razorpay Dashboard (<strong>Settings &gt; Webhooks &gt; Add New</strong>).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-zinc-300 px-4 py-3 rounded-xl font-mono select-all focus:outline-none transition-colors"
          />
          <button
            onClick={handleCopy}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20 transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Endpoint'}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
            <div className="text-slate-500 dark:text-zinc-500 text-[11px] font-semibold">Subscribed Events:</div>
            <div className="text-slate-900 dark:text-zinc-200 font-mono text-[11px] mt-1 font-semibold">payment.failed, payment_link.paid</div>
          </div>
          <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
            <div className="text-slate-500 dark:text-zinc-500 text-[11px] font-semibold">Security Signature:</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] mt-1 font-bold">HMAC-SHA256 Verified</div>
          </div>
          <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
            <div className="text-slate-500 dark:text-zinc-500 text-[11px] font-semibold">Payload Ingestion:</div>
            <div className="text-blue-600 dark:text-blue-400 font-mono text-[11px] mt-1 font-bold">Pydantic Agent Loop</div>
          </div>
        </div>
      </div>

      {/* Twilio & SMTP Live Gateway Configuration */}
      <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-9 space-y-5 shadow-xs transition-colors">
        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Twilio WhatsApp & SMTP Gateway Config (.env)</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
          Configure real outbound channels in <code className="text-blue-600 dark:text-blue-400 font-mono">backend/.env</code> to send actual WhatsApp messages and emails.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.06] space-y-1 text-slate-800 dark:text-zinc-300">
            <div className="text-emerald-600 dark:text-emerald-400 font-bold font-sans">Twilio WhatsApp:</div>
            <div>TWILIO_ACCOUNT_SID="your_sid"</div>
            <div>TWILIO_AUTH_TOKEN="your_token"</div>
            <div>TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"</div>
          </div>
          <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.06] space-y-1 text-slate-800 dark:text-zinc-300">
            <div className="text-blue-600 dark:text-blue-400 font-bold font-sans">SMTP Email Server:</div>
            <div>SMTP_HOST="smtp.gmail.com"</div>
            <div>SMTP_PORT=587</div>
            <div>SMTP_USERNAME="your_email@domain.com"</div>
            <div>SMTP_PASSWORD="app_password"</div>
          </div>
        </div>
      </div>

      {/* Multi-Agent Architecture */}
      <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-9 space-y-5 shadow-xs transition-colors">
        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Multi-Agent Stack & Guardrails</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04] space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">Diagnostic & Strategy Agent:</div>
            <div className="text-slate-600 dark:text-zinc-400 text-[11px] font-mono">Google Gemini 2.5 Flash via Pydantic-AI</div>
            <div className="text-slate-500 dark:text-zinc-500 text-[10px]">Strict Pydantic I/O models with dual-mode heuristic engine.</div>
          </div>
          <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04] space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">Stopping & Gating Guardrail:</div>
            <div className="text-slate-600 dark:text-zinc-400 text-[11px] font-mono">Max 2 Retries Bounded Threshold</div>
            <div className="text-zinc-500 text-[10px]">Prevents customer fatigue and protects merchant reputation.</div>
          </div>
        </div>
      </div>

      {/* Database State Management */}
      <div className="bg-white dark:bg-[#111217] border border-rose-200 dark:border-rose-900/30 rounded-2xl p-7 sm:p-9 space-y-4 shadow-xs transition-colors">
        <h3 className="font-heading font-bold text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Database & Environment State</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
          Reset SQLite database state or re-seed with realistic transactions for live demo presentations.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onSeedDB}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-white/[0.08] text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Seed 6 Sample Transactions</span>
          </button>

          <button
            onClick={onClearDB}
            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Database Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
