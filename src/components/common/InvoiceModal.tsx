import React from 'react';
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { Order } from '../../types';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print bg-neutral-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide uppercase">Official Tax Invoice · {order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-neutral-900 hover:bg-neutral-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-8 sm:p-12 text-neutral-900 bg-white" id="printable-invoice">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-neutral-200 pb-8">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-widest text-neutral-950 font-serif-heading">AURA</span>
                <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase">ATELIER LTD</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Premium Garments & Fashion Commerce</p>
              <p className="text-xs text-neutral-500">BIN / Tax ID: 004918239-0101</p>
              <p className="text-xs text-neutral-500">Gulshan Avenue, Dhaka-1212, Bangladesh</p>
              <p className="text-xs text-neutral-500">+880 9612-445566 | support@auragarments.bd</p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded bg-neutral-900 text-white font-mono font-bold text-xs uppercase tracking-wider mb-2">
                TAX INVOICE
              </span>
              <p className="text-base font-bold font-mono text-neutral-950">{order.orderNumber}</p>
              <p className="text-xs text-neutral-500 mt-1">
                Date: {new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-neutral-500">
                Tracking: <span className="font-mono font-semibold text-neutral-800">{order.trackingNumber || 'N/A'}</span>
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{order.paymentStatus === 'paid' ? 'Payment Completed' : 'Payment Pending'}</span>
              </div>
            </div>
          </div>

          {/* Customer & Billing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-neutral-200 text-xs">
            <div>
              <h5 className="font-bold text-neutral-400 uppercase tracking-wider mb-2">Deliver To:</h5>
              <p className="font-bold text-neutral-950 text-sm">{order.shippingAddress.fullName}</p>
              <p className="text-neutral-600 mt-0.5">{order.shippingAddress.detailedAddress}</p>
              <p className="text-neutral-600">
                {order.shippingAddress.upazila}, {order.shippingAddress.district}, {order.shippingAddress.division} {order.shippingAddress.postcode ? `- ${order.shippingAddress.postcode}` : ''}
              </p>
              <p className="text-neutral-700 font-mono font-semibold mt-1">Phone: {order.shippingAddress.phone}</p>
              {order.shippingAddress.email && <p className="text-neutral-600">Email: {order.shippingAddress.email}</p>}
            </div>

            <div className="sm:text-right">
              <h5 className="font-bold text-neutral-400 uppercase tracking-wider mb-2">Payment Breakdown:</h5>
              <p className="text-neutral-700">
                Method: <span className="font-bold uppercase text-neutral-950">{order.paymentMethod}</span>
              </p>
              {order.transactionId && (
                <p className="text-neutral-700 font-mono">
                  TRX ID: <span className="font-semibold text-neutral-900">{order.transactionId}</span>
                </p>
              )}
              <p className="text-neutral-700">
                Fulfillment Status: <span className="font-semibold text-neutral-900 capitalize">{order.orderStatus.replace('_', ' ')}</span>
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
                  <tr key={index} className="print-break-inside-avoid">
                    <td className="py-3 pr-2">
                      <p className="font-bold text-neutral-900">{item.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">SKU: {item.variantSku}</p>
                    </td>
                    <td className="py-3 text-neutral-600">
                      <span className="font-medium text-neutral-900">{item.size}</span> · {item.color}
                    </td>
                    <td className="py-3 text-right font-mono text-neutral-700">৳{item.price.toLocaleString()}</td>
                    <td className="py-3 text-center font-bold text-neutral-900">{item.quantity}</td>
                    <td className="py-3 text-right font-mono font-bold text-neutral-950">৳{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono text-neutral-900">৳{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Special Discount:</span>
                  <span className="font-mono">-৳{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charge:</span>
                <span className="font-mono text-neutral-900">
                  {order.shippingFee === 0 ? 'FREE' : `৳${order.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>VAT / Tax (Included):</span>
                <span className="font-mono text-neutral-900">৳0</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-neutral-900 font-bold text-base text-neutral-950">
                <span>Grand Total:</span>
                <span className="font-mono">৳{order.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-12 pt-6 border-t border-neutral-200 text-center text-[11px] text-neutral-500">
            <p className="font-semibold text-neutral-700">Thank you for choosing AURA ATELIER garments.</p>
            <p className="mt-0.5">For exchange or inquiries, visit auragarments.bd or call +880 9612-445566 within 7 days of delivery.</p>
            <p className="text-[10px] text-neutral-400 mt-2 font-mono">This is an authenticated computer-generated invoice requiring no physical signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
