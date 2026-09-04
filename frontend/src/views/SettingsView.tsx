import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Copy,
  Check,
  Shield,
  Database,
  Trash2,
  Key,
  Save,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Mail,
  MessageSquare,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';

interface SettingsViewProps {
  onClearDB: () => void;
  onSeedDB: () => void;
  showNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
  seeding?: boolean;
  clearing?: boolean;
}

interface EnvConfig {
  debug_mode: boolean;
  groq_api_key?: string;
  gemini_api_key?: string;
  llm_model?: string;
  gemini_live_model?: string;
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
  razorpay_webhook_secret?: string;
  twilio_api_key?: string;
  twilio_api_secret?: string;
  twilio_whatsapp_from?: string;
  twilio_sandbox_template?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_from?: string;
  max_retry_attempts?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onClearDB,
  onSeedDB,
  showNotification,
  seeding = false,
  clearing = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const webhookUrl = `${window.location.origin}/webhook/razorpay`;

  const [envConfig, setEnvConfig] = useState<EnvConfig | null>(null);
  const [loadingEnv, setLoadingEnv] = useState<boolean>(true);
  const [savingEnv, setSavingEnv] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [groqModelsList, setGroqModelsList] = useState<string[]>([
    'groq/openai/gpt-oss-120b',
    'groq/openai/gpt-oss-20b',
    'groq/qwen/qwen3.6-27b',
    'groq/qwen/qwen3.8-27b',
    'gemini/gemini-2.5-flash',
  ]);

  // Editable form state
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [llmModel, setLlmModel] = useState('groq/openai/gpt-oss-120b');
  const [geminiLiveModel, setGeminiLiveModel] = useState('models/gemini-2.0-flash-exp');
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('');
  const [twilioApiKey, setTwilioApiKey] = useState('');
  const [twilioApiSecret, setTwilioApiSecret] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');
  const [twilioTemplate, setTwilioTemplate] = useState('appointment');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [maxRetries, setMaxRetries] = useState(2);

  const fetchGroqModels = useCallback(async () => {
    try {
      const res = await fetch('/api/groq-models');
      if (res.ok) {
        const models = await res.json();
        if (Array.isArray(models) && models.length > 0) {
          setGroqModelsList([...models, 'gemini/gemini-2.5-flash']);
        }
      }
    } catch {
      // Keep defaults
    }
  }, []);

