import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    storeName: 'TheSteps',
    tagline: 'The Ultimate Online Shopping BD Experience',
    searchPlaceholder: 'Search in TheSteps (e.g. smart watch, earbuds, serum, panjabi)...',
    allCategories: 'All Products',
    newArrivals: 'New Arrivals',
    bestSellers: 'Best Sellers',
    sale: 'Flash Sale',
    cart: 'Cart',
    wishlist: 'Wishlist',
    login: 'Login',
    account: 'My Account',
    dashboard: 'Admin Panel',
    sellerPanel: 'Seller Hub',
    logout: 'Logout',
    freeDeliveryNote: 'Free Nationwide Delivery on orders over ৳2,500 · 64 Districts Express Shipping',
    insideDhaka: 'Inside Dhaka (৳60)',
    outsideDhaka: 'Outside Dhaka (৳120)',
    quickAdd: 'Add to cart',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    selectSize: 'Select Size / Variant',
    selectColor: 'Select Color / Edition',
    inStock: 'In Stock',
    lowStock: 'Only {count} items left!',
    outOfStock: 'Out of Stock',
    specifications: 'Specifications & Details',
    sizeGuide: 'Size & Measurement Guide',
    customerReviews: 'Customer Reviews',
    checkout: 'Proceed to Checkout',
    subtotal: 'Subtotal',
    discount: 'Voucher Discount',
    shipping: 'Delivery Fee',
    total: 'Total Payable',
    applyCoupon: 'Apply',
    couponPlaceholder: 'Enter voucher code (e.g. SMART10)',
    paymentMethods: 'EPS Payment Options',
    bKashPay: 'bKash',
    nagadPay: 'Nagad',
    sonaliPay: 'Internet Banking',
    cardPay: 'Credit / Debit Card',
    bankTransfer: 'Bank Transfer',
    codPay: 'Cash on Delivery (COD)',
    orderSuccess: 'Order Confirmed Successfully!',
    orderNumber: 'Order ID',
    trackOrder: 'Track Order',
    viewInvoice: 'Print Invoice',
    currencySymbol: '৳'
  },
  bn: {
    storeName: 'দ্য স্টেপস',
    tagline: 'বাংলাদেশের সেরা অনলাইন শপিং অভিজ্ঞতা',
    searchPlaceholder: 'দ্য স্টেপস-এ খুঁজুন (যেমন: স্মার্ট ওয়াচ, ইয়ারবাড, সিরাম, পাঞ্জাবি)...',
    allCategories: 'সকল পণ্য',
    newArrivals: 'নতুন পণ্য',
    bestSellers: 'সেরা বিক্রিত',
    sale: 'ফ্ল্যাশ সেল',
    cart: 'কার্ট',
    wishlist: 'উইশলিস্ট',
    login: 'লগইন',
    account: 'আমার অ্যাকাউন্ট',
    dashboard: 'অ্যাডমিন প্যানেল',
    sellerPanel: 'সেলার হাব',
    logout: 'লগআউট',
    freeDeliveryNote: '৳২,৫০০+ অর্ডারে সারা বাংলাদেশে ফ্রি ডেলিভারি · ৬৪ জেলায় দ্রুত হোম ডেলিভারি',
    insideDhaka: 'ঢাকা সিটির মধ্যে (৳৬০)',
    outsideDhaka: 'ঢাকার বাইরে (৳১২০)',
    quickAdd: 'কার্টে যোগ করুন',
    addToCart: 'কার্টে যোগ করুন',
    buyNow: 'এখনই কিনুন',
    selectSize: 'সাইজ / ভ্যারিয়েন্ট',
    selectColor: 'রং / এডিশন',
    inStock: 'স্টকে আছে',
    lowStock: 'মাত্র {count} টি বাকি!',
    outOfStock: 'স্টক শেষ',
    specifications: 'স্পেসিফিকেশন ও বিস্তারিত',
    sizeGuide: 'সাইজ নির্দেশিকা',
    customerReviews: 'ক্রেতাদের রিভিউ',
    checkout: 'চেকআউটে যান',
    subtotal: 'উপমোট',
    discount: 'ভাউচার ছাড়',
    shipping: 'ডেলিভারি চার্জ',
    total: 'সর্বমোট মূল্য',
    applyCoupon: 'প্রয়োগ',
    couponPlaceholder: 'ভাউচার কোড লিখুন (যেমন: SMART10)',
    paymentMethods: 'ইপিএস পেমেন্ট অপশন',
    bKashPay: 'বিকাশ',
    nagadPay: 'নগদ',
    sonaliPay: 'ইন্টারনেট ব্যাংকিং',
    cardPay: 'ভিসা / মাস্টারকার্ড',
    bankTransfer: 'ব্যাংক ট্রান্সফার',
    codPay: 'ক্যাশ অন ডেলিভারি (COD)',
    orderSuccess: 'অর্ডার সফলভাবে নিশ্চিত হয়েছে!',
    orderNumber: 'অর্ডার আইডি',
    trackOrder: 'অর্ডার ট্র্যাক করুন',
    viewInvoice: 'ইনভয়েস প্রিন্ট করুন',
    currencySymbol: '৳'
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('sd_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sd_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const formatPrice = (amount: number): string => {
    const formatted = new Intl.NumberFormat('en-IN').format(amount);
    return `৳${formatted}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
