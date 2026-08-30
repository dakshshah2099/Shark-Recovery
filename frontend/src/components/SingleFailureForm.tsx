import React, { useState } from 'react';
import { Zap, Send } from 'lucide-react';

interface SingleFailureFormProps {
  onSuccess: () => void;
  showNotification: (msg: string) => void;
}

export const SingleFailureForm: React.FC<SingleFailureFormProps> = ({
  onSuccess,
  showNotification,
}) => {
  const [name, setName] = useState<string>('Rahul Sharma');
  const [email, setEmail] = useState<string>('rahul.sharma@example.com');
  const [phone, setPhone] = useState<string>('+919876543210');
  const [amount, setAmount] = useState<number>(3499);
  const [failureCode, setFailureCode] = useState<string>('BAD_REQUEST_ERROR');
  const [failureReason, setFailureReason] = useState<string>(
    'Payment failed due to daily UPI transaction limit exceeded'
  );
  const [instantRecovery, setInstantRecovery] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const failureOptions = [
    {
      code: 'BAD_REQUEST_ERROR',
      reason: 'Payment failed due to daily UPI transaction limit exceeded',
      label: 'UPI Daily Limit Exceeded (BAD_REQUEST_ERROR)',
    },
    {
      code: 'GATEWAY_ERROR',
      reason: 'OTP timed out on HDFC netbanking authentication',
      label: 'Netbanking 3DS OTP Timeout (GATEWAY_ERROR)',
    },
    {
      code: 'GATEWAY_ERROR',
      reason: 'SBI gateway server 503 temporary outage',
      label: 'SBI Bank 503 Outage (GATEWAY_ERROR)',
    },
    {
      code: 'INSUFFICIENT_FUNDS',
      reason: 'Insufficient balance in Kotak account',
      label: 'Insufficient Bank Balance (INSUFFICIENT_FUNDS)',
    },
    {
      code: 'USER_DROPOUT',
      reason: 'User dropped out during checkout confirmation',
      label: 'Checkout Modal Abandonment (USER_DROPOUT)',
    },
    {
      code: 'BAD_REQUEST_ERROR',
      reason: 'Credit card expired or invalid CVV provided',
      label: 'Expired Card / Auth Failure (EXPIRED_CARD)',
    },
  ];

  const handleSelectPreset = (preset: typeof failureOptions[0]) => {
    setFailureCode(preset.code);
    setFailureReason(preset.reason);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/simulate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          amount: Number(amount),
          failure_code: failureCode,
          failure_reason: failureReason,
          simulate_instant_recovery: instantRecovery,
        }),
      });

      if (res.ok) {
        showNotification(`⚡ Single failure replicated & recovery orchestrated for ${name}!`);
        onSuccess();
      } else {
        const err = await res.json();
        showNotification(`Failed: ${err.detail || 'Could not process transaction'}`);
      }
    } catch (err) {
      console.error('Error simulating single failure:', err);
      showNotification('Network error while replicating failure.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-9 space-y-7 shadow-xs transition-colors">
      <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>Single Payment Failure Replicator</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Inject a custom failed checkout transaction to trigger live multi-agent recovery & outreach.
          </p>
        </div>
      </div>

      {/* Preset Quick Fill */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">
          Select Common Indian Failure Scenario:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {failureOptions.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectPreset(opt)}
              className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                failureReason === opt.reason
                  ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-500 text-blue-900 dark:text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/[0.15]'
              }`}
            >
              <div className="font-semibold text-slate-900 dark:text-zinc-200">{opt.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-1 line-clamp-1">{opt.reason}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Customer Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Customer Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">WhatsApp Phone (E.164)</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Order Amount (INR)</label>
            <input
              type="number"
              required
              min={1}
              step="any"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Razorpay Failure Code</label>
            <input
              type="text"
              required
              value={failureCode}
              onChange={(e) => setFailureCode(e.target.value)}
              className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Failure Reason Description</label>
          <input
            type="text"
            required
            value={failureReason}
            onChange={(e) => setFailureReason(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <input
            type="checkbox"
            id="instant-pay"
            checked={instantRecovery}
            onChange={(e) => setInstantRecovery(e.target.checked)}
            className="rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-black cursor-pointer"
          />
          <label htmlFor="instant-pay" className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer select-none font-medium">
            Simulate customer immediately paying via discounted recovery link
          </label>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>{submitting ? 'Orchestrating Recovery Pipeline...' : 'Inject Failure & Run AI Recovery Loop'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
