/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface SpendingChartsProps {
  transactions: Transaction[];
}

export default function SpendingCharts({ transactions }: SpendingChartsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  // Calculate summary cashflow statistics
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsPercentage = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;
    const burnRatePercent = totalIncome > 0 ? Math.min(100, (totalExpenses / totalIncome) * 100) : 100;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsPercentage,
      burnRatePercent
    };
  }, [transactions]);

  // Generate trend line data of cumulative spending
  const trendData = useMemo(() => {
    const sorted = [...transactions]
      .filter((tx) => tx.type === 'expense')
      .sort((a, b) => a.timestamp - b.timestamp);

    let cumulative = 0;
    return sorted.map((tx) => {
      cumulative += tx.amount;
      return {
        date: tx.date.split(',')[0], // e.g. "June 2"
        amount: tx.amount,
        cumulative,
        recipient: tx.recipientOrSender,
      };
    });
  }, [transactions]);

  return (
    <div className="space-y-4" id="dashboard_visualizer_container">
      
      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-2 gap-3" id="cashflow_gauge_grid">
        <div className="p-3 bg-[#141416]/90 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Inflow</span>
            <div className="p-1 rounded-lg bg-[#1C2C20]">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#81C784]" />
            </div>
          </div>
          <span className="text-sm font-bold font-mono text-[#81C784]">
            KES {stats.totalIncome.toLocaleString()}
          </span>
        </div>

        <div className="p-3 bg-[#141416]/90 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Outflow</span>
            <div className="p-1 rounded-lg bg-[#2E1F1F]">
              <ArrowDownRight className="w-3.5 h-3.5 text-[#E57373]" />
            </div>
          </div>
          <span className="text-sm font-bold font-mono text-[#E57373]">
            KES {stats.totalExpenses.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Burn Rate / Cashflow balance slider */}
      <div className="p-4 bg-[#1C1C1E] border border-slate-800 rounded-2xl space-y-2.5">
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="text-slate-400">Ledger Cash-burn Rate</span>
          <span className={`font-bold ${stats.burnRatePercent > 90 ? 'text-[#E57373]' : 'text-[#81C784]'}`}>
            {Math.round(stats.burnRatePercent)}% Spent
          </span>
        </div>

        {/* Dual dynamic bar */}
        <div className="w-full h-2 bg-[#141416] rounded-full overflow-hidden relative flex">
          <div 
            className="h-full bg-[#E57373] transition-all duration-500"
            style={{ width: `${stats.burnRatePercent}%` }}
          />
          <div 
            className="h-full bg-[#81C784] transition-all duration-500"
            style={{ width: `${100 - stats.burnRatePercent}%` }}
          />
        </div>

        <div className="flex justify-between text-[9px] font-mono text-slate-500">
          <span>Spent (Outflow)</span>
          <span>Savings Pool ({Math.round(stats.savingsPercentage)}%)</span>
        </div>
      </div>

      {/* Spending Trend Line Graph */}
      {trendData.length >= 2 ? (
        <div className="space-y-2 pt-2 border-t border-slate-800/60" id="spending_trends_card">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#81C784]" /> Accumulative Spending Growth
          </span>
          
          <div className="relative w-full h-[130px] bg-[#141416]/45 rounded-xl p-2 border border-slate-900">
            {(() => {
              const width = 400;
              const height = 110;
              const minVal = 0;
              const maxVal = Math.max(...trendData.map(d => d.cumulative)) * 1.1;

              const points = trendData.map((d, i) => {
                const x = (i / (trendData.length - 1)) * (width - 32) + 16;
                const y = height - ((d.cumulative - minVal) / (maxVal - minVal)) * (height - 20) - 10;
                return { x, y, ...d };
              });

              // Construct curve path
              let pathD = `M ${points[0].x} ${points[0].y}`;
              for (let i = 1; i < points.length; i++) {
                const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
                const cpY1 = points[i-1].y;
                const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
                const cpY2 = points[i].y;
                pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
              }

              const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

              return (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chartLineGradient_clean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#81C784" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#81C784" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Guide grids */}
                  <line x1="10" y1={45} x2={width - 10} y2={45} stroke="#222225" strokeDasharray="2,2" />
                  <line x1="10" y1={height - 15} x2={width - 10} y2={height - 15} stroke="#222225" />

                  {/* Gradient area */}
                  <path d={areaD} fill="url(#chartLineGradient_clean)" />

                  {/* Main Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#81C784"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Interactive Nodes */}
                  {points.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint?.value === pt.cumulative ? "5" : "3.5"}
                      fill="#81C784"
                      stroke="#141416"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredPoint({ x: pt.x, y: pt.y, label: pt.date, value: pt.cumulative })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="cursor-pointer transition-all duration-150"
                    />
                  ))}

                  {/* Micro Tooltip */}
                  {hoveredPoint && (
                    <g transform={`translate(${Math.max(10, Math.min(width - 110, hoveredPoint.x - 50))}, ${hoveredPoint.y - 35})`} className="pointer-events-none z-30">
                      <rect width="100" height="26" rx="6" fill="#1C1C1E" stroke="#323232" strokeWidth="1" />
                      <text x="50" y="11" fill="#E2E8F0" fontSize="8" textAnchor="middle" fontFamily="monospace">
                        {hoveredPoint.label}
                      </text>
                      <text x="50" y="21" fill="#81C784" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        KES {Math.round(hoveredPoint.value).toLocaleString()}
                      </text>
                    </g>
                  )}
                </svg>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 font-mono text-[10px] bg-[#141416]/30 border border-dashed border-slate-800 rounded-2xl">
          More transactions needed to render trend graphics.
        </div>
      )}

    </div>
  );
}
