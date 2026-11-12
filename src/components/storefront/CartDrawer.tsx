import React, { useState } from 'react';
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  Truck, 
  CheckCircle 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
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

  const { formatPrice, t } = useLanguage();
  const [couponInput, setCouponInput] = useState('');

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    if (applyCouponCode(couponInput)) {
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-900" />
            <h3 className="text-base font-bold text-neutral-950">Your Shopping Bag</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-900 text-white">
              {itemCount}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="px-5 py-3 bg-neutral-100 border-b border-neutral-200 text-xs">
          {subtotal >= 2500 ? (
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>You've unlocked FREE Express Shipping in Bangladesh!</span>
            </div>
          ) : (
            <div>
              <div className="flex justify-between font-medium text-neutral-700 mb-1">
                <span>Add ৳{(2500 - subtotal).toLocaleString()} more for FREE Delivery</span>
                <span>{Math.round((subtotal / 2500) * 100)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-neutral-900 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / 2500) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-neutral-100 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-4 bg-neutral-100 rounded-full text-neutral-400">
                <ShoppingBag className="w-10 h-10 stroke-[1.2]" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">Your bag is empty</h4>
              <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                Discover our latest drop of heavyweight combed cotton tees, oxfords, and raw selvedge denim.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.variantId} className="pt-4 first:pt-0 flex gap-4">
                {/* Thumb */}
                <div className="w-20 h-24 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                  <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-neutral-950 truncate">{item.productName}</h4>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      <span className="font-semibold text-neutral-800">{item.size}</span> · {item.color}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">SKU: {item.variantSku}</p>
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-neutral-300 rounded-md overflow-hidden bg-neutral-50">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs font-bold text-neutral-600 hover:bg-neutral-200 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-bold font-mono text-neutral-950 bg-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="px-2 py-0.5 text-xs font-bold text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold font-mono text-neutral-950">
                      ৳{(item.discountedPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Controls */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 space-y-3.5">
            {/* Division Selector for live delivery fee calculation */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-600">Delivery Division:</span>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="bg-white border border-neutral-300 rounded-md px-2.5 py-1 text-xs font-medium text-neutral-900 focus:outline-none"
              >
                {BD_DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {div} {div === 'Dhaka' ? '(৳60)' : '(৳120)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Coupon Code Input */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="font-mono font-bold">{appliedCoupon.code}</span>
                    <span>applied ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `৳${appliedCoupon.discountValue}`} off)</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code (e.g. AURA10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs uppercase placeholder:normal-case placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Subtotal & Totals Breakdown */}
            <div className="space-y-1.5 text-xs border-t border-neutral-200 pt-3">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono text-neutral-900">৳{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Special Discount</span>
                  <span className="font-mono">-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Shipping ({selectedDivision})</span>
                <span className="font-mono text-neutral-900">
                  {shippingFee === 0 ? 'FREE' : `৳${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-black text-neutral-950">
                <span>Total Payable</span>
                <span className="font-mono">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                onCheckout();
                onClose();
              }}
              className="w-full py-3.5 px-4 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>{t('checkout')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
