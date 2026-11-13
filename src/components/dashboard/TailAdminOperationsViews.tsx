import React, { useMemo, useState, useEffect } from 'react';
import {
  Search,
  Users,
  FileText,
  Printer,
  CreditCard,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User as UserIcon,
  Shield,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Smartphone,
  Banknote
} from 'lucide-react';
import {
  Order,
  Product,
  ProductBid,
  Coupon,
  PurchaseOrder,
  UserProfile
} from '../../types';
import {
  EPS_PAYMENT_CHANNELS,
  EPS_PLATFORM_INFO,
  getPaymentChannelName
} from '../../config/epsPaymentOptions';
import { useNotification } from '../../context/NotificationContext';

/* ============================================================================
   1. CUSTOMERS DIRECTORY VIEW
============================================================================ */
interface CustomersViewProps {
  orders: Order[];
  bids: ProductBid[];
  onPrintInvoice: (order: Order) => void;
}

interface AggregatedCustomer {
  key: string;
  name: string;
  phone: string;
  email: string;
  division: string;
  district: string;
  address: string;
  totalSpent: number;
  orderCount: number;
  bidCount: number;
  lastOrderDate: string;
  orders: Order[];
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  orders,
  bids,
  onPrintInvoice
}) => {
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null);

  const customers = useMemo(() => {
    const map = new Map<string, AggregatedCustomer>();

    orders.forEach((ord) => {
      const key = ord.contactNumber || ord.email || ord.customerName;
      const existing = map.get(key);
      if (existing) {
        if (ord.orderStatus !== 'cancelled') {
          existing.totalSpent += ord.grandTotal;
        }
        existing.orderCount += 1;
        existing.orders.push(ord);
        if (new Date(ord.orderDate) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = ord.orderDate;
        }
      } else {
        map.set(key, {
          key,
          name: ord.customerName,
          phone: ord.contactNumber,
          email: ord.email,
          division: ord.shippingAddress?.division || 'Dhaka',
          district: ord.shippingAddress?.district || 'Dhaka',
          address: ord.shippingAddress?.detailedAddress || 'Bangladesh',
          totalSpent: ord.orderStatus !== 'cancelled' ? ord.grandTotal : 0,
          orderCount: 1,
          bidCount: 0,
          lastOrderDate: ord.orderDate,
          orders: [ord]
        });
      }
    });

    bids.forEach((bid) => {
      const key = bid.customerPhone || bid.customerName;
      const existing = map.get(key);
      if (existing) {
        existing.bidCount += 1;
      } else {
        map.set(key, {
          key,
          name: bid.customerName,
          phone: bid.customerPhone,
          email: 'bidding-customer@thesteps.bd',
          division: 'Dhaka',
          district: 'Dhaka',
          address: 'Registered Bidder',
          totalSpent: 0,
          orderCount: 0,
          bidCount: 1,
          lastOrderDate: bid.createdAt,
          orders: []
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders, bids]);

  const divisions = useMemo(
    () => ['all', ...Array.from(new Set(customers.map((c) => c.division)))],
    [customers]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q);
      const matchesDiv = divisionFilter === 'all' || c.division === divisionFilter;
      return matchesSearch && matchesDiv;
    });
  }, [customers, search, divisionFilter]);

  const selectedCustomer = useMemo(
    () =>
      customers.find((c) => c.key === selectedCustomerKey) || filtered[0] || null,
    [customers, filtered, selectedCustomerKey]
  );

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      <div className="col-span-12 xl:col-span-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#465FFF]" />
              <span>Customers Directory ({filtered.length})</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Aggregated buyer profiles, lifetime spend, and regional order distribution
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs focus:outline-none focus:border-[#465FFF]"
              />
            </div>

            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="h-9 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 text-xs font-medium text-gray-700 dark:text-gray-200"
            >
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div === 'all' ? 'All Divisions' : div}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
          <table className="min-w-[680px] w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase text-[11px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Orders / Bids</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    No customers match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isSelected = selectedCustomer?.key === c.key;
                  return (
                    <tr
                      key={c.key}
                      onClick={() => setSelectedCustomerKey(c.key)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#ECF3FF]/60 dark:bg-[#465FFF]/10'
                          : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#465FFF]/10 text-[#465FFF] dark:text-[#7592FF] flex items-center justify-center font-bold text-xs shrink-0">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {c.name}
                            </p>
                            <p className="text-[11px] font-mono-num text-gray-500 truncate">
                              {c.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {c.division}
                        </span>
                        <span className="block text-[11px] text-gray-400">{c.district}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono-num">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {c.orderCount}
                        </span>{' '}
                        <span className="text-gray-400">/ {c.bidCount}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                        ৳{c.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-gray-500">
                        {new Date(c.lastOrderDate).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Inspector */}
      <div className="col-span-12 xl:col-span-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        {selectedCustomer ? (
          <>
            <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-full bg-[#465FFF] text-white flex items-center justify-center font-bold text-base shrink-0">
                {selectedCustomer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {selectedCustomer.name}
                </h4>
                <p className="text-xs font-mono-num text-gray-500 truncate">
                  {selectedCustomer.phone}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {selectedCustomer.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">
                  Lifetime Value
                </span>
                <span className="font-mono-num font-bold text-base text-gray-900 dark:text-white mt-0.5 block">
                  ৳{selectedCustomer.totalSpent.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">
                  Total Orders
                </span>
                <span className="font-mono-num font-bold text-base text-gray-900 dark:text-white mt-0.5 block">
                  {selectedCustomer.orderCount}
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Delivery Address
              </span>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                {selectedCustomer.address}, {selectedCustomer.district}, {selectedCustomer.division}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                Recent Orders ({selectedCustomer.orders.length})
              </span>
              {selectedCustomer.orders.length === 0 ? (
                <p className="text-xs text-gray-400">No placed orders yet (bidder only).</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedCustomer.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-mono-num font-bold text-gray-900 dark:text-white">
                          {ord.orderNumber}
                        </p>
                        <p className="text-[11px] text-gray-500 capitalize">
                          {ord.orderStatus.replace('_', ' ')} · {getPaymentChannelName(ord.paymentMethod)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono-num font-bold text-gray-900 dark:text-white">
                          ৳{ord.grandTotal.toLocaleString()}
                        </p>
                        <button
                          type="button"
                          onClick={() => onPrintInvoice(ord)}
                          className="text-[11px] font-semibold text-[#465FFF] hover:underline cursor-pointer"
                        >
                          View Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-500 py-8 text-center">
            Select a customer to view profile details.
          </p>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   2. INVOICES WORKSPACE VIEW (List + Live Single Invoice Preview)
============================================================================ */
interface InvoicesViewProps {
  orders: Order[];
  onPrintInvoice: (order: Order) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  orders,
  onPrintInvoice
}) => {
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter(
      (o) =>
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || null,
    [orders, filteredOrders, selectedOrderId]
  );

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Left List */}
      <div className="col-span-12 lg:col-span-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#465FFF]" />
            <span>Invoices ({filteredOrders.length})</span>
          </h3>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs focus:outline-none focus:border-[#465FFF]"
          />
        </div>

        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filteredOrders.map((ord) => {
            const isSelected = activeOrder?.id === ord.id;
            return (
              <button
                key={ord.id}
                type="button"
                onClick={() => setSelectedOrderId(ord.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#465FFF] bg-[#ECF3FF]/60 dark:bg-[#465FFF]/15'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-num font-bold text-xs text-gray-900 dark:text-white">
                    INV-{ord.orderNumber}
                  </span>
                  <span className="font-mono-num font-bold text-xs text-[#465FFF] dark:text-[#7592FF]">
                    ৳{ord.grandTotal.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                  {ord.customerName}
                </p>
                <p className="text-[11px] font-mono-num text-gray-400 mt-0.5 capitalize">
                  {new Date(ord.orderDate).toLocaleDateString()} · {ord.paymentStatus}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Single Invoice Sheet */}
      <div className="col-span-12 lg:col-span-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 dark:border-gray-800 dark:bg-white/[0.03] space-y-6">
        {activeOrder ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-xs font-semibold text-[#465FFF] dark:text-[#7592FF]">
                  Tax &amp; Dispatch Invoice
                </span>
                <h2 className="text-xl font-bold font-mono-num text-gray-900 dark:text-white mt-0.5">
                  #{activeOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Issued: {new Date(activeOrder.orderDate).toLocaleDateString()} · Payment:{' '}
                  {getPaymentChannelName(activeOrder.paymentMethod)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onPrintInvoice(activeOrder)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Export PDF</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  From Merchant
                </span>
                <p className="font-bold text-sm text-gray-900 dark:text-white">
                  TheSteps Bangladesh Ltd.
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  House 14, Road 11, Banani, Dhaka 1213
                </p>
                <p className="text-gray-500 dark:text-gray-400 font-mono-num">
                  support@thesteps.com.bd
                </p>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Billed &amp; Shipped To
                </span>
                <p className="font-bold text-sm text-gray-900 dark:text-white">
                  {activeOrder.customerName}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeOrder.shippingAddress.detailedAddress},{' '}
                  {activeOrder.shippingAddress.district}
                </p>
                <p className="text-gray-500 dark:text-gray-400 font-mono-num">
                  {activeOrder.contactNumber} · {activeOrder.email}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
              <table className="min-w-[520px] w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    <th className="py-3 px-4 font-semibold">Item &amp; SKU</th>
                    <th className="py-3 px-4 font-semibold">Option</th>
                    <th className="py-3 px-4 text-center font-semibold">Qty</th>
                    <th className="py-3 px-4 text-right font-semibold">Unit Price</th>
                    <th className="py-3 px-4 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {activeOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </p>
                        <span className="text-[11px] font-mono-num text-gray-400">
                          {item.variantSku}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {item.size} · {item.color}
                      </td>
                      <td className="py-3 px-4 text-center font-mono-num font-semibold text-gray-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-gray-600 dark:text-gray-300">
                        ৳{item.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                        ৳{item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-mono-num font-semibold text-gray-900 dark:text-white">
                    ৳{activeOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Shipping Fee</span>
                  <span className="font-mono-num font-semibold text-gray-900 dark:text-white">
                    ৳{activeOrder.shippingFee.toLocaleString()}
                  </span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span className="font-mono-num font-semibold">
                      -৳{activeOrder.discount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between text-sm font-bold text-gray-900 dark:text-white">
                  <span>Grand Total</span>
                  <span className="font-mono-num text-[#465FFF] dark:text-[#7592FF]">
                    ৳{activeOrder.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="py-12 text-center text-xs text-gray-500">No invoices available.</p>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   3. BILLING & EPS PAYMENT CHANNELS VIEW
============================================================================ */
interface BillingEpsViewProps {
  orders: Order[];
  grossSales: number;
  gatewayFees: number;
}

export const BillingEpsView: React.FC<BillingEpsViewProps> = ({
  orders,
  grossSales,
  gatewayFees
}) => {
  const [catFilter, setCatFilter] = useState<string>('all');

  const channelVolume = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    orders
      .filter((o) => o.orderStatus !== 'cancelled')
      .forEach((o) => {
        if (!map[o.paymentMethod]) {
          map[o.paymentMethod] = { count: 0, total: 0 };
        }
        map[o.paymentMethod].count += 1;
        map[o.paymentMethod].total += o.grandTotal;
      });
    return map;
  }, [orders]);

  const filteredChannels = useMemo(() => {
    if (catFilter === 'all') return EPS_PAYMENT_CHANNELS;
    return EPS_PAYMENT_CHANNELS.filter((c) => c.category === catFilter);
  }, [catFilter]);

  const getCategoryIcon = (cat: string) => {
    if (cat === 'cards') return <CreditCard className="w-4 h-4" />;
    if (cat === 'internet_banking') return <Building2 className="w-4 h-4" />;
    if (cat === 'mobile_banking') return <Smartphone className="w-4 h-4" />;
    return <Banknote className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Top EPS Settlement Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total Gateway Volume
          </span>
          <h4 className="mt-2 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            ৳{grossSales.toLocaleString()}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">
            {EPS_PLATFORM_INFO.title} · {EPS_PAYMENT_CHANNELS.length} Active Channels
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Estimated EPS Processing Fee (1.5%)
          </span>
          <h4 className="mt-2 text-2xl font-bold font-mono-num text-amber-600 dark:text-amber-400">
            ৳{Math.round(gatewayFees).toLocaleString()}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">
            Automatic settlement reconciliation
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Merchant Settlement Net
          </span>
          <h4 className="mt-2 text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
            ৳{Math.max(0, Math.round(grossSales - gatewayFees)).toLocaleString()}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">
            {EPS_PLATFORM_INFO.supportPhone} · {EPS_PLATFORM_INFO.supportEmail}
          </p>
        </div>
      </div>

      {/* Payment Channels Matrix */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Integrated EPS Payment Methods
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {EPS_PLATFORM_INFO.tagline}
            </p>
          </div>

          <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            {[
              { id: 'all', label: 'All (21)' },
              { id: 'cards', label: 'Cards' },
              { id: 'internet_banking', label: 'iBanking' },
              { id: 'mobile_banking', label: 'Mobile MFS' },
              { id: 'cod', label: 'COD / Bank' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCatFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  catFilter === tab.id
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChannels.map((ch) => {
            const stats = channelVolume[ch.id] || { count: 0, total: 0 };
            return (
              <div
                key={ch.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: ch.brandColor }}
                    >
                      {getCategoryIcon(ch.category)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                        {ch.name}
                      </h4>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                        {ch.categoryLabel}
                        {ch.supportsEmi ? ' · EMI Ready' : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    Enabled
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {ch.description}
                </p>

                <div className="pt-2.5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs font-mono-num">
                  <span className="text-gray-500 dark:text-gray-400">
                    {stats.count} {stats.count === 1 ? 'order' : 'orders'}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ৳{stats.total.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   4. CAMPAIGN & RESTOCK CALENDAR VIEW
============================================================================ */
interface CalendarEventItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'campaign' | 'restock' | 'voucher';
  custom?: boolean;
}

interface CalendarViewProps {
  coupons: Coupon[];
  purchaseOrders: PurchaseOrder[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  coupons,
  purchaseOrders
}) => {
  const { addToast } = useNotification();
  const [cursor, setCursor] = useState(() => new Date());
  const [customEvents, setCustomEvents] = useState<CalendarEventItem[]>(() => {
    try {
      const saved = localStorage.getItem('thesteps_calendar_events');
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return [
      {
        id: 'evt-default-1',
        date: `${y}-${m}-15`,
        title: 'Mid-Month Flash Sale Drop',
        type: 'campaign',
        custom: true
      },
      {
        id: 'evt-default-2',
        date: `${y}-${m}-22`,
        title: 'Warehouse Audit & Restock',
        type: 'restock',
        custom: true
      }
    ];
  });

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState<'campaign' | 'restock' | 'voucher'>('campaign');

  useEffect(() => {
    localStorage.setItem('thesteps_calendar_events', JSON.stringify(customEvents));
  }, [customEvents]);

  const allEvents = useMemo(() => {
    const derived: CalendarEventItem[] = [
      ...coupons.map((c) => ({
        id: `evt-cpn-${c.id}`,
        date: c.expiryDate,
        title: `Voucher Ends: ${c.code}`,
        type: 'voucher' as const
      })),
      ...purchaseOrders.map((po) => ({
        id: `evt-po-${po.id}`,
        date: po.purchaseDate,
        title: `PO ${po.poNumber}`,
        type: 'restock' as const
      }))
    ];
    return [...customEvents, ...derived];
  }, [customEvents, coupons, purchaseOrders]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDayIdx = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayIdx).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    setCustomEvents((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        date: newDate,
        title: newTitle.trim(),
        type: newType,
        custom: true
      }
    ]);
    setNewTitle('');
    addToast('Event Scheduled', `Added "${newTitle.trim()}" on ${newDate}`, 'success');
  };

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      <div className="col-span-12 xl:col-span-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#465FFF]" />
            <span>{monthName}</span>
          </h3>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date())}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 pb-2 text-center text-[11px] font-semibold uppercase text-gray-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-gray-800 border-x border-b border-gray-100 dark:border-gray-800">
              {cells.map((dayNum, idx) => {
                if (!dayNum) {
                  return <div key={idx} className="min-h-[88px] bg-gray-50/40 dark:bg-gray-900/20" />;
                }
                const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = allEvents.filter((ev) => ev.date === iso);
                const isToday = iso === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={idx}
                    onClick={() => setNewDate(iso)}
                    className={`min-h-[88px] p-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02] ${
                      isToday ? 'bg-[#ECF3FF]/40 dark:bg-[#465FFF]/10' : ''
                    }`}
                  >
                    <span
                      className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-mono-num font-semibold ${
                        isToday
                          ? 'bg-[#465FFF] text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate ${
                            ev.type === 'campaign'
                              ? 'bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/20 dark:text-[#7592FF]'
                              : ev.type === 'restock'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          }`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="block text-[10px] text-gray-400 font-mono-num">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add & List Events Sidebar */}
      <div className="col-span-12 xl:col-span-4 space-y-6">
        <form
          onSubmit={handleAddEvent}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4"
        >
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            Schedule Store Event
          </h4>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Event Title
            </label>
            <input
              type="text"
              placeholder="e.g. Eid Collection Launch"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs focus:outline-none focus:border-[#465FFF]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-mono-num text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs"
              >
                <option value="campaign">Campaign</option>
                <option value="restock">Restock</option>
                <option value="voucher">Voucher</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Calendar</span>
          </button>
        </form>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            Upcoming Schedule ({allEvents.length})
          </h4>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {allEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {ev.title}
                  </p>
                  <p className="text-[11px] font-mono-num text-gray-400 capitalize">
                    {ev.date} · {ev.type}
                  </p>
                </div>
                {ev.custom && (
                  <button
                    type="button"
                    onClick={() =>
                      setCustomEvents((prev) => prev.filter((item) => item.id !== ev.id))
                    }
                    className="p-1.5 text-gray-400 hover:text-rose-600 cursor-pointer"
                    title="Delete event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   5. OPERATIONS KANBAN / TASK BOARD VIEW
============================================================================ */
type TaskColumn = 'todo' | 'in_progress' | 'completed';

interface AdminTask {
  id: string;
  title: string;
  meta: string;
  priority: 'high' | 'medium' | 'low';
  column: TaskColumn;
  system?: boolean;
}

interface TaskKanbanViewProps {
  orders: Order[];
  products: Product[];
  bids: ProductBid[];
  onNavigateTab: (tab: any) => void;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  orders,
  products,
  bids,
  onNavigateTab
}) => {
  const { addToast } = useNotification();
  const [customTasks, setCustomTasks] = useState<AdminTask[]>(() => {
    try {
      const saved = localStorage.getItem('thesteps_kanban_tasks');
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return [
      {
        id: 'tsk-1',
        title: 'Verify EPS merchant payout batch',
        meta: 'Finance · Weekly reconciliation',
        priority: 'high',
        column: 'todo'
      },
      {
        id: 'tsk-2',
        title: 'Update festive Flash Sale banner copy',
        meta: 'Merchandising · Storefront',
        priority: 'medium',
        column: 'in_progress'
      },
      {
        id: 'tsk-3',
        title: 'Configure automated catalog snapshot',
        meta: 'Operations · Backup verified',
        priority: 'low',
        column: 'completed'
      }
    ];
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    localStorage.setItem('thesteps_kanban_tasks', JSON.stringify(customTasks));
  }, [customTasks]);

  const systemTasks = useMemo<AdminTask[]>(() => {
    const items: AdminTask[] = [];
    const pendingOrders = orders.filter(
      (o) => o.orderStatus === 'pending_payment' || o.orderStatus === 'processing'
    );
    if (pendingOrders.length > 0) {
      items.push({
        id: 'sys-orders',
        title: `Dispatch ${pendingOrders.length} active order(s)`,
        meta: 'Orders Queue · Fulfillment required',
        priority: 'high',
        column: 'todo',
        system: true
      });
    }
    const lowStock = products.flatMap((p) => p.variants).filter((v) => v.stock <= v.minStockAlert);
    if (lowStock.length > 0) {
      items.push({
        id: 'sys-stock',
        title: `Restock ${lowStock.length} low-inventory SKU(s)`,
        meta: 'Inventory · Below alert threshold',
        priority: 'high',
        column: 'in_progress',
        system: true
      });
    }
    const pendingBids = bids.filter((b) => b.status === 'pending');
    if (pendingBids.length > 0) {
      items.push({
        id: 'sys-bids',
        title: `Review ${pendingBids.length} pending customer bid(s)`,
        meta: 'Bids & Vouchers · Awaiting response',
        priority: 'medium',
        column: 'todo',
        system: true
      });
    }
    return items;
  }, [orders, products, bids]);

  const allTasks = [...systemTasks, ...customTasks];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setCustomTasks((prev) => [
      {
        id: `tsk-${Date.now()}`,
        title: newTaskTitle.trim(),
        meta: 'Team Task · Added manually',
        priority: newTaskPriority,
        column: 'todo'
      },
      ...prev
    ]);
    setNewTaskTitle('');
    addToast('Task Created', 'Added to Operations Board.', 'info');
  };

  const moveTask = (id: string, dir: 'prev' | 'next') => {
    const order: TaskColumn[] = ['todo', 'in_progress', 'completed'];
    setCustomTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const idx = order.indexOf(t.column);
        const nextIdx = dir === 'next' ? Math.min(2, idx + 1) : Math.max(0, idx - 1);
        return { ...t, column: order[nextIdx] };
      })
    );
  };

  const columns: { id: TaskColumn; title: string; icon: React.ReactNode }[] = [
    { id: 'todo', title: 'To Do', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
    { id: 'in_progress', title: 'In Progress', icon: <Clock className="w-4 h-4 text-[#465FFF]" /> },
    { id: 'completed', title: 'Completed', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> }
  ];

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAddTask}
        className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
      >
        <input
          type="text"
          placeholder="Add operational task (e.g. Confirm Pathao pickup for Dhaka orders)..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs focus:outline-none focus:border-[#465FFF]"
          required
        />
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as any)}
            className="h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-semibold"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            type="submit"
            className="h-10 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((col) => {
          const items = allTasks.filter((t) => t.column === col.id);
          return (
            <div
              key={col.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  {col.icon}
                  <span>{col.title}</span>
                </span>
                <span className="font-mono-num text-xs font-semibold text-gray-500">
                  {items.length}
                </span>
              </div>

              <div className="space-y-3">
                {items.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span
                        className={`font-semibold uppercase ${
                          task.priority === 'high'
                            ? 'text-rose-600 dark:text-rose-400'
                            : task.priority === 'medium'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {task.priority} priority
                      </span>
                      {task.system && (
                        <span className="text-[10px] font-semibold text-[#465FFF] dark:text-[#7592FF]">
                          Live Queue
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {task.meta}
                    </p>

                    <div className="pt-2 border-t border-gray-200/70 dark:border-gray-800 flex items-center justify-between">
                      {task.system ? (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigateTab(
                              task.id === 'sys-orders'
                                ? 'orders'
                                : task.id === 'sys-stock'
                                ? 'inventory'
                                : 'bids'
                            )
                          }
                          className="text-[11px] font-semibold text-[#465FFF] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Queue</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={col.id === 'todo'}
                              onClick={() => moveTask(task.id, 'prev')}
                              className="p-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 cursor-pointer"
                              title="Move back"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={col.id === 'completed'}
                              onClick={() => moveTask(task.id, 'next')}
                              className="p-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 cursor-pointer"
                              title="Move forward"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomTasks((prev) => prev.filter((x) => x.id !== task.id))
                            }
                            className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   6. USER PROFILE & STORE SETTINGS VIEW
============================================================================ */
interface UserProfileViewProps {
  currentUser: UserProfile | null;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ currentUser }) => {
  const { addToast } = useNotification();

  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || 'Faruk Ahmed'
  );
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '+8801711-000000');
  const [shopName, setShopName] = useState(
    currentUser?.shopName || 'TheSteps Official Flagship'
  );
  const [city, setCity] = useState('Dhaka, Bangladesh');
  const [bio, setBio] = useState('Superadmin & Commerce Operations Lead at TheSteps');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      'thesteps_admin_profile',
      JSON.stringify({ displayName, phone, shopName, city, bio })
    );
    addToast('Profile Updated', 'Admin account preferences saved.', 'success');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Profile Meta Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#465FFF] text-white flex items-center justify-center text-xl font-bold overflow-hidden shrink-0">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              displayName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {displayName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {bio} · {city}
            </p>
            <p className="text-[11px] font-mono-num text-[#465FFF] dark:text-[#7592FF] mt-1 capitalize">
              Role: {(currentUser?.role || 'superadmin').replace('_', ' ')}
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
        >
          <Check className="w-4 h-4" />
          <span>Save Profile</span>
        </button>
      </div>

      {/* Personal Information & Business Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#465FFF]" />
            <span>Personal Information</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="h-10 px-3 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 flex items-center gap-2 text-gray-500">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{currentUser?.email || 'faruk017@gmail.com'}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-mono-num"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Store / Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Role Title / Bio
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Address &amp; Security</span>
          </h4>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Primary Hub Location
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Multi-Factor Authentication (MFA)
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {currentUser?.mfaEnabled ? 'Protected' : 'Standard'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Role-based Firestore security rules restrict catalog writes, inventory adjustments, and P&amp;L access to verified merchant operators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
