import React, { useState, useMemo } from 'react';
import { 
  LanguageProvider, 
  useLanguage 
} from './context/LanguageContext';
import { 
  NotificationProvider, 
  useNotification 
} from './context/NotificationContext';
import { 
  AuthProvider, 
  useAuth 
} from './context/AuthContext';
import { 
  CartProvider, 
  useCart 
} from './context/CartContext';
import { 
  StoreProvider, 
  useStore 
} from './context/StoreContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HeroBanner } from './components/storefront/HeroBanner';
import { ProductCard } from './components/storefront/ProductCard';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrderSuccessModal } from './components/checkout/OrderSuccessModal';
import { InvoiceModal } from './components/common/InvoiceModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { SizeGuideModal } from './components/common/SizeGuideModal';
import { DevDocsModal } from './components/common/DevDocsModal';
import { GdprModal } from './components/common/GdprModal';
import { AuthModal } from './components/auth/AuthModal';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { Product, ProductVariant, Order } from './types';
import { GARMENT_CATEGORIES } from './config/constants';
import { Filter, ArrowUpDown, Sparkles, CheckCircle2, SlidersHorizontal, Plus } from 'lucide-react';

function StorefrontApp() {
  const { products, orders } = useStore();
  const { language, t } = useLanguage();
  const { isCartOpen, setIsCartOpen, addToCart } = useCart();
  const { currentUser, isManager } = useAuth();

  // Navigation and Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [filterInStockOnly, setFilterInStockOnly] = useState<boolean>(false);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'analytics' | 'products' | 'inventory' | 'orders' | 'suppliers' | 'finance' | 'audit'>('analytics');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isDevDocsOpen, setIsDevDocsOpen] = useState(false);
  const [isGdprOpen, setIsGdprOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [orderForInvoice, setOrderForInvoice] = useState<Order | null>(null);

  // Filtered and sorted products
  const displayProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        prod.name.toLowerCase().includes(q) ||
        prod.fabric.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.description.toLowerCase().includes(q);

      // Stock filter
      const hasStock = prod.variants.some((v) => (v.stock - (v.reservedStock || 0)) > 0);
      const matchesStock = !filterInStockOnly || hasStock;

      return matchesCategory && matchesSearch && matchesStock;
    }).sort((a, b) => {
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

  const currentCategoryObj = GARMENT_CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900">
      {/* Site Header */}
      <Header
        onOpenSearch={() => {}}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenDevDocs={() => setIsDevDocsOpen(true)}
        onOpenGdpr={() => setIsGdprOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Storefront Body */}
      <main className="flex-1">
        {/* Promotional Hero Banner when category is 'all' and no active search */}
        {selectedCategory === 'all' && !searchQuery && (
          <HeroBanner
            onExplore={(cat) => {
              if (cat) setSelectedCategory(cat);
            }}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
          />
        )}

        {/* Garments Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Section Title & Filter Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 font-serif-heading tracking-tight">
                  {language === 'bn' ? currentCategoryObj?.nameBn || 'সকল পোশাক' : currentCategoryObj?.name || 'All Garments'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-neutral-200 text-neutral-800">
                  {displayProducts.length} styles
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Engineered in Bangladesh · Ring-spun heavyweight cotton, oxford weaves, & selvedge denim
              </p>
            </div>

            {/* Filter and Sort Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <button
                onClick={() => setFilterInStockOnly(!filterInStockOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  filterInStockOnly
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <span>In Stock Only</span>
                {filterInStockOnly && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 mr-1.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured Collection</option>
                  <option value="newest">New Arrivals First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {isManager && (
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setDashboardTab('products');
                    setIsDashboardOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Create a new garment product"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Garment</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Search / Category Pill Notice */}
          {(selectedCategory !== 'all' || searchQuery) && (
            <div className="pt-4 flex items-center gap-2 text-xs">
              <span className="text-neutral-500">Filtered by:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 text-white font-medium text-[11px]">
                  <span>Category: {currentCategoryObj?.name}</span>
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-amber-400 cursor-pointer ml-1">✕</button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 text-white font-medium text-[11px]">
                  <span>Search: "{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-amber-400 cursor-pointer ml-1">✕</button>
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          <div className="pt-8">
            {displayProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <Filter className="w-6 h-6 stroke-[1.2]" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">No matching garments found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Try adjusting your search criteria or resetting filters to browse all available Bangladesh textile styles.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setFilterInStockOnly(false);
                  }}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 sm:gap-8">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={handleSelectProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Editorial Value Strip: The Fabric Standard */}
        <section className="bg-white border-y border-neutral-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">01 · COMBED RING-SPUN</span>
                <h3 className="text-lg font-black text-neutral-950 font-serif-heading">240 GSM Structural Knit</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Every cotton jersey thread is combed to remove impurities and short fibers. The result is a substantial, non-transparent heavyweight drape that withstands humid Dhaka climates.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">02 · SHUTTLE-LOOM WEAVING</span>
                <h3 className="text-lg font-black text-neutral-950 font-serif-heading">14.5oz Narayanganj Selvedge</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Crafted on vintage projectile and shuttle looms using unbleached raw indigo warp. Zero chemical acid wash preserves fiber tensile strength for decades of personalized fades.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">03 · EID & SARTORIAL HERITAGE</span>
                <h3 className="text-lg font-black text-neutral-950 font-serif-heading">Computerized Jacquard Motif</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Subtle self-embossed geometric weave on viscose-cotton jacquard. Finished with antique brass snap buttons and tailored mandarin collar for prestigious gatherings.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Site Footer */}
      <Footer
        onOpenDevDocs={() => setIsDevDocsOpen(true)}
        onOpenGdpr={() => setIsGdprOpen(true)}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
      />

      {/* --- ALL MODALS & DRAWERS --- */}

      {/* Product Detail Modal */}
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
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Multi-Step Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => {
          setConfirmedOrder(order);
        }}
      />

      {/* Order Success Confirmation Dialog */}
      <OrderSuccessModal
        order={confirmedOrder}
        isOpen={confirmedOrder !== null}
        onClose={() => setConfirmedOrder(null)}
        onPrintInvoice={(order) => {
          setOrderForInvoice(order);
        }}
      />

      {/* Printable Tax Invoice Modal */}
      <InvoiceModal
        order={orderForInvoice}
        isOpen={orderForInvoice !== null}
        onClose={() => setOrderForInvoice(null)}
      />

      {/* Notifications Slide-Over Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Size Guide Table Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />

      {/* Developer Documentation & Architecture Modal */}
      <DevDocsModal
        isOpen={isDevDocsOpen}
        onClose={() => setIsDevDocsOpen(false)}
      />

      {/* GDPR & SOC2 Privacy Center Modal */}
      <GdprModal
        isOpen={isGdprOpen}
        onClose={() => setIsGdprOpen(false)}
      />

      {/* Auth & RBAC Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
      />

      {/* Business Management Dashboard */}
      <AdminDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onPrintInvoice={(order) => {
          setOrderForInvoice(order);
        }}
        initialTab={dashboardTab}
        editingProduct={editingProduct}
        onClearEditingProduct={() => setEditingProduct(null)}
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
