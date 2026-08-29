import React from 'react';
import { Play, RefreshCw, Layers, LayoutDashboard, Table, MessageSquare, Activity, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSimulateBatch: () => void;
  onRefresh: () => void;
  simulating: boolean;
  refreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onSimulateBatch,
  onRefresh,
  simulating,
  refreshing,
}) => {
  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Table },
    { id: 'outreach', label: 'Outreach & WhatsApp', icon: MessageSquare },
    { id: 'audit', label: 'Agent Audit Trail', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="border-b border-zinc-800 bg-[#09090b] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Branding & Primary Controls */}
        <div className="h-16 flex items-center justify-between border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-sm tracking-tight text-white">
                  SHARK<span className="text-blue-500">RECOVERY</span>
                </span>
                <span className="text-[10px] font-medium bg-zinc-900 text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-800 font-mono">
                  v1.0
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Pydantic-AI • Autonomous</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              onClick={onSimulateBatch}
              disabled={simulating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{simulating ? 'Orchestrating...' : 'Simulate 5 Failed Payments'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold border-b-2 border-blue-500'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
