import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PieChart,
} from 'lucide-react';
import type { DashboardMetrics, TransactionItem } from '../types';

interface OverviewChartsProps {
  metrics: DashboardMetrics | null;
  transactions: TransactionItem[];
}

interface TrendPoint {
  index: number;
  id: string;
  orderId?: string;
  amount?: number;
  customerName?: string;
  cumFailed: number;
  cumRecovered: number;
  rate: string;
}

const CATEGORY_COLORS: Record<string, { bar: string; text: string }> = {
  'upi intent limit': { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  'bank outage 3ds': { bar: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
  'bank server error': { bar: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
  'insufficient funds': { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  'authentication failed': { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  'card network timeout': { bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  'expired card': { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  'user dropout': { bar: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  'network timeout': { bar: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' },
  'payment declined': { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
};

const formatAxisCurrency = (val: number): string => {
  if (val <= 0) return '₹0';
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${Math.round(val)}`;
};

export const OverviewCharts: React.FC<OverviewChartsProps> = ({ metrics, transactions }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // 1. Compute Category Breakdown from real transactions
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number; recoveredAmount: number }> = {};
    transactions.forEach((t) => {
      const cat = (t.failure_category || 'unknown').replace(/_/g, ' ').toLowerCase();
      if (!map[cat]) {
        map[cat] = { count: 0, totalAmount: 0, recoveredAmount: 0 };
      }
      map[cat].count += 1;
      map[cat].totalAmount += Number(t.amount) || 0;
      if (t.status === 'recovered') {
        map[cat].recoveredAmount += Number(t.recovered_amount) || Number(t.amount) || 0;
      }
    });

    const totalTxns = transactions.length || 1;
    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        count: data.count,
        percent: Math.round((data.count / totalTxns) * 100),
        totalAmount: data.totalAmount,
        recoveredAmount: data.recoveredAmount,
        recoveryRate: data.totalAmount > 0 ? Math.round((data.recoveredAmount / data.totalAmount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  // 2. Compute Cumulative Revenue Flow for Area/Line Chart (Origin anchored)
  const renderPoints: TrendPoint[] = useMemo(() => {
    if (!transactions.length) return [];
    const sorted = [...transactions].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime() || 0;
      const timeB = new Date(b.created_at || 0).getTime() || 0;
      return timeA - timeB;
    });

    // Start with baseline origin (0, 0)
    const points: TrendPoint[] = [
      {
        index: 0,
        id: 'baseline-origin',
        customerName: 'Initial Baseline',
        cumFailed: 0,
        cumRecovered: 0,
        rate: '0',
      },
    ];

    let cumFailed = 0;
    let cumRecovered = 0;

    sorted.forEach((t, idx) => {
      cumFailed += Number(t.amount) || 0;
      if (t.status === 'recovered') {
        cumRecovered += Number(t.recovered_amount) || Number(t.amount) || 0;
      }
      points.push({
        index: idx + 1,
        id: t.id,
        orderId: t.razorpay_order_id,
        amount: Number(t.amount) || 0,
        customerName: t.customer_name,
        cumFailed,
        cumRecovered,
        rate: cumFailed > 0 ? ((cumRecovered / cumFailed) * 100).toFixed(1) : '0',
      });
    });

    return points;
  }, [transactions]);

  // SVG dimensions & math
  const svgWidth = 540;
  const svgHeight = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 55 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const maxRevenue = useMemo(() => {
    if (!renderPoints.length) return 10000;
    const maxVal = Math.max(...renderPoints.map((p) => p.cumFailed));
    return maxVal > 0 ? Math.max(maxVal * 1.15, 1000) : 10000;
  }, [renderPoints]);

  const getY = (val: number) => {
    return padding.top + innerHeight - (val / maxRevenue) * innerHeight;
  };

  const getX = (idx: number) => {
    if (renderPoints.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (renderPoints.length - 1)) * innerWidth;
  };

  // Build SVG Path strings
  const failedPath = useMemo(() => {
    if (!renderPoints.length) return '';
    return renderPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.cumFailed).toFixed(1)}`)
      .join(' ');
  }, [renderPoints, maxRevenue]);

  const recoveredPath = useMemo(() => {
    if (!renderPoints.length) return '';
    return renderPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.cumRecovered).toFixed(1)}`)
      .join(' ');
  }, [renderPoints, maxRevenue]);

  const recoveredArea = useMemo(() => {
    if (!renderPoints.length) return '';
    const lastX = getX(renderPoints.length - 1);
    const firstX = getX(0);
    const baseY = padding.top + innerHeight;
    return `${recoveredPath} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;
  }, [recoveredPath, renderPoints]);

  // Channel Breakdown
  const channelData = useMemo(() => {
    const whatsappCount = metrics?.whatsapp_dispatched_count || 0;
    const emailCount = metrics?.email_dispatched_count || 0;
    const totalDispatches = whatsappCount + emailCount;

    return [
      {
        channel: 'WhatsApp 1-Click Link',
        count: whatsappCount,
        percent: totalDispatches > 0 ? Math.round((whatsappCount / totalDispatches) * 100) : 0,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        badge: 'Twilio Template',
      },
      {
        channel: 'SMTP Email Delivery',
        count: emailCount,
        percent: totalDispatches > 0 ? Math.round((emailCount / totalDispatches) * 100) : 0,
        color: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
        badge: 'SMTP Dispatcher',
      },
    ];
  }, [metrics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Revenue Velocity & Cumulative Yield */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-[#27272a]">
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Cumulative Recovery Yield</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
              Cumulative failed checkout volume vs autonomous recovered revenue.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
            <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <span className="w-2.5 h-0.5 bg-rose-500 rounded" />
              <span>Gross Failed</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2.5 h-0.5 bg-emerald-500 rounded" />
              <span>Recovered</span>
            </span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 font-mono rounded-md border border-dashed border-zinc-200 dark:border-[#27272a]">
            No checkout dropout telemetry recorded yet
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-44 select-none"
              >
                <defs>
                  <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines & Ticks */}
                {[0, 0.33, 0.66, 1].map((ratio) => {
                  const val = maxRevenue * (1 - ratio);
                  const y = padding.top + ratio * innerHeight;
                  return (
                    <g key={ratio}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + innerWidth}
                        y2={y}
                        stroke="currentColor"
                        className="text-zinc-100 dark:text-[#27272a]"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padding.left - 6}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[9px] font-mono fill-zinc-400 dark:fill-zinc-500"
                      >
                        {formatAxisCurrency(val)}
                      </text>
                    </g>
                  );
                })}

                {/* Recovered Area Fill */}
                <path d={recoveredArea} fill="url(#recoveredGrad)" />

                {/* Gross Failed Line */}
                <path
                  d={failedPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-70"
                />

                {/* Recovered Revenue Line */}
                <path
                  d={recoveredPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points on recovered path */}
                {renderPoints.map((p, i) => {
                  if (p.id === 'baseline-origin') return null;
                  const x = getX(i);
                  const yRec = getY(p.cumRecovered);
                  const isHovered = hoveredPoint === i;

                  return (
                    <g key={p.id}>
                      <circle
                        cx={x}
                        cy={yRec}
                        r={isHovered ? 5 : 3}
                        className={`transition-all cursor-pointer ${
                          isHovered ? 'fill-emerald-400 stroke-white dark:stroke-[#121215] stroke-2' : 'fill-emerald-500'
                        }`}
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Interactive Tooltip Card */}
              {hoveredPoint !== null && renderPoints[hoveredPoint] && renderPoints[hoveredPoint].id !== 'baseline-origin' && (
                <div className="absolute top-1 right-2 bg-zinc-900/95 dark:bg-[#18181b]/95 backdrop-blur-xs border border-zinc-700 dark:border-[#27272a] rounded-md p-2.5 text-white text-xs shadow-xl space-y-1 font-mono z-20 pointer-events-none">
                  <div className="font-sans font-bold text-zinc-200">
                    Step {renderPoints[hoveredPoint].index}: {renderPoints[hoveredPoint].customerName}
                  </div>
                  {renderPoints[hoveredPoint].amount !== undefined && (
                    <div className="text-[10px] text-zinc-400">
                      Txn: ₹{renderPoints[hoveredPoint].amount?.toLocaleString('en-IN')}
                    </div>
                  )}
                  <div className="text-[11px] text-rose-400">
                    Cum. Failed: ₹{renderPoints[hoveredPoint].cumFailed.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    Cum. Recovered: ₹{renderPoints[hoveredPoint].cumRecovered.toLocaleString('en-IN')} ({renderPoints[hoveredPoint].rate}%)
                  </div>
                </div>
              )}
            </div>

            {/* Metric Footer Pill */}
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-[#27272a]">
              <span className="font-subheading">Net Yield Efficiency:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ₹{Number(metrics?.total_recovered_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({metrics?.recovery_rate_percent || 0}% overall)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart 2: Failure Category Root Causes & Channel Attribution */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#27272a]">
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Root Cause Distribution & Triage</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
              Empirical breakdown of failure loss vectors and channel efficiency.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-[#18181b] px-2 py-0.5 rounded border border-zinc-200 dark:border-[#27272a]">
            {categoryStats.length} Vectors
          </span>
        </div>

        {categoryStats.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 font-mono rounded-md border border-dashed border-zinc-200 dark:border-[#27272a]">
            No categorized failure telemetry recorded
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Horizontal Bar Breakdown for Top Categories */}
            <div className="space-y-2.5">
              {categoryStats.slice(0, 4).map((cat) => {
                const colorConfig = CATEGORY_COLORS[cat.category] || { bar: 'bg-blue-600 dark:bg-blue-500', text: 'text-zinc-500 dark:text-zinc-400' };
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-heading font-semibold text-zinc-800 dark:text-zinc-200 capitalize truncate max-w-[55%]">
                        {cat.category}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {cat.count} txns ({cat.percent}%)
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {cat.recoveryRate}% recovered
                        </span>
                      </div>
                    </div>
                    {/* Visual Bar Indicator */}
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-[#18181b] overflow-hidden flex">
                      <div
                        className={`h-full ${colorConfig.bar} transition-all rounded-full`}
                        style={{ width: `${Math.max(5, cat.percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Channel Performance Grid */}
            <div className="pt-3 border-t border-zinc-100 dark:border-[#27272a] grid grid-cols-2 gap-3">
              {channelData.map((ch) => (
                <div
                  key={ch.channel}
                  className="bg-zinc-50 dark:bg-[#18181b] p-2.5 rounded border border-zinc-200 dark:border-[#27272a] space-y-1"
                >
                  <div className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                    {ch.channel}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-heading font-bold text-sm text-zinc-900 dark:text-white">
                      {ch.count} Sent
                    </span>
                    <span className={`text-xs font-mono font-semibold ${ch.textColor}`}>
                      {ch.percent}% share
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
