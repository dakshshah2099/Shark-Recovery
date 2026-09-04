import React from 'react';
import {
  LayoutDashboard,
  Table,
  Zap,
  Activity,
  Cpu,
  Settings,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
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

interface NavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  badge?: string;
}

const MAIN_NAV_ITEMS: NavItemDef[] = [
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
    desc: 'Live recovery ledger',
  },
];

const SYSTEM_NAV_ITEMS: NavItemDef[] = [
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
  const [hoveredTooltip, setHoveredTooltip] = React.useState<{
    label: string;
    desc?: string;
    top: number;
  } | null>(null);

  // Clear tooltip when collapse changes
  React.useEffect(() => {
    setHoveredTooltip(null);
  }, [collapsed]);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLElement>,
    label: string,
    desc?: string
  ) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      desc,
      top: rect.top + rect.height / 2,
    });
  };

  const handleMouseLeave = () => {
    setHoveredTooltip(null);
  };
  const agentNavItems: NavItemDef[] = [
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
            label: 'Agent Flow & Telemetry',
            icon: Cpu,
            desc: 'Multi-Agent Pipeline',
          },
          {
            id: 'whatsapp-feed',
            label: 'WhatsApp Outreach Feed',
            icon: MessageSquare,
            desc: 'Simulated Outbound Feed',
          },
        ]
      : []),
    {
      id: 'audit',
      label: 'AI Audit Trail',
      icon: Activity,
      desc: 'Trace & Reasoning Log',
    },
  ];

  const renderNavGroup = (items: NavItemDef[], title?: string) => (
    <div className="space-y-1.5">
      {!collapsed && title && (
        <div className="px-3 pt-1 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 select-none">
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <div key={item.id} className="relative">
            <button
              type="button"
              onClick={() => {
                onTabChange(item.id);
                onCloseMobile();
              }}
              onMouseEnter={(e) => handleMouseEnter(e, item.label, item.desc)}
              onMouseLeave={handleMouseLeave}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center rounded-md cursor-pointer relative h-10 outline-none select-none transition-all duration-150 focus-rzp ${
                collapsed ? 'justify-center px-0' : 'justify-start px-3 gap-3'
              } ${
                isActive
                  ? 'bg-blue-50/90 dark:bg-[#18181b] text-blue-700 dark:text-blue-400 font-semibold border border-blue-200/80 dark:border-[#27272a] shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-[#141417] border border-transparent'
              }`}
            >
              {/* Active Indicator Notch */}
              {isActive && (
                <span
                  className={`absolute bg-blue-600 dark:bg-blue-500 rounded-r-sm ${
                    collapsed
                      ? 'left-0 top-2 bottom-2 w-1'
                      : 'left-0 top-1.5 bottom-1.5 w-1'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Icon */}
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Icon
                  className={`w-4.5 h-4.5 ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                  aria-hidden="true"
                />
              </div>

              {/* Expanded Label & Description */}
              {!collapsed && (
                <div className="overflow-hidden text-left flex-1 min-w-0">
                  <div className="text-xs font-semibold font-subheading truncate leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-body truncate leading-tight mt-0.5">
                    {item.desc}
                  </div>
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/60 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Sidebar navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-[#27272a] flex flex-col justify-between lg:translate-x-0 overflow-x-hidden ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${mobileOpen ? 'translate-x-0 !w-64 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Region: Header & Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
          {/* Header Brand Section */}
          <div
            className={`h-16 flex items-center border-b border-zinc-200 dark:border-[#27272a] relative shrink-0 ${
              collapsed ? 'justify-center px-0' : 'px-4 justify-between'
            }`}
          >
            {collapsed ? (
              <div className="w-full flex items-center justify-center shrink-0">
                <img
                  src={faviconImg}
                  alt="Shark Recovery"
                  className="w-9 h-9 object-contain rounded-md"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center overflow-hidden px-1">
                <img
                  src={sharkRecoveryDark}
                  alt="Shark Recovery"
                  className="hidden dark:block h-9.5 w-auto max-w-[215px] object-contain"
                />
                <img
                  src={sharkRecoveryLight}
                  alt="Shark Recovery"
                  className="block dark:hidden h-9.5 w-auto max-w-[215px] object-contain"
                />
              </div>
            )}

            {/* Mobile Close Button */}
            {!collapsed && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation sidebar"
                className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-md cursor-pointer focus-rzp"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links with Generous Vertical Spacing */}
          <nav className="p-3.5 sm:p-4 space-y-6 flex-1">
            {renderNavGroup(MAIN_NAV_ITEMS, 'Core Ledger')}
            {renderNavGroup(agentNavItems, 'Autonomous Agents')}
            {renderNavGroup(SYSTEM_NAV_ITEMS, 'System')}
          </nav>
        </div>

        {/* Bottom Region: Utility Controls */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-[#27272a] bg-zinc-50/80 dark:bg-[#0c0c0e] space-y-2.5 shrink-0">
          {/* Sidebar Collapse Toggle Button */}
          <div className="relative">
            <button
              type="button"
              onClick={onToggleCollapse}
              onMouseEnter={(e) => handleMouseEnter(e, 'Expand Sidebar', '[Alt+S]')}
              onMouseLeave={handleMouseLeave}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              className={`hidden lg:flex w-full h-9 rounded-md border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-700 dark:text-zinc-300 text-xs font-medium items-center cursor-pointer focus-rzp overflow-hidden transition-colors ${
                collapsed ? 'justify-center px-0' : 'justify-between px-2.5'
              }`}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <div className={`flex items-center overflow-hidden ${collapsed ? 'justify-center w-full' : 'gap-2'}`}>
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                  )}
                </div>
                {!collapsed && <span className="font-subheading whitespace-nowrap">Collapse Sidebar</span>}
              </div>
              {!collapsed && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono px-1 py-0.5 rounded bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a]">
                  Alt+S
                </span>
              )}
            </button>
          </div>

          {/* Theme Toggle Button */}
          <div className="relative">
            <button
              type="button"
              onClick={onToggleTheme}
              onMouseEnter={(e) => handleMouseEnter(e, darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode')}
              onMouseLeave={handleMouseLeave}
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className={`w-full h-9 rounded-md border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-700 dark:text-zinc-300 text-xs font-medium inline-flex items-center cursor-pointer focus-rzp overflow-hidden transition-colors ${
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
                {!collapsed && (
                  <span className="font-subheading whitespace-nowrap">
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono whitespace-nowrap">
                  {darkMode ? 'Dark' : 'Light'}
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Global Collapsed Sidebar Flyout Tooltip (Escapes Overflow Clipping) */}
      {collapsed && hoveredTooltip && (
        <div
          role="tooltip"
          style={{ top: `${hoveredTooltip.top}px` }}
          className="fixed left-[78px] -translate-y-1/2 z-[9999] py-1.5 px-3 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium shadow-2xl border border-zinc-700 dark:border-zinc-300 pointer-events-none whitespace-nowrap flex items-center gap-2 animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <span className="font-semibold">{hoveredTooltip.label}</span>
          {hoveredTooltip.desc && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              {hoveredTooltip.desc}
            </span>
          )}
        </div>
      )}
    </>
  );
};
