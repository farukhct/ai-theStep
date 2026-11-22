import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Megaphone,
  Target,
  MousePointerClick,
  Users,
  Handshake,
  DollarSign,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Search,
  Download,
  Printer,
  ArrowUp,
  ArrowRight,
  Package,
  CreditCard
} from 'lucide-react';
import { Coupon, Order, Product, ProductBid } from '../../types';
import { getPaymentChannelInfo, getPaymentChannelName } from '../../config/epsPaymentOptions';
import { useNotification } from '../../context/NotificationContext';

/* ============================================================================
   1. TAILADMIN MARKETING DASHBOARD VIEW
============================================================================ */
interface MarketingDashboardViewProps {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  onEditProduct: (product: Product) => void;
  onToggleCoupon: (id: string) => void;
}

const CAMPAIGN_SERIES = [
  { label: 'W1', impressions: 42000, clicks: 3150, conversions: 142 },
  { label: 'W2', impressions: 51500, clicks: 4020, conversions: 186 },
  { label: 'W3', impressions: 48200, clicks: 3780, conversions: 171 },
  { label: 'W4', impressions: 63400, clicks: 5180, conversions: 238 },
  { label: 'W5', impressions: 59100, clicks: 4720, conversions: 215 },
  { label: 'W6', impressions: 74800, clicks: 6340, conversions: 294 }
];

