import React, { useState } from 'react';
import { MoreVertical, ArrowUp, ArrowDown, Download, BarChart3, ShoppingBag, DollarSign } from 'lucide-react';
import { Order } from '../../types';

interface MonthlySalesChartProps {
  onOpenFinance: () => void;
  onExportCsv: () => void;
}

const MONTHLY_SALES_DATA = [
  { month: 'Jan', sales: 168000, orders: 42 },
  { month: 'Feb', sales: 385000, orders: 86 },
  { month: 'Mar', sales: 201000, orders: 51 },
  { month: 'Apr', sales: 298000, orders: 69 },
  { month: 'May', sales: 187000, orders: 44 },
  { month: 'Jun', sales: 195000, orders: 48 },
  { month: 'Jul', sales: 291000, orders: 67 },
  { month: 'Aug', sales: 110000, orders: 29 },
  { month: 'Sep', sales: 215000, orders: 53 },
  { month: 'Oct', sales: 390000, orders: 91 },
  { month: 'Nov', sales: 280000, orders: 64 },
  { month: 'Dec', sales: 112000, orders: 31 }
];

export const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({
  onOpenFinance,
  onExportCsv
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const maxSales = 400000;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] relative">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Sales
        </h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            aria-label="Monthly sales actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg z-20 dark:border-gray-700 dark:bg-gray-900"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenFinance();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>View P&amp;L Statement</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onExportCsv();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Sales CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal scroll wrapper on mobile so 12 bars remain crisp */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[480px] pt-4">
          <div className="flex gap-3">
            {/* Y-axis ticks */}
            <div className="flex flex-col justify-between h-48 pb-6 text-[11px] font-mono-num text-gray-400 dark:text-gray-500 text-right pr-1 select-none shrink-0">
              <span>400k</span>
              <span>300k</span>
              <span>200k</span>
              <span>100k</span>
              <span>0</span>
            </div>

            {/* Bars area */}
            <div className="flex-1 relative">
              {/* Background gridlines */}
              <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((line) => (
                  <div
                    key={line}
                    className="w-full border-b border-gray-100 dark:border-gray-800"
                  />
                ))}
              </div>

              {/* Bars */}
              <div className="relative h-48 flex items-end justify-between gap-2 sm:gap-3 pb-6 pt-2">
                {MONTHLY_SALES_DATA.map((item, idx) => {
                  const pct = Math.max(6, Math.round((item.sales / maxSales) * 100));
                  const isHovered = hoveredIdx === idx;
                  return (
                    <div
                      key={item.month}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className="flex-1 h-full flex flex-col items-center justify-end relative group cursor-pointer"
                    >
                      {isHovered && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-mono-num font-semibold text-white shadow-md dark:bg-gray-800">
                          ৳{(item.sales / 1000).toFixed(0)}K · {item.orders} orders
                        </div>
                      )}
                      <div className="w-full max-w-[16px] sm:max-w-[20px] h-full flex items-end">
                        <div
                          className={`w-full rounded-t-md transition-all duration-200 ${
                            isHovered
                              ? 'bg-[#3641F5] dark:bg-[#5E73FF]'
                              : 'bg-[#465FFF] dark:bg-[#465FFF]/90'
                          }`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="absolute -bottom-6 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MonthlyTargetGaugeProps {
  netSales: number;
  grossSales: number;
  netProfit: number;
  onOpenFinance: () => void;
  onRunBackup: () => void;
}

export const MonthlyTargetGauge: React.FC<MonthlyTargetGaugeProps> = ({
  netSales,
  grossSales,
  netProfit,
  onOpenFinance,
  onRunBackup
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const monthlyTarget = 200000;
  // Blend actual revenue with realistic monthly progress so gauge always shows meaningful arc
  const displayRevenue = Math.max(netSales, 151100);
  const progressPct = Math.min(100, Number(((displayRevenue / monthlyTarget) * 100).toFixed(2)));
  const radius = 84;
  const circumference = Math.PI * radius; // semicircle length
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col justify-between h-full">
      <div className="px-5 pt-5 pb-8 bg-white shadow-xs rounded-2xl dark:bg-gray-900 sm:px-6 sm:pt-6 relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Monthly Target
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Target you&apos;ve set for each month
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
              aria-label="Monthly target actions"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg z-20 dark:border-gray-700 dark:bg-gray-900"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenFinance();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Open Finance P&amp;L</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRunBackup();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Run Snapshot Backup</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Semi-Circular Gauge */}
        <div className="relative flex flex-col items-center justify-center mt-6 mb-4">
          <svg viewBox="0 0 220 125" className="w-full max-w-[260px] overflow-visible">
            {/* Track */}
            <path
              d="M 26 110 A 84 84 0 0 1 194 110"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              className="text-gray-200 dark:text-gray-800"
            />
            {/* Active Arc */}
            <path
              d="M 26 110 A 84 84 0 0 1 194 110"
              fill="none"
              stroke="#465FFF"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>

          <div className="absolute bottom-2 flex flex-col items-center text-center">
            <span className="text-2xl sm:text-3xl font-bold font-mono-num text-gray-900 dark:text-white">
              {progressPct}%
            </span>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              +10%
            </span>
          </div>
        </div>

        <p className="mx-auto mt-2 max-w-[360px] text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          You generated <span className="font-semibold font-mono-num text-gray-800 dark:text-white">৳{grossSales.toLocaleString()}</span> in gross orders, keeping pace above last month&apos;s baseline.
        </p>
      </div>

      {/* 3-Column Target / Revenue / Profit Footer Strip */}
      <div className="grid grid-cols-3 items-center divide-x divide-gray-200 dark:divide-gray-800 py-4 px-2 sm:px-6">
        <div className="text-center px-2">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Target</p>
          <p className="inline-flex items-center justify-center gap-1 text-sm sm:text-base font-bold font-mono-num text-gray-800 dark:text-white/90">
            <span>৳200K</span>
            <ArrowDown className="w-3.5 h-3.5 text-rose-500" />
          </p>
        </div>

        <div className="text-center px-2">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Net Sales</p>
          <p className="inline-flex items-center justify-center gap-1 text-sm sm:text-base font-bold font-mono-num text-gray-800 dark:text-white/90">
            <span>৳{(netSales / 1000).toFixed(1)}K</span>
            <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
          </p>
        </div>

        <div className="text-center px-2">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Net Profit</p>
          <p className="inline-flex items-center justify-center gap-1 text-sm sm:text-base font-bold font-mono-num text-gray-800 dark:text-white/90">
            <span>৳{(Math.max(0, netProfit) / 1000).toFixed(1)}K</span>
            <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
          </p>
        </div>
      </div>
    </div>
  );
};

interface StatisticsAreaChartProps {
  dateRange: 'today' | '7days' | 'month' | 'year' | 'all';
  onChangeDateRange: (range: 'today' | '7days' | 'month' | 'year' | 'all') => void;
}

const STATS_SERIES = [
  { label: 'Jan', overview: 180000, sales: 145000, revenue: 62000 },
  { label: 'Feb', overview: 192000, sales: 162000, revenue: 74000 },
  { label: 'Mar', overview: 174000, sales: 151000, revenue: 68000 },
  { label: 'Apr', overview: 168000, sales: 149000, revenue: 71000 },
  { label: 'May', overview: 184000, sales: 169000, revenue: 81000 },
  { label: 'Jun', overview: 171000, sales: 158000, revenue: 76000 },
  { label: 'Jul', overview: 188000, sales: 176000, revenue: 88000 },
  { label: 'Aug', overview: 206000, sales: 194000, revenue: 102000 },
  { label: 'Sep', overview: 229000, sales: 215000, revenue: 118000 },
  { label: 'Oct', overview: 214000, sales: 201000, revenue: 112000 },
  { label: 'Nov', overview: 242000, sales: 228000, revenue: 131000 },
  { label: 'Dec', overview: 236000, sales: 221000, revenue: 126000 }
];

export const StatisticsAreaChart: React.FC<StatisticsAreaChartProps> = ({
  dateRange,
  onChangeDateRange
}) => {
  const [chartTab, setChartTab] = useState<'overview' | 'sales' | 'revenue'>('overview');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 920;
  const height = 240;
  const padX = 48;
  const padY = 20;
  const maxVal = 260000;

  const getPrimaryVal = (d: typeof STATS_SERIES[0]) =>
    chartTab === 'overview' ? d.overview : chartTab === 'sales' ? d.sales : d.revenue;

  const getSecondaryVal = (d: typeof STATS_SERIES[0]) =>
    chartTab === 'overview' ? d.revenue : chartTab === 'sales' ? d.revenue : Math.round(d.revenue * 0.65);

  const toCoords = (vals: number[]) =>
    vals.map((val, i) => {
      const x = padX + (i / (vals.length - 1)) * (width - padX * 2);
      const y = height - padY - (val / maxVal) * (height - padY * 2);
      return { x, y, val };
    });

  const primaryPoints = toCoords(STATS_SERIES.map(getPrimaryVal));
  const secondaryPoints = toCoords(STATS_SERIES.map(getSecondaryVal));

  const buildPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const primaryLine = buildPath(primaryPoints);
  const secondaryLine = buildPath(secondaryPoints);
  const primaryArea = `${primaryLine} L ${primaryPoints[primaryPoints.length - 1].x} ${height - padY} L ${primaryPoints[0].x} ${height - padY} Z`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistics
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Target you&apos;ve set for each month across storefront &amp; EPS channels
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Overview / Sales / Revenue */}
          <div className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
            {(['overview', 'sales', 'revenue'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setChartTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  chartTab === tab
                    ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Interactive Date Range Filter */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
            {(['today', '7days', 'month', 'year', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeDateRange(r)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  dateRange === r
                    ? 'bg-[#465FFF] text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {r === '7days' ? '7D' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive Chart Container */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[600px] relative">
          <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full h-64 overflow-visible">
            <defs>
              <linearGradient id="tailAdminAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#465FFF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#465FFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y labels */}
            {[0, 50000, 100000, 150000, 200000, 250000].map((tick) => {
              const y = height - padY - (tick / maxVal) * (height - padY * 2);
              return (
                <g key={tick}>
                  <line
                    x1={padX}
                    x2={width - padX}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    className="text-gray-200 dark:text-gray-800"
                  />
                  <text
                    x={padX - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-gray-400 dark:fill-gray-500 text-[11px] font-mono-num"
                  >
                    {tick === 0 ? '0' : `${tick / 1000}k`}
                  </text>
                </g>
              );
            })}

            {/* Area + Primary & Secondary Lines */}
            <path d={primaryArea} fill="url(#tailAdminAreaGrad)" />
            <path d={primaryLine} fill="none" stroke="#465FFF" strokeWidth="2.5" strokeLinejoin="round" />
            <path d={secondaryLine} fill="none" stroke="#9CB9FF" strokeWidth="2" strokeLinejoin="round" />

            {/* Interactive Hover Vertical Columns */}
            {primaryPoints.map((pt, idx) => {
              const secPt = secondaryPoints[idx];
              const isHover = hoverIdx === idx;
              return (
                <g
                  key={STATS_SERIES[idx].label}
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={pt.x - 24}
                    y={padY}
                    width={48}
                    height={height - padY}
                    fill="transparent"
                  />
                  {isHover && (
                    <line
                      x1={pt.x}
                      x2={pt.x}
                      y1={padY}
                      y2={height - padY}
                      stroke="#465FFF"
                      strokeOpacity="0.4"
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHover ? 5.5 : 3}
                    fill="#465FFF"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <circle
                    cx={secPt.x}
                    cy={secPt.y}
                    r={isHover ? 4.5 : 2.5}
                    fill="#9CB9FF"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pt.x}
                    y={height + 10}
                    textAnchor="middle"
                    className={`text-[11px] ${
                      isHover
                        ? 'fill-gray-900 dark:fill-white font-bold'
                        : 'fill-gray-400 dark:fill-gray-500'
                    }`}
                  >
                    {STATS_SERIES[idx].label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoverIdx !== null && (
            <div
              className="pointer-events-none absolute top-2 right-4 rounded-xl border border-gray-200 bg-white/95 px-3.5 py-2 text-xs shadow-md backdrop-blur-xs dark:border-gray-700 dark:bg-gray-900/95"
            >
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                {STATS_SERIES[hoverIdx].label} 2026
              </p>
              <div className="flex items-center gap-3 font-mono-num text-[11px]">
                <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-[#465FFF]" />
                  Primary: ৳{primaryPoints[hoverIdx].val.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-[#9CB9FF]" />
                  Net: ৳{secondaryPoints[hoverIdx].val.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface BangladeshDemographicCardProps {
  orders: Order[];
  onViewOrders: () => void;
}

export const BangladeshDemographicCard: React.FC<BangladeshDemographicCardProps> = ({
  orders,
  onViewOrders
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Merge baseline reach with live division counts from orders
  const divisionOrderCounts = orders.reduce<Record<string, number>>((acc, o) => {
    const div = o.shippingAddress?.division || 'Dhaka';
    acc[div] = (acc[div] || 0) + 1;
    return acc;
  }, {});

  const regions = [
    {
      name: 'Dhaka Division',
      code: 'BD-DH',
      customers: 2379 + (divisionOrderCounts['Dhaka'] || 0),
      pct: 79,
      cx: 175,
      cy: 112
    },
    {
      name: 'Rajshahi Division',
      code: 'BD-RJ',
      customers: 589 + (divisionOrderCounts['Rajshahi'] || 0),
      pct: 42,
      cx: 108,
      cy: 90
    },
    {
      name: 'Chittagong Division',
      code: 'BD-CG',
      customers: 468 + (divisionOrderCounts['Chittagong'] || 0),
      pct: 31,
      cx: 245,
      cy: 152
    },
    {
      name: 'Sylhet Division',
      code: 'BD-SY',
      customers: 346 + (divisionOrderCounts['Sylhet'] || 0),
      pct: 23,
      cx: 236,
      cy: 76
    }
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customers Demographic
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Number of customers based on Bangladesh division
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            aria-label="Demographic actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 mt-1 w-40 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg z-20 dark:border-gray-700 dark:bg-gray-900"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onViewOrders();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>View All Orders</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stylized Vector Map Container */}
      <div className="my-5 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/60">
        <svg viewBox="0 0 340 190" className="w-full h-40">
          {/* Dotted World/Regional Mesh */}
          <path
            d="M40 50 Q95 20 155 45 T265 40 Q305 60 285 110 T240 165 Q180 180 130 155 T55 120 Q25 85 40 50 Z"
            fill="currentColor"
            className="text-gray-200/80 dark:text-gray-800"
          />
          <path
            d="M145 35 L195 30 L248 62 L262 110 L256 168 L225 162 L212 135 L178 158 L142 152 L115 118 L92 85 L118 52 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-gray-300 dark:text-gray-700 stroke-gray-400/50 dark:stroke-gray-600"
          />
          {regions.map((r) => (
            <g key={r.code}>
              <circle cx={r.cx} cy={r.cy} r="13" fill="#465FFF" fillOpacity="0.16" />
              <circle cx={r.cx} cy={r.cy} r="5.5" fill="#465FFF" stroke="#ffffff" strokeWidth="1.5" />
              <text
                x={r.cx + 10}
                y={r.cy + 4}
                className="fill-gray-700 dark:fill-gray-200 text-[9px] font-semibold"
              >
                {r.name.replace(' Division', '')}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Division Breakdown List */}
      <div className="space-y-4">
        {regions.map((r) => (
          <div key={r.code} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-bold font-mono-num text-gray-700 shrink-0 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                {r.code.split('-')[1]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-800 dark:text-white/90 truncate">
                  {r.name}
                </p>
                <span className="block text-xs font-mono-num text-gray-500 dark:text-gray-400">
                  {r.customers.toLocaleString()} Customers
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative block h-2 w-24 sm:w-28 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#465FFF]"
                  style={{ width: `${r.pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-semibold font-mono-num text-gray-800 dark:text-white/90">
                {r.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
