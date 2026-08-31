import React from 'react';
import {
  LayoutDashboard,
  Table,
  Zap,
  Activity,
  Settings,
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
  const mainNavItems = [
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
  ];

  const agentNavItems = [
    {
      id: 'ingest',
      label: 'Failure Ingestion',
      icon: Zap,
      desc: 'CSV & live simulation',
    },
    {
      id: 'audit',
      label: 'AI Audit Trail',
      icon: Activity,
      desc: 'Agent trace logs',
    },
  ];

  const systemNavItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      desc: 'Keys & Webhooks',
    },
  ];

  const renderNavGroup = (items: typeof mainNavItems, title: string) => (
    <div className="space-y-1">
      <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#52719c]">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              onCloseMobile();
            }}
            className={`w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer relative ${
              isActive
                ? 'bg-blue-50/90 dark:bg-[#0c83ff]/15 text-[#0c83ff] dark:text-[#3395ff] font-semibold border border-blue-200/70 dark:border-[#0c83ff]/30 shadow-xs'
                : 'text-slate-600 dark:text-[#8ea5c8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#132238]/60'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#0c83ff] rounded-r-full" />
            )}
            <Icon
              className={`w-4 h-4 transition-colors ${
                isActive
                  ? 'text-[#0c83ff] dark:text-[#3395ff]'
                  : 'text-slate-400 dark:text-[#627d9f] group-hover:text-slate-700 dark:group-hover:text-[#b8cde8]'
              }`}
            />
            <div className="flex-1">
              <div className="text-xs font-semibold">{item.label}</div>
              <div className="text-[10px] text-slate-400 dark:text-[#627d9f] font-normal">
                {item.desc}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container - Razorpay Dark/Light Palette */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-[#09111e] border-r border-slate-200 dark:border-[#172a46] flex flex-col justify-between transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Header */}
        <div>
          <div className="h-18 px-5 flex items-center justify-between border-b border-slate-200 dark:border-[#172a46]">
            <div className="flex items-center gap-3">
              {/* Razorpay Iconic Lightning Bolt Icon */}
              <div className="w-9 h-9 bg-[#0c2340] dark:bg-[#07172b] border border-[#0c83ff]/40 rounded-xl flex items-center justify-center shadow-xs">
                <svg
                  className="w-5 h-5 text-[#3395ff]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M13.5 2L4 13.5h6.5L9.5 22 20 10.5h-6.5L13.5 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    Razorpay
                  </span>
                  <span className="text-[10px] font-bold bg-[#0c83ff] text-white px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                    Recovery
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-[#7a95b8] flex items-center gap-1">
                  <span>AI Revenue Engine</span>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-4">
            {renderNavGroup(mainNavItems, 'Payments & Recovery')}
            {renderNavGroup(agentNavItems, 'Autonomous Agents')}
            {renderNavGroup(systemNavItems, 'Integration')}
          </nav>
        </div>

        {/* Bottom Merchant Status Badge */}
        <div className="p-4 border-t border-slate-200 dark:border-[#172a46] bg-slate-50/50 dark:bg-[#070e1a]/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                  rzp_live_gateway
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#6a87aa]">
                  Webhook Active
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-mono">
              TEST MODE
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
