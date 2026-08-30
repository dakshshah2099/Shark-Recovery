import React, { useState } from 'react';
import { SingleFailureForm } from '../components/SingleFailureForm';
import { CsvUploader } from '../components/CsvUploader';
import { Zap, UploadCloud, Layers } from 'lucide-react';

interface IngestionViewProps {
  onSuccess: () => void;
  showNotification: (msg: string) => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({ onSuccess, showNotification }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Mode Switcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>Failure Ingestion & Simulation Hub</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Trigger live recovery workflows by either injecting individual checkout failure events or uploading batch CSV logs.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-black/60 p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold cursor-pointer transition-all ${
              activeTab === 'single'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Single Failure</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold cursor-pointer transition-all ${
              activeTab === 'csv'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>CSV Upload</span>
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
