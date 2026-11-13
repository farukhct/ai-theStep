import React, { useState } from 'react';
import {
  ShoppingCart,
  X,
  Trash2,
  ArrowRight,
  Tag,
  CheckCircle,
  Ticket
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { BD_DIVISIONS } from '../../config/constants';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    subtotal,
    discount,
    shippingFee,
    grandTotal,
    itemCount,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    selectedDivision,
    setSelectedDivision
  } = useCart();

  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [couponInput, setCouponInput] = useState('');

  if (!isOpen) return null;

  const collectedVouchers = currentUser?.collectedVouchers || ['SMART10'];

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    if (applyCouponCode(couponInput)) {
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-[#292933] text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#ff4300]" />
            <h3 className="text-base font-bold">TheSteps Cart</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#ff4300] text-white font-mono-num">
              {itemCount}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress */}
        <div className="px-5 py-3 bg-[#E6F4FB]/70 border-b border-neutral-200 text-xs">
          {subtotal >= 2500 ? (
            <div className="flex items-center gap-2 text-[#1b8a3a] font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>FREE Nationwide Delivery unlocked!</span>
            </div>
          ) : (
            <div>
              <div className="flex justify-between font-medium text-[#292933] mb-1">
                <span>Add ৳{(2500 - subtotal).toLocaleString()} more for FREE Delivery</span>
                <span className="font-mono-num">{Math.round((subtotal / 2500) * 100)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#ff4300] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / 2500) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-neutral-100 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-4 bg-[#ebedf0] rounded-full text-neutral-400">
                <ShoppingCart className="w-10 h-10 stroke-[1.4]" />
              </div>
              <h4 className="text-base font-bold text-[#292933]">Your TheSteps cart is empty</h4>
              <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                Explore Flash Deals, gadgets, fashion, and home essentials with instant EPS checkout.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-[#ff4300] hover:bg-[#d93800] text-white rounded-[5px] text-xs font-bold cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.variantId} className="pt-4 first:pt-0 flex gap-3.5">
                <div className="w-20 h-20 rounded border border-neutral-200 bg-neutral-100 overflow-hidden shrink-0">
                  <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#292933] line-clamp-2">{item.productName}</h4>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-neutral-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {item.color} · {item.size}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-neutral-300 rounded overflow-hidden bg-neutral-50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#292933] hover:bg-neutral-200 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-bold font-mono-num text-[#292933] bg-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="px-2 py-0.5 text-xs font-bold text-[#292933] hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold font-mono-num text-[#ff4300]">
                      ৳{(item.discountedPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-neutral-200 bg-[#f7f8fa] space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-600">Delivery Division:</span>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="bg-white border border-neutral-300 rounded px-2.5 py-1 text-xs font-medium text-[#292933]"
              >
                {BD_DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {div} {div === 'Dhaka' ? '(৳60)' : '(৳120)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Voucher Input & Quick Collected Chips */}
            <div className="space-y-2">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 rounded bg-[#E6F4FB] border border-[#008ED2]/40 text-xs">
                  <div className="flex items-center gap-1.5 text-[#008ED2]">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="font-mono font-bold">{appliedCoupon.code}</span>
                    <span>
                      ({appliedCoupon.discountType === 'percentage'
                        ? `${appliedCoupon.discountValue}%`
                        : `৳${appliedCoupon.discountValue}`}{' '}
                      off)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-rose-600 font-bold text-[11px] hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('couponPlaceholder')}
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 bg-white border border-neutral-300 rounded px-3 py-1.5 text-xs uppercase placeholder:normal-case focus:outline-none focus:border-[#008ED2]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-[#008ED2] hover:bg-[#0074ad] text-white rounded text-xs font-bold cursor-pointer"
                    >
                      {t('applyCoupon')}
                    </button>
                  </form>

                  {collectedVouchers.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <Ticket className="w-3 h-3 text-[#EC1561]" />
                      <span className="text-neutral-500">Your vouchers:</span>
                      {collectedVouchers.slice(0, 3).map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => applyCouponCode(code)}
                          className="px-2 py-0.5 rounded border border-dashed border-[#008ED2] text-[#008ED2] font-mono font-bold hover:bg-[#E6F4FB] cursor-pointer"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-xs border-t border-neutral-200 pt-3">
              <div className="flex justify-between text-neutral-600">
                <span>{t('subtotal')}</span>
                <span className="font-mono-num text-[#292933]">৳{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#1b8a3a]">
                  <span>{t('discount')}</span>
                  <span className="font-mono-num">-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Delivery ({selectedDivision})</span>
                <span className="font-mono-num text-[#292933]">{shippingFee === 0 ? 'FREE' : `৳${shippingFee}`}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold text-[#292933]">
                <span>{t('total')}</span>
                <span className="font-mono-num text-[#ff4300]">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onCheckout();
                onClose();
              }}
              className="w-full py-3 px-4 bg-[#ff4300] hover:bg-[#d93800] text-white font-bold rounded-[5px] text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>{t('checkout')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
