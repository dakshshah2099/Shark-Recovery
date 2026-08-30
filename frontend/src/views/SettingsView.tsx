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
        <h2 className="font-heading font-black text-2xl text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-500" />
          <span>System & Webhook Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Configure Razorpay live webhook ingesters, agent parameters, and SQLite persistence.
        </p>
      </div>

      {/* Razorpay Webhook Configuration */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-5">
        <div>
          <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" />
            <span>Razorpay Webhook Endpoint</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Register this webhook in your Razorpay Dashboard (<strong>Settings &gt; Webhooks &gt; Add New</strong>).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 bg-black/60 border border-white/[0.08] text-xs text-zinc-300 px-4 py-3 rounded-xl font-mono select-all focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Endpoint'}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-black/30 p-3.5 rounded-xl border border-white/[0.04]">
            <div className="text-zinc-500 text-[11px] font-semibold">Subscribed Events:</div>
            <div className="text-zinc-200 font-mono text-[11px] mt-1">payment.failed, payment_link.paid</div>
          </div>
          <div className="bg-black/30 p-3.5 rounded-xl border border-white/[0.04]">
            <div className="text-zinc-500 text-[11px] font-semibold">Security Signature:</div>
            <div className="text-emerald-400 font-mono text-[11px] mt-1 font-bold">HMAC-SHA256 Verified</div>
          </div>
          <div className="bg-black/30 p-3.5 rounded-xl border border-white/[0.04]">
            <div className="text-zinc-500 text-[11px] font-semibold">Payload Ingestion:</div>
            <div className="text-blue-400 font-mono text-[11px] mt-1 font-bold">Pydantic Agent Loop</div>
          </div>
        </div>
      </div>

      {/* Twilio & SMTP Live Gateway Configuration */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Twilio WhatsApp & SMTP Gateway Config (.env)</span>
        </h3>
        <p className="text-xs text-zinc-400">
          Configure real outbound channels in <code className="text-blue-400 font-mono">backend/.env</code> to send actual WhatsApp messages and emails.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-black/40 p-4 rounded-xl border border-white/[0.06] space-y-1 text-zinc-300">
            <div className="text-emerald-400 font-bold font-sans">Twilio WhatsApp:</div>
            <div>TWILIO_ACCOUNT_SID="your_sid"</div>
            <div>TWILIO_AUTH_TOKEN="your_token"</div>
            <div>TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"</div>
          </div>
          <div className="bg-black/40 p-4 rounded-xl border border-white/[0.06] space-y-1 text-zinc-300">
            <div className="text-blue-400 font-bold font-sans">SMTP Email Server:</div>
            <div>SMTP_HOST="smtp.gmail.com"</div>
            <div>SMTP_PORT=587</div>
            <div>SMTP_USERNAME="your_email@domain.com"</div>
            <div>SMTP_PASSWORD="app_password"</div>
          </div>
        </div>
      </div>

      {/* Multi-Agent Architecture */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>Multi-Agent Stack & Guardrails</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-black/30 p-4 rounded-xl border border-white/[0.04] space-y-1">
            <div className="font-semibold text-white">Diagnostic & Strategy Agent:</div>
            <div className="text-zinc-400 text-[11px] font-mono">Google Gemini 2.5 Flash via Pydantic-AI</div>
            <div className="text-zinc-500 text-[10px]">Strict Pydantic I/O models with dual-mode heuristic engine.</div>
          </div>
          <div className="bg-black/30 p-4 rounded-xl border border-white/[0.04] space-y-1">
            <div className="font-semibold text-white">Stopping & Gating Guardrail:</div>
            <div className="text-zinc-400 text-[11px] font-mono">Max 2 Retries Bounded Threshold</div>
            <div className="text-zinc-500 text-[10px]">Prevents customer fatigue and protects brand reputation.</div>
          </div>
        </div>
      </div>

      {/* Database State Management */}
      <div className="bg-[#121318] border border-rose-900/30 rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="font-heading font-bold text-base text-rose-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-400" />
          <span>Database & Environment State</span>
        </h3>
        <p className="text-xs text-zinc-400">
          Reset SQLite database state or re-seed with realistic transactions for live demo presentations.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onSeedDB}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>Seed 6 Sample Transactions</span>
          </button>

          <button
            onClick={onClearDB}
            className="bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Database Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
