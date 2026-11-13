import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HeroBanner } from './components/storefront/HeroBanner';
import { ProductCard } from './components/storefront/ProductCard';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { VoucherCenterModal } from './components/storefront/VoucherCenterModal';
import { TrackOrderModal } from './components/storefront/TrackOrderModal';
import { BidModal } from './components/storefront/BidModal';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrderSuccessModal } from './components/checkout/OrderSuccessModal';
import { EpsPaymentOptionsModal } from './components/checkout/EpsPaymentOptionsModal';
import { InvoiceModal } from './components/common/InvoiceModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { SizeGuideModal } from './components/common/SizeGuideModal';
import { DevDocsModal } from './components/common/DevDocsModal';
import { GdprModal } from './components/common/GdprModal';
import { AuthModal } from './components/auth/AuthModal';
import { CustomerPortalModal } from './components/auth/CustomerPortalModal';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { Product, ProductVariant, Order } from './types';
import { GARMENT_CATEGORIES } from './config/constants';
import {
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Plus,
  Flame,
  Clock,
  ChevronRight,
  Zap
} from 'lucide-react';

function StorefrontApp() {
  const { products } = useStore();
  const { language } = useLanguage();
  const { isCartOpen, setIsCartOpen, addToCart } = useCart();
  const { isManager } = useAuth();

  // Navigation and Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [filterInStockOnly, setFilterInStockOnly] = useState<boolean>(false);

  // Flash Sale countdown timer (tabular-nums)
  const [secondsRemaining, setSecondsRemaining] = useState(5 * 3600 + 42 * 60 + 18);
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 5 * 3600 + 42 * 60 + 18));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const flashHours = String(Math.floor(secondsRemaining / 3600)).padStart(2, '0');
  const flashMins = String(Math.floor((secondsRemaining % 3600) / 60)).padStart(2, '0');
  const flashSecs = String(secondsRemaining % 60).padStart(2, '0');

  const flashSaleRef = useRef<HTMLElement>(null);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [bidProduct, setBidProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<
    'analytics' | 'products' | 'inventory' | 'orders' | 'bids' | 'suppliers' | 'finance' | 'audit'
  >('analytics');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isDevDocsOpen, setIsDevDocsOpen] = useState(false);
  const [isGdprOpen, setIsGdprOpen] = useState(false);
  const [isVoucherCenterOpen, setIsVoucherCenterOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [orderForInvoice, setOrderForInvoice] = useState<Order | null>(null);
  const [isEpsOptionsOpen, setIsEpsOptionsOpen] = useState(false);

  const flashDeals = useMemo(() => {
    return products.filter((p) => p.status === 'active' && p.isFlashDeal);
  }, [products]);

  // Filtered and sorted products
  const displayProducts = useMemo(() => {
    return products
      .filter((prod) => {
        if (prod.status !== 'active') return false;
        const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          prod.name.toLowerCase().includes(q) ||
          prod.brand.toLowerCase().includes(q) ||
          (prod.shopName || '').toLowerCase().includes(q) ||
          prod.fabric.toLowerCase().includes(q) ||
          prod.category.toLowerCase().includes(q) ||
          prod.sku.toLowerCase().includes(q) ||
          prod.description.toLowerCase().includes(q);

        const hasStock = prod.variants.some((v) => v.stock - (v.reservedStock || 0) > 0);
        const matchesStock = !filterInStockOnly || hasStock;

        return matchesCategory && matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
        if (sortBy === 'price-low') return a.discountedPrice - b.discountedPrice;
        if (sortBy === 'price-high') return b.discountedPrice - a.discountedPrice;
        if (sortBy === 'rating') return b.rating - a.rating;
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, filterInStockOnly, sortBy]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleInstantBuy = (product: Product, variant: ProductVariant, quantity: number) => {
    addToCart(product, variant, quantity);
    setIsCheckoutOpen(true);
  };

  const handleEditProductFromStorefront = (product: Product) => {
    setSelectedProduct(null);
    setIsDetailModalOpen(false);
    setEditingProduct(product);
    setDashboardTab('products');
    setIsDashboardOpen(true);
  };

  const currentCategoryObj = GARMENT_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-[#ebedf0] flex flex-col text-[#292933]">
      {/* TheSteps Header */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPortal={() => setIsPortalOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenVoucherCenter={() => setIsVoucherCenterOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenEpsOptions={() => setIsEpsOptionsOpen(true)}
        onScrollToFlashSale={() => flashSaleRef.current?.scrollIntoView({ behavior: 'smooth' })}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Storefront Body */}
      <main className="flex-1 space-y-6 pb-8">
        {selectedCategory === 'all' && !searchQuery && (
          <>
            {/* Hero Department Split + 4-Pillar Strip */}
            <HeroBanner
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              onOpenVoucherCenter={() => setIsVoucherCenterOpen(true)}
              onOpenEpsOptions={() => setIsEpsOptionsOpen(true)}
            />

            {/* Flash Sale Section */}
            {flashDeals.length > 0 && (
              <section ref={flashSaleRef} className="max-w-7xl mx-auto px-3 sm:px-6">
                <div className="bg-white rounded-[6px] border border-neutral-200/80 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                    <div className="flex flex-wrap items-center gap-4">
                      <h2 className="text-lg sm:text-xl font-bold text-[#ff4300] flex items-center gap-1.5">
                        <Zap className="w-5 h-5 fill-[#ff4300]" />
                        <span>Flash Sale</span>
                      </h2>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-neutral-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Ending in</span>
                        </span>
                        <div className="flex items-center gap-1 font-mono-num font-bold">
                          <span className="px-2 py-1 rounded bg-[#ff4300] text-white">{flashHours}</span>
                          <span className="text-[#ff4300]">:</span>
                          <span className="px-2 py-1 rounded bg-[#ff4300] text-white">{flashMins}</span>
                          <span className="text-[#ff4300]">:</span>
                          <span className="px-2 py-1 rounded bg-[#ff4300] text-white">{flashSecs}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsVoucherCenterOpen(true)}
                      className="text-xs font-semibold text-[#008ED2] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Shop All Flash Deals &amp; Vouchers</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {flashDeals.map((deal) => {
                      const pct = Math.round(((deal.regularPrice - deal.discountedPrice) / deal.regularPrice) * 100);
                      const sold = deal.flashSoldCount || 15;
                      const left = deal.flashStockLeft ?? deal.availableQuantity;
                      const progress = Math.min(92, Math.round((sold / (sold + left)) * 100));
                      return (
                        <div
                          key={deal.id}
                          onClick={() => handleSelectProduct(deal)}
                          className="sd-card border border-neutral-200 overflow-hidden cursor-pointer flex flex-col"
                        >
                          <div className="relative aspect-square bg-neutral-100">
                            <img src={deal.images[0]} alt={deal.name} className="w-full h-full object-cover" />
                            {pct > 0 && (
                              <span className="absolute top-2 left-2 bg-[#ff4300] text-white text-[11px] font-bold font-mono-num px-2 py-0.5 rounded-[3px]">
                                -{pct}%
                              </span>
                            )}
                          </div>
                          <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                            <h3 className="text-xs font-medium text-[#292933] line-clamp-2">{deal.name}</h3>
                            <div className="space-y-1.5">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm sm:text-base font-bold text-[#ff4300] font-mono-num">
                                  ৳{deal.discountedPrice.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-neutral-400 line-through font-mono-num">
                                  ৳{deal.regularPrice.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <div className="w-full h-2 rounded-full bg-[#ff4300]/15 overflow-hidden">
                                  <div className="h-full bg-[#ff4300] rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-[10px] font-semibold text-[#ff4300] mt-1 flex items-center justify-between font-mono-num">
                                  <span className="inline-flex items-center gap-0.5">
                                    <Flame className="w-3 h-3" /> {sold} sold
                                  </span>
                                  <span>{left} left</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Quick Category Strip */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {GARMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-[5px] text-xs font-semibold whitespace-nowrap cursor-pointer border transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[#ff4300] text-white border-[#ff4300]'
                        : 'bg-white text-[#292933] border-neutral-200 hover:border-[#ff4300] hover:text-[#ff4300]'
                    }`}
                  >
                    {language === 'bn' ? cat.nameBn : cat.name}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Main TheSteps Catalog Section ("Deals You Can't Miss") */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-neutral-300/70">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#292933]">
                  {selectedCategory === 'all' && !searchQuery
                    ? "Deals You Can't Miss"
                    : language === 'bn'
                    ? currentCategoryObj?.nameBn || 'সকল পণ্য'
                    : currentCategoryObj?.name || 'Search Results'}
                </h2>
                <span className="text-xs font-mono-num text-neutral-500">
                  ({displayProducts.length} items)
                </span>
              </div>
            </div>

            {/* Filter & Sort Toolbar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterInStockOnly(!filterInStockOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border font-semibold cursor-pointer transition-colors ${
                  filterInStockOnly
                    ? 'bg-[#292933] text-white border-[#292933]'
                    : 'bg-white text-[#292933] border-neutral-300 hover:border-[#ff4300]'
                }`}
              >
                <span>In Stock Only</span>
                {filterInStockOnly && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <div className="flex items-center bg-white border border-neutral-300 rounded-[5px] px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 mr-1.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-[#292933] focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured Deals</option>
                  <option value="newest">New Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {isManager && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setDashboardTab('products');
                    setIsDashboardOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#ff4300] hover:bg-[#d93800] text-white font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              )}
            </div>
          </div>

          {(selectedCategory !== 'all' || searchQuery) && (
            <div className="pt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-neutral-500">Active filter:</span>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#292933] text-white font-medium cursor-pointer"
                >
                  <span>{currentCategoryObj?.name}</span>
                  <span>✕</span>
                </button>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#292933] text-white font-medium cursor-pointer"
                >
                  <span>&quot;{searchQuery}&quot;</span>
                  <span>✕</span>
                </button>
              )}
            </div>
          )}

          {/* Product Grid */}
          <div className="pt-5">
            {displayProducts.length === 0 ? (
              <div className="bg-white rounded-[6px] py-16 text-center space-y-3 border border-neutral-200">
                <Filter className="w-8 h-8 text-neutral-400 mx-auto" />
                <h3 className="text-base font-bold text-[#292933]">No matching TheSteps items found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Try clearing filters or searching another keyword like smartwatch, earbuds, serum, or panjabi.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setFilterInStockOnly(false);
                  }}
                  className="px-4 py-2 bg-[#ff4300] text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={handleSelectProduct}
                    onOpenBid={(p) => setBidProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer & Mobile Nav */}
      <Footer
        onOpenDevDocs={() => setIsDevDocsOpen(true)}
        onOpenGdpr={() => setIsGdprOpen(true)}
        onOpenEpsOptions={() => setIsEpsOptionsOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenVoucherCenter={() => setIsVoucherCenterOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPortal={() => setIsPortalOpen(true)}
        onScrollTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* --- ALL MODALS --- */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProduct(null);
        }}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        onInstantBuy={handleInstantBuy}
        onEditProduct={handleEditProductFromStorefront}
        onOpenBid={(p) => setBidProduct(p)}
      />

      <BidModal
        product={bidProduct}
        isOpen={bidProduct !== null}
        onClose={() => setBidProduct(null)}
      />

      <VoucherCenterModal
        isOpen={isVoucherCenterOpen}
        onClose={() => setIsVoucherCenterOpen(false)}
      />

      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
        onPrintInvoice={(order) => setOrderForInvoice(order)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => setConfirmedOrder(order)}
      />

      <OrderSuccessModal
        order={confirmedOrder}
        isOpen={confirmedOrder !== null}
        onClose={() => setConfirmedOrder(null)}
        onPrintInvoice={(order) => setOrderForInvoice(order)}
      />

      <InvoiceModal
        order={orderForInvoice}
        isOpen={orderForInvoice !== null}
        onClose={() => setOrderForInvoice(null)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />

      <DevDocsModal
        isOpen={isDevDocsOpen}
        onClose={() => setIsDevDocsOpen(false)}
      />

      <GdprModal
        isOpen={isGdprOpen}
        onClose={() => setIsGdprOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
      />

      <CustomerPortalModal
        isOpen={isPortalOpen}
        onClose={() => setIsPortalOpen(false)}
        onPrintInvoice={(order) => setOrderForInvoice(order)}
        onSelectProduct={handleSelectProduct}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <AdminDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onPrintInvoice={(order) => setOrderForInvoice(order)}
        initialTab={dashboardTab}
        editingProduct={editingProduct}
        onClearEditingProduct={() => setEditingProduct(null)}
      />

      <EpsPaymentOptionsModal
        isOpen={isEpsOptionsOpen}
        onClose={() => setIsEpsOptionsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <StoreProvider>
              <StorefrontApp />
            </StoreProvider>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}
