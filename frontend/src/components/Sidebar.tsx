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
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#52719c]">
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
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer relative ${
              collapsed ? 'justify-center' : 'text-left'
            } ${
              isActive
                ? 'bg-blue-50/90 dark:bg-[#0c83ff]/15 text-[#0c83ff] dark:text-[#3395ff] font-semibold border border-blue-200/70 dark:border-[#0c83ff]/30 shadow-xs'
                : 'text-slate-600 dark:text-[#8ea5c8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#132238]/60'
            }`}
          >
            {isActive && !collapsed && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#0c83ff] rounded-r-full" />
            )}
            <Icon
              className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                isActive
                  ? 'text-[#0c83ff] dark:text-[#3395ff]'
                  : 'text-slate-400 dark:text-[#627d9f] group-hover:text-slate-700 dark:group-hover:text-[#b8cde8]'
              }`}
            />
            {!collapsed && (
              <div className="flex-1 truncate">
                <div className="text-xs font-semibold truncate">{item.label}</div>
                <div className="text-[10px] text-slate-400 dark:text-[#627d9f] font-normal truncate">
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#09111e] border-r border-slate-200 dark:border-[#172a46] flex flex-col justify-between transition-all duration-200 ease-out lg:translate-x-0 ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${mobileOpen ? 'translate-x-0 !w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Header */}
        <div>
          <div
            className={`h-16 px-4 flex items-center border-b border-slate-200 dark:border-[#172a46] transition-all ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Theme-Adaptive Razorpay Thunder Icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-xs bg-[#0c83ff] text-white dark:bg-[#0c2340] dark:border dark:border-[#0c83ff]/40 dark:text-[#3395ff]">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M13.5 2L4 13.5h6.5L9.5 22 20 10.5h-6.5L13.5 2z" />
                </svg>
              </div>

              {!collapsed && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                      Razorpay
                    </span>
                    <span className="text-[10px] font-bold bg-[#0c83ff] text-white px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                      Recovery
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-[#7a95b8]">
                    AI Revenue Engine
                  </div>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse/Expand Trigger */}
            {!collapsed && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#52719c] dark:hover:text-[#cad8ec] hover:bg-slate-100 dark:hover:bg-[#132238] transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Collapsed re-expand button */}
          {collapsed && (
            <div className="hidden lg:flex justify-center pt-2">
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#52719c] dark:hover:text-[#cad8ec] hover:bg-slate-100 dark:hover:bg-[#132238] transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-3">
            {renderNavGroup(mainNavItems, collapsed ? undefined : 'Payments')}
            {renderNavGroup(agentNavItems, collapsed ? undefined : 'Autonomous Agents')}
            {renderNavGroup(systemNavItems, collapsed ? undefined : 'System')}
          </nav>
        </div>

        {/* Bottom Bar: Theme Switcher & Status */}
        <div className="p-3 border-t border-slate-200 dark:border-[#172a46] bg-slate-50/50 dark:bg-[#070e1a]/80 space-y-2">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`w-full py-2 px-2.5 rounded-xl border border-slate-200 dark:border-[#172a46] bg-white dark:bg-[#0c182b] hover:bg-slate-50 dark:hover:bg-[#132238] text-slate-700 dark:text-[#cad8ec] text-xs font-medium inline-flex items-center transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="inline-flex items-center gap-2">
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
              {!collapsed && <span>{darkMode ? 'Dark Theme' : 'Light Theme'}</span>}
            </span>
            {!collapsed && (
              <span className="text-[10px] text-slate-400 dark:text-[#6a87aa] font-mono">
                {darkMode ? 'Dark' : 'Light'}
              </span>
            )}
          </button>

          {/* Gateway Status Indicator */}
          {!collapsed ? (
            <div className="flex items-center justify-between text-xs px-1 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-600 dark:text-[#7a95b8]">
                  rzp_live_mode
                </span>
              </div>
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-mono">
                TEST
              </span>
            </div>
          ) : (
            <div className="flex justify-center pt-1" title="Razorpay Test Mode Active">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
