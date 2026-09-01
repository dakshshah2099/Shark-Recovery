import React, { useState } from 'react';
import { SingleFailureForm } from '../components/SingleFailureForm';
import { CsvUploader } from '../components/CsvUploader';
import { Zap, UploadCloud, Layers } from 'lucide-react';

interface IngestionViewProps {
  onSuccess: () => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({ onSuccess, showNotification }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single');

  return (
    <div className="space-y-6 w-full">
      {/* Mode Switcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Payment Dropout Ingestion Hub</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            Ingest checkout dropouts, bank gateway error logs, or batch reconciliation files to trigger autonomous multi-agent recovery.
          </p>
        </div>

        <div role="tablist" aria-label="Ingestion mode" className="flex items-center bg-zinc-100 dark:bg-[#09090b] p-1 rounded-md border border-zinc-200 dark:border-[#27272a] text-xs">
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
            <span>Batch CSV Ingestion</span>
          </button>
        </div>
      </div>

      {activeTab === 'single' ? (
        <SingleFailureForm onSuccess={onSuccess} showNotification={showNotification} />
      ) : (
        <CsvUploader onSuccess={onSuccess} showNotification={showNotification} />
      )}
    </div>
  );
};
