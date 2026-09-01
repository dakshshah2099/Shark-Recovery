import React, { useState } from 'react';
import { SingleFailureForm } from '../components/SingleFailureForm';
import { CsvUploader } from '../components/CsvUploader';
import { RazorpayCheckoutButton } from '../components/RazorpayCheckoutButton';
import { BatchBenchmarkSuite } from '../components/BatchBenchmarkSuite';
import { SentinelTelemetryCard } from '../components/SentinelTelemetryCard';
import { Zap, UploadCloud, Layers, CreditCard, Sparkles } from 'lucide-react';

interface IngestionViewProps {
  onSuccess: () => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({ onSuccess, showNotification }) => {
  const [activeTab, setActiveTab] = useState<'benchmark' | 'checkout' | 'single' | 'csv'>('benchmark');

  return (
    <div className="space-y-6 w-full">
      {/* Mode Switcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Autonomous Revenue Recovery Hub</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            Execute closed-loop multi-agent recovery across checkout dropoffs, mandate retries, B2B invoices, and Hinglish Voice AI.
          </p>
        </div>

        <div role="tablist" aria-label="Ingestion mode" className="flex items-center bg-zinc-100 dark:bg-[#09090b] p-1 rounded-md border border-zinc-200 dark:border-[#27272a] text-xs flex-wrap gap-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'benchmark'}
            onClick={() => setActiveTab('benchmark')}
            className={`px-3.5 py-1.5 rounded font-subheading font-semibold flex items-center gap-1.5 cursor-pointer transition-all focus-rzp ${
              activeTab === 'benchmark'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Multi-Vector Suite</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'checkout'}
            onClick={() => setActiveTab('checkout')}
            className={`px-3.5 py-1.5 rounded font-subheading font-semibold flex items-center gap-1.5 cursor-pointer transition-all focus-rzp ${
              activeTab === 'checkout'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Live Razorpay Modal</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'single'}
            onClick={() => setActiveTab('single')}
            className={`px-3.5 py-1.5 rounded font-subheading font-semibold flex items-center gap-1.5 cursor-pointer transition-all focus-rzp ${
              activeTab === 'single'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Manual Entry</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'csv'}
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-1.5 rounded font-subheading font-semibold flex items-center gap-1.5 cursor-pointer transition-all focus-rzp ${
              activeTab === 'csv'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Batch CSV</span>
          </button>
        </div>
      </div>

      {/* Sentinel Telemetry Anomaly Widget */}
      <SentinelTelemetryCard />

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
