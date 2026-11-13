import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Bell,
  User,
  Globe,
  Layers,
  ChevronDown,
  Ticket,
  Truck,
  Store,
  Flame,
  CreditCard,
  Menu,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { GARMENT_CATEGORIES, POPULAR_SEARCH_KEYWORDS } from '../../config/constants';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenPortal: () => void;
  onOpenDashboard: () => void;
  onOpenVoucherCenter: () => void;
  onOpenTrackOrder: () => void;
  onOpenEpsOptions: () => void;
  onScrollToFlashSale: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenNotifications,
  onOpenAuth,
  onOpenPortal,
  onOpenDashboard,
  onOpenVoucherCenter,
  onOpenTrackOrder,
  onOpenEpsOptions,
  onScrollToFlashSale,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, isManager, switchDemoRole } = useAuth();
  const { itemCount, grandTotal } = useCart();
  const { unreadCount } = useNotification();

  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showPopularSearch, setShowPopularSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowPopularSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSellWithUs = () => {
    if (!isManager) {
      switchDemoRole('seller');
    }
    onOpenDashboard();
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs">
      {/* TheSteps Top Utility Strip */}
      <div className="bg-[#f7f8fa] border-b border-neutral-200 text-[11px] text-[#292933]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={onOpenVoucherCenter}
              className="inline-flex items-center gap-1.5 font-semibold text-[#ff4300] hover:text-[#d93800] whitespace-nowrap cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Get Extra Discount</span>
            </button>
            <span className="hidden md:inline text-neutral-400">|</span>
            <span className="hidden md:inline text-neutral-600 truncate">
              {t('freeDeliveryNote')}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={onOpenTrackOrder}
              className="inline-flex items-center gap-1 text-neutral-600 hover:text-[#ff4300] whitespace-nowrap cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{t('trackOrder')}</span>
            </button>

            <button
              type="button"
              onClick={handleSellWithUs}
              className="hidden sm:inline-flex items-center gap-1 text-neutral-600 hover:text-[#ff4300] whitespace-nowrap cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Sell with us</span>
            </button>

            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden sm:inline text-neutral-700 hover:text-[#ff4300] font-medium whitespace-nowrap cursor-pointer"
            >
              {currentUser ? `${currentUser.displayName.split(' ')[0]} · Switch Role` : 'Login / Sign up'}
            </button>

            {/* EN | বাং Switcher */}
            <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded px-1.5 py-0.5">
              <Globe className="w-3 h-3 text-neutral-400" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-1 rounded cursor-pointer ${language === 'en' ? 'text-[#ff4300] font-bold' : 'text-neutral-500'}`}
              >
                EN
              </button>
              <span className="text-neutral-300">/</span>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-1 rounded cursor-pointer ${language === 'bn' ? 'text-[#ff4300] font-bold' : 'text-neutral-500'}`}
              >
                বাং
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-5">
        {/* Left: Mobile Menu + Brand SVG + Categories Mega Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-1.5 rounded border border-neutral-200 text-[#292933] hover:bg-neutral-100 cursor-pointer"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              setSearchQuery('');
            }}
            className="flex items-center gap-2 cursor-pointer text-left"
          >
            {/* TheSteps Brand Mark SVG */}
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <rect width="36" height="36" rx="7" fill="#ff4300" />
              <rect x="8" y="21" width="6" height="6" rx="1.2" fill="white" />
              <rect x="15" y="15" width="6" height="12" rx="1.2" fill="white" />
              <rect x="22" y="9" width="6" height="18" rx="1.2" fill="white" />
            </svg>
            <div className="leading-none">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#292933]">
                The<span className="text-[#ff4300]">Steps</span>
              </span>
              <span className="block text-[9px] font-medium text-neutral-500 tracking-wide">
                thesteps.com.bd
              </span>
            </div>
          </button>

          {/* Staggered Hamburger Categories Dropdown */}
          <div className="relative hidden lg:block ml-2">
            <button
              type="button"
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-[5px] border border-neutral-200 hover:border-[#ff4300] bg-white text-xs font-semibold text-[#292933] cursor-pointer transition-colors"
            >
              <span className="flex flex-col gap-[3px] w-4">
                <span className="h-[2px] w-4 bg-[#ff4300] rounded"></span>
                <span className="h-[2px] w-2.5 bg-[#292933] rounded"></span>
                <span className="h-[2px] w-3.5 bg-[#ff4300] rounded"></span>
              </span>
              <span>Categories</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {showCategoryMenu && (
              <div
                onMouseLeave={() => setShowCategoryMenu(false)}
                className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-neutral-200 rounded-lg shadow-xl py-2 z-50"
              >
                {GARMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setShowCategoryMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[#ff4300]/10 text-[#ff4300] font-semibold'
                        : 'text-[#292933] hover:bg-neutral-50 hover:text-[#ff4300]'
                    }`}
                  >
                    <span>{language === 'bn' ? cat.nameBn : cat.name}</span>
                    <span className="text-neutral-400">›</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Squared Search Bar + "Popular Right Now" Trending Dropdown */}
        <div ref={searchBoxRef} className="flex-1 max-w-2xl relative hidden sm:block">
          <div className="flex items-stretch border-2 border-[#ff4300] rounded-[5px] overflow-hidden bg-white">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowPopularSearch(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="flex-1 px-3.5 py-2 text-xs text-[#292933] placeholder:text-neutral-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 text-neutral-400 hover:text-[#292933] text-xs cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPopularSearch(false)}
              className="px-4 py-2 bg-[#ff4300] hover:bg-[#d93800] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>

          {showPopularSearch && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl p-4 z-50">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#ff4300]" />
                  <span>Popular Right Now</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPopularSearch(false)}
                  className="text-[11px] text-neutral-400 hover:text-[#292933] cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCH_KEYWORDS.map((kw) => (
                  <button
                    key={kw.label}
                    type="button"
                    onClick={() => {
                      setSearchQuery(kw.label);
                      setShowPopularSearch(false);
                    }}
                    className={`px-3 py-1 rounded text-xs border cursor-pointer transition-colors ${
                      kw.hot
                        ? 'border-[#ff4300]/40 bg-[#ff4300]/5 text-[#ff4300] font-semibold'
                        : 'border-neutral-200 bg-neutral-50 text-[#292933] hover:border-[#ff4300]'
                    }`}
                  >
                    {kw.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Controls: Seller/Admin, Notifications, My Account, Cart */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isManager && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-[#292933] hover:bg-[#1b1b28] text-white text-xs font-semibold rounded-[5px] cursor-pointer transition-colors whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 text-[#ff4300]" />
              <span>{currentUser?.role === 'seller' ? t('sellerPanel') : t('dashboard')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 text-[#292933] hover:text-[#ff4300] rounded-full hover:bg-neutral-100 cursor-pointer transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-[#ff4300] text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono-num">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={currentUser ? onOpenPortal : onOpenAuth}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[5px] hover:bg-neutral-100 text-[#292933] cursor-pointer transition-colors"
            title="My TheSteps Account"
          >
            <div className="w-7 h-7 rounded-full bg-[#E6F4FB] border border-[#008ED2]/30 flex items-center justify-center text-xs font-bold text-[#008ED2] overflow-hidden shrink-0">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
              ) : currentUser?.displayName ? (
                currentUser.displayName.charAt(0)
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="text-left hidden xl:block leading-tight">
              <span className="block text-[10px] text-neutral-500">Account</span>
              <span className="block text-xs font-semibold truncate max-w-[90px]">
                {currentUser ? currentUser.displayName.split(' ')[0] : t('login')}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 py-2 bg-[#ff4300] hover:bg-[#d93800] text-white rounded-[5px] cursor-pointer transition-colors shadow-xs"
            title="Shopping Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 bg-[#292933] text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono-num">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold font-mono-num hidden sm:inline">৳{grandTotal.toLocaleString()}</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="sm:hidden px-3 pb-2.5">
        <div className="flex items-stretch border-2 border-[#ff4300] rounded-[5px] overflow-hidden bg-white">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in TheSteps..."
            className="flex-1 px-3 py-1.5 text-xs text-[#292933] focus:outline-none"
          />
          <button
            type="button"
            className="px-3 bg-[#ff4300] text-white flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Bar (Single-Line Nav Links) */}
      <div className="bg-[#292933] text-white text-xs overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-9 flex items-center gap-6 whitespace-nowrap">
          <button
            type="button"
            onClick={onScrollToFlashSale}
            className="inline-flex items-center gap-1.5 font-semibold text-[#ff4300] hover:text-white cursor-pointer transition-colors"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Flash Deals</span>
          </button>
          <button
            type="button"
            onClick={onOpenVoucherCenter}
            className="inline-flex items-center gap-1.5 hover:text-[#ff4300] cursor-pointer transition-colors"
          >
            <Ticket className="w-3.5 h-3.5 text-[#EC1561]" />
            <span>Voucher Center</span>
          </button>
          <button
            type="button"
            onClick={onOpenTrackOrder}
            className="inline-flex items-center gap-1.5 hover:text-[#ff4300] cursor-pointer transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-[#008ED2]" />
            <span>Track Order</span>
          </button>
          <button
            type="button"
            onClick={handleSellWithUs}
            className="inline-flex items-center gap-1.5 hover:text-[#ff4300] cursor-pointer transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-neutral-300" />
            <span>Seller Hub</span>
          </button>
          <button
            type="button"
            onClick={onOpenEpsOptions}
            className="inline-flex items-center gap-1.5 hover:text-[#ff4300] cursor-pointer transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>EPS Payment Options</span>
          </button>
        </div>
      </div>

      {/* Mobile Categories Drawer */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-neutral-200 bg-white max-h-72 overflow-y-auto px-4 py-3 grid grid-cols-2 gap-2">
          {GARMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onSelectCategory(cat.id);
                setShowMobileMenu(false);
              }}
              className={`text-left px-3 py-2 rounded text-xs cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#ff4300] text-white font-semibold'
                  : 'bg-neutral-50 text-[#292933] hover:bg-neutral-100'
              }`}
            >
              {language === 'bn' ? cat.nameBn : cat.name}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