  const fetchEnvConfig = useCallback(async () => {
    setLoadingEnv(true);
    try {
      const res = await fetch('/api/env-config');
      if (res.ok) {
        const data: EnvConfig = await res.json();
        setEnvConfig(data);
        if (data.debug_mode) {
          setGroqKey(data.groq_api_key || '');
          setGeminiKey(data.gemini_api_key || '');
          setLlmModel(data.llm_model || 'groq/openai/gpt-oss-120b');
          setGeminiLiveModel(data.gemini_live_model || 'models/gemini-2.0-flash-exp');
          setRzpKeyId(data.razorpay_key_id || '');
          setRzpKeySecret(data.razorpay_key_secret || '');
          setRzpWebhookSecret(data.razorpay_webhook_secret || '');
          setTwilioApiKey(data.twilio_api_key || '');
          setTwilioApiSecret(data.twilio_api_secret || '');
          setTwilioFrom(data.twilio_whatsapp_from || 'whatsapp:+14155238886');
          setTwilioTemplate(data.twilio_sandbox_template || 'appointment');
          setSmtpHost(data.smtp_host || 'smtp.gmail.com');
          setSmtpPort(data.smtp_port || 587);
          setSmtpUser(data.smtp_username || '');
          setSmtpPass(data.smtp_password || '');
          setSmtpFrom(data.smtp_from || 'recovery@sharkrecovery.local');
          setMaxRetries(data.max_retry_attempts ?? 2);
        }
      }
    } catch (err) {
      console.error('Error fetching env config:', err);
    } finally {
      setLoadingEnv(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvConfig();
    fetchGroqModels();
  }, [fetchEnvConfig, fetchGroqModels]);

  const handleSaveEnv = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setSavingEnv(true);
    setSaveStatus(null);
    showNotification?.('Saving environment configuration & reloading runtime singleton...', 'loading', 0);
    try {
      const res = await fetch('/api/env-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groq_api_key: groqKey,
          gemini_api_key: geminiKey,
          llm_model: llmModel,
          gemini_live_model: geminiLiveModel,
          razorpay_key_id: rzpKeyId,
          razorpay_key_secret: rzpKeySecret,
          razorpay_webhook_secret: rzpWebhookSecret,
          twilio_api_key: twilioApiKey,
          twilio_api_secret: twilioApiSecret,
          twilio_whatsapp_from: twilioFrom,
          twilio_sandbox_template: twilioTemplate,
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
        setSaveStatus({
          type: 'success',
          message: 'Environment configuration successfully saved to .env and applied to live runtime singleton!',
        });
        showNotification?.('✓ Environment configuration saved & runtime reloaded!', 'success', 4500);
        setTimeout(() => setSaveStatus(null), 6000);
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.detail || 'Failed to persist environment configuration.';
        setSaveStatus({ type: 'error', message: errMsg });
        showNotification?.(`❌ ${errMsg}`, 'error', 5000);
      }
    } catch (err) {
      console.error('Error saving env config:', err);
      const errMsg = 'Network error occurred while applying configuration.';
      setSaveStatus({ type: 'error', message: errMsg });
      showNotification?.(`❌ ${errMsg}`, 'error', 5000);
    } finally {
      setSavingEnv(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    showNotification?.('📋 Webhook URL copied to clipboard!', 'info', 2500);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs transition-colors space-y-1.5">
        <h2 className="font-heading font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>System & Gateway Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading">
          Configure Razorpay live webhook ingesters, runtime environment credentials, and database persistence.
        </p>
      </div>

      {/* Razorpay Webhook Configuration */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-7 space-y-4 shadow-xs transition-colors">
        <div>
          <h3 className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Razorpay Webhook Endpoint</span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            Register this webhook in your Razorpay Dashboard (<strong>Settings &gt; Webhooks &gt; Add New</strong>).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-zinc-100 px-3 rounded-md font-mono select-all focus:outline-none transition-colors"
          />
          <button
            onClick={handleCopy}
            className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-subheading font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Endpoint'}</span>
          </button>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-[#27272a] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-zinc-50 dark:bg-[#09090b] p-3 rounded-md border border-zinc-200/60 dark:border-[#27272a]">
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-mono font-semibold">Subscribed Events:</div>
            <div className="text-zinc-900 dark:text-white font-mono text-[11px] mt-0.5 font-semibold">payment.failed, payment_link.paid</div>
          </div>
          <div className="bg-zinc-50 dark:bg-[#09090b] p-3 rounded-md border border-zinc-200/60 dark:border-[#27272a]">
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-mono font-semibold">Security Signature:</div>
            <div className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] mt-0.5 font-bold">HMAC-SHA256 Verified</div>
          </div>
          <div className="bg-zinc-50 dark:bg-[#09090b] p-3 rounded-md border border-zinc-200/60 dark:border-[#27272a]">
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-mono font-semibold">Payload Ingestion:</div>
            <div className="text-blue-600 dark:text-blue-400 font-mono text-[11px] mt-0.5 font-bold">Pydantic Agent Loop</div>
          </div>
        </div>
      </div>

      {/* Environment Variables Management */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-7 space-y-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-[#27272a]">
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Runtime Environment Variables (.env)</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
              Credentials for LLM models, Razorpay APIs, Twilio WhatsApp, and SMTP email.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {envConfig?.debug_mode ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
                <Unlock className="w-3 h-3" />
                <span>DEBUG_MODE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a] font-mono">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </span>
            )}
          </div>
        </div>

        {loadingEnv ? (
          <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading environment configuration...</span>
          </div>
        ) : envConfig?.debug_mode ? (
          /* Editable Live Form */
          <div className="space-y-4">
            {/* Inline Dynamic Status Feedback Banner */}
            {saveStatus && (
              <div
                role="status"
                aria-live="polite"
                className={`p-3.5 rounded-md border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
                  saveStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {saveStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span className="font-medium font-subheading">{saveStatus.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveStatus(null)}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer focus-rzp"
                  aria-label="Close notification banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 1. AI & LLM Keys */}
            <div className="space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>LiteLLM Multi-Model Engine (Groq & Google Gemini)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="settings-groq-key" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    GROQ_API_KEY <span className="text-emerald-700 dark:text-emerald-400 font-semibold">(Ultra-fast)</span>
                  </label>
                  <input
                    id="settings-groq-key"
                    type="password"
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="settings-gemini-key" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    GEMINI_API_KEY
                  </label>
                  <input
                    id="settings-gemini-key"
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="settings-llm-model" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  LLM_MODEL (Multi-Agent Reasoning Engine)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="settings-llm-model"
                    type="text"
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    placeholder="groq/openai/gpt-oss-120b or gemini/gemini-2.5-flash"
                    className="flex-1 h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                  <CustomSelect
                    value={llmModel}
                    onChange={setLlmModel}
                    options={groqModelsList}
                    placeholder="Select Model Preset"
                    className="w-full sm:w-64"
                    align="right"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="settings-gemini-live-model" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  GEMINI_LIVE_MODEL (Multimodal Live Voice & Telephony Stream)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="settings-gemini-live-model"
                    type="text"
                    value={geminiLiveModel}
                    onChange={(e) => setGeminiLiveModel(e.target.value)}
                    placeholder="models/gemini-2.0-flash-exp or models/gemini-3.0-flash"
                    className="flex-1 h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                  <CustomSelect
                    value={geminiLiveModel}
                    onChange={setGeminiLiveModel}
                    options={[
                      'models/gemini-2.0-flash-exp',
                      'models/gemini-3.0-flash',
                      'models/gemini-2.5-flash',
                      'models/gemini-2.0-flash-realtime-exp',
                    ]}
                    placeholder="Select Live Voice Model"
                    className="w-full sm:w-64"
                    align="right"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono font-semibold">Live Model Presets:</span>
                {['models/gemini-2.0-flash-exp', 'models/gemini-3.0-flash', 'models/gemini-2.5-flash'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setGeminiLiveModel(m)}
                    aria-pressed={geminiLiveModel === m}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      geminiLiveModel === m
                        ? 'bg-rose-600 text-white font-semibold shadow-xs'
                        : 'bg-zinc-100 dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-[#27272a]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Razorpay Credentials */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>Razorpay API Keys</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="settings-rzp-key-id" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">RAZORPAY_KEY_ID</label>
                  <input
                    id="settings-rzp-key-id"
                    type="text"
                    value={rzpKeyId}
                    onChange={(e) => setRzpKeyId(e.target.value)}
                    placeholder="rzp_test_..."
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="settings-rzp-key-secret" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">RAZORPAY_KEY_SECRET</label>
                  <input
                    id="settings-rzp-key-secret"
                    type="password"
                    value={rzpKeySecret}
                    onChange={(e) => setRzpKeySecret(e.target.value)}
                    placeholder="Secret..."
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="settings-rzp-webhook-secret" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">WEBHOOK_SECRET</label>
                  <input
                    id="settings-rzp-webhook-secret"
                    type="password"
                    value={rzpWebhookSecret}
                    onChange={(e) => setRzpWebhookSecret(e.target.value)}
                    placeholder="Webhook secret..."
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 3. Twilio WhatsApp */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Twilio WhatsApp API (Sandbox & Production Template Compatible)</span>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-md p-3 text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-semibold flex items-center gap-1.5 font-subheading">
                  <span>💡 Twilio Template Dispatch:</span>
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-body leading-relaxed">
                  Outgoing recovery links will be formatted into your selected pre-approved Sandbox or production template.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="settings-twilio-key" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    TWILIO_API_KEY <span className="text-emerald-700 dark:text-emerald-400 font-semibold">(SK...)</span>
                  </label>
                  <input
                    id="settings-twilio-key"
                    type="text"
                    value={twilioApiKey}
                    onChange={(e) => setTwilioApiKey(e.target.value)}
                    placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="settings-twilio-secret" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    TWILIO_API_SECRET
                  </label>
                  <input
                    id="settings-twilio-secret"
                    type="password"
                    value={twilioApiSecret}
                    onChange={(e) => setTwilioApiSecret(e.target.value)}
                    placeholder="API Secret..."
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="settings-twilio-from" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">TWILIO_WHATSAPP_FROM</label>
                  <input
                    id="settings-twilio-from"
                    type="text"
                    value={twilioFrom}
                    onChange={(e) => setTwilioFrom(e.target.value)}
                    placeholder="whatsapp:+14155238886"
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
              </div>

              {/* Twilio Pre-approved Template Selector */}
              <div className="pt-1.5 space-y-1.5">
                <div id="twilio-template-group-label" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200">
                  Pre-Approved Sandbox Template:
                </div>
                <div role="group" aria-labelledby="twilio-template-group-label" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTwilioTemplate('appointment')}
                    aria-pressed={twilioTemplate === 'appointment'}
                    className={`p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                      twilioTemplate === 'appointment'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-[#18181b] text-blue-900 dark:text-white font-semibold'
                        : 'border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between font-subheading">
                      <span>Appointment (Default)</span>
                      {twilioTemplate === 'appointment' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono">Active</span>}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                      Your Shark Recovery appointment is coming up on &#123;link&#125;
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTwilioTemplate('code')}
                    aria-pressed={twilioTemplate === 'code'}
                    className={`p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                      twilioTemplate === 'code'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-[#18181b] text-blue-900 dark:text-white font-semibold'
                        : 'border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between font-subheading">
                      <span>Verification Code</span>
                      {twilioTemplate === 'code' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono">Active</span>}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                      Your Shark Recovery code is &#123;link&#125;
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTwilioTemplate('order')}
                    aria-pressed={twilioTemplate === 'order'}
                    className={`p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                      twilioTemplate === 'order'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-[#18181b] text-blue-900 dark:text-white font-semibold'
                        : 'border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between font-subheading">
                      <span>Order Shipped</span>
                      {twilioTemplate === 'order' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono">Active</span>}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                      Your order has shipped... Details: &#123;link&#125;
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. SMTP Email */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>SMTP Email Gateway</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="settings-smtp-host" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">SMTP_HOST</label>
                  <input
                    id="settings-smtp-host"
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="settings-smtp-port" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">SMTP_PORT</label>
                  <input
                    id="settings-smtp-port"
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="settings-smtp-user" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">SMTP_USERNAME</label>
                  <input
                    id="settings-smtp-user"
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="user@domain.com"
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="settings-smtp-pass" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">SMTP_PASSWORD</label>
                  <input
                    id="settings-smtp-pass"
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="App password..."
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="settings-smtp-from" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">SMTP_FROM</label>
                  <input
                    id="settings-smtp-from"
                    type="text"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder="recovery@brand.com"
                    className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 5. Deterministic Guardrails & Retry Policy */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Deterministic Guardrails & Recovery Policy</span>
              </div>
              <div>
                <label htmlFor="settings-max-retries" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  MAX_RETRY_ATTEMPTS (Bounded Retries)
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2.5 font-body">
                  Maximum autonomous diagnostic & outreach attempts before gating rules mark a dropout as dropped/abandoned. Directly persists to <code className="font-mono text-blue-600 dark:text-blue-400">MAX_RETRY_ATTEMPTS</code> in environment.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMaxRetries(val)}
                      aria-pressed={maxRetries === val}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer focus-rzp ${
                        maxRetries === val
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a]'
                      }`}
                    >
                      {val} {val === 1 ? 'Attempt' : 'Attempts'}
                    </button>
                  ))}
                  <div className="relative w-28">
                    <input
                      id="settings-max-retries"
                      type="number"
                      min="1"
                      max="10"
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                      className="w-full h-8.5 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 font-mono focus-rzp transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 border-t border-zinc-100 dark:border-[#27272a] flex items-center justify-between">
              <div>
                {saveStatus?.type === 'success' && (
                  <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-xs font-subheading font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Configuration saved & applied!</span>
                  </span>
                )}
                {saveStatus?.type === 'error' && (
                  <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-xs font-subheading font-semibold text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Failed to apply configuration</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveEnv}
                disabled={savingEnv}
                className="h-9 px-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-subheading font-semibold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all focus-rzp"
              >
                {savingEnv ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Save & Apply Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Read-Only Notice when DEBUG_MODE is False */
          <div className="bg-zinc-50 dark:bg-[#09090b] p-5 rounded-md border border-zinc-200/80 dark:border-[#27272a] text-xs space-y-1.5">
            <div className="font-semibold text-zinc-800 dark:text-white flex items-center gap-1.5 font-subheading">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Environment Variable Editing is Locked</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-body leading-relaxed">
              To edit API keys directly from this web console, set <code className="text-blue-600 dark:text-blue-400 font-mono">DEBUG_MODE=true</code> in your backend environment or <code className="text-blue-600 dark:text-blue-400 font-mono">.env</code> file.
            </p>
          </div>
        )}
      </div>

      {/* Database State Management */}
      <div className="bg-white dark:bg-[#121215] border border-rose-200 dark:border-rose-900/30 rounded-lg p-5 sm:p-7 space-y-3 shadow-xs transition-colors">
        <h3 className="font-heading font-bold text-sm sm:text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Database State Management</span>
        </h3>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-body">
          Administrative controls to reset transaction records or populate standard benchmark transactions for baseline verification.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onSeedDB}
            disabled={seeding || clearing}
            className="h-9 px-4 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a] text-xs font-subheading font-medium inline-flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 focus-rzp"
          >
            <Database className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Populating Benchmark...' : 'Load Benchmark Dataset'}</span>
          </button>

          <button
            type="button"
            onClick={onClearDB}
            disabled={clearing || seeding}
            className="h-9 px-4 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-subheading font-medium inline-flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 focus-rzp"
          >
            <Trash2 className={`w-3.5 h-3.5 text-rose-500 ${clearing ? 'animate-pulse' : ''}`} />
            <span>{clearing ? 'Purging Records...' : 'Purge All Database Records'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
