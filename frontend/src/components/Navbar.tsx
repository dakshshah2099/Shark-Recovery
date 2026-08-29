import { Bot, Play, RefreshCw } from 'lucide-react';

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
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">
                SHARK<span className="text-cyan-400">RECOVERY</span>
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                Razorpay Buildathon
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Autonomous Revenue Recovery Agent Active</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={onSimulateBatch}
            disabled={simulating}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {simulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Orchestrating AI Agents...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Simulate 5 Failed Payments</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
