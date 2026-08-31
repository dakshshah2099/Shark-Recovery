import React from 'react';
import {
  LayoutDashboard,
  Table,
  Zap,
  Activity,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      desc: 'KPIs & recovery funnel',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: Table,
      desc: 'Failed payment ledger',
    },
    {
      id: 'ingest',
      label: 'Failure Ingestion',
      icon: Zap,
      desc: 'CSV & single simulation',
    },
    {
      id: 'audit',
      label: 'Agent Audit Trail',
      icon: Activity,
      desc: 'AI triage & trace logs',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      desc: 'Webhooks & keys',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-[#0d0e14] border-r border-slate-200 dark:border-white/[0.08] flex flex-col justify-between transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Header */}
        <div>
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    Shark<span className="text-blue-600 dark:text-blue-500">Recovery</span>
                  </span>
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  Razorpay Autonomous Engine
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Workspace
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/80 dark:border-blue-500/20 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-300'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
