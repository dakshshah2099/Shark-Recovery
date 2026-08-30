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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121318] border border-white/[0.08] rounded-2xl p-6">
        <div>
          <h2 className="font-heading font-black text-xl text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-blue-500" />
            <span>Failure Ingestion & Simulation Hub</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Trigger live recovery workflows by either injecting individual checkout failure events or uploading batch CSV logs.
          </p>
        </div>

        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/[0.08] text-xs">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold cursor-pointer transition-all ${
              activeTab === 'single'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Single Failure</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold cursor-pointer transition-all ${
              activeTab === 'csv'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
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