export const MarketingDashboardView: React.FC<MarketingDashboardViewProps> = ({
  products,
  orders,
  coupons,
  onEditProduct,
  onToggleCoupon
}) => {
  const [channelFilter, setChannelFilter] = useState<'all' | 'flash' | 'featured'>('all');
  const [hoverWeek, setHoverWeek] = useState<number | null>(null);

  const promotedProducts = useMemo(() => {
    return products.filter((p) => {
      if (channelFilter === 'flash') return Boolean(p.isFlashDeal);
      if (channelFilter === 'featured') return Boolean(p.isFeatured);
      return Boolean(p.isFlashDeal || p.isFeatured);
    });
  }, [products, channelFilter]);

  const totalCouponRedemptions = useMemo(
    () => coupons.reduce((sum, c) => sum + c.usageCount, 0),
    [coupons]
  );

  const campaignRevenue = useMemo(
    () => orders.filter((o) => o.orderStatus !== 'cancelled').reduce((s, o) => s + o.grandTotal, 0),
    [orders]
  );

  const maxImp = Math.max(...CAMPAIGN_SERIES.map((w) => w.impressions));

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Campaign Reach (6W)
            </span>
            <span className="w-9 h-9 rounded-xl bg-[#ECF3FF] dark:bg-[#465FFF]/15 text-[#465FFF] dark:text-[#7592FF] flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <h4 className="text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
              339.0K
            </h4>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
              <ArrowUp className="w-3 h-3" />
              18.4%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Social, Search &amp; Storefront banners</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Avg Click-Through Rate
            </span>
            <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <h4 className="text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
              8.02%
            </h4>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
              <ArrowUp className="w-3 h-3" />
              2.1%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">27,190 qualified product clicks</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Voucher Redemptions
            </span>
            <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <h4 className="text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
              {totalCouponRedemptions.toLocaleString()}
            </h4>
            <span className="text-xs font-semibold text-[#465FFF] dark:text-[#7592FF] font-mono-num">
              {coupons.filter((c) => c.isActive).length} active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Across SMART10 &amp; campaign codes</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Attributed Order Value
            </span>
            <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <h4 className="text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
              ৳{Math.max(campaignRevenue, 148500).toLocaleString()}
            </h4>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
              4.8x ROAS
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Live settled &amp; active checkouts</p>
        </div>
      </div>

      {/* Middle Row: Funnel Chart + Voucher ROI */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Weekly Ad Impressions &amp; Conversion Lift
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Hover bars to inspect weekly impressions, clicks, and converted orders
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#465FFF]" />
                Impressions
              </span>
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                Clicks
              </span>
            </div>
          </div>

          <div className="h-56 flex items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-3 pt-6">
            {CAMPAIGN_SERIES.map((w, idx) => {
              const impH = Math.round((w.impressions / maxImp) * 100);
              const clkH = Math.max(12, Math.round((w.clicks / maxImp) * 600));
              const isHover = hoverWeek === idx;
              return (
                <div
                  key={w.label}
                  onMouseEnter={() => setHoverWeek(idx)}
                  onMouseLeave={() => setHoverWeek(null)}
                  className="flex-1 h-full flex items-end justify-center gap-1.5 relative cursor-pointer"
                >
                  {isHover && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-mono-num font-semibold text-white shadow-md">
                      {(w.impressions / 1000).toFixed(1)}k imp · {w.clicks.toLocaleString()} clicks · {w.conversions} conv
                    </div>
                  )}
                  <div
                    className="w-5 sm:w-7 rounded-t-md bg-[#465FFF] transition-all duration-200"
                    style={{ height: `${impH}%` }}
                  />
                  <div
                    className="w-5 sm:w-7 rounded-t-md bg-emerald-500 transition-all duration-200"
                    style={{ height: `${Math.min(95, clkH)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-4 pt-2.5">
            {CAMPAIGN_SERIES.map((w) => (
              <span
                key={w.label}
                className="flex-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {w.label}
              </span>
            ))}
          </div>
        </div>

        {/* Active Promo Vouchers */}
        <div className="col-span-12 xl:col-span-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Active Promo Campaigns
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Toggle storefront voucher availability
            </p>
          </div>
          <div className="space-y-3">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold font-mono-num text-gray-900 dark:text-white">
                    {c.code} ·{' '}
                    <span className="font-sans font-semibold text-[#465FFF]">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : `৳${c.discountValue}`}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {c.usageCount}/{c.usageLimit} redeemed · Min ৳{c.minOrderAmount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleCoupon(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 ${
                    c.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {c.isActive ? 'Active' : 'Paused'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Promoted Catalog Campaigns Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Featured &amp; Flash Sale Merchandising
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Products currently promoted on storefront hero &amp; flash deal slots
            </p>
          </div>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900">
            {(['all', 'flash', 'featured'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setChannelFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                  channelFilter === tab
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All Promoted' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-left text-xs">
            <thead>
              <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="py-2.5 pr-3 font-medium">Product</th>
                <th className="py-2.5 px-3 font-medium">Placement</th>
                <th className="py-2.5 px-3 text-right font-medium">Sale Price</th>
                <th className="py-2.5 px-3 text-right font-medium">Flash Sold</th>
                <th className="py-2.5 pl-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {promotedProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 pr-3 font-semibold text-gray-900 dark:text-white">
                    {p.name}
                  </td>
                  <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                    {[p.isFlashDeal ? 'Flash Deal' : null, p.isFeatured ? 'Featured' : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                    ৳{p.discountedPrice.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num text-gray-700 dark:text-gray-300">
                    {p.flashSoldCount || 0} sold
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      className="text-xs font-semibold text-[#465FFF] hover:underline cursor-pointer"
                    >
                      Edit Campaign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. TAILADMIN CRM DASHBOARD VIEW
============================================================================ */
interface CrmDashboardViewProps {
  orders: Order[];
  bids: ProductBid[];
  onNavigateBids: () => void;
  onPrintInvoice: (order: Order) => void;
}

export const CrmDashboardView: React.FC<CrmDashboardViewProps> = ({
  orders,
  bids,
  onNavigateBids,
  onPrintInvoice
}) => {
  const [stageFilter, setStageFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, { name: string; email: string; totalSpent: number; orders: number; lastDate: string }>();
    orders.forEach((o) => {
      const key = o.email || o.contactNumber;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: o.customerName,
          email: o.email,
          totalSpent: o.grandTotal,
          orders: 1,
          lastDate: o.orderDate
        });
      } else {
        existing.totalSpent += o.grandTotal;
        existing.orders += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const pipelineValue = useMemo(
    () => bids.reduce((sum, b) => sum + b.bidAmount * b.quantity, 0),
    [bids]
  );

  const filteredBids = useMemo(
    () => bids.filter((b) => stageFilter === 'all' || b.status === stageFilter),
    [bids, stageFilter]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Active Leads &amp; Bids
            </span>
            <span className="w-9 h-9 rounded-xl bg-[#ECF3FF] dark:bg-[#465FFF]/15 text-[#465FFF] flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </span>
          </div>
          <h4 className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {bids.length}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">
            {bids.filter((b) => b.status === 'pending').length} pending negotiation
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Open Deal Pipeline
            </span>
            <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <h4 className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            ৳{pipelineValue.toLocaleString()}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">Total customer offer value</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Tracked Buyer Accounts
            </span>
            <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <h4 className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {uniqueCustomers.length}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">Unique verified order profiles</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Estimated Target Attainment
            </span>
            <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <h4 className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            78.4%
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">Q4 B2B &amp; VIP retention goal</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Deals / Bids Pipeline */}
        <div className="col-span-12 xl:col-span-7 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Customer Negotiation &amp; Bid Deals
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Track custom pricing requests and convert approved bids to orders
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900">
                {(['all', 'pending', 'accepted', 'rejected'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStageFilter(s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize cursor-pointer ${
                      stageFilter === s
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onNavigateBids}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#465FFF] hover:underline cursor-pointer whitespace-nowrap"
              >
                <span>Manage Bids</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full text-left text-xs">
              <thead>
                <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                  <th className="py-2.5 pr-3 font-medium">Customer</th>
                  <th className="py-2.5 px-3 font-medium">Product</th>
                  <th className="py-2.5 px-3 text-right font-medium">Offer Value</th>
                  <th className="py-2.5 pl-3 text-right font-medium">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredBids.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No negotiation deals in this stage.
                    </td>
                  </tr>
                ) : (
                  filteredBids.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-gray-900 dark:text-white">{b.customerName}</p>
                        <span className="text-[11px] font-mono-num text-gray-400">
                          {b.customerPhone}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                        {b.productName}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                        ৳{(b.bidAmount * b.quantity).toLocaleString()}
                      </td>
                      <td className="py-3 pl-3 text-right capitalize font-semibold text-[#465FFF]">
                        {b.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top VIP Buyers */}
        <div className="col-span-12 xl:col-span-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Top Customer Accounts
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Ranked by cumulative settled spend
            </p>
          </div>
          <div className="space-y-3">
            {uniqueCustomers.slice(0, 5).map((cust) => {
              const latestOrder = orders.find((o) => o.email === cust.email);
              return (
                <div
                  key={cust.email}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#ECF3FF] dark:bg-[#465FFF]/15 text-[#465FFF] flex items-center justify-center text-xs font-bold shrink-0">
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {cust.name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {cust.orders} {cust.orders === 1 ? 'order' : 'orders'} · {cust.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold font-mono-num text-gray-900 dark:text-white">
                      ৳{cust.totalSpent.toLocaleString()}
                    </p>
                    {latestOrder && (
                      <button
                        type="button"
                        onClick={() => onPrintInvoice(latestOrder)}
                        className="text-[11px] text-[#465FFF] hover:underline cursor-pointer"
                      >
                        Last Invoice
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. TAILADMIN LOGISTICS & COURIER DISPATCH VIEW
============================================================================ */
interface LogisticsDashboardViewProps {
  orders: Order[];
  onPrintInvoice: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: Order['orderStatus'], note?: string) => void;
}

export const LogisticsDashboardView: React.FC<LogisticsDashboardViewProps> = ({
  orders,
  onPrintInvoice,
  onUpdateStatus
}) => {
  const [hubFilter, setHubFilter] = useState<'all' | 'processing' | 'shipped' | 'delivered'>('all');

  const counts = useMemo(() => {
    const processing = orders.filter((o) =>
      ['pending_payment', 'paid', 'confirmed', 'processing', 'packed'].includes(o.orderStatus)
    ).length;
    const shipped = orders.filter((o) => o.orderStatus === 'shipped').length;
    const delivered = orders.filter((o) => o.orderStatus === 'delivered').length;
    return { processing, shipped, delivered };
  }, [orders]);

  const filteredShipments = useMemo(() => {
    return orders.filter((o) => {
      if (hubFilter === 'all') return o.orderStatus !== 'cancelled';
      if (hubFilter === 'processing') {
        return ['pending_payment', 'paid', 'confirmed', 'processing', 'packed'].includes(
          o.orderStatus
        );
      }
      return o.orderStatus === hubFilter;
    });
  }, [orders, hubFilter]);

  const couriers = [
    { name: 'Steadfast Courier BD', share: 48, sla: '24–36h Dhaka / 48h Nationwide', status: 'Connected' },
    { name: 'Pathao Parcel Express', share: 32, sla: 'Same-day Metro / 48h Divisions', status: 'Connected' },
    { name: 'RedX Logistics Hub', share: 20, sla: '64-District COD Settlement', status: 'Connected' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Pending Hub Dispatch
            </span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <h4 className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {counts.processing}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">Awaiting packing or courier pickup</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              In Transit (Shipped)
            </span>
            <Truck className="w-4 h-4 text-[#465FFF]" />
          </div>
          <h4 className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {counts.shipped}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">Active courier tracking parcels</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Completed Deliveries
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <h4 className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {counts.delivered}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">Confirmed customer handoffs</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Avg Fulfillment Time
            </span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <h4 className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            26.4 hrs
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">Rajshahi &amp; Uttara Sector-11 Hubs</p>
        </div>
      </div>

      {/* Courier Fleet Partners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {couriers.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{c.name}</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {c.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.sla}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono-num text-gray-500">
                <span>Parcel Share</span>
                <span className="font-bold text-gray-900 dark:text-white">{c.share}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-[#465FFF]" style={{ width: `${c.share}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Waybill & Parcel Dispatch Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Active Waybills &amp; Hub Dispatch Queue
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Update parcel transit stages or print dispatch invoices
            </p>
          </div>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900">
            {(['all', 'processing', 'shipped', 'delivered'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setHubFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                  hubFilter === tab
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[680px] w-full text-left text-xs">
            <thead>
              <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="py-2.5 pr-3 font-medium">Waybill / Order</th>
                <th className="py-2.5 px-3 font-medium">Destination</th>
                <th className="py-2.5 px-3 font-medium">Payment</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 pl-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredShipments.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 pr-3">
                    <p className="font-mono-num font-bold text-gray-900 dark:text-white">
                      {ord.trackingNumber || 'PENDING-TRK'}
                    </p>
                    <span className="text-[11px] font-mono-num text-gray-400">
                      {ord.orderNumber} · {ord.customerName}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {ord.shippingAddress.district}, {ord.shippingAddress.division}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono-num text-gray-700 dark:text-gray-300">
                    ৳{ord.grandTotal.toLocaleString()} · {ord.paymentMethod.toUpperCase()}
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={ord.orderStatus}
                      onChange={(e) =>
                        onUpdateStatus(
                          ord.id,
                          e.target.value as Order['orderStatus'],
                          'Updated via Logistics Console'
                        )
                      }
                      className="h-8 px-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-semibold capitalize"
                    >
                      <option value="processing">Processing</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onPrintInvoice(ord)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   4. TAILADMIN TRANSACTIONS SETTLEMENT LEDGER VIEW
============================================================================ */
interface TransactionsLedgerViewProps {
  orders: Order[];
  onPrintInvoice: (order: Order) => void;
  onExportCsv: () => void;
}

export const TransactionsLedgerView: React.FC<TransactionsLedgerViewProps> = ({
  orders,
  onPrintInvoice,
  onExportCsv
}) => {
  const { addToast } = useNotification();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.transactionId || '').toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || o.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#465FFF]" />
              <span>Transactions &amp; Payment Settlements</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Complete audit trail for bKash, Nagad, Cards, iBanking, Bank Slips &amp; COD
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onExportCsv();
              addToast('CSV Exported', 'Sales & transaction ledger downloaded.', 'success');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Ledger</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search TRX ID, order #, or customer..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs focus:outline-none focus:border-[#465FFF]"
            />
          </div>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 self-start">
            {(['all', 'paid', 'pending', 'refunded'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                  statusFilter === s
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-left text-xs">
            <thead>
              <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="py-2.5 pr-3 font-medium">Transaction ID</th>
                <th className="py-2.5 px-3 font-medium">Order &amp; Customer</th>
                <th className="py-2.5 px-3 font-medium">Channel</th>
                <th className="py-2.5 px-3 text-right font-medium">Amount</th>
                <th className="py-2.5 px-3 font-medium">Payment State</th>
                <th className="py-2.5 pl-3 text-right font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((ord) => {
                const info = getPaymentChannelInfo(ord.paymentMethod);
                return (
                  <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 pr-3 font-mono-num font-semibold text-gray-900 dark:text-white">
                      {ord.transactionId || `COD-${ord.orderNumber}`}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-gray-900 dark:text-white">{ord.customerName}</p>
                      <span className="text-[11px] font-mono-num text-gray-400">
                        {ord.orderNumber} · {new Date(ord.orderDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                      {getPaymentChannelName(ord.paymentMethod)} ·{' '}
                      <span className="text-gray-400 uppercase">{info.category.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                      ৳{ord.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 capitalize font-semibold">
                      <span
                        className={
                          ord.paymentStatus === 'paid'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : ord.paymentStatus === 'refunded'
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => onPrintInvoice(ord)}
                        className="text-xs font-semibold text-[#465FFF] hover:underline cursor-pointer"
                      >
                        Invoice
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
  );
};
