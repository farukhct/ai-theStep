import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, Coupon } from '../types';
import { INITIAL_COUPONS } from '../config/constants';
import { useNotification } from './NotificationContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => boolean;
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
    const saved = localStorage.getItem('aura_cart');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('aura_coupon');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });

  const [selectedDivision, setSelectedDivision] = useState<string>('Dhaka');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('aura_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('aura_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (product: Product, variant: ProductVariant, quantity: number = 1): boolean => {
    const available = variant.stock - (variant.reservedStock || 0);
    if (available <= 0) {
      addToast('Out of Stock', `${product.name} (${variant.size} - ${variant.color}) is currently sold out.`, 'warning');
      return false;
    }

    let success = true;
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.variantId === variant.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = currentQty + quantity;
        if (newQty > available) {
          addToast('Stock Limit Reached', `Only ${available} items available for this size/color.`, 'warning');
          success = false;
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        if (quantity > available) {
          addToast('Stock Limit Reached', `Only ${available} items available for this size/color.`, 'warning');
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
          discountedPrice: variant.discountedPrice,
          purchasePrice: variant.purchasePrice,
          quantity,
          maxStock: available
        };
        return [...prev, newItem];
      }
    });

    if (success) {
      addToast('Added to Bag', `${product.name} (${variant.size} / ${variant.color}) added.`, 'success');
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
            addToast('Max Quantity', `Only ${item.maxStock} items available in stock.`, 'warning');
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

  const applyCouponCode = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = INITIAL_COUPONS.find(c => c.code === cleanCode && c.isActive);

    if (!coupon) {
      addToast('Invalid Coupon', 'The coupon code entered does not exist or has expired.', 'error');
      return false;
    }

    const currentSubtotal = cart.reduce((acc, item) => acc + item.discountedPrice * item.quantity, 0);
    if (currentSubtotal < coupon.minOrderAmount) {
      addToast('Minimum Order Required', `Order at least ৳${coupon.minOrderAmount} to apply this code.`, 'warning');
      return false;
    }

    setAppliedCoupon(coupon);
    addToast('Coupon Applied', `Code ${coupon.code} applied successfully!`, 'success');
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast('Coupon Removed', 'Promo code removed from your order.', 'info');
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

  // Shipping logic: Inside Dhaka = 60, Outside = 120. Free if subtotal >= 2500
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
