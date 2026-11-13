import React, { useState, useEffect } from 'react';
import { X, Handshake, ShieldCheck, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';

interface BidModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BidModal: React.FC<BidModalProps> = ({ product, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { submitBid } = useStore();

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [phone, setPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      const suggested = Math.max(
        product.minBidPrice || Math.round(product.discountedPrice * 0.9),
        Math.round(product.discountedPrice * 0.92)
      );
      setBidAmount(suggested);
      setQuantity(1);
      setPhone(currentUser?.phoneNumber || '+88017');
      setNote('');
      setError('');
    }
  }, [product, isOpen, currentUser]);

  if (!isOpen || !product) return null;

  const minAllowed = product.minBidPrice || Math.round(product.discountedPrice * 0.75);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bidAmount < minAllowed) {
      setError(`Minimum eligible offer for this item is ৳${minAllowed.toLocaleString()}.`);
      return;
    }
    if (phone.trim().length < 11) {
      setError('Please enter a valid 11-digit contact phone number.');
      return;
    }
    setSubmitting(true);
    try {
      await submitBid({
        product,
        bidAmount,
        quantity,
        customerPhone: phone.trim(),
        note: note.trim() || undefined
      });
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Could not submit your offer.');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#292933] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#008ED2] flex items-center justify-center text-white">
              <Handshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Bid For Product</h3>
              <p className="text-[11px] text-neutral-300">Propose your custom price directly to the seller</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-neutral-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Product Summary */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <img src={product.images[0]} alt={product.name} className="w-14 h-14 rounded object-cover shrink-0 bg-white" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#292933] line-clamp-2">{product.name}</p>
              <div className="flex items-center gap-2 mt-1 font-mono-num">
                <span className="font-bold text-[#ff4300]">List: ৳{product.discountedPrice.toLocaleString()}</span>
                <span className="text-[11px] text-neutral-500">Min Offer: ৳{minAllowed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#292933] mb-1">Your Offer Price (৳) *</label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                min={minAllowed}
                max={product.regularPrice}
                className="w-full px-3 py-2 border border-neutral-300 rounded font-mono-num font-bold text-sm text-[#292933] focus:outline-none focus:border-[#008ED2]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#292933] mb-1">Quantity *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                min={1}
                max={Math.max(1, product.availableQuantity)}
                className="w-full px-3 py-2 border border-neutral-300 rounded font-mono-num font-bold text-sm text-[#292933] focus:outline-none focus:border-[#008ED2]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#292933] mb-1">Contact Mobile Number *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801XXXXXXXXX"
              className="w-full px-3 py-2 border border-neutral-300 rounded font-mono-num text-[#292933] focus:outline-none focus:border-[#008ED2]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#292933] mb-1">Message to Seller (Optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ready for instant bKash payment if approved today"
              className="w-full px-3 py-2 border border-neutral-300 rounded text-[#292933] focus:outline-none focus:border-[#008ED2]"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 bg-[#E6F4FB]/50 p-2.5 rounded">
            <ShieldCheck className="w-4 h-4 text-[#008ED2] shrink-0" />
            <span>Once accepted by the seller, checkout immediately at your agreed bid price in My Account → My Bids.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded bg-[#ff4300] hover:bg-[#d93800] text-white font-semibold cursor-pointer transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Price Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
