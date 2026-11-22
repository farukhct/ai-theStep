import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, X, CheckCircle, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { Order } from '../../types';
import { THESTEPS_CONTACT } from '../../config/constants';
import { getPaymentChannelName } from '../../config/epsPaymentOptions';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getPaymentStatusLabel = (order: Order): string => {
  if (order.paymentStatus === 'paid') return 'Payment Completed';
  if (order.paymentStatus === 'refunded') return 'Payment Refunded';
  if (order.paymentStatus === 'failed') return 'Payment Failed';
  if (order.paymentMethod === 'bank_transfer') return 'Pending Bank Verification';
  return 'Payment Pending';
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const billingDiffers =
    order.billingAddress &&
    (order.billingAddress.fullName !== order.shippingAddress.fullName ||
      order.billingAddress.phone !== order.shippingAddress.phone ||
      order.billingAddress.detailedAddress !== order.shippingAddress.detailedAddress ||
      order.billingAddress.district !== order.shippingAddress.district);

  const handlePrint = () => {
    const previousTitle = document.title;
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.body.classList.remove('invoice-print-active');
      document.title = previousTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    document.body.classList.add('invoice-print-active');
    document.title = `Invoice-${order.orderNumber} - ${THESTEPS_CONTACT.brand}`;
    window.addEventListener('afterprint', cleanup);

    window.requestAnimationFrame(() => {
      window.print();
      window.setTimeout(cleanup, 2500);
    });
  };

  const handleDownloadInvoice = () => {
    const paymentLabel = getPaymentStatusLabel(order);
    const formattedDate = new Date(order.orderDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const rowsHtml = order.items
      .map(
        (item) => `
          <tr>
            <td>
              <div class="item-name">${escapeHtml(item.name)}</div>
              <div class="item-sku">SKU: ${escapeHtml(item.variantSku)}</div>
            </td>
            <td>${escapeHtml(item.size)} &middot; ${escapeHtml(item.color)}</td>
            <td class="right mono">&#2547;${Number(item.price || 0).toLocaleString()}</td>
            <td class="center bold">${Number(item.quantity || 1)}</td>
            <td class="right mono bold">&#2547;${Number(item.total || 0).toLocaleString()}</td>
          </tr>
        `
      )
      .join('');

    const billingHtml = billingDiffers
      ? `
        <div class="box">
          <h5>Billed To:</h5>
          <p class="bold">${escapeHtml(order.billingAddress.fullName)}</p>
          <p>${escapeHtml(order.billingAddress.detailedAddress)}</p>
          <p>${escapeHtml(order.billingAddress.upazila)}, ${escapeHtml(order.billingAddress.district)}, ${escapeHtml(order.billingAddress.division)}${order.billingAddress.postcode ? ` - ${escapeHtml(order.billingAddress.postcode)}` : ''}</p>
          <p class="mono bold">Phone: ${escapeHtml(order.billingAddress.phone)}</p>
        </div>
      `
      : '';

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice ${escapeHtml(order.orderNumber)} - ${escapeHtml(THESTEPS_CONTACT.brand)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #171717; background: #f5f5f5; margin: 0; padding: 24px; }
    .toolbar { max-width: 780px; margin: 0 auto 14px; display: flex; justify-content: flex-end; gap: 8px; }
    .print-btn { background: #171717; color: #fff; border: 0; border-radius: 8px; padding: 9px 16px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .sheet { max-width: 780px; margin: 0 auto; background: #fff; padding: 36px; border: 1px solid #e5e5e5; border-radius: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 1px solid #e5e5e5; padding-bottom: 24px; }
    .brand { font-size: 28px; font-weight: 900; color: #ff4300; letter-spacing: -0.02em; }
    .brand-sub { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: #292933; text-transform: uppercase; margin-left: 6px; }
    .muted { font-size: 12px; color: #737373; margin: 2px 0; }
    .badge { display: inline-block; background: #171717; color: #fff; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; margin-bottom: 6px; }
    .status { display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .status.pending { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .status.failed { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
    .status.refunded { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 20px; padding: 20px 0; border-bottom: 1px solid #e5e5e5; font-size: 12px; }
    .box h5 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; color: #a3a3a3; letter-spacing: 0.06em; }
    .box p { margin: 2px 0; color: #404040; }
    .right { text-align: right; }
    .center { text-align: center; }
    .bold { font-weight: 700; color: #0a0a0a; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
    th { text-align: left; padding: 10px 6px; border-bottom: 2px solid #171717; font-size: 11px; text-transform: uppercase; color: #737373; }
    td { padding: 12px 6px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
    .item-name { font-weight: 700; color: #171717; }
    .item-sku { font-size: 10px; color: #737373; font-family: ui-monospace, monospace; margin-top: 2px; }
    .totals-wrap { display: flex; justify-content: flex-end; border-top: 1px solid #e5e5e5; padding-top: 14px; }
    .totals { width: 260px; font-size: 12px; }
    .totals-row { display: flex; justify-content: space-between; margin-bottom: 7px; color: #525252; }
    .totals-grand { display: flex; justify-content: space-between; border-top: 2px solid #171717; padding-top: 8px; margin-top: 8px; font-size: 15px; font-weight: 800; color: #0a0a0a; }
    .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 11px; color: #737373; }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none !important; }
      .sheet { border: 0; border-radius: 0; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  </div>
  <div class="sheet">
    <div class="header">
      <div>
        <div><span class="brand">${escapeHtml(THESTEPS_CONTACT.brand)}</span><span class="brand-sub">BANGLADESH</span></div>
        <p class="muted">${escapeHtml(THESTEPS_CONTACT.tagline)}</p>
        <p class="muted">BIN / Tax ID: 004918239-0101</p>
        <p class="muted">${escapeHtml(THESTEPS_CONTACT.address)}</p>
        <p class="muted">${escapeHtml(THESTEPS_CONTACT.phone)} | ${escapeHtml(THESTEPS_CONTACT.email)}</p>
      </div>
      <div class="right">
        <div class="badge">TAX INVOICE</div>
        <div class="mono bold" style="font-size:16px;">${escapeHtml(order.orderNumber)}</div>
        <p class="muted">Date: ${escapeHtml(formattedDate)}</p>
        <p class="muted">Tracking: <strong class="mono">${escapeHtml(order.trackingNumber || 'N/A')}</strong></p>
        <div class="status ${escapeHtml(order.paymentStatus)}">${escapeHtml(paymentLabel)}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <h5>Deliver To:</h5>
        <p class="bold">${escapeHtml(order.shippingAddress.fullName)}</p>
        <p>${escapeHtml(order.shippingAddress.detailedAddress)}</p>
        <p>${escapeHtml(order.shippingAddress.upazila)}, ${escapeHtml(order.shippingAddress.district)}, ${escapeHtml(order.shippingAddress.division)}${order.shippingAddress.postcode ? ` - ${escapeHtml(order.shippingAddress.postcode)}` : ''}</p>
        <p class="mono bold">Phone: ${escapeHtml(order.shippingAddress.phone)}</p>
        ${order.shippingAddress.email ? `<p>Email: ${escapeHtml(order.shippingAddress.email)}</p>` : ''}
        ${order.shippingAddress.deliveryNotes ? `<p>Delivery Note: ${escapeHtml(order.shippingAddress.deliveryNotes)}</p>` : ''}
      </div>
      ${billingHtml}
      <div class="box right">
        <h5>Payment Breakdown:</h5>
        <p>Method: <span class="bold">${escapeHtml(getPaymentChannelName(order.paymentMethod))}</span></p>
        ${order.transactionId ? `<p class="mono">TRX ID: <span class="bold">${escapeHtml(order.transactionId)}</span></p>` : ''}
        ${order.emiPlan && order.emiPlan !== 'full' ? `<p>EMI Plan: <span class="bold">${escapeHtml(order.emiPlan)}</span></p>` : ''}
        <p>Fulfillment Status: <span class="bold" style="text-transform:capitalize;">${escapeHtml(order.orderStatus.replace('_', ' '))}</span></p>
        ${order.remarks ? `<p style="font-style:italic;color:#737373;">Note: ${escapeHtml(order.remarks)}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Size / Color</th>
          <th class="right">Unit Price</th>
          <th class="center">Qty</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="totals-wrap">
      <div class="totals">
        <div class="totals-row"><span>Subtotal:</span><span class="mono bold">&#2547;${Number(order.subtotal || 0).toLocaleString()}</span></div>
        ${order.discount > 0 ? `<div class="totals-row" style="color:#047857;"><span>Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ''}:</span><span class="mono">-&#2547;${Number(order.discount || 0).toLocaleString()}</span></div>` : ''}
        <div class="totals-row"><span>Delivery Charge:</span><span class="mono">${order.shippingFee === 0 ? 'FREE' : `&#2547;${Number(order.shippingFee || 0).toLocaleString()}`}</span></div>
        <div class="totals-row"><span>VAT / Tax (Included):</span><span class="mono">&#2547;${Number(order.tax || 0).toLocaleString()}</span></div>
        <div class="totals-grand"><span>Grand Total:</span><span class="mono">&#2547;${Number(order.grandTotal || 0).toLocaleString()}</span></div>
      </div>
    </div>

    <div class="footer">
      <p class="bold" style="color:#404040;">Thank you for shopping with TheSteps Bangladesh (thesteps.com.bd).</p>
      <p>For exchange or inquiries, email ${escapeHtml(THESTEPS_CONTACT.email)} or call ${escapeHtml(THESTEPS_CONTACT.phoneHours)} within 7 days of delivery.</p>
      <p class="mono" style="font-size:10px;color:#a3a3a3;margin-top:8px;">This is an authenticated computer-generated invoice requiring no physical signature.</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${order.orderNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const StatusIcon =
    order.paymentStatus === 'paid'
      ? CheckCircle
      : order.paymentStatus === 'failed'
      ? AlertCircle
      : Clock;

  const modalContent = (
    <div
      id="invoice-print-portal"
      role="dialog"
      aria-modal="true"
      aria-label={`Tax Invoice ${order.orderNumber}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[90] flex items-start justify-center p-3 sm:p-6 bg-neutral-950/65 backdrop-blur-xs overflow-y-auto"
    >
      <div className="invoice-modal-sheet relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print bg-neutral-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              Official Tax Invoice · {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Download printable HTML invoice"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save HTML</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-neutral-900 hover:bg-neutral-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close invoice preview"
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 sm:p-12 text-neutral-900 bg-white" id="printable-invoice">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-neutral-200 pb-8">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-[#ff4300]">
                  {THESTEPS_CONTACT.brand}
                </span>
                <span className="text-xs font-bold tracking-widest text-[#292933] uppercase">
                  BANGLADESH
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">{THESTEPS_CONTACT.tagline}</p>
              <p className="text-xs text-neutral-500">BIN / Tax ID: 004918239-0101</p>
              <p className="text-xs text-neutral-500">{THESTEPS_CONTACT.address}</p>
              <p className="text-xs text-neutral-500">
                {THESTEPS_CONTACT.phone} | {THESTEPS_CONTACT.email}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded bg-neutral-900 text-white font-mono font-bold text-xs uppercase tracking-wider mb-2">
                TAX INVOICE
              </span>
              <p className="text-base font-bold font-mono text-neutral-950">{order.orderNumber}</p>
              <p className="text-xs text-neutral-500 mt-1">
                Date:{' '}
                {new Date(order.orderDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-neutral-500">
                Tracking:{' '}
                <span className="font-mono font-semibold text-neutral-800">
                  {order.trackingNumber || 'N/A'}
                </span>
              </p>
              <div
                className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : order.paymentStatus === 'refunded'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : order.paymentStatus === 'failed'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{getPaymentStatusLabel(order)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Billing Details */}
          <div
            className={`grid grid-cols-1 ${
              billingDiffers ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
            } gap-6 py-6 border-b border-neutral-200 text-xs`}
          >
            <div>
              <h5 className="font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Deliver To:
              </h5>
              <p className="font-bold text-neutral-950 text-sm">{order.shippingAddress.fullName}</p>
              <p className="text-neutral-600 mt-0.5">{order.shippingAddress.detailedAddress}</p>
              <p className="text-neutral-600">
                {order.shippingAddress.upazila}, {order.shippingAddress.district},{' '}
                {order.shippingAddress.division}{' '}
                {order.shippingAddress.postcode ? `- ${order.shippingAddress.postcode}` : ''}
              </p>
              <p className="text-neutral-700 font-mono font-semibold mt-1">
                Phone: {order.shippingAddress.phone}
              </p>
              {order.shippingAddress.email && (
                <p className="text-neutral-600">Email: {order.shippingAddress.email}</p>
              )}
              {order.shippingAddress.deliveryNotes && (
                <p className="text-neutral-500 mt-1">
                  Delivery Note: {order.shippingAddress.deliveryNotes}
                </p>
              )}
            </div>

            {billingDiffers && (
              <div>
                <h5 className="font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Billed To:
                </h5>
                <p className="font-bold text-neutral-950 text-sm">{order.billingAddress.fullName}</p>
                <p className="text-neutral-600 mt-0.5">{order.billingAddress.detailedAddress}</p>
                <p className="text-neutral-600">
                  {order.billingAddress.upazila}, {order.billingAddress.district},{' '}
                  {order.billingAddress.division}{' '}
                  {order.billingAddress.postcode ? `- ${order.billingAddress.postcode}` : ''}
                </p>
                <p className="text-neutral-700 font-mono font-semibold mt-1">
                  Phone: {order.billingAddress.phone}
                </p>
              </div>
            )}

            <div className="sm:text-right">
              <h5 className="font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Payment Breakdown:
              </h5>
              <p className="text-neutral-700">
                Method:{' '}
                <span className="font-bold text-neutral-950">
                  {getPaymentChannelName(order.paymentMethod)}
                </span>
              </p>
              {order.transactionId && (
                <p className="text-neutral-700 font-mono">
                  TRX ID: <span className="font-semibold text-neutral-900">{order.transactionId}</span>
                </p>
              )}
              {order.emiPlan && order.emiPlan !== 'full' && (
                <p className="text-neutral-700">
                  EMI Plan: <span className="font-semibold text-neutral-900 uppercase">{order.emiPlan}</span>
                </p>
              )}
              <p className="text-neutral-700">
                Fulfillment Status:{' '}
                <span className="font-semibold text-neutral-900 capitalize">
                  {order.orderStatus.replace('_', ' ')}
                </span>
              </p>
              {order.remarks && (
                <p className="text-neutral-500 italic mt-1 text-[11px]">Note: {order.remarks}</p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-neutral-900 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5">Size / Color</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {order.items.map((item, index) => (
                  <tr key={`${item.variantId}-${index}`} className="print-break-inside-avoid">
                    <td className="py-3 pr-2">
                      <p className="font-bold text-neutral-900">{item.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">SKU: {item.variantSku}</p>
                    </td>
                    <td className="py-3 text-neutral-600">
                      <span className="font-medium text-neutral-900">{item.size}</span> · {item.color}
                    </td>
                    <td className="py-3 text-right font-mono text-neutral-700">
                      ৳{Number(item.price || 0).toLocaleString()}
                    </td>
                    <td className="py-3 text-center font-bold text-neutral-900">{item.quantity}</td>
                    <td className="py-3 text-right font-mono font-bold text-neutral-950">
                      ৳{Number(item.total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-4 border-t border-neutral-200 print-break-inside-avoid">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono text-neutral-900">
                  ৳{Number(order.subtotal || 0).toLocaleString()}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>
                    Special Discount{order.couponCode ? ` (${order.couponCode})` : ''}:
                  </span>
                  <span className="font-mono">-৳{Number(order.discount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charge:</span>
                <span className="font-mono text-neutral-900">
                  {order.shippingFee === 0 ? 'FREE' : `৳${Number(order.shippingFee || 0).toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>VAT / Tax (Included):</span>
                <span className="font-mono text-neutral-900">
                  ৳{Number(order.tax || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-neutral-900 font-bold text-base text-neutral-950">
                <span>Grand Total:</span>
                <span className="font-mono">
                  ৳{Number(order.grandTotal || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-12 pt-6 border-t border-neutral-200 text-center text-[11px] text-neutral-500 print-break-inside-avoid">
            <p className="font-semibold text-neutral-700">
              Thank you for shopping with TheSteps Bangladesh (thesteps.com.bd).
            </p>
            <p className="mt-0.5">
              For exchange or inquiries, email {THESTEPS_CONTACT.email} or call{' '}
              {THESTEPS_CONTACT.phoneHours} within 7 days of delivery.
            </p>
            <p className="text-[10px] text-neutral-400 mt-2 font-mono">
              This is an authenticated computer-generated invoice requiring no physical signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
