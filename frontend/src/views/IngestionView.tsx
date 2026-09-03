import React, { useState } from 'react';
import { SingleFailureForm } from '../components/SingleFailureForm';
import { CsvUploader } from '../components/CsvUploader';
import { RazorpayCheckoutButton } from '../components/RazorpayCheckoutButton';
import { BatchBenchmarkSuite } from '../components/BatchBenchmarkSuite';
import { Zap, UploadCloud, Layers, CreditCard, Sparkles } from 'lucide-react';

interface IngestionViewProps {
  onSuccess: () => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({ onSuccess, showNotification }) => {
  const [activeTab, setActiveTab] = useState<'benchmark' | 'checkout' | 'single' | 'csv'>('benchmark');

  return (
    <div className="space-y-6 w-full">
      {/* 1. Hero Executive Strip */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs transition-colors space-y-1.5">
        <h2 className="font-heading font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Autonomous Revenue Recovery Hub</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading">
          Execute closed-loop multi-agent recovery across checkout dropoffs, mandate retries, B2B invoices, and Hinglish Voice AI.
        </p>
      </div>

      {/* 2. Ingestion Mode Switcher Pane (Dedicated Selection Pane Below) */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-3 sm:p-4 shadow-xs transition-colors">
        <div
          role="tablist"
          aria-label="Recovery Hub Ingestion Mode"
          className="grid grid-cols-2 lg:grid-cols-4 gap-2.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'benchmark'}
            onClick={() => setActiveTab('benchmark')}
            className={`p-3 rounded-lg font-subheading text-xs text-left cursor-pointer transition-all border focus-rzp ${
              activeTab === 'benchmark'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-zinc-50/70 hover:bg-zinc-100 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#27272a]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold font-heading">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
              <span className="truncate">Multi-Vector Suite</span>
            </div>
            <p className={`text-[11px] mt-1 font-body truncate ${activeTab === 'benchmark' ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
              6-Vector Closed Loop
            </p>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'checkout'}
            onClick={() => setActiveTab('checkout')}
            className={`p-3 rounded-lg font-subheading text-xs text-left cursor-pointer transition-all border focus-rzp ${
              activeTab === 'checkout'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-zinc-50/70 hover:bg-zinc-100 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#27272a]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold font-heading">
              <CreditCard className="w-4 h-4 shrink-0 text-blue-400" aria-hidden="true" />
              <span className="truncate">Live Razorpay Modal</span>
            </div>
            <p className={`text-[11px] mt-1 font-body truncate ${activeTab === 'checkout' ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
              SDK Checkout Test
            </p>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'single'}
            onClick={() => setActiveTab('single')}
            className={`p-3 rounded-lg font-subheading text-xs text-left cursor-pointer transition-all border focus-rzp ${
              activeTab === 'single'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-zinc-50/70 hover:bg-zinc-100 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#27272a]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold font-heading">
              <Zap className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
              <span className="truncate">Manual Entry</span>
            </div>
            <p className={`text-[11px] mt-1 font-body truncate ${activeTab === 'single' ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
              Single Failure Form
            </p>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'csv'}
            onClick={() => setActiveTab('csv')}
            className={`p-3 rounded-lg font-subheading text-xs text-left cursor-pointer transition-all border focus-rzp ${
              activeTab === 'csv'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-zinc-50/70 hover:bg-zinc-100 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#27272a]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold font-heading">
              <UploadCloud className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span className="truncate">Batch CSV</span>
            </div>
            <p className={`text-[11px] mt-1 font-body truncate ${activeTab === 'csv' ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
              Bulk File Ingestion
            </p>
          </button>
        </div>
      </div>

      {activeTab === 'benchmark' && (
        <BatchBenchmarkSuite onSuccess={onSuccess} showNotification={showNotification} />
      )}

      {activeTab === 'checkout' && (
        <RazorpayCheckoutButton onSuccess={onSuccess} showNotification={showNotification} />
      )}

      {activeTab === 'single' && (
        <SingleFailureForm onSuccess={onSuccess} showNotification={showNotification} />
      )}

      {activeTab === 'csv' && (
        <CsvUploader onSuccess={onSuccess} showNotification={showNotification} />
      )}
    </div>
  );
};
