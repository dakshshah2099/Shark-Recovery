import React from 'react';
import { Play, RefreshCw, Layers } from 'lucide-react';

interface NavbarProps {
  onSimulateBatch: () => void;
  onRefresh: () => void;
  simulating: boolean;
  refreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSimulateBatch,
  onRefresh,
  simulating,
  refreshing,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-[#09090b] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-heading font-extrabold text-base tracking-tight text-white">
                SHARK <span className="text-blue-500 font-bold">RECOVERY</span>
              </span>
              <span className="text-[10px] font-medium bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                Razorpay Buildathon
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Multi-Agent Recovery Pipeline Online</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md border border-zinc-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={onSimulateBatch}
            disabled={simulating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs px-3.5 py-2 rounded-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{simulating ? 'Orchestrating Batch...' : 'Simulate 5 Failed Payments'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
