import React from 'react';
import {
  LayoutDashboard,
  Table,
  Zap,
  Activity,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
  darkMode,
  onToggleTheme,
}) => {
  const mainNavItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      desc: 'KPIs & funnel',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: Table,
      desc: 'Recovery ledger',
    },
  ];

  const agentNavItems = [
    {
      id: 'ingest',
      label: 'Failure Ingestion',
      icon: Zap,
      desc: 'CSV & simulation',
    },
    {
      id: 'audit',
      label: 'AI Audit Trail',
      icon: Activity,
      desc: 'Trace & telemetry',
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

  const renderNavGroup = (items: typeof mainNavItems, title?: string) => (
    <div className="space-y-1">
      {!collapsed && title && (
        <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </div>
      )}
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
            title={collapsed ? item.label : undefined}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer relative ${
              collapsed ? 'justify-center' : 'text-left'
            } ${
              isActive
                ? 'bg-blue-50/80 dark:bg-[#18181b] text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-zinc-700 shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181b]'
            }`}
          >
            {isActive && !collapsed && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
            )}
            <Icon
              className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                isActive
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
              }`}
            />
            {!collapsed && (
              <div className="flex-1 truncate">
                <div className="text-xs font-semibold font-subheading truncate">{item.label}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-body truncate">
                  {item.desc}
                </div>
              </div>
            )}
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
          className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-[#27272a] flex flex-col justify-between transition-all duration-200 ease-out lg:translate-x-0 ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${mobileOpen ? 'translate-x-0 !w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Header */}
        <div>
          <div
            className={`h-16 px-4 flex items-center border-b border-zinc-200 dark:border-[#27272a] transition-all ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Theme-Adaptive Icon */}
              <div className="w-8 h-8 rounded-md flex items-center justify-center transition-colors bg-blue-600 text-white dark:bg-[#18181b] dark:border dark:border-[#27272a] dark:text-blue-400">
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M13.5 2L4 13.5h6.5L9.5 22 20 10.5h-6.5L13.5 2z" />
                </svg>
              </div>

              {!collapsed && (
                <span className="font-heading font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                  SHARKRECOVERY
                </span>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-3">
            {renderNavGroup(mainNavItems, collapsed ? undefined : 'Payments')}
            {renderNavGroup(agentNavItems, collapsed ? undefined : 'Autonomous Agents')}
            {renderNavGroup(systemNavItems, collapsed ? undefined : 'System')}
          </nav>
        </div>

        {/* Bottom Bar: Controls (Collapse, Theme & Status) */}
        <div className="p-3 border-t border-zinc-200 dark:border-[#27272a] bg-zinc-50/70 dark:bg-[#0c0c0e] space-y-2">
          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex w-full py-2 px-2.5 rounded-md border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-700 dark:text-zinc-300 text-xs font-medium items-center transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="inline-flex items-center gap-2">
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-zinc-500" />
              )}
              {!collapsed && <span className="font-subheading">Collapse Sidebar</span>}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`w-full py-2 px-2.5 rounded-md border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-700 dark:text-zinc-300 text-xs font-medium inline-flex items-center transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="inline-flex items-center gap-2">
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )}
              {!collapsed && <span className="font-subheading">{darkMode ? 'Dark Theme' : 'Light Theme'}</span>}
            </span>
            {!collapsed && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                {darkMode ? 'Dark' : 'Light'}
              </span>
            )}
          </button>

          {/* Clean Status Indicator */}
          {!collapsed ? (
            <div className="flex items-center gap-2 text-xs px-1 pt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                rzp_live_mode
              </span>
            </div>
          ) : (
            <div className="flex justify-center pt-1" title="Razorpay Webhook Active">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
