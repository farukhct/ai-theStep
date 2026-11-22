import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CartItem, Product, ProductVariant, Coupon } from '../types';
import { INITIAL_COUPONS } from '../config/constants';
import { useNotification } from './NotificationContext';

export interface AddToCartOptions {
  openDrawer?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    variant: ProductVariant,
    quantity?: number,
    overridePrice?: number,
    options?: AddToCartOptions
  ) => boolean;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  reconcileCartWithProducts: (products: Product[]) => void;
  appliedCoupon: Coupon | null;
  couponEligibilityError: string | null;
  applyCouponCode: (code: string) => boolean;
  removeCoupon: () => void;
  selectedDivision: string;
  setSelectedDivision: (div: string) => void;
  subtotal: number;
  discount: number;
  shippingFee: number;
  isFreeShipping: boolean;
  hasAllFreeDeliveryItems: boolean;
  hasStockIssue: boolean;
  grandTotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

function isCouponExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiryEnd = new Date(`${expiryDate}T23:59:59.999Z`).getTime();
  return !Number.isNaN(expiryEnd) && Date.now() > expiryEnd;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useNotification();

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('sd_cart') || localStorage.getItem('aura_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        /* ignore */
      }
    }
    return [];
  });

  const cartRef = useRef<CartItem[]>(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('sd_coupon');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* ignore */
      }
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

  const addToCart = useCallback(
    (
      product: Product,
      variant: ProductVariant,
      quantity: number = 1,
      overridePrice?: number,
      options?: AddToCartOptions
    ): boolean => {
      const qty = Math.max(1, Math.floor(Number(quantity) || 1));
      const available = Math.max(0, variant.stock - (variant.reservedStock || 0));

      if (available <= 0) {
        addToast(
          'Out of Stock',
          `${product.name} (${variant.size} · ${variant.color}) is currently sold out.`,
          'warning'
        );
        return false;
      }

      const effectivePrice =
        overridePrice !== undefined && Number.isFinite(overridePrice) && overridePrice > 0
          ? Math.round(overridePrice)
          : variant.discountedPrice;

      const currentCart = cartRef.current;
      const existingIndex = currentCart.findIndex((item) => item.variantId === variant.id);

      let nextCart: CartItem[];
      if (existingIndex > -1) {
        const currentQty = currentCart[existingIndex].quantity;
        const newQty = currentQty + qty;
        if (newQty > available) {
          addToast('Stock Limit Reached', `Only ${available} units available for this option.`, 'warning');
          return false;
        }
        nextCart = currentCart.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: newQty,
                discountedPrice: effectivePrice,
                maxStock: available,
                freeDelivery: Boolean(product.freeDelivery)
              }
            : item
        );
      } else {
        if (qty > available) {
          addToast('Stock Limit Reached', `Only ${available} units available for this option.`, 'warning');
          return false;
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
          quantity: qty,
          maxStock: available,
          freeDelivery: Boolean(product.freeDelivery)
        };
        nextCart = [...currentCart, newItem];
      }

      cartRef.current = nextCart;
      setCart(nextCart);
      addToast('Added to Cart', `${product.name} added to your shopping cart.`, 'success');
      if (options?.openDrawer !== false) {
        setIsCartOpen(true);
      }
      return true;
    },
    [addToast]
  );

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) => {
          const next = prev.filter((item) => item.variantId !== variantId);
          cartRef.current = next;
          return next;
        });
        return;
      }

      const target = cartRef.current.find((item) => item.variantId === variantId);
      if (!target) return;

      const safeQty = Math.floor(quantity);
      if (safeQty > target.maxStock) {
        addToast('Max Quantity', `Only ${target.maxStock} units available in stock.`, 'warning');
      }
      const clampedQty = target.maxStock > 0 ? Math.min(safeQty, target.maxStock) : 1;

      setCart((prev) => {
        const next = prev.map((item) => (item.variantId === variantId ? { ...item, quantity: clampedQty } : item));
        cartRef.current = next;
        return next;
      });
    },
    [addToast]
  );

  const removeFromCart = useCallback((variantId: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.variantId !== variantId);
      cartRef.current = next;
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    cartRef.current = [];
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  const reconcileCartWithProducts = useCallback((liveProducts: Product[]) => {
    if (!Array.isArray(liveProducts) || liveProducts.length === 0) return;
    setCart((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map((item) => {
        const prod = liveProducts.find((p) => p.id === item.productId);
        const variant = prod?.variants.find((v) => v.id === item.variantId);
        if (!prod || !variant) return item;
        const liveAvail = Math.max(0, variant.stock - (variant.reservedStock || 0));
        const liveFree = Boolean(prod.freeDelivery);
        if (item.maxStock !== liveAvail || item.freeDelivery !== liveFree || item.regularPrice !== variant.regularPrice) {
          changed = true;
          return {
            ...item,
            maxStock: liveAvail,
            freeDelivery: liveFree,
            regularPrice: variant.regularPrice
          };
        }
        return item;
      });
      if (changed) {
        cartRef.current = next;
        return next;
      }
      return prev;
    });
  }, []);

  const getAvailableCoupons = (): Coupon[] => {
    try {
      const stored = localStorage.getItem('sd_coupons');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return INITIAL_COUPONS;
  };

  const applyCouponCode = useCallback(
    (code: string): boolean => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return false;
      const allCoupons = getAvailableCoupons();
      const coupon = allCoupons.find((c) => c.code.toUpperCase() === cleanCode);

      if (!coupon || !coupon.isActive) {
        addToast('Invalid Voucher', 'The voucher code entered is invalid or inactive.', 'error');
        return false;
      }

      if (isCouponExpired(coupon.expiryDate)) {
        addToast('Voucher Expired', `Voucher ${coupon.code} expired on ${coupon.expiryDate}.`, 'error');
        return false;
      }

      if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
        addToast('Usage Limit Reached', `Voucher ${coupon.code} has reached its redemption limit.`, 'warning');
        return false;
      }

      const currentSubtotal = cartRef.current.reduce((acc, item) => acc + item.discountedPrice * item.quantity, 0);
      if (currentSubtotal < coupon.minOrderAmount) {
        addToast(
          'Minimum Spend Required',
          `Spend at least ৳${coupon.minOrderAmount.toLocaleString()} to use ${coupon.code}.`,
          'warning'
        );
        return false;
      }

      setAppliedCoupon(coupon);
      addToast('Voucher Applied', `Code ${coupon.code} activated!`, 'success');
      return true;
    },
    [addToast]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    addToast('Voucher Removed', 'Discount voucher removed from order.', 'info');
  }, [addToast]);

  const subtotal = cart.reduce((acc, item) => acc + item.discountedPrice * item.quantity, 0);

  let couponEligibilityError: string | null = null;
  let discount = 0;
  if (appliedCoupon && cart.length > 0) {
    if (!appliedCoupon.isActive || isCouponExpired(appliedCoupon.expiryDate)) {
      couponEligibilityError = `Voucher ${appliedCoupon.code} is expired or inactive.`;
    } else if (appliedCoupon.usageLimit > 0 && appliedCoupon.usageCount >= appliedCoupon.usageLimit) {
      couponEligibilityError = `Voucher ${appliedCoupon.code} redemption limit reached.`;
    } else if (subtotal < appliedCoupon.minOrderAmount) {
      couponEligibilityError = `Add ৳${(appliedCoupon.minOrderAmount - subtotal).toLocaleString()} more to activate ${appliedCoupon.code} (min ৳${appliedCoupon.minOrderAmount.toLocaleString()}).`;
    } else if (appliedCoupon.discountType === 'percentage') {
      const calculated = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      discount = appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    } else {
      discount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  const hasAllFreeDeliveryItems = cart.length > 0 && cart.every((item) => item.freeDelivery === true);
  const isFreeShipping = cart.length === 0 || subtotal >= 2500 || hasAllFreeDeliveryItems;
  const shippingFee = cart.length === 0 ? 0 : isFreeShipping ? 0 : selectedDivision.toLowerCase() === 'dhaka' ? 60 : 120;
  const hasStockIssue = cart.some((item) => item.maxStock <= 0 || item.quantity > item.maxStock);

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
        reconcileCartWithProducts,
        appliedCoupon,
        couponEligibilityError,
        applyCouponCode,
        removeCoupon,
        selectedDivision,
        setSelectedDivision,
        subtotal,
        discount,
        shippingFee,
        isFreeShipping,
        hasAllFreeDeliveryItems,
        hasStockIssue,
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
