import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Loader2, AlertCircle, ArrowUpRight, HelpCircle } from 'lucide-react';

interface RazorpayCheckoutButtonProps {
  onSuccess: () => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  onSuccess,
  showNotification,
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('2499');
  const [sdkLoaded, setSdkLoaded] = useState<boolean>(false);
  const [initiating, setInitiating] = useState<boolean>(false);

  // Load Razorpay Standard Checkout Script
  useEffect(() => {
    if (window.Razorpay) {
      setSdkLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout SDK script');
      showNotification('Could not load Razorpay Checkout SDK. Check network connection.', 'error');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [showNotification]);

  const handleLaunchCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showNotification('Please provide a valid order amount in INR.', 'error');
      return;
    }

    const finalName = customerName.trim() || 'Priya Sharma';
    const finalEmail = customerEmail.trim() || 'priya.sharma@example.com';
    const finalPhone = customerPhone.trim() || '+919876543210';

    setInitiating(true);
    showNotification('Initializing live Razorpay test checkout session...', 'loading', 0);

    try {
      // 1. Create order on backend
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          currency: 'INR',
          customer_name: finalName,
          customer_email: finalEmail,
          customer_phone: finalPhone,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showNotification(`Order creation failed: ${err.detail || 'Could not initialize session'}`, 'error');
        setInitiating(false);
        return;
      }

      const orderData = await res.json();
      showNotification('Razorpay Checkout Modal active. Select Failure to test recovery.', 'info', 5000);

      if (!window.Razorpay) {
        showNotification('Razorpay SDK not available. Fallback to direct simulation.', 'error');
        setInitiating(false);
        return;
      }

      // 2. Configure official Razorpay Checkout options
      const options = {
        key: orderData.key_id || 'rzp_test_TWSrBAIEzLzPT3',
        amount: Math.round(numAmount * 100),
        currency: orderData.currency || 'INR',
        name: 'Shark Recovery Store',
        description: 'Payment Dropout & Recovery Live Verification',
        order_id: orderData.order_id,
        prefill: {
          name: finalName,
          email: finalEmail,
          contact: finalPhone,
        },
        theme: {
          color: '#0c2340',
        },
        handler: async (response: any) => {
          showNotification(`Payment Succeeded (Payment ID: ${response.razorpay_payment_id})`, 'success', 4500);
          onSuccess();
          setInitiating(false);
        },
        modal: {
          ondismiss: () => {
            setInitiating(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);

      // 3. Listen for client failure event
      rzpInstance.on('payment.failed', async (failureResponse: any) => {
        const errObj = failureResponse.error || {};
        showNotification(`⚠️ Payment Failed: ${errObj.description || 'Checkout Dropout'}. Intercepting with AI agent...`, 'loading', 0);

        try {
          const reportRes = await fetch('/api/checkout/report-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderData.order_id || errObj.metadata?.order_id,
              payment_id: errObj.metadata?.payment_id,
              error_code: errObj.code || 'BAD_REQUEST_ERROR',
              error_description: errObj.description || 'Payment failed during checkout authentication',
              error_source: errObj.source || 'bank',
              error_step: errObj.step || 'payment_authentication',
              error_reason: errObj.reason || 'payment_failed',
              amount: numAmount,
              customer_name: finalName,
              customer_email: finalEmail,
              customer_phone: finalPhone,
            }),
          });

          if (reportRes.ok) {
            showNotification(`⚡ Live failure intercepted! AI recovery executed & outreach dispatched for ${finalName}.`, 'success', 5000);
            onSuccess();
          } else {
            showNotification('Webhook / report processed. Refreshing ledger...', 'info', 3000);
            onSuccess();
          }
        } catch (reportErr) {
          console.error('Failed to report client failure:', reportErr);
        } finally {
          setInitiating(false);
        }
      });

      rzpInstance.open();
    } catch (err) {
      console.error('Checkout launch error:', err);
      showNotification('Network error while launching Razorpay checkout modal.', 'error');
      setInitiating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-7 space-y-6 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-[#27272a]">
        <div>
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>Live Razorpay Checkout Testing</span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            Launch the official Razorpay test modal to generate real payment failures and demonstrate end-to-end webhook recovery.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Razorpay Standard SDK</span>
          </span>
        </div>
      </div>

      {/* Demonstration Instructions Card */}
      <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-lg p-4 text-xs space-y-2.5">
        <div className="font-heading font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 font-subheading">
          <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>How to demonstrate a live payment failure:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-zinc-700 dark:text-zinc-300 font-body leading-relaxed pl-1">
          <li>Click <strong className="text-zinc-900 dark:text-white font-semibold">"Launch Razorpay Checkout"</strong> below to open the official modal.</li>
          <li>In the Razorpay window, choose <strong className="text-zinc-900 dark:text-white font-semibold">UPI</strong> or <strong className="text-zinc-900 dark:text-white font-semibold">Card</strong>.</li>
          <li>Select <strong className="text-rose-600 dark:text-rose-400 font-semibold">"Failure"</strong> on the test bank screen (or enter test card <code className="bg-white dark:bg-[#18181b] px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono">4000 0000 0000 0002</code>).</li>
          <li>Observe the real-time AI triage interception, diagnostic root cause analysis, dynamic discount calculation, and recovery outreach!</li>
        </ol>
      </div>

      {/* Checkout Parameters Form */}
      <form onSubmit={handleLaunchCheckout} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label htmlFor="rzp-name" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Customer Name
            </label>
            <input
              id="rzp-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus-rzp font-body transition-colors"
            />
          </div>

          <div>
            <label htmlFor="rzp-email" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Customer Email
            </label>
            <input
              id="rzp-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="e.g. priya.sharma@example.com"
              className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus-rzp font-body transition-colors"
            />
          </div>

          <div>
            <label htmlFor="rzp-phone" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              WhatsApp Contact (E.164)
            </label>
            <input
              id="rzp-phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus-rzp font-mono transition-colors"
            />
          </div>
        </div>

        <div className="max-w-xs">
          <label htmlFor="rzp-amount" className="block text-xs font-subheading font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
            Order Amount (INR) <span className="text-rose-500" aria-hidden="true">*</span>
          </label>
          <input
            id="rzp-amount"
            type="number"
            required
            aria-required="true"
            min={1}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 2499.00"
            className="w-full h-9 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white rounded-md px-3 focus-rzp font-mono transition-colors"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={initiating || !sdkLoaded}
            className="h-10 px-6 rounded-md bg-[#0c2340] hover:bg-[#14355f] text-white font-subheading font-bold text-xs inline-flex items-center justify-center gap-2.5 cursor-pointer shadow-md disabled:opacity-50 transition-all border border-[#0c2340] focus-rzp"
          >
            {initiating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Opening Razorpay Standard Modal...</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-extrabold text-white">
                  ₹
                </div>
                <span>Launch Razorpay Live Test Checkout</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>
          {!sdkLoaded && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-body flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Loading official Razorpay checkout script from checkout.razorpay.com...</span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
