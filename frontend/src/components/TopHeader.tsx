import React from 'react';
import { Menu, Sun, Moon, ShieldCheck } from 'lucide-react';

interface TopHeaderProps {
  activeTab: string;
  onOpenMobile: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobile,
  darkMode,
  onToggleTheme,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Recovery Overview',
      subtitle: 'Real-time revenue recovery metrics, in-flight pipeline, and agent performance.',
    },
    transactions: {
      title: 'Payment Transactions',
      subtitle: 'Failed checkout dropouts, AI diagnostic dispositions, and payment recovery links.',
    },
    ingest: {
      title: 'Failure Ingestion & Simulation',
      subtitle: 'Inject custom payment failures or upload bulk CSV logs to run recovery triage.',
    },
    audit: {
      title: 'AI Agent Audit Ledger',
      subtitle: 'Deterministic trace logs of Diagnostic & Strategy agents with JSON payload verification.',
    },
    settings: {
      title: 'Merchant & Gateway Settings',
      subtitle: 'Configure Razorpay webhook credentials, outbound SMS/WhatsApp gateway, and LLM keys.',
    },
  };

  const current = titles[activeTab] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="h-18 border-b border-slate-200 dark:border-[#172a46] bg-white/90 dark:bg-[#09111e]/90 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 dark:border-[#172a46] text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white inline-flex items-center justify-center cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
            {current.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#7a95b8] hidden sm:block mt-0.5">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Razorpay Test Mode Badge */}
        <div className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>TEST MODE</span>
        </div>

        {/* Razorpay Agent Status Badge */}
        <div className="hidden md:inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-[#0c83ff]/10 border border-[#0c83ff]/25 text-xs font-semibold text-[#0c83ff] dark:text-[#3395ff]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Agent Ingestion Live</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8.5 h-8.5 rounded-lg border border-slate-200 dark:border-[#172a46] text-slate-600 dark:text-[#8ea5c8] hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#0c182b] inline-flex items-center justify-center transition-colors cursor-pointer"
          title="Toggle color theme"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
};
