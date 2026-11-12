import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  SlidersHorizontal, 
  Bell, 
  User, 
  ShieldCheck, 
  Globe, 
  Sparkles, 
  FileText, 
  Lock,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { useStore } from '../../context/StoreContext';
import { GARMENT_CATEGORIES } from '../../config/constants';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
  onOpenDevDocs: () => void;
  onOpenGdpr: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenCart,
  onOpenNotifications,
  onOpenAuth,
  onOpenDashboard,
  onOpenDevDocs,
  onOpenGdpr,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, isManager } = useAuth();
  const { itemCount, grandTotal } = useCart();
  const { unreadCount } = useNotification();
  const { syncStatus } = useStore();
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Top Banner with Delivery Note, Language & Sync Status */}
      <div className="bg-neutral-950 text-neutral-300 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-white">{t('freeDeliveryNote')}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] shrink-0">
            {/* Sync Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'online' ? 'bg-emerald-400' : syncStatus === 'syncing' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
              <span className="capitalize">{syncStatus === 'online' ? 'Cloud Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline Ready'}</span>
            </div>

            {/* Architecture & Docs link */}
            <button 
              onClick={onOpenDevDocs}
              className="hidden md:flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>Architecture & API</span>
            </button>

            {/* GDPR privacy badge */}
            <button 
              onClick={onOpenGdpr}
              className="hidden lg:flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>GDPR / SOC2</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-neutral-900 rounded px-1.5 py-0.5 border border-neutral-800">
              <Globe className="w-3 h-3 text-neutral-400" />
              <button 
                onClick={() => setLanguage('en')}
                className={`px-1 rounded cursor-pointer transition-colors ${language === 'en' ? 'text-white font-bold bg-neutral-800' : 'text-neutral-400 hover:text-white'}`}
              >
                EN
              </button>
              <span className="text-neutral-600">|</span>
              <button 
                onClick={() => setLanguage('bn')}
                className={`px-1 rounded cursor-pointer transition-colors ${language === 'bn' ? 'text-white font-bold bg-neutral-800' : 'text-neutral-400 hover:text-white'}`}
              >
                বাং
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => onSelectCategory('all')} 
            className="cursor-pointer group flex flex-col"
          >
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-widest text-neutral-950 font-serif-heading">AURA</span>
              <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">ATELIER</span>
            </div>
            <span className="text-[9px] tracking-wider text-neutral-400 uppercase -mt-1 hidden sm:block">
              Dhaka · Garments Commerce
            </span>
          </div>

          {/* Category Dropdown (Desktop) */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/70 rounded-lg transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('allCategories')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {showCategoryMenu && (
              <div 
                className="absolute top-full left-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setShowCategoryMenu(false)}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 py-1.5">
                  Garment Categories
                </div>
                {GARMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setShowCategoryMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                      selectedCategory === cat.id ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{language === 'bn' ? cat.nameBn : cat.name}</span>
                    {selectedCategory === cat.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="flex-1 max-w-md mx-2 relative">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-100/80 hover:bg-neutral-100 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-full border border-transparent focus:border-neutral-300 focus:outline-none transition-all placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Dashboard Entry Button */}
          {isManager && (
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer group"
              title="Open Business Management Dashboard"
            >
              <Layers className="w-3.5 h-3.5 text-neutral-300 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">{t('dashboard')}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-800 rounded text-emerald-400 border border-neutral-700">
                {currentUser?.role === 'superadmin' ? 'SUPER' : currentUser?.role?.slice(0, 5).toUpperCase()}
              </span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Account Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            title="User Profile & Roles"
          >
            <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-800 uppercase">
              {currentUser?.displayName ? currentUser.displayName.charAt(0) : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold leading-none truncate max-w-[90px]">
                {currentUser?.displayName?.split(' ')[0] || t('login')}
              </p>
              <p className="text-[10px] text-neutral-400 leading-none mt-1 capitalize">
                {currentUser?.role?.replace('_', ' ') || 'Guest'}
              </p>
            </div>
          </button>

          {/* Cart Bag Drawer Trigger */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg transition-all shadow-sm cursor-pointer"
            title="Shopping Bag"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 text-neutral-950 text-[10px] font-extrabold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold hidden sm:inline">৳{grandTotal.toLocaleString()}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Strip (Responsive Horizontal Scroll) */}
      <div className="border-t border-neutral-100 bg-neutral-50/70 overflow-x-auto no-scrollbar py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {GARMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer font-medium ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 border border-neutral-200/70'
              }`}
            >
              {language === 'bn' ? cat.nameBn : cat.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
