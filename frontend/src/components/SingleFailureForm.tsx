import React, { useState } from 'react';
import { Zap, Send, Loader2 } from 'lucide-react';

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
    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-7 space-y-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-[#27272a]">
        <div>
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Single Payment Failure Replicator</span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            Inject a simulated failed checkout transaction to trigger live multi-agent recovery.
          </p>
        </div>
      </div>

      {/* Preset Quick Fill */}
      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
          Select Common Indian Payment Dropout Scenario:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {failureOptions.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectPreset(opt)}
              className={`p-2.5 rounded-md border text-left text-xs transition-all cursor-pointer ${
                failureReason === opt.reason
                  ? 'bg-blue-50/80 dark:bg-[#18181b] border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs font-semibold'
                  : 'bg-zinc-50 dark:bg-[#09090b] border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <div className="font-semibold font-subheading text-zinc-900 dark:text-white">{opt.label}</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 line-clamp-1">{opt.reason}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus:outline-none focus:border-blue-500 transition-colors font-body"
            />
          </div>

          <div>
            <label className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Customer Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus:outline-none focus:border-blue-500 transition-colors font-body"
            />
          </div>

          <div>
            <label className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">WhatsApp Phone (E.164)</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Order Amount (INR)</label>
            <input
              type="number"
              required
              min={1}
              step="any"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Razorpay Failure Code</label>
            <input
              type="text"
              required
              value={failureCode}
              onChange={(e) => setFailureCode(e.target.value)}
              className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Failure Reason Description</label>
          <input
            type="text"
            required
            value={failureReason}
            onChange={(e) => setFailureReason(e.target.value)}
            className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus:outline-none focus:border-blue-500 transition-colors font-body"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="instant-pay"
            checked={instantRecovery}
            onChange={(e) => setInstantRecovery(e.target.checked)}
            className="rounded border-zinc-300 dark:border-[#27272a] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#18181b] cursor-pointer"
          />
          <label htmlFor="instant-pay" className="text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer select-none font-body font-medium">
            Simulate customer immediately completing payment via recovery link
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-9 px-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-subheading font-semibold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Multi-Agent Loop...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 fill-white" />
                <span>Replicate Failure & Run Recovery Loop</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
