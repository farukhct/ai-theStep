import React, { useState } from 'react';
import { X, Ticket, CheckCircle2, Copy, ArrowRight, Info, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';

interface VoucherCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoucherCenterModal: React.FC<VoucherCenterModalProps> = ({ isOpen, onClose }) => {
  const { coupons } = useStore();
  const { currentUser, collectVoucher } = useAuth();
  const { applyCouponCode, setIsCartOpen } = useCart();
  const { addToast } = useNotification();
  const [expandedTermsId, setExpandedTermsId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeCoupons = coupons.filter((c) => c.isActive);
  const collectedCodes = currentUser?.collectedVouchers || [];

  const handleCollect = (code: string) => {
    collectVoucher(code);
    addToast('Voucher Collected', `${code} saved to your TheSteps account.`, 'success');
  };

  const handleCollectAll = () => {
    activeCoupons.forEach((c) => collectVoucher(c.code));
    addToast('All Vouchers Collected', `${activeCoupons.length} TheSteps vouchers added to your wallet.`, 'success');
  };

  const handleApplyAndShop = (code: string) => {
    collectVoucher(code);
    const applied = applyCouponCode(code);
    if (applied) {
      onClose();
      setIsCartOpen(true);
    } else {
      navigator.clipboard?.writeText(code);
      addToast('Code Copied', `${code} collected & copied. Add qualifying items to your cart to redeem.`, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#292933] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EC1561] flex items-center justify-center text-white">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">TheSteps Voucher Center</h3>
              <p className="text-xs text-neutral-300">Collect storewide & seller vouchers before checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCoupons.length > 0 && (
              <button
                type="button"
                onClick={handleCollectAll}
                className="px-3 py-1.5 rounded bg-[#ff4300] hover:bg-[#d93800] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Collect All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-300 hover:text-white rounded-lg cursor-pointer"
              aria-label="Close voucher center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voucher List */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#ebedf0] space-y-3.5">
          {activeCoupons.length === 0 ? (
            <div className="bg-white rounded-lg p-10 text-center text-xs text-neutral-500">
              No active vouchers available right now. Check back during our next Flash Sale!
            </div>
          ) : (
            activeCoupons.map((coupon) => {
              const isCollected = collectedCodes.includes(coupon.code);
              const showTerms = expandedTermsId === coupon.id;
              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-lg border-2 border-dashed border-[#008ED2]/50 p-4 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-lg bg-[#E6F4FB] border border-[#008ED2]/30 flex flex-col items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-[#EC1561]" />
                        <span className="text-[10px] font-bold text-[#008ED2] font-mono-num">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[#292933]">
                            {coupon.title ||
                              (coupon.discountType === 'percentage'
                                ? `${coupon.discountValue}% Instant Discount`
                                : `৳${coupon.discountValue} Flat Off`)}
                          </span>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#E6F4FB] text-[#008ED2]">
                            {coupon.code}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {coupon.shopName || 'TheSteps Official'} · Min spend ৳{coupon.minOrderAmount.toLocaleString()} · Expires {coupon.expiryDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(coupon.code);
                          addToast('Code Copied', `${coupon.code} copied to clipboard.`, 'info');
                        }}
                        className="p-2 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                        title="Copy voucher code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {isCollected ? (
                        <button
                          type="button"
                          onClick={() => handleApplyAndShop(coupon.code)}
                          className="px-3.5 py-2 rounded bg-[#008ED2] hover:bg-[#0074ad] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Use in Cart</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCollect(coupon.code)}
                          className="px-4 py-2 rounded bg-[#ff4300] hover:bg-[#d93800] text-white text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Collect
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ticket stub dashed divider with circular notches */}
                  <div className="sd-voucher-divider mt-3.5 pt-2.5 flex items-center justify-between text-[11px] text-neutral-500">
                    <button
                      type="button"
                      onClick={() => setExpandedTermsId(showTerms ? null : coupon.id)}
                      className="inline-flex items-center gap-1 text-[#008ED2] font-medium hover:underline cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                      <span>{showTerms ? 'Hide T&C' : 'View Terms & Conditions'}</span>
                    </button>
                    <span className="font-mono-num">Used {coupon.usageCount}/{coupon.usageLimit}</span>
                  </div>

                  {showTerms && (
                    <p className="mt-2 text-[11px] text-neutral-600 bg-[#E6F4FB]/50 rounded p-2">
                      {coupon.terms || `Valid on qualifying orders above ৳${coupon.minOrderAmount.toLocaleString()} before ${coupon.expiryDate}.`}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
