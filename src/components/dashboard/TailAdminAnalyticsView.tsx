import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Package,
  ArrowUp,
  ArrowDown,
  Edit,
  Filter
} from 'lucide-react';
import { Order, Product } from '../../types';
import { GARMENT_CATEGORIES } from '../../config/constants';
import { getPaymentChannelInfo } from '../../config/epsPaymentOptions';

interface TailAdminAnalyticsViewProps {
  products: Product[];
  orders: Order[];
  netSales: number;
  averageOrderValue: number;
  onEditProduct: (product: Product) => void;
  onOpenInvoices: () => void;
  onOpenBilling: () => void;
}

const WEEKLY_TRAFFIC_DATA = [
  { day: 'Mon', sessions: 1420, orders: 19 },
  { day: 'Tue', sessions: 1890, orders: 26 },
  { day: 'Wed', sessions: 1640, orders: 23 },
  { day: 'Thu', sessions: 2210, orders: 34 },
  { day: 'Fri', sessions: 2740, orders: 45 },
  { day: 'Sat', sessions: 2490, orders: 39 },
  { day: 'Sun', sessions: 2050, orders: 31 }
];

export const TailAdminAnalyticsView: React.FC<TailAdminAnalyticsViewProps> = ({
  products,
  orders,
  netSales,
  averageOrderValue,
  onEditProduct,
  onOpenInvoices,
  onOpenBilling
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const multiplier = timeframe === '7d' ? 1 : timeframe === '30d' ? 4.2 : 11.8;

  const totalSessions = useMemo(
    () => Math.round(WEEKLY_TRAFFIC_DATA.reduce((s, d) => s + d.sessions, 0) * multiplier),
    [multiplier]
  );

  const conversionRate = useMemo(() => {
    const baseOrders = Math.max(orders.length, 18);
    return Number(((baseOrders / Math.max(totalSessions * 0.08, 1)) * 100).toFixed(2));
  }, [orders.length, totalSessions]);

  const activeProductsCount = useMemo(
    () => products.filter((p) => p.status === 'active').length,
    [products]
  );

  // Payment category distribution from real orders
  const channelBreakdown = useMemo(() => {
    const buckets: Record<string, { label: string; amount: number; count: number; color: string }> = {
      mobile_banking: { label: 'Mobile Financial (MFS)', amount: 0, count: 0, color: '#465FFF' },
      cards: { label: 'Cards (VISA / MC / AMEX)', amount: 0, count: 0, color: '#12B76A' },
      internet_banking: { label: 'Internet Banking', amount: 0, count: 0, color: '#F79009' },
      cod: { label: 'Cash on Delivery', amount: 0, count: 0, color: '#64748B' }
    };

    orders
      .filter((o) => o.orderStatus !== 'cancelled')
      .forEach((o) => {
        const info = getPaymentChannelInfo(o.paymentMethod);
        const key = buckets[info.category] ? info.category : 'cod';
        buckets[key].amount += o.grandTotal;
        buckets[key].count += 1;
      });

    const totalAmt = Object.values(buckets).reduce((s, b) => s + b.amount, 0) || 1;
    return Object.entries(buckets).map(([key, b]) => ({
      key,
      ...b,
      pct: Math.round((b.amount / totalAmt) * 100)
    }));
  }, [orders]);

  // Top categories by catalog stock & value
  const categoryStats = useMemo(() => {
    const map: Record<string, { id: string; name: string; skus: number; stockValue: number }> = {};
    products.forEach((p) => {
      const catObj = GARMENT_CATEGORIES.find((c) => c.id === p.category);
      const name = catObj?.name || p.category;
      if (!map[p.category]) {
        map[p.category] = { id: p.category, name, skus: 0, stockValue: 0 };
      }
      const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      map[p.category].skus += 1;
      map[p.category].stockValue += stock * p.discountedPrice;
    });
    const list = Object.values(map).sort((a, b) => b.stockValue - a.stockValue).slice(0, 5);
    const maxVal = list[0]?.stockValue || 1;
    return list.map((item) => ({
      ...item,
      pct: Math.max(12, Math.round((item.stockValue / maxVal) * 100))
    }));
  }, [products]);

  // Top products by rating & flash/featured performance
  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.flashSoldCount || 0) + b.reviewsCount - ((a.flashSoldCount || 0) + a.reviewsCount))
      .slice(0, 6);
  }, [products]);

  const maxSession = Math.max(...WEEKLY_TRAFFIC_DATA.map((d) => Math.round(d.sessions * multiplier)));

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards (TailAdmin Analytics Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Storefront Sessions
            </span>
            <span className="w-9 h-9 rounded-xl bg-[#ECF3FF] dark:bg-[#465FFF]/15 text-[#465FFF] dark:text-[#7592FF] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <h4 className="text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
              {totalSessions.toLocaleString()}
            </h4>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
              <ArrowUp className="w-3 h-3" />
              14.2%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            Across desktop &amp; mobile web
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Net Settled Sales
            </span>
            <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <h4 className="text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
              ৳{netSales.toLocaleString()}
            </h4>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
              <ArrowUp className="w-3 h-3" />
              9.8%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            After discounts &amp; refunds
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Average Order Value
            </span>
            <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <h4 className="text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
              ৳{Math.round(averageOrderValue).toLocaleString()}
            </h4>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
              <ArrowUp className="w-3 h-3" />
              4.6%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            Checkout conversion: {conversionRate}%
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Active Catalog SKUs
            </span>
            <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <h4 className="text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
              {activeProductsCount} / {products.length}
            </h4>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 font-mono-num">
              <ArrowDown className="w-3 h-3" />
              {products.length - activeProductsCount} draft
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            Live items visible to shoppers
          </p>
        </div>
      </div>

      {/* Middle 12-Col Analytics Split */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left 8 Cols: Acquisition & Order Velocity Chart */}
        <div className="col-span-12 xl:col-span-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Visitor Traffic &amp; Order Velocity
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Session volume vs checkout completion across the selected window
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 self-start">
              {(['7d', '30d', '90d'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold uppercase transition-colors cursor-pointer ${
                    timeframe === t
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <div className="min-w-[480px] pt-6">
              <div className="h-56 flex items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-3">
                {WEEKLY_TRAFFIC_DATA.map((d, idx) => {
                  const scaledSessions = Math.round(d.sessions * multiplier);
                  const scaledOrders = Math.round(d.orders * multiplier);
                  const heightPct = Math.max(14, Math.round((scaledSessions / maxSession) * 100));
                  const isHovered = hoveredBar === idx;

                  return (
                    <div
                      key={d.day}
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="flex-1 h-full flex flex-col items-center justify-end relative cursor-pointer"
                    >
                      {isHovered && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-mono-num font-semibold text-white shadow-md dark:bg-gray-800">
                          {scaledSessions.toLocaleString()} visits · {scaledOrders} orders
                        </div>
                      )}

                      <div className="w-full max-w-[34px] h-full flex items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-200 ${
                            isHovered
                              ? 'bg-[#3641F5] dark:bg-[#5E73FF]'
                              : 'bg-[#465FFF]/85 dark:bg-[#465FFF]/80'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between gap-4 pt-2.5">
                {WEEKLY_TRAFFIC_DATA.map((d) => (
                  <span
                    key={d.day}
                    className="flex-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {d.day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Payment Channels Mix */}
        <div className="col-span-12 xl:col-span-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Revenue by EPS Channel
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Payment mix from settled orders
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenBilling}
                className="text-xs font-semibold text-[#465FFF] hover:underline cursor-pointer whitespace-nowrap"
              >
                All Channels
              </button>
            </div>

            <div className="space-y-4">
              {channelBreakdown.map((ch) => (
                <div key={ch.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {ch.label}
                    </span>
                    <span className="font-mono-num font-bold text-gray-900 dark:text-white shrink-0">
                      ৳{ch.amount.toLocaleString()} ({ch.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(ch.pct, 4)}%`, backgroundColor: ch.color }}
                    />
                  </div>
                  <p className="text-[11px] font-mono-num text-gray-400 dark:text-gray-500">
                    {ch.count} {ch.count === 1 ? 'order' : 'orders'} processed
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenInvoices}
            className="mt-6 w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
          >
            Inspect Order Invoices
          </button>
        </div>
      </div>

      {/* Bottom 12-Col Split: Category Valuation + Top Products */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Top Categories by Inventory Value
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Live stock valuation grouped by department
              </p>
            </div>
            <Filter className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-4">
            {categoryStats.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {cat.name} ·{' '}
                    <span className="font-normal text-gray-500">{cat.skus} items</span>
                  </span>
                  <span className="font-mono-num font-bold text-gray-900 dark:text-white shrink-0">
                    ৳{cat.stockValue.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#465FFF]"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-7 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Top Performing Products
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Click any item to edit pricing, variants, or merchandising flags
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[540px] w-full text-left text-xs">
              <thead>
                <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                  <th className="py-2.5 pr-3 font-medium">Product</th>
                  <th className="py-2.5 px-3 font-medium">Category</th>
                  <th className="py-2.5 px-3 text-right font-medium">Price</th>
                  <th className="py-2.5 px-3 text-right font-medium">Stock</th>
                  <th className="py-2.5 pl-3 text-right font-medium">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {topProducts.map((p) => {
                  const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[210px]">
                              {p.name}
                            </p>
                            <span className="text-[11px] font-mono-num text-gray-400">
                              {p.sku}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400 capitalize whitespace-nowrap">
                        {p.category.replace('-', ' ')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        ৳{p.discountedPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {stock} pcs
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#465FFF] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Edit product inline"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
