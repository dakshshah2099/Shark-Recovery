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
    <div className="bg-[#121318] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <h3 className="font-heading font-black text-lg text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <span>Single Payment Failure Replicator</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Inject a custom failed checkout transaction to trigger live multi-agent recovery & outreach.
          </p>
        </div>
      </div>

      {/* Preset Quick Fill */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          Select Common Indian Failure Scenario:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {failureOptions.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectPreset(opt)}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                failureReason === opt.reason
                  ? 'bg-blue-600/10 border-blue-500 text-white'
                  : 'bg-black/40 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]'
              }`}
            >
              <div className="font-semibold text-zinc-200">{opt.label}</div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5 line-clamp-1">{opt.reason}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/60 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1">Customer Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/60 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1">WhatsApp Phone (E.164)</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-black/60 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1">Order Amount (INR)</label>
            <input
              type="number"
              required
              min={1}
              step="any"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-black/60 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1">Razorpay Failure Code</label>
            <input
              type="text"
              required
              value={failureCode}
              onChange={(e) => setFailureCode(e.target.value)}
              className="w-full bg-black/60 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 font-medium mb-1">Failure Reason Description</label>
          <input
            type="text"
            required
            value={failureReason}
            onChange={(e) => setFailureReason(e.target.value)}
            className="w-full bg-black/60 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="instant-pay"
            checked={instantRecovery}
            onChange={(e) => setInstantRecovery(e.target.checked)}
            className="rounded border-zinc-700 text-blue-600 focus:ring-blue-500 bg-black cursor-pointer"
          />
          <label htmlFor="instant-pay" className="text-xs text-zinc-300 cursor-pointer select-none">
            Simulate customer immediately paying via discounted recovery link
          </label>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>{submitting ? 'Orchestrating Recovery Pipeline...' : 'Inject Failure & Run AI Recovery Loop'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
