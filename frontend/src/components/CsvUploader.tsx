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
    <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-lg p-5 sm:p-7 space-y-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-[#172a46]">
        <div>
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600 dark:text-sky-400" />
            <span>Bulk CSV Payment Ingestion</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Upload checkout transaction logs to trigger automated multi-agent triage.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="h-8.5 px-3 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-[#132238] dark:hover:bg-[#1c3252] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#172a46] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
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
        className={`border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] ${
          dragOver
            ? 'border-[#0c83ff] bg-[#0c83ff]/10'
            : file
            ? 'border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20'
            : 'border-slate-200 hover:border-slate-300 dark:border-[#172a46] dark:hover:border-[#223e66] bg-slate-50/50 dark:bg-[#080d1a]'
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
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/80">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{file.name}</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">{(file.size / 1024).toFixed(1)} KB • Ready to Ingest</div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-[#132238] text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto border border-slate-200 dark:border-[#172a46]">
              <UploadCloud className="w-4.5 h-4.5" />
            </div>
            <div className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Drag & Drop your <span className="text-blue-600 dark:text-sky-400">.csv</span> file here, or click to browse
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Headers: <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">name, email, phone, amount, failure_code, failure_reason</span>
            </div>
          </div>
        )}
      </div>

      {file && (
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setFile(null)}
            className="h-8.5 px-3.5 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-[#8ea5c8] dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#132238] dark:hover:bg-[#1c3252] inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="h-8.5 px-4 rounded-md bg-[#0c83ff] hover:bg-[#006fdf] text-white font-heading font-semibold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Process CSV File</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
