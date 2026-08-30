import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';

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
      title: 'Executive Overview',
      subtitle: 'Real-time revenue recovery metrics, in-flight pipeline, and agent performance.',
    },
    transactions: {
      title: 'Transactions & Recovery Ledger',
      subtitle: 'Complete auditable history of failed checkouts and recovery dispositions.',
    },
    ingest: {
      title: 'Failure Ingestion & Simulation',
      subtitle: 'Inject custom payment failures or upload bulk CSV logs to run recovery triage.',
    },
    audit: {
      title: 'Agent Audit Trail & Observability',
      subtitle: 'Deterministic execution trace of diagnostic and strategy agents with JSON payloads.',
    },
    settings: {
      title: 'System Settings & Integration',
      subtitle: 'Manage Razorpay webhook endpoints, outbound gateway credentials, and database state.',
    },
  };

  const current = titles[activeTab] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="h-20 border-b border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-10 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden w-10 h-10 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white inline-flex items-center justify-center cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
            {current.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block mt-0.5">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Agent Status Badge */}
        <div className="hidden sm:inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Multi-Agent Engine Active</span>
        </div>

        {/* Theme quick switch */}
        <button
          onClick={onToggleTheme}
          className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#121318] inline-flex items-center justify-center transition-colors cursor-pointer"
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
