import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  ChevronDown,
  Upload,
  KeyRound,
  Plug,
  Settings as SettingsIcon,
  HelpCircle,
  X
} from 'lucide-react';
import { Order, Product } from '../../types';
import { BD_DIVISIONS, THESTEPS_CONTACT } from '../../config/constants';
import { getPaymentChannelName } from '../../config/epsPaymentOptions';
import { useNotification } from '../../context/NotificationContext';

/* ============================================================================
   1. TAILADMIN FORM ELEMENTS VIEW
============================================================================ */
export const FormsElementsView: React.FC = () => {
  const { addToast } = useNotification();
  const [storeTitle, setStoreTitle] = useState('TheSteps Official Store');
  const [selectedDivision, setSelectedDivision] = useState<string>('Dhaka');
  const [codEnabled, setCodEnabled] = useState(true);
  const [epsEnabled, setEpsEnabled] = useState(true);
  const [flashBanner, setFlashBanner] = useState(true);
  const [shippingCap, setShippingCap] = useState(2500);
  const [fulfillmentMode, setFulfillmentMode] = useState<'standard' | 'express'>('express');
  const [notes, setNotes] = useState('Same-day Dhaka courier pickup before 4:00 PM.');
  const [uploadedName, setUploadedName] = useState<string>('');

  const handleSaveDemo = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Form Validated', `Saved configuration for ${storeTitle} (${selectedDivision}).`, 'success');
  };

  return (
    <form onSubmit={handleSaveDemo} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Inputs, Select, Textarea, File Dropzone */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Default Inputs</h3>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Storefront Display Name
              </label>
              <input
                type="text"
                value={storeTitle}
                onChange={(e) => setStoreTitle(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#465FFF]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Default Dispatch Hub Division
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#465FFF]"
              >
                {BD_DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} Division
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Free Delivery Threshold (৳{shippingCap.toLocaleString()})
              </label>
              <input
                type="range"
                min={500}
                max={5000}
                step={250}
                value={shippingCap}
                onChange={(e) => setShippingCap(Number(e.target.value))}
                className="w-full accent-[#465FFF]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Courier Operations Note
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#465FFF]"
              />
            </div>
          </div>
        </div>

        {/* File Dropzone */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Dropzone Upload</h3>
          <label className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 hover:border-[#465FFF] cursor-pointer text-center">
            <Upload className="w-7 h-7 text-[#465FFF] mb-2" />
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              {uploadedName ? `Selected: ${uploadedName}` : 'Click to attach catalog CSV or brand banner'}
            </p>
            <span className="text-[11px] text-gray-400 mt-1">PNG, JPG, PDF, or CSV up to 10MB</span>
            <input
              type="file"
              onChange={(e) => setUploadedName(e.target.files?.[0]?.name || '')}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Right Column: Toggles, Checkboxes, Radios, Submit */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Toggle Switches &amp; Checkboxes
          </h3>

          <div className="space-y-3 text-xs">
            {[
              { label: 'Cash on Delivery (64 Districts)', val: codEnabled, set: setCodEnabled },
              { label: 'EPS Online Payment Gateway (bKash/Nagad/Cards)', val: epsEnabled, set: setEpsEnabled },
              { label: 'Show Flash Deal Countdown Ribbon', val: flashBanner, set: setFlashBanner }
            ].map((item) => (
              <label
                key={item.label}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer"
              >
                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={item.val}
                  onClick={() => item.set(!item.val)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    item.val ? 'bg-[#465FFF]' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      item.val ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>

          <div className="pt-2 space-y-2 text-xs">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Radio Fulfillment Mode</p>
            <div className="grid grid-cols-2 gap-3">
              {(['standard', 'express'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFulfillmentMode(m)}
                  className={`p-3 rounded-xl border text-left font-semibold capitalize cursor-pointer ${
                    fulfillmentMode === m
                      ? 'border-[#465FFF] bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15'
                      : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {m} Delivery
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold cursor-pointer"
          >
            Save Form Controls
          </button>
        </div>
      </div>
    </form>
  );
};

/* ============================================================================
   2. TAILADMIN FORM LAYOUTS VIEW
============================================================================ */
export const FormsLayoutsView: React.FC = () => {
  const { addToast } = useNotification();
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [dispatchForm, setDispatchForm] = useState({ courier: 'Steadfast', hub: 'Dhaka', weight: '0.5', note: '' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addToast('Inquiry Logged', `Received request from ${contactForm.firstName || 'Contact'}.`, 'success');
          setContactForm({ firstName: '', lastName: '', email: '', message: '' });
        }}
        className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4 text-xs"
      >
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Multi-Column Contact Layout</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            required
            placeholder="First name"
            value={contactForm.firstName}
            onChange={(e) => setContactForm((p) => ({ ...p, firstName: e.target.value }))}
            className="h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
          <input
            type="text"
            required
            placeholder="Last name"
            value={contactForm.lastName}
            onChange={(e) => setContactForm((p) => ({ ...p, lastName: e.target.value }))}
            className="h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
        </div>
        <input
          type="email"
          required
          placeholder="Email address"
          value={contactForm.email}
          onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
          className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        />
        <textarea
          rows={4}
          placeholder="Message details..."
          value={contactForm.message}
          onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
          className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        />
        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold cursor-pointer"
        >
          Submit Form
        </button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addToast('Manifest Scheduled', `${dispatchForm.courier} pickup scheduled for ${dispatchForm.hub}.`, 'success');
        }}
        className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4 text-xs"
      >
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Horizontal Courier Manifest Layout</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <label className="font-semibold text-gray-700 dark:text-gray-300">Courier Partner</label>
          <select
            value={dispatchForm.courier}
            onChange={(e) => setDispatchForm((p) => ({ ...p, courier: e.target.value }))}
            className="sm:col-span-2 h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            <option value="Steadfast">Steadfast Courier BD</option>
            <option value="Pathao">Pathao Parcel</option>
            <option value="RedX">RedX Express</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <label className="font-semibold text-gray-700 dark:text-gray-300">Origin Hub</label>
          <select
            value={dispatchForm.hub}
            onChange={(e) => setDispatchForm((p) => ({ ...p, hub: e.target.value }))}
            className="sm:col-span-2 h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            {BD_DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d} Hub
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <label className="font-semibold text-gray-700 dark:text-gray-300">Parcel Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={dispatchForm.weight}
            onChange={(e) => setDispatchForm((p) => ({ ...p, weight: e.target.value }))}
            className="sm:col-span-2 h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-mono-num"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          <label className="font-semibold text-gray-700 dark:text-gray-300 pt-2">Instructions</label>
          <textarea
            rows={3}
            value={dispatchForm.note}
            onChange={(e) => setDispatchForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Fragile parcel / COD collection instruction..."
            className="sm:col-span-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold cursor-pointer"
        >
          Schedule Manifest
        </button>
      </form>
    </div>
  );
};

/* ============================================================================
   3. TAILADMIN BASIC TABLES & DATA TABLES VIEWS
============================================================================ */
export const TablesBasicView: React.FC<{ products: Product[]; orders: Order[] }> = ({
  products,
  orders
}) => (
  <div className="space-y-6">
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-white">
        Basic Table — Store Catalog Overview
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full text-left text-xs">
          <thead>
            <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
              <th className="py-3 pr-3 font-medium">Product</th>
              <th className="py-3 px-3 font-medium">Brand / Shop</th>
              <th className="py-3 px-3 text-right font-medium">Regular</th>
              <th className="py-3 px-3 text-right font-medium">Sale Price</th>
              <th className="py-3 pl-3 text-right font-medium">Available Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="py-3 pr-3 font-semibold text-gray-900 dark:text-white">{p.name}</td>
                <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                  {p.brand} · {p.shopName || 'TheSteps'}
                </td>
                <td className="py-3 px-3 text-right font-mono-num text-gray-400 line-through">
                  ৳{p.regularPrice.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                  ৳{p.discountedPrice.toLocaleString()}
                </td>
                <td className="py-3 pl-3 text-right font-mono-num text-gray-700 dark:text-gray-300">
                  {p.variants.reduce((s, v) => s + v.stock, 0)} units
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-white">
        Basic Table — Latest Order Channels
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-[540px] w-full text-left text-xs">
          <thead>
            <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
              <th className="py-3 pr-3 font-medium">Order</th>
              <th className="py-3 px-3 font-medium">Customer</th>
              <th className="py-3 px-3 font-medium">Gateway</th>
              <th className="py-3 pl-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.slice(0, 8).map((o) => (
              <tr key={o.id}>
                <td className="py-3 pr-3 font-mono-num font-bold text-gray-900 dark:text-white">
                  {o.orderNumber}
                </td>
                <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{o.customerName}</td>
                <td className="py-3 px-3 text-gray-500">{getPaymentChannelName(o.paymentMethod)}</td>
                <td className="py-3 pl-3 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                  ৳{o.grandTotal.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const DataTablesView: React.FC<{
  products: Product[];
  orders: Order[];
  onExportCsv: () => void;
}> = ({ products, orders, onExportCsv }) => {
  const [dataset, setDataset] = useState<'orders' | 'products'>('orders');
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = orders.filter(
      (o) =>
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.shippingAddress.division.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => (sortAsc ? a.grandTotal - b.grandTotal : b.grandTotal - a.grandTotal));
  }, [orders, search, sortAsc]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) =>
      sortAsc ? a.discountedPrice - b.discountedPrice : b.discountedPrice - a.discountedPrice
    );
  }, [products, search, sortAsc]);

  const activeTotal = dataset === 'orders' ? filteredOrders.length : filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(activeTotal / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => {
              setDataset('orders');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              dataset === 'orders'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Orders DataTable ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setDataset('products');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              dataset === 'products'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Products DataTable ({products.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 px-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
          </select>

          <button
            type="button"
            onClick={() => setSortAsc((p) => !p)}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortAsc ? 'Amount Asc' : 'Amount Desc'}</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="h-9 px-3 rounded-lg bg-[#465FFF] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={`Search ${dataset}...`}
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs"
        />
      </div>

      <div className="overflow-x-auto">
        {dataset === 'orders' ? (
          <table className="min-w-[640px] w-full text-left text-xs">
            <thead>
              <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500">
                <th className="py-2.5 pr-3 font-medium">Order #</th>
                <th className="py-2.5 px-3 font-medium">Customer</th>
                <th className="py-2.5 px-3 font-medium">Division</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 pl-3 text-right font-medium">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredOrders.slice(start, start + pageSize).map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 pr-3 font-mono-num font-bold text-gray-900 dark:text-white">
                    {o.orderNumber}
                  </td>
                  <td className="py-3 px-3">{o.customerName}</td>
                  <td className="py-3 px-3 text-gray-500">{o.shippingAddress.division}</td>
                  <td className="py-3 px-3 capitalize">{o.orderStatus.replace('_', ' ')}</td>
                  <td className="py-3 pl-3 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                    ৳{o.grandTotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-[640px] w-full text-left text-xs">
            <thead>
              <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500">
                <th className="py-2.5 pr-3 font-medium">SKU</th>
                <th className="py-2.5 px-3 font-medium">Product Name</th>
                <th className="py-2.5 px-3 font-medium">Category</th>
                <th className="py-2.5 px-3 text-right font-medium">Stock</th>
                <th className="py-2.5 pl-3 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredProducts.slice(start, start + pageSize).map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 pr-3 font-mono-num font-bold">{p.sku}</td>
                  <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">{p.name}</td>
                  <td className="py-3 px-3 text-gray-500 capitalize">{p.category.replace('-', ' ')}</td>
                  <td className="py-3 px-3 text-right font-mono-num">
                    {p.variants.reduce((s, v) => s + v.stock, 0)}
                  </td>
                  <td className="py-3 pl-3 text-right font-mono-num font-bold">
                    ৳{p.discountedPrice.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
        <span className="font-mono-num">
          Showing {activeTotal === 0 ? 0 : start + 1}–{Math.min(start + pageSize, activeTotal)} of {activeTotal}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono-num font-semibold text-gray-800 dark:text-gray-200">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   4. TAILADMIN CHARTS SHOWCASE (LINE / BAR / PIE)
============================================================================ */
export const ChartsShowcaseView: React.FC<{
  mode: 'line' | 'bar' | 'pie';
  orders: Order[];
  products: Product[];
}> = ({ mode, orders, products }) => {
  const [activeTab, setActiveTab] = useState<'line' | 'bar' | 'pie'>(mode);

  const linePts = [
    { label: 'Mon', rev: 42000, profit: 14500 },
    { label: 'Tue', rev: 58000, profit: 19200 },
    { label: 'Wed', rev: 51000, profit: 17100 },
    { label: 'Thu', rev: 74000, profit: 25400 },
    { label: 'Fri', rev: 89000, profit: 31200 },
    { label: 'Sat', rev: 81000, profit: 28000 },
    { label: 'Sun', rev: 67000, profit: 22900 }
  ];

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const val = p.variants.reduce((s, v) => s + v.stock * p.discountedPrice, 0);
      map.set(p.category, (map.get(p.category) || 0) + val);
    });
    const list = Array.from(map.entries()).map(([cat, val]) => ({ cat, val }));
    const total = list.reduce((s, x) => s + x.val, 0) || 1;
    const colors = ['#465FFF', '#12B76A', '#F79009', '#EC4899', '#8B5CF6', '#0EA5E9'];
    return list.slice(0, 6).map((item, idx) => ({
      ...item,
      pct: Math.round((item.val / total) * 100),
      color: colors[idx % colors.length]
    }));
  }, [products]);

  const maxLine = 95000;
  const linePath = linePts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${40 + i * 95} ${200 - (p.rev / maxLine) * 165}`)
    .join(' ');
  const profitPath = linePts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${40 + i * 95} ${200 - (p.profit / maxLine) * 165}`)
    .join(' ');

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {(['line', 'bar', 'pie'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
              activeTab === t
                ? 'bg-[#465FFF] text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {t} Chart
          </button>
        ))}
      </div>

      {activeTab === 'line' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Weekly Gross Sales vs Net Profit Line Chart
          </h3>
          <div className="overflow-x-auto">
            <svg viewBox="0 0 680 230" className="min-w-[540px] w-full h-64">
              {[0, 30000, 60000, 90000].map((v) => {
                const y = 200 - (v / maxLine) * 165;
                return (
                  <g key={v}>
                    <line x1="40" x2="620" y1={y} y2={y} stroke="currentColor" strokeDasharray="4 4" className="text-gray-200 dark:text-gray-800" />
                    <text x="8" y={y + 4} className="fill-gray-400 text-[10px] font-mono-num">
                      {v === 0 ? '0' : `${v / 1000}k`}
                    </text>
                  </g>
                );
              })}
              <path d={linePath} fill="none" stroke="#465FFF" strokeWidth="3" />
              <path d={profitPath} fill="none" stroke="#12B76A" strokeWidth="2.5" />
              {linePts.map((p, i) => {
                const x = 40 + i * 95;
                return (
                  <g key={p.label}>
                    <circle cx={x} cy={200 - (p.rev / maxLine) * 165} r="4.5" fill="#465FFF" />
                    <circle cx={x} cy={200 - (p.profit / maxLine) * 165} r="4" fill="#12B76A" />
                    <text x={x} y="222" textAnchor="middle" className="fill-gray-500 text-[11px]">
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {activeTab === 'bar' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Channel Order Volume Bar Chart ({orders.length} active orders)
          </h3>
          <div className="h-60 flex items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-3 pt-6">
            {linePts.map((d) => (
              <div key={d.label} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                <div className="w-full max-w-[38px] flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-[#465FFF]"
                    style={{ height: `${Math.round((d.rev / maxLine) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pie' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 220 220" className="w-56 h-56 -rotate-90">
              {(() => {
                let offset = 0;
                const r = 80;
                const c = 2 * Math.PI * r;
                return categoryTotals.map((seg) => {
                  const dash = (seg.pct / 100) * c;
                  const el = (
                    <circle
                      key={seg.cat}
                      cx="110"
                      cy="110"
                      r={r}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="26"
                      strokeDasharray={`${dash} ${c - dash}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += dash;
                  return el;
                });
              })()}
            </svg>
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Catalog Valuation Share by Category
            </h3>
            {categoryTotals.map((seg) => (
              <div key={seg.cat} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 capitalize font-medium text-gray-700 dark:text-gray-300">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: seg.color }} />
                  {seg.cat.replace('-', ' ')}
                </span>
                <span className="font-mono-num font-bold text-gray-900 dark:text-white">
                  ৳{seg.val.toLocaleString()} ({seg.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   5. TAILADMIN UI ELEMENTS LIBRARY
============================================================================ */
export const UiElementsShowcaseView: React.FC = () => {
  const { addToast } = useNotification();
  const [activeSegment, setActiveSegment] = useState<'overview' | 'buttons' | 'alerts'>('overview');
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {(['overview', 'buttons', 'alerts'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSegment(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
              activeSegment === tab
                ? 'bg-[#465FFF] text-white'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts Showcase */}
      {(activeSegment === 'overview' || activeSegment === 'alerts') && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">TailAdmin Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-500/10 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-300">Success Alert</p>
                <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">Order batch synced to courier hub.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-500/10 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-300">Warning Alert</p>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5">3 SKUs below minimum stock threshold.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-800/50 dark:bg-rose-500/10 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-rose-900 dark:text-rose-300">Error Alert</p>
                <p className="text-rose-700 dark:text-rose-400 mt-0.5">Corporate deposit requires manual receipt verification.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-800/50 dark:bg-blue-500/10 flex gap-3">
              <Info className="w-5 h-5 text-[#465FFF] shrink-0" />
              <div>
                <p className="font-bold text-blue-900 dark:text-blue-300">Info Alert</p>
                <p className="text-blue-700 dark:text-blue-400 mt-0.5">EPS gateway active for 22 payment channels.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buttons, Avatars, Progress & Modal Trigger */}
      {(activeSegment === 'overview' || activeSegment === 'buttons') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Buttons &amp; Modals</h3>
            <div className="flex flex-wrap gap-3 text-xs">
              <button
                type="button"
                onClick={() => addToast('Primary Action', 'TailAdmin Primary button clicked.', 'info')}
                className="px-4 py-2.5 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold cursor-pointer"
              >
                Primary Button
              </button>
              <button
                type="button"
                onClick={() => addToast('Secondary Action', 'TailAdmin Outline button clicked.', 'info')}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                Outline Button
              </button>
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold cursor-pointer"
              >
                Open Sample Modal
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Accordion &amp; Progress</h3>
            {[
              { q: 'Progress Trackers', a: 'Single-level crisp rounded bars using #465FFF brand accent.' },
              { q: 'Interactive Avatars', a: 'Initials fallbacks and high-DPI profile rings across admin views.' }
            ].map((item, idx) => (
              <div key={item.q} className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full px-4 py-3 flex items-center justify-between font-semibold text-gray-900 dark:text-white cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <p className="px-4 pb-3 text-gray-500 dark:text-gray-400">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showDemoModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">TailAdmin Dialog</h4>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Clean responsive modal dialog aligned with Light &amp; Dark mode design tokens.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 rounded-xl bg-[#465FFF] text-white text-xs font-semibold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   6. TAILADMIN PAGES: SETTINGS, PRICING, FAQ, INTEGRATIONS, API KEYS
============================================================================ */
export const SettingsPageView: React.FC = () => {
  const { addToast } = useNotification();
  const [dhakaFee, setDhakaFee] = useState(60);
  const [outsideFee, setOutsideFee] = useState(120);
  const [freeThreshold, setFreeThreshold] = useState(2500);
  const [supportEmail, setSupportEmail] = useState(THESTEPS_CONTACT.email);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        addToast('Store Settings Saved', 'Delivery charges & storefront preferences updated.', 'success');
      }}
      className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5 max-w-4xl"
    >
      <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <SettingsIcon className="w-5 h-5 text-[#465FFF]" />
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Store &amp; Delivery Settings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Configure regional fees, free shipping rules, and contact endpoints</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Inside Dhaka Delivery (৳)</label>
          <input
            type="number"
            value={dhakaFee}
            onChange={(e) => setDhakaFee(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-mono-num"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Outside Dhaka Delivery (৳)</label>
          <input
            type="number"
            value={outsideFee}
            onChange={(e) => setOutsideFee(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-mono-num"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Free Shipping Minimum (৳)</label>
          <input
            type="number"
            value={freeThreshold}
            onChange={(e) => setFreeThreshold(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-mono-num"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Merchant Support Email</label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
        </div>
      </div>

      <button
        type="submit"
        className="px-5 py-2.5 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold cursor-pointer"
      >
        Save Preferences
      </button>
    </form>
  );
};

export const PricingPageView: React.FC = () => {
  const { addToast } = useNotification();
  const [annual, setAnnual] = useState(true);
  const [activeTier, setActiveTier] = useState('Growth Merchant');

  const plans = [
    {
      name: 'Starter Seller',
      monthly: 0,
      annual: 0,
      desc: 'For independent boutiques launching on TheSteps.',
      features: ['Up to 50 active SKUs', 'EPS MFS & COD checkout', 'Standard 48h payout cycle']
    },
    {
      name: 'Growth Merchant',
      monthly: 2400,
      annual: 1900,
      desc: 'For scaling multi-branch electronics & fashion stores.',
      features: ['Unlimited SKUs & variants', 'Flash Deal & Bid negotiation tools', 'Same-day Steadfast & Pathao sync']
    },
    {
      name: 'Enterprise Mall',
      monthly: 6500,
      annual: 5200,
      desc: 'For official brand flagship stores & distributors.',
      features: ['Dedicated RBAC staff seats', 'Custom webhook & API access', 'Priority 0% EMI gateway routing']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vendor &amp; Merchant Plans</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">TailAdmin structured pricing comparison</p>
        </div>
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              !annual ? 'bg-[#465FFF] text-white' : 'text-gray-500'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              annual ? 'bg-[#465FFF] text-white' : 'text-gray-500'
            }`}
          >
            Annual (Save 20%)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const price = annual ? p.annual : p.monthly;
          const isSelected = activeTier === p.name;
          return (
            <div
              key={p.name}
              className={`rounded-2xl border p-6 flex flex-col justify-between space-y-6 ${
                isSelected
                  ? 'border-[#465FFF] bg-white dark:bg-white/[0.04]'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">{p.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-mono-num text-gray-900 dark:text-white">
                    ৳{price.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-gray-800">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTier(p.name);
                  addToast('Plan Selected', `Active tier set to ${p.name}.`, 'success');
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer ${
                  isSelected
                    ? 'bg-[#465FFF] text-white'
                    : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {isSelected ? 'Current Active Plan' : `Switch to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const FaqPageView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openIdx, setOpenIdx] = useState<number>(0);

  const faqs = [
    {
      q: 'How are EPS online payments (bKash, Nagad, VISA) reconciled?',
      a: 'Each EPS checkout initiates a single-use server payment session, verifies OTP/PIN or 3DS Luhn validation, and records the TRX ID against the order for instant settlement tracking.'
    },
    {
      q: 'When does Cash on Delivery mark payment status as Paid?',
      a: 'COD orders remain pending during confirmed, packed, and shipped stages and transition to Paid only once marked Delivered or Paid in Fulfillment.'
    },
    {
      q: 'How do Admins print official customer tax invoices?',
      a: 'Click the Print icon in Orders, Invoices, or Recent Orders to open the A4 print-isolated tax invoice preview or save a standalone HTML copy.'
    },
    {
      q: 'Can customers access the Admin Console or edit products?',
      a: 'No. Strict RBAC rules and backend JWT/CSRF verification isolate customer accounts from privileged administrative routes and product editors.'
    }
  ].filter((f) => !search.trim() || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#465FFF]" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Operations &amp; Merchant FAQs</h3>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter questions..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs"
          />
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((item, idx) => (
          <div key={item.q} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-gray-900 dark:text-white cursor-pointer"
            >
              <span>{item.q}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === idx && (
              <p className="px-4 pb-4 text-gray-600 dark:text-gray-300 leading-relaxed">{item.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const IntegrationsPageView: React.FC = () => {
  const { addToast } = useNotification();
  const [items, setItems] = useState([
    { id: 'eps', name: 'EPS Payment Gateway', category: 'Payments', desc: '22-channel MFS, VISA/MC/AMEX & iBanking gateway.', enabled: true },
    { id: 'steadfast', name: 'Steadfast Courier BD', category: 'Logistics', desc: 'Automated consignment booking & 64-district tracking.', enabled: true },
    { id: 'pathao', name: 'Pathao Parcel Express', category: 'Logistics', desc: 'Same-day metro delivery & COD reconciliation.', enabled: true },
    { id: 'firebase', name: 'Firebase Cloud Sync', category: 'Database', desc: 'Real-time catalog & order backup synchronization.', enabled: true },
    { id: 'sms', name: 'SSL Wireless SMS OTP', category: 'Messaging', desc: 'Order dispatch alerts and verification codes.', enabled: false }
  ]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const next = !x.enabled;
        addToast(x.name, `${x.name} ${next ? 'connected' : 'paused'}.`, 'info');
        return { ...x, enabled: next };
      })
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col justify-between space-y-5"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-[#ECF3FF] dark:bg-[#465FFF]/15 text-[#465FFF] flex items-center justify-center">
                <Plug className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold text-gray-500">{item.category}</span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white pt-1">{item.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span
              className={`text-xs font-semibold ${
                item.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
              }`}
            >
              {item.enabled ? 'Connected' : 'Disabled'}
            </span>
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                item.enabled ? 'bg-[#465FFF]' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  item.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ApiKeysPageView: React.FC = () => {
  const { addToast } = useNotification();
  const [keys, setKeys] = useState([
    {
      id: 'key-1',
      name: 'EPS Webhook Verification Key',
      value: 'ts_live_eps_98f2a4c7d8102e4b91c0',
      scope: 'payments.webhook',
      active: true,
      created: '2026-10-12'
    },
    {
      id: 'key-2',
      name: 'Steadfast Fulfillment Sync',
      value: 'ts_live_courier_41a90e3f77bc129d',
      scope: 'orders.dispatch',
      active: true,
      created: '2026-11-01'
    }
  ]);
  const [newName, setNewName] = useState('');
  const [revealedId, setRevealedId] = useState<string | null>(null);

  const createKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const rand = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 10);
    setKeys((prev) => [
      {
        id: `key-${Date.now()}`,
        name: newName.trim(),
        value: `ts_live_${rand}`,
        scope: 'catalog.read',
        active: true,
        created: new Date().toISOString().split('T')[0]
      },
      ...prev
    ]);
    setNewName('');
    addToast('API Key Created', 'New scoped key generated.', 'success');
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={createKey}
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New API key label (e.g. ERP Inventory Webhook)..."
          className="flex-1 h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs"
          required
        />
        <button
          type="submit"
          className="h-10 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Key</span>
        </button>
      </form>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#465FFF]" />
          <span>API Keys &amp; Scoped Tokens</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-left text-xs">
            <thead>
              <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500">
                <th className="py-2.5 pr-3 font-medium">Label</th>
                <th className="py-2.5 px-3 font-medium">Token</th>
                <th className="py-2.5 px-3 font-medium">Scope</th>
                <th className="py-2.5 px-3 font-medium">Created</th>
                <th className="py-2.5 pl-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {keys.map((k) => {
                const isShown = revealedId === k.id;
                const masked = `${k.value.slice(0, 12)}••••••••••••`;
                return (
                  <tr key={k.id}>
                    <td className="py-3 pr-3 font-semibold text-gray-900 dark:text-white">{k.name}</td>
                    <td className="py-3 px-3 font-mono-num text-gray-600 dark:text-gray-300">
                      {isShown ? k.value : masked}
                    </td>
                    <td className="py-3 px-3 font-mono-num text-[#465FFF]">{k.scope}</td>
                    <td className="py-3 px-3 font-mono-num text-gray-500">{k.created}</td>
                    <td className="py-3 pl-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRevealedId(isShown ? null : k.id)}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                          title={isShown ? 'Hide' : 'Reveal'}
                        >
                          {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(k.value);
                            addToast('Copied', `${k.name} copied to clipboard.`, 'info');
                          }}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                          title="Copy key"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeys((prev) => prev.filter((x) => x.id !== k.id))}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-rose-600 cursor-pointer"
                          title="Revoke"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
