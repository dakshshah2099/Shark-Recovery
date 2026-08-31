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
    <div className="space-y-6 w-full">
      {/* Mode Switcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-xl p-5 sm:p-6 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0c83ff] dark:text-[#3395ff]" />
            <span>Failure Ingestion & Simulation Hub</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#7a95b8] mt-0.5">
            Trigger autonomous recovery by injecting single failed checkout events or batch CSV logs.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-[#080d1a] p-1 rounded-lg border border-slate-200 dark:border-[#172a46] text-xs">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3.5 py-1.5 rounded-md flex items-center gap-1.5 font-semibold cursor-pointer transition-all ${
              activeTab === 'single'
                ? 'bg-[#0c83ff] text-white shadow-xs'
                : 'text-slate-600 dark:text-[#8ea5c8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Single Failure</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-1.5 rounded-md flex items-center gap-1.5 font-semibold cursor-pointer transition-all ${
              activeTab === 'csv'
                ? 'bg-[#0c83ff] text-white shadow-xs'
                : 'text-slate-600 dark:text-[#8ea5c8] hover:text-slate-900 dark:hover:text-white'
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
