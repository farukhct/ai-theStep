import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, Coupon } from '../types';
import { INITIAL_COUPONS } from '../config/constants';
import { useNotification } from './NotificationContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number, overridePrice?: number) => boolean;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => boolean;
  removeCoupon: () => void;
  selectedDivision: string;
  setSelectedDivision: (div: string) => void;
  subtotal: number;
  discount: number;
  shippingFee: number;
  grandTotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useNotification();
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('sd_cart') || localStorage.getItem('aura_cart');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('sd_coupon');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return null;
  });

  const [selectedDivision, setSelectedDivision] = useState<string>('Dhaka');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('sd_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('sd_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('sd_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (
    product: Product,
    variant: ProductVariant,
    quantity: number = 1,
    overridePrice?: number
  ): boolean => {
    const available = variant.stock - (variant.reservedStock || 0);
    if (available <= 0) {
      addToast('Out of Stock', `${product.name} (${variant.size} · ${variant.color}) is currently sold out.`, 'warning');
      return false;
    }

    const effectivePrice = overridePrice ?? variant.discountedPrice;
    let success = true;
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.variantId === variant.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = currentQty + quantity;
        if (newQty > available) {
          addToast('Stock Limit Reached', `Only ${available} items available for this option.`, 'warning');
          success = false;
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          discountedPrice: effectivePrice
        };
        return updated;
      } else {
        if (quantity > available) {
          addToast('Stock Limit Reached', `Only ${available} items available for this option.`, 'warning');
          success = false;
          return prev;
        }
        const newItem: CartItem = {
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantSku: variant.sku,
          size: variant.size,
          color: variant.color,
          image: product.images[0] || '',
          regularPrice: variant.regularPrice,
          discountedPrice: effectivePrice,
          purchasePrice: variant.purchasePrice,
          quantity,
          maxStock: available
        };
        return [...prev, newItem];
      }
    });

    if (success) {
      addToast('Added to Cart', `${product.name} added to your shopping cart.`, 'success');
      setIsCartOpen(true);
    }
    return success;
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.variantId === variantId) {
          if (quantity > item.maxStock) {
            addToast('Max Quantity', `Only ${item.maxStock} units available in stock.`, 'warning');
            return { ...item, quantity: item.maxStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const getAvailableCoupons = (): Coupon[] => {
    try {
      const stored = localStorage.getItem('sd_coupons');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return INITIAL_COUPONS;
  };

  const applyCouponCode = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    const allCoupons = getAvailableCoupons();
    const coupon = allCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (!coupon) {
      addToast('Invalid Voucher', 'The voucher code entered is invalid or expired.', 'error');
      return false;
    }

    const currentSubtotal = cart.reduce((acc, item) => acc + item.discountedPrice * item.quantity, 0);
    if (currentSubtotal < coupon.minOrderAmount) {
      addToast('Minimum Spend Required', `Spend at least ৳${coupon.minOrderAmount.toLocaleString()} to use ${coupon.code}.`, 'warning');
      return false;
    }

    setAppliedCoupon(coupon);
    addToast('Voucher Applied', `Code ${coupon.code} activated!`, 'success');
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast('Voucher Removed', 'Discount voucher removed from order.', 'info');
  };

  const subtotal = cart.reduce((acc, item) => acc + item.discountedPrice * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      const calculated = (subtotal * appliedCoupon.discountValue) / 100;
      discount = appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    } else {
      discount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  const isFreeShipping = subtotal >= 2500 || cart.length === 0;
  const shippingFee = cart.length === 0 ? 0 : isFreeShipping ? 0 : selectedDivision.toLowerCase() === 'dhaka' ? 60 : 120;

  const grandTotal = Math.max(0, subtotal - discount + shippingFee);
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        selectedDivision,
        setSelectedDivision,
        subtotal,
        discount,
        shippingFee,
        grandTotal,
        itemCount,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
