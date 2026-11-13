import React, { useState } from 'react';
import { X, Search, Truck, PackageCheck, Clock, MapPin, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { getPaymentChannelName } from '../../config/epsPaymentOptions';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice: (order: Order) => void;
}

const TIMELINE_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending_payment', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' }
];

const STATUS_RANK: Record<OrderStatus, number> = {
  pending_payment: 0,
  paid: 1,
  confirmed: 1,
  processing: 2,
  packed: 3,
  shipped: 4,
  delivered: 5,
  cancelled: -1,
  returned: -1,
  refunded: -1
};

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ isOpen, onClose, onPrintInvoice }) => {
  const { orders } = useStore();
  const [query, setQuery] = useState('SD-26-8891');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(() => orders[0] || null);
  const [notFound, setNotFound] = useState(false);

  if (!isOpen) return null;

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim().toLowerCase();
    if (!clean) return;
    const match = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === clean ||
        (o.trackingNumber || '').toLowerCase() === clean ||
        o.contactNumber.replace(/\D/g, '').endsWith(clean.replace(/\D/g, ''))
    );
    if (match) {
      setSearchedOrder(match);
      setNotFound(false);
    } else {
      setSearchedOrder(null);
      setNotFound(true);
    }
  };

  const activeRank = searchedOrder ? STATUS_RANK[searchedOrder.orderStatus] : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#292933] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#ff4300] flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Track Your TheSteps Order</h3>
              <p className="text-xs text-neutral-300">Enter Order ID, Tracking Code, or 11-digit Phone Number</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg cursor-pointer"
            aria-label="Close order tracker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-5 border-b border-neutral-200 bg-neutral-50 shrink-0 space-y-3">
          <form onSubmit={handleTrackSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. SD-26-8891, SD-TRK-88912, or 01712998877"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-md text-xs font-medium text-[#292933] focus:outline-none focus:border-[#ff4300]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#ff4300] hover:bg-[#d93800] text-white text-xs font-semibold rounded-md cursor-pointer transition-colors"
            >
              Track Now
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
            <span>Quick lookup:</span>
            {orders.slice(0, 3).map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => {
                  setQuery(ord.orderNumber);
                  setSearchedOrder(ord);
                  setNotFound(false);
                }}
                className="px-2 py-0.5 rounded bg-white border border-neutral-200 hover:border-[#ff4300] text-[#292933] font-mono-num cursor-pointer"
              >
                {ord.orderNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Result Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {notFound && (
            <div className="p-6 text-center space-y-2 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="font-bold text-rose-950 text-sm">No matching shipment found</h4>
              <p className="text-rose-700">
                Verify your TheSteps Order ID (e.g. SD-26-8891) or call Customer Care at 01326052866 (9am-6pm).
              </p>
            </div>
          )}

          {searchedOrder && (
            <>
              {/* Top Meta Banner */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-[#E6F4FB]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-sm text-[#292933]">{searchedOrder.orderNumber}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#008ED2] text-white uppercase">
                      {searchedOrder.orderStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-neutral-600">
                    Tracking ID: <span className="font-mono-num font-semibold text-[#292933]">{searchedOrder.trackingNumber || 'Pending Courier'}</span> · {getPaymentChannelName(searchedOrder.paymentMethod)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onPrintInvoice(searchedOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#292933] hover:bg-[#1b1b28] text-white font-semibold cursor-pointer self-start sm:self-center"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
              </div>

              {/* Visual Progress Stepper */}
              {activeRank >= 0 ? (
                <div className="p-4 border border-neutral-200 rounded-lg bg-white">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {TIMELINE_STEPS.map((st, idx) => {
                      const done = idx <= activeRank;
                      return (
                        <div key={st.key} className="flex flex-col items-center text-center gap-1.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                              done ? 'bg-[#1b8a3a] text-white' : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                            }`}
                          >
                            {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`text-[11px] leading-tight ${done ? 'font-semibold text-[#292933]' : 'text-neutral-400'}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
                  Order status: {searchedOrder.orderStatus.toUpperCase()}
                </div>
              )}

              {/* Delivery Destination & Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border border-neutral-200 space-y-1.5">
                  <h4 className="font-bold text-[#292933] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ff4300]" />
                    <span>Delivery Address</span>
                  </h4>
                  <p className="font-semibold text-[#292933]">{searchedOrder.shippingAddress.fullName}</p>
                  <p className="text-neutral-600">{searchedOrder.shippingAddress.detailedAddress}</p>
                  <p className="text-neutral-500">
                    {searchedOrder.shippingAddress.upazila}, {searchedOrder.shippingAddress.district}, {searchedOrder.shippingAddress.division}
                  </p>
                  <p className="font-mono-num text-neutral-700">{searchedOrder.shippingAddress.phone}</p>
                </div>

                <div className="p-3.5 rounded-lg border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-[#292933] flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-[#008ED2]" />
                    <span>Items ({searchedOrder.items.length})</span>
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {searchedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate text-neutral-700">
                          {item.name} × <span className="font-semibold">{item.quantity}</span>
                        </span>
                        <span className="font-mono-num font-bold text-[#292933] shrink-0">
                          ৳{item.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-neutral-100 flex justify-between font-bold text-[#292933]">
                    <span>Total Paid</span>
                    <span className="font-mono-num text-[#ff4300]">৳{searchedOrder.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Log */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#292933] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Shipment Activity History</span>
                </h4>
                <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                  {searchedOrder.statusHistory.slice().reverse().map((h, i) => (
                    <div key={i} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#292933] uppercase text-[11px]">{h.status.replace('_', ' ')}</p>
                        <p className="text-[11px] text-neutral-500">{h.note || `Updated by ${h.updatedBy}`}</p>
                      </div>
                      <span className="font-mono-num text-[11px] text-neutral-400 shrink-0">
                        {new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
