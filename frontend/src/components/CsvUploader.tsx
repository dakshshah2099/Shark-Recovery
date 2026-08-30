import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Download, Loader2 } from 'lucide-react';

interface CsvUploaderProps {
  onSuccess: () => void;
  showNotification: (msg: string) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onSuccess, showNotification }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCsvContent = `name,email,phone,amount,failure_code,failure_reason
Pooja Hegde,pooja.h@example.com,+919820123456,3499,BAD_REQUEST_ERROR,Payment failed due to daily UPI debit limit exceeded
Rohan Verma,rohan.v@example.com,+919811987654,1899,GATEWAY_ERROR,OTP timed out on HDFC netbanking authentication
Deepak Gupta,deepak.g@example.com,+919711002233,5499,GATEWAY_ERROR,SBI gateway server 503 temporary outage
Ananya Sen,ananya.s@example.com,+919933445566,1299,USER_DROPOUT,User closed modal prior to OTP verification
Sneha Reddy,sneha.r@example.com,+919886098765,2799,INSUFFICIENT_FUNDS,Insufficient balance in savings account`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'failed_payments_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Sample CSV template downloaded!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        showNotification('Please upload a valid .csv file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ingest-csv', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        showNotification(`⚡ Successfully ingested & orchestrated ${data.processed_count} transactions from CSV!`);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onSuccess();
      } else {
        const err = await res.json();
        showNotification(`CSV Ingestion Error: ${err.detail || 'Could not parse file'}`);
      }
    } catch (err) {
      console.error('CSV upload error:', err);
      showNotification('Network error while uploading CSV.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 sm:p-9 space-y-7 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>Bulk CSV Failed Payment Ingestion</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Upload transaction logs from your checkout warehouse to trigger autonomous multi-agent triage.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
          dragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            : file
            ? 'border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/10'
            : 'border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-black/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/80">
              <FileText className="w-6 h-6" />
            </div>
            <div className="font-heading font-bold text-sm text-slate-900 dark:text-white">{file.name}</div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">{(file.size / 1024).toFixed(1)} KB • Ready to Ingest</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 flex items-center justify-center mx-auto border border-slate-200 dark:border-white/[0.06]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Drag & Drop your <span className="text-blue-600 dark:text-blue-400">.csv</span> file here, or browse
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-500">
              Headers: <span className="font-mono text-slate-700 dark:text-zinc-400">name, email, phone, amount, failure_code, failure_reason</span>
            </div>
          </div>
        )}
      </div>

      {file && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setFile(null)}
            className="h-11 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingesting & Running AI Triage...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Process & Run Recovery Pipeline</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
