import React from 'react';
import { CheckCircle2, Printer, ArrowRight, Package, MapPin, Truck, ShieldCheck } from 'lucide-react';
import { Order } from '../../types';
import { getPaymentChannelName } from '../../config/epsPaymentOptions';

interface OrderSuccessModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice: (order: Order) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
  onPrintInvoice
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {order.paymentStatus === 'paid' ? 'PAYMENT AUTHORIZED (EPS)' : 'ORDER CONFIRMED'}
          </span>
          <h3 className="text-2xl font-black text-neutral-950 font-serif-heading">
            Order Placed Successfully!
          </h3>
          <p className="text-xs text-neutral-500">
            Thank you, {order.customerName}. Your TheSteps shipment is queued for packing.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-left text-xs space-y-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
            <span className="text-neutral-500">Order Reference:</span>
            <span className="font-mono font-bold text-neutral-950">{order.orderNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Tracking Code:</span>
            <span className="font-mono font-bold text-neutral-800">{order.trackingNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Payment Channel:</span>
            <span className="font-bold text-neutral-900">{getPaymentChannelName(order.paymentMethod)}</span>
          </div>

          {order.transactionId && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Transaction ID:</span>
              <span className="font-mono font-semibold text-neutral-800">{order.transactionId}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-neutral-200 font-bold text-sm">
            <span className="text-neutral-900">Total Payable:</span>
            <span className="font-mono text-neutral-950">৳{order.grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Shipping Destination Note */}
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-100 text-left text-xs text-neutral-700">
          <Truck className="w-4 h-4 text-neutral-600 shrink-0" />
          <p className="text-[11px] leading-snug">
            Delivering to <span className="font-bold text-neutral-900">{order.shippingAddress.detailedAddress}, {order.shippingAddress.division}</span> via Pathao Express.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => onPrintInvoice(order)}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Tax Invoice</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
