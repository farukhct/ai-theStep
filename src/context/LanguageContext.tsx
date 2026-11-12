import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    storeName: 'AURA ATELIER',
    tagline: 'Modern Garments & Sartorial Excellence',
    searchPlaceholder: 'Search garments, fabrics, cotton tees, chinos...',
    allCategories: 'All Garments',
    newArrivals: 'New Arrivals',
    bestSellers: 'Best Sellers',
    sale: 'Special Offers',
    cart: 'Bag',
    wishlist: 'Saved',
    login: 'Sign In',
    account: 'Account',
    dashboard: 'Admin Dashboard',
    logout: 'Sign Out',
    freeDeliveryNote: 'Free Express Delivery across Bangladesh on orders over ৳2,500',
    insideDhaka: 'Inside Dhaka (৳60)',
    outsideDhaka: 'Outside Dhaka (৳120)',
    quickAdd: 'Quick Add',
    addToCart: 'Add to Bag',
    buyNow: 'Instant Buy',
    selectSize: 'Select Size',
    selectColor: 'Select Color',
    inStock: 'In Stock',
    lowStock: 'Only {count} items left!',
    outOfStock: 'Sold Out',
    specifications: 'Specifications & Fabric',
    sizeGuide: 'Garments Size Guide',
    customerReviews: 'Verified Customer Reviews',
    checkout: 'Proceed to Secure Checkout',
    subtotal: 'Subtotal',
    discount: 'Discount',
    shipping: 'Shipping Fee',
    total: 'Grand Payable Total',
    applyCoupon: 'Apply Code',
    couponPlaceholder: 'Enter promo code (e.g. AURA10)',
    paymentMethods: 'Payment Channels in Bangladesh',
    bKashPay: 'bKash Merchant Pay',
    nagadPay: 'Nagad Online Pay',
    sonaliPay: 'Sonali Bank SPG',
    cardPay: 'Credit / Debit Card',
    bankTransfer: 'Direct Bank Transfer',
    codPay: 'Cash on Delivery (COD)',
    orderSuccess: 'Order Placed Successfully!',
    orderNumber: 'Order Number',
    trackOrder: 'Track Shipment',
    viewInvoice: 'Print Official Invoice',
    currencySymbol: '৳'
  },
  bn: {
    storeName: 'অরা অটেলিয়ার',
    tagline: 'আধুনিক পোশাক ও মানসম্মত গার্মেন্টস সম্ভার',
    searchPlaceholder: 'পোশাক, ফ্যাব্রিক, কটন টি-শার্ট, চিনোস খুঁজুন...',
    allCategories: 'সকল পোশাক',
    newArrivals: 'নতুন কালেকশন',
    bestSellers: 'বেস্ট সেলার',
    sale: 'বিশেষ ছাড়',
    cart: 'ব্যাগ',
    wishlist: 'পছন্দ',
    login: 'লগইন',
    account: 'প্রোফাইল',
    dashboard: 'ম্যানেজমেন্ট ড্যাশবোর্ড',
    logout: 'লগআউট',
    freeDeliveryNote: '৳২,৫০০ বা তার বেশি অর্ডারে সারা বাংলাদেশে ফ্রি ডেলিভারি',
    insideDhaka: 'ঢাকা সিটির মধ্যে (৳৬০)',
    outsideDhaka: 'ঢাকার বাইরে (৳১২০)',
    quickAdd: 'দ্রুত কিনুন',
    addToCart: 'ব্যাগে যোগ করুন',
    buyNow: 'সরাসরি কিনুন',
    selectSize: 'সাইজ নির্বাচন করুন',
    selectColor: 'রং নির্বাচন করুন',
    inStock: 'স্টকে আছে',
    lowStock: 'মাত্র {count} টি অবশিষ্ট!',
    outOfStock: 'স্টক শেষ',
    specifications: 'কাপড় ও স্পেসিফিকেশন',
    sizeGuide: 'মাপের নির্দেশিকা',
    customerReviews: 'ক্রেতাদের রিভিউ',
    checkout: 'অর্ডার সম্পন্ন করুন',
    subtotal: 'মোট মূল্য',
    discount: 'ছাড়',
    shipping: 'ডেলিভারি চার্জ',
    total: 'সর্বমোট প্রদেয় মূল্য',
    applyCoupon: 'কুপন প্রয়োগ',
    couponPlaceholder: 'প্রোমো কোড লিখুন (যেমন: AURA10)',
    paymentMethods: 'পেমেন্ট মাধ্যমসমূহ',
    bKashPay: 'বিকাশ মার্চেন্ট পে',
    nagadPay: 'নগদ অনলাইন পে',
    sonaliPay: 'সোনালী ব্যাংক SPG',
    cardPay: 'ভিসা / মাস্টারকার্ড',
    bankTransfer: 'সরাসরি ব্যাংক ট্রান্সফার',
    codPay: 'ক্যাশ অন ডেলিভারি (COD)',
    orderSuccess: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!',
    orderNumber: 'অর্ডার নম্বর',
    trackOrder: 'শিপমেন্ট ট্র্যাক করুন',
    viewInvoice: 'চালান / ইনভয়েস প্রিন্ট',
    currencySymbol: '৳'
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('aura_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('aura_lang', lang);
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
