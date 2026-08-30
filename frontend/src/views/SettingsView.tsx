import React, { useState, useEffect } from 'react';
import {
  Settings,
  Copy,
  Check,
  Shield,
  Database,
  Trash2,
  Key,
  Bot,
  Save,
  Lock,
  Unlock,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface SettingsViewProps {
  onClearDB: () => void;
  onSeedDB: () => void;
}

interface EnvConfig {
  debug_mode: boolean;
  google_api_key?: string;
  gemini_api_key?: string;
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
  razorpay_webhook_secret?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_whatsapp_from?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_from?: string;
  max_retry_attempts?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClearDB, onSeedDB }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const webhookUrl = `${window.location.origin}/webhook/razorpay`;

  const [envConfig, setEnvConfig] = useState<EnvConfig | null>(null);
  const [loadingEnv, setLoadingEnv] = useState<boolean>(true);
  const [savingEnv, setSavingEnv] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Editable form state
  const [googleKey, setGoogleKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [maxRetries, setMaxRetries] = useState(2);

  useEffect(() => {
    fetchEnvConfig();
  }, []);

  const fetchEnvConfig = async () => {
    setLoadingEnv(true);
    try {
      const res = await fetch('/api/env-config');
      if (res.ok) {
        const data: EnvConfig = await res.json();
        setEnvConfig(data);
        if (data.debug_mode) {
          setGoogleKey(data.google_api_key || '');
          setGeminiKey(data.gemini_api_key || '');
          setRzpKeyId(data.razorpay_key_id || '');
          setRzpKeySecret(data.razorpay_key_secret || '');
          setRzpWebhookSecret(data.razorpay_webhook_secret || '');
          setTwilioSid(data.twilio_account_sid || '');
          setTwilioToken(data.twilio_auth_token || '');
          setTwilioFrom(data.twilio_whatsapp_from || 'whatsapp:+14155238886');
          setSmtpHost(data.smtp_host || 'smtp.gmail.com');
          setSmtpPort(data.smtp_port || 587);
          setSmtpUser(data.smtp_username || '');
          setSmtpPass(data.smtp_password || '');
          setSmtpFrom(data.smtp_from || 'recovery@sharkagent.local');
          setMaxRetries(data.max_retry_attempts ?? 2);
        }
      }
    } catch (err) {
      console.error('Error fetching env config:', err);
    } finally {
      setLoadingEnv(false);
    }
  };

  const handleSaveEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEnv(true);
    try {
      const res = await fetch('/api/env-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_api_key: googleKey,
          gemini_api_key: geminiKey,
          razorpay_key_id: rzpKeyId,
          razorpay_key_secret: rzpKeySecret,
          razorpay_webhook_secret: rzpWebhookSecret,
          twilio_account_sid: twilioSid,
          twilio_auth_token: twilioToken,
          twilio_whatsapp_from: twilioFrom,
          smtp_host: smtpHost,
          smtp_port: Number(smtpPort),
          smtp_username: smtpUser,
          smtp_password: smtpPass,
          smtp_from: smtpFrom,
          max_retry_attempts: Number(maxRetries),
        }),
      });

      if (res.ok) {
        const updated: EnvConfig = await res.json();
        setEnvConfig(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving env config:', err);
    } finally {
      setSavingEnv(false);
    }
  };

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
          <span>System & Environment Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Configure Razorpay live webhook ingesters, runtime environment credentials, and database persistence.
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
            className="flex-1 h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-zinc-300 px-4 rounded-xl font-mono select-all focus:outline-none transition-colors"
          />
          <button
            onClick={handleCopy}
            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20 transition-all"
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

      {/* Environment Variables Management (Editable when DEBUG_MODE is True) */}
      <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-9 space-y-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Runtime Environment Variables (.env)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              Live credentials for Google Gemini LLMs, Razorpay APIs, Twilio WhatsApp, and SMTP gateway.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {envConfig?.debug_mode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 font-mono">
                <Unlock className="w-3.5 h-3.5" />
                <span>DEBUG_MODE Enabled</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked (DEBUG_MODE=False)</span>
              </span>
            )}
          </div>
        </div>

        {loadingEnv ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading environment configuration...</span>
          </div>
        ) : envConfig?.debug_mode ? (
          /* Editable Live Form */
          <form onSubmit={handleSaveEnv} className="space-y-6">
            {/* 1. AI & LLM Keys */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Google Gemini AI Intelligence</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">GOOGLE_API_KEY</label>
                  <input
                    type="password"
                    value={googleKey}
                    onChange={(e) => setGoogleKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">GEMINI_API_KEY</label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 2. Razorpay Credentials */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-500" />
                <span>Razorpay API Keys</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">RAZORPAY_KEY_ID</label>
                  <input
                    type="text"
                    value={rzpKeyId}
                    onChange={(e) => setRzpKeyId(e.target.value)}
                    placeholder="rzp_test_..."
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">RAZORPAY_KEY_SECRET</label>
                  <input
                    type="password"
                    value={rzpKeySecret}
                    onChange={(e) => setRzpKeySecret(e.target.value)}
                    placeholder="Secret..."
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">WEBHOOK_SECRET</label>
                  <input
                    type="password"
                    value={rzpWebhookSecret}
                    onChange={(e) => setRzpWebhookSecret(e.target.value)}
                    placeholder="Webhook secret..."
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 3. Twilio WhatsApp */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>Twilio WhatsApp API</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">TWILIO_ACCOUNT_SID</label>
                  <input
                    type="text"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    placeholder="AC..."
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">TWILIO_AUTH_TOKEN</label>
                  <input
                    type="password"
                    value={twilioToken}
                    onChange={(e) => setTwilioToken(e.target.value)}
                    placeholder="Auth token..."
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">TWILIO_WHATSAPP_FROM</label>
                  <input
                    type="text"
                    value={twilioFrom}
                    onChange={(e) => setTwilioFrom(e.target.value)}
                    placeholder="whatsapp:+14155238886"
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 4. SMTP Email */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>SMTP Email Gateway</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">SMTP_HOST</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">SMTP_PORT</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">SMTP_USERNAME</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="user@domain.com"
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">SMTP_PASSWORD</label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="App password..."
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">SMTP_FROM</label>
                  <input
                    type="text"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder="recovery@brand.com"
                    className="w-full h-11 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <div>
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Environment variables updated & applied to runtime!</span>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={savingEnv}
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all"
              >
                {savingEnv ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Apply Environment Config</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Read-Only Notice when DEBUG_MODE is False */
          <div className="bg-slate-50 dark:bg-black/40 p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] text-xs space-y-2">
            <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Environment Variable Editing is Locked</span>
            </div>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              To edit API keys and credentials directly from this web console, set <code className="text-blue-600 dark:text-blue-400 font-mono">DEBUG_MODE=true</code> in your backend environment or <code className="text-blue-600 dark:text-blue-400 font-mono">.env</code> file.
            </p>
          </div>
        )}
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
            className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-white/[0.08] text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Seed 6 Sample Transactions</span>
          </button>

          <button
            onClick={onClearDB}
            className="h-11 px-5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Database Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
