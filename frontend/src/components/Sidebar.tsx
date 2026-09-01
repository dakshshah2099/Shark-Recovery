import {
  LayoutDashboard,
  Table,
  Zap,
  Activity,
  Cpu,
  Settings,
  X,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import sharkRecoveryDark from '../assets/Shark-Recovery-Dark-Theme.svg';
import sharkRecoveryLight from '../assets/Shark-Recovery-Light-Theme.svg';
import faviconImg from '../assets/favicon.png';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  debugMode?: boolean;
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
  debugMode = true,
}) => {
  const agentNavItems = [
    {
      id: 'ingest',
      label: 'Failure Ingestion',
      icon: Zap,
      desc: 'Manual & Batch Ingest',
    },
    ...(debugMode
      ? [
          {
            id: 'agent-flow',
            label: 'Agent Flow',
            icon: Cpu,
            desc: '6-Node Pipeline',
          },
        ]
      : []),
    {
      id: 'audit',
      label: 'AI Audit Trail',
      icon: Activity,
      desc: 'Trace & telemetry',
    },
  ];

  const renderNavGroup = (items: typeof MAIN_NAV_ITEMS, title?: string) => (
    <div className="space-y-1">
      {!collapsed && title && (
        <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 transition-opacity duration-200">
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
            className={`w-full group flex items-center rounded-md transition-all duration-200 cursor-pointer relative overflow-hidden h-10 ${
              collapsed ? 'justify-center px-0' : 'justify-start px-3 gap-3'
            } ${
              isActive
                ? 'bg-blue-50/80 dark:bg-[#18181b] text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-zinc-700 shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181b]'
            }`}
          >
            {isActive && !collapsed && (
              <span
                className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full"
                aria-hidden="true"
              />
            )}
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Icon
                className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
                }`}
                aria-hidden="true"
              />
            </div>
            {!collapsed && (
              <div className="overflow-hidden transition-opacity duration-200 whitespace-nowrap flex-1">
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
          className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container with Hardware-Accelerated Smooth Width Transition */}
      <aside
        aria-label="Sidebar navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-[#27272a] flex flex-col justify-between transition-all duration-300 ease-out lg:translate-x-0 overflow-x-hidden ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${mobileOpen ? 'translate-x-0 !w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Header */}
        <div>
          <div
            className={`h-16 flex items-center border-b border-zinc-200 dark:border-[#27272a] transition-all duration-300 relative ${
              collapsed ? 'justify-center px-0' : 'px-3 justify-center'
            }`}
          >
            {collapsed ? (
              <div className="w-full flex items-center justify-center shrink-0">
                <img
                  src={faviconImg}
                  alt="Shark Recovery"
                  className="w-9 h-9 object-contain rounded-md transition-transform duration-200 hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center overflow-hidden px-1">
                <img
                  src={sharkRecoveryDark}
                  alt="Shark Recovery"
                  className="hidden dark:block h-10 w-auto max-w-[215px] object-contain transition-opacity duration-200"
                />
                <img
                  src={sharkRecoveryLight}
                  alt="Shark Recovery"
                  className="block dark:hidden h-10 w-auto max-w-[215px] object-contain transition-opacity duration-200"
                />
              </div>
            )}

            {/* Mobile close button positioned absolute to preserve centering */}
            {!collapsed && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation sidebar"
                className="lg:hidden absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-md cursor-pointer focus-rzp"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-3">
            {renderNavGroup(MAIN_NAV_ITEMS, 'Payments')}
            {renderNavGroup(agentNavItems, 'Autonomous Agents')}
            {renderNavGroup(SYSTEM_NAV_ITEMS, 'System')}
          </nav>
        </div>

        {/* Bottom Bar: Controls (Collapse & Theme) */}
        <div className="p-3 border-t border-zinc-200 dark:border-[#27272a] bg-zinc-50/70 dark:bg-[#0c0c0e] space-y-2">
          {/* Sidebar Collapse Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className={`hidden lg:flex w-full h-9 rounded-md border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-700 dark:text-zinc-300 text-xs font-medium items-center transition-all duration-200 cursor-pointer focus-rzp overflow-hidden ${
              collapsed ? 'justify-center px-0' : 'justify-between px-2.5'
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <div className={`flex items-center overflow-hidden ${collapsed ? 'justify-center w-full' : 'gap-2'}`}>
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <ChevronLeft
                  className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ease-in-out ${
                    collapsed ? 'rotate-180' : 'rotate-0'
                  }`}
                  aria-hidden="true"
                />
              </div>
              {!collapsed && <span className="font-subheading whitespace-nowrap">Collapse Sidebar</span>}
            </div>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            className={`w-full h-9 rounded-md border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-700 dark:text-zinc-300 text-xs font-medium inline-flex items-center transition-all duration-200 cursor-pointer focus-rzp overflow-hidden ${
              collapsed ? 'justify-center px-0' : 'justify-between px-2.5'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className={`flex items-center overflow-hidden ${collapsed ? 'justify-center w-full' : 'gap-2'}`}>
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-700" aria-hidden="true" />
                )}
              </div>
              {!collapsed && <span className="font-subheading whitespace-nowrap">{darkMode ? 'Dark Theme' : 'Light Theme'}</span>}
            </div>
            {!collapsed && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">
                {darkMode ? 'Dark' : 'Light'}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
