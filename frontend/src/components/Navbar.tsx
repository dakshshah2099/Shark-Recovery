import React from 'react';
import { Play, RefreshCw, Layers, LayoutDashboard, Table, MessageSquare, Activity, Settings, Zap } from 'lucide-react';

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
    { id: 'ingest', label: 'CSV & Failure Injection', icon: Zap },
    { id: 'outreach', label: 'Outreach Hub', icon: MessageSquare },
    { id: 'audit', label: 'Agent Audit Trail', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="border-b border-white/[0.08] bg-[#0b0c10] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-sm tracking-tight text-white">
                  SHARK<span className="text-blue-500">RECOVERY</span>
                </span>
                <span className="text-[10px] font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800 font-mono">
                  RAZORPAY
                </span>
              </div>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="hidden md:flex items-center bg-[#121318] p-1 rounded-xl border border-white/[0.08]">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 bg-[#121318] hover:bg-zinc-800 text-zinc-300 rounded-xl border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Sync Ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              onClick={onSimulateBatch}
              disabled={simulating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              title="Quickly simulate 5 realistic failed payment scenarios"
            >
              <Play className="w-3 h-3 fill-white" />
              <span className="hidden sm:inline">{simulating ? 'Simulating...' : 'Simulate 5 Drops'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-white/[0.06]">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
