import React from 'react';
import {
  LayoutDashboard,
  Table,
  Zap,
  Activity,
  Settings,
  X,
  ChevronLeft,
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

const MAIN_NAV_ITEMS = [
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

const AGENT_NAV_ITEMS = [
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

const SYSTEM_NAV_ITEMS = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    desc: 'Keys & Webhooks',
  },
];

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

  const renderNavGroup = (items: typeof MAIN_NAV_ITEMS, title?: string) => (
    <div className="space-y-1">
      {title && (
        <div
          className={`px-3 overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ${
            collapsed ? 'max-h-0 opacity-0 py-0 -translate-y-1 pointer-events-none' : 'max-h-8 opacity-100 py-1.5 translate-y-0'
          }`}
        >
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onTabChange(item.id);
              onCloseMobile();
            }}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 cursor-pointer relative overflow-hidden ${
              collapsed ? 'justify-center' : 'text-left'
            } ${
              isActive
                ? 'bg-blue-50/80 dark:bg-[#18181b] text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-zinc-700 shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181b]'
            }`}
          >
            {isActive && (
              <span
                className={`absolute left-0 top-2 bottom-2 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full transition-all duration-300 ${
                  collapsed ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'
                }`}
                aria-hidden="true"
              />
            )}
            <Icon
              className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isActive
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
              }`}
              aria-hidden="true"
            />
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap flex-1 ${
                collapsed ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none' : 'max-w-[170px] opacity-100 translate-x-0'
              }`}
            >
              <div className="text-xs font-semibold font-subheading truncate">{item.label}</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-body truncate">
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
          className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container with Smooth Width & Transform Transitions */}
      <aside
        aria-label="Sidebar navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-[#27272a] flex flex-col justify-between transition-[width,transform] duration-300 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 overflow-x-hidden ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${mobileOpen ? 'translate-x-0 !w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Header */}
        <div>
          <div
            className={`h-16 px-4 flex items-center border-b border-zinc-200 dark:border-[#27272a] transition-all duration-300 ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Theme-Adaptive Icon */}
              <div className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center transition-transform duration-200 hover:scale-105 bg-blue-600 text-white dark:bg-[#18181b] dark:border dark:border-[#27272a] dark:text-blue-400" aria-hidden="true">
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M13.5 2L4 13.5h6.5L9.5 22 20 10.5h-6.5L13.5 2z" />
                </svg>
              </div>

              <span
                className={`font-heading font-extrabold text-base tracking-tight text-zinc-900 dark:text-white whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                  collapsed ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none' : 'max-w-[160px] opacity-100 translate-x-0'
                }`}
              >
                SHARKRECOVERY
              </span>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation sidebar"
              className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Main navigation" className="p-3 space-y-3">
            {renderNavGroup(MAIN_NAV_ITEMS, 'Payments')}
            {renderNavGroup(AGENT_NAV_ITEMS, 'Autonomous Agents')}
            {renderNavGroup(SYSTEM_NAV_ITEMS, 'System')}
          </nav>
        </div>

        {/* Bottom Bar: Controls (Collapse, Theme & Status) */}
        <div className="p-3 border-t border-zinc-200 dark:border-[#27272a] bg-zinc-50/70 dark:bg-[#0c0c0e] space-y-2">
          {/* Sidebar Collapse Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className={`hidden lg:flex w-full py-2 px-2.5 rounded-md border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-700 dark:text-zinc-300 text-xs font-medium items-center transition-all duration-200 cursor-pointer focus-rzp overflow-hidden ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="inline-flex items-center gap-2 overflow-hidden">
              <ChevronLeft
                className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-300 ease-in-out ${
                  collapsed ? 'rotate-180' : 'rotate-0'
                }`}
                aria-hidden="true"
              />
              <span
                className={`font-subheading whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                  collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[120px] opacity-100 translate-x-0'
                }`}
              >
                Collapse Sidebar
              </span>
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            className={`w-full py-2 px-2.5 rounded-md border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-700 dark:text-zinc-300 text-xs font-medium inline-flex items-center transition-all duration-200 cursor-pointer focus-rzp overflow-hidden ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="inline-flex items-center gap-2 overflow-hidden">
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-500 shrink-0 transition-transform duration-300 rotate-0" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700 shrink-0 transition-transform duration-300 rotate-0" aria-hidden="true" />
              )}
              <span
                className={`font-subheading whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                  collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[120px] opacity-100 translate-x-0'
                }`}
              >
                {darkMode ? 'Dark Theme' : 'Light Theme'}
              </span>
            </span>
            <span
              className={`text-[11px] text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[50px] opacity-100'
              }`}
            >
              {darkMode ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* Clean Status Indicator */}
          <div
            className={`flex items-center text-xs px-1 pt-1 overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed ? 'justify-center' : 'gap-2'
            }`}
            title="Razorpay Webhook Active"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span
              className={`text-[11px] font-mono text-zinc-700 dark:text-zinc-300 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[120px] opacity-100 translate-x-0'
              }`}
            >
              rzp_live_mode
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
