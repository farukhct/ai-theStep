import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Package,
  Layers,
  ShoppingBag,
  Users,
  DollarSign,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Plus,
  Download,
  Search,
  SlidersHorizontal,
  Printer,
  AlertTriangle,
  CheckCircle,
  Database,
  X,
  Edit,
  Copy,
  Trash2,
  Handshake,
  Ticket,
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ChevronLeft,
  LayoutGrid,
  Store,
  FileText,
  Receipt
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ProductEditorPage } from './ProductEditorPage';
import { DeleteProductModal } from './DeleteProductModal';
import {
  MonthlySalesChart,
  MonthlyTargetGauge,
  StatisticsAreaChart,
  BangladeshDemographicCard
} from './TailAdminCharts';
import { Product, Order, OrderStatus } from '../../types';
import { getPaymentChannelName } from '../../config/epsPaymentOptions';

type AdminTab =
  | 'analytics'
  | 'products'
  | 'add-product'
  | 'inventory'
  | 'orders'
  | 'bids'
  | 'suppliers'
  | 'finance'
  | 'audit';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice: (order: Order) => void;
  initialTab?: AdminTab;
  editingProduct?: Product | null;
  onClearEditingProduct?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onPrintInvoice,
  initialTab,
  editingProduct,
  onClearEditingProduct
}) => {
  const {
    products,
    orders,
    transactions,
    suppliers,
    purchaseOrders,
    expenses,
    auditLogs,
    coupons,
    bids,
    financialSummary,
    dateRange,
    setDateRange,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustVariantStock,
    updateOrderStatus,
    cancelOrder,
    respondToBid,
    addCoupon,
    toggleCouponStatus,
    addSupplier,
    receivePurchaseOrder,
    addExpense,
    exportSalesCsv,
    exportInventoryCsv,
    exportFinancialCsv,
    runManualBackup,
    lastBackupDate
  } = useStore();

  const { currentUser, isSeller } = useAuth();
  const { addToast, notifications, unreadCount, markAllAsRead, markAsRead } = useNotification();

  // Shell & TailAdmin Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [openMenuGroup, setOpenMenuGroup] = useState<'dashboard' | 'ecommerce' | 'operations'>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [recentOrderFilter, setRecentOrderFilter] = useState<string>('all');
  const [isRecentFilterOpen, setIsRecentFilterOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Vouchers & Bids
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherTitle, setNewVoucherTitle] = useState('');
  const [newVoucherValue, setNewVoucherValue] = useState(200);
  const [newVoucherMinSpend, setNewVoucherMinSpend] = useState(1500);
  const [counterOfferMap, setCounterOfferMap] = useState<Record<string, number>>({});

  // Search & Filter states for sub-views
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false);

  // Inline Product Editor (Create / Edit) & Delete Modal State
  const [productEditorState, setProductEditorState] = useState<{
    mode: 'create' | 'edit';
    product: Product | null;
  }>({
    mode: 'create',
    product: null
  });
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Adjust Stock Modal
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [selectedVariantForAdj, setSelectedVariantForAdj] = useState<{
    productId: string;
    variantId: string;
    sku: string;
    currentStock: number;
  } | null>(null);
  const [stockAdjustmentQty, setStockAdjustmentQty] = useState<number>(0);
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState<string>('Physical warehouse audit adjustment');
  const [stockAdjustmentType, setStockAdjustmentType] = useState<'stock_adjustment' | 'damaged_stock'>('stock_adjustment');

  // New Expense Modal
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);
  const [newExpenseCategory, setNewExpenseCategory] = useState<string>('packaging');

  // New Supplier Modal
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
      if (initialTab === 'add-product' && !editingProduct) {
        setProductEditorState({ mode: 'create', product: null });
        setOpenMenuGroup('ecommerce');
      }
    }
  }, [initialTab, isOpen, editingProduct]);

  useEffect(() => {
    if (editingProduct && isOpen) {
      setActiveTab('add-product');
      setOpenMenuGroup('ecommerce');
      setProductEditorState({
        mode: 'edit',
        product: editingProduct
      });
      if (onClearEditingProduct) {
        onClearEditingProduct();
      }
    }
  }, [editingProduct, isOpen, onClearEditingProduct]);

  // Keyboard shortcut Cmd+K / Ctrl+K for command search
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // CSV Download helper
  const downloadCsvFile = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handlers for Product CRUD (inline workspace, never popup)
  const handleOpenCreateProduct = () => {
    setProductEditorState({
      mode: 'create',
      product: null
    });
    setOpenMenuGroup('ecommerce');
    setActiveTab('add-product');
    setIsMobileSidebarOpen(false);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductEditorState({
      mode: 'edit',
      product: prod
    });
    setOpenMenuGroup('ecommerce');
    setActiveTab('add-product');
    setIsMobileSidebarOpen(false);
  };

  const handleDuplicateProduct = async (prod: Product) => {
    const cloneSku = `${prod.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`;
    const cloneName = `${prod.name} (Copy)`;
    const cloneVariants = prod.variants.map((v) => ({
      ...v,
      id: `var-${Date.now()}-${v.size}-${Math.random().toString(36).substring(2, 5)}`,
      sku: `${cloneSku}-${v.size}`,
      reservedStock: 0
    }));

    await addProduct({
      ...prod,
      name: cloneName,
      slug: cloneName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sku: cloneSku,
      status: 'draft',
      variants: cloneVariants
    });
    addToast('Product Duplicated', `Created draft clone ${cloneSku}`, 'info');
  };

  const handleProductFormSubmit = async (data: any) => {
    if (productEditorState.mode === 'create') {
      await addProduct(data);
    } else if (productEditorState.mode === 'edit' && productEditorState.product) {
      await updateProduct(productEditorState.product.id, data);
    }
  };

  const handleArchiveProduct = async (productId: string) => {
    await updateProduct(productId, { status: 'archived' });
    addToast('Product Archived', 'Product status set to Archived (hidden from storefront).', 'info');
  };

  const handlePermanentDelete = async (productId: string) => {
    await deleteProduct(productId);
  };

  const handleConfirmStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantForAdj) return;
    await adjustVariantStock(
      selectedVariantForAdj.productId,
      selectedVariantForAdj.variantId,
      stockAdjustmentQty,
      stockAdjustmentType,
      stockAdjustmentReason
    );
    setShowAdjustStockModal(false);
    setSelectedVariantForAdj(null);
  };

  const handleConfirmExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || newExpenseAmount <= 0) return;
    await addExpense({
      category: newExpenseCategory as any,
      description: newExpenseDesc,
      amount: newExpenseAmount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer / bKash',
      createdBy: currentUser?.displayName || 'Finance Officer'
    });
    setNewExpenseDesc('');
    setNewExpenseAmount(0);
    setShowAddExpenseModal(false);
  };

  const handleConfirmSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName || !newSupplierPhone) return;
    await addSupplier({
      name: newSupplierName,
      contactPerson: newSupplierContact || 'Manager',
      phoneNumber: newSupplierPhone,
      email: `${newSupplierName.toLowerCase().replace(/[^a-z0-9]/g, '')}@suppliers.bd`,
      companyName: newSupplierName,
      address: newSupplierAddress || 'Gazipur, Dhaka',
      status: 'active'
    });
    setNewSupplierName('');
    setNewSupplierPhone('');
    setShowAddSupplierModal(false);
  };

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  // Filtered Orders & Products
  const filteredOrders = orders.filter((o) => {
    const q = (orderSearch || globalSearch).toLowerCase();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.contactNumber.includes(q);
    const matchStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredProducts = products.filter((p) => {
    const q = (productSearch || globalSearch).toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const recentOverviewOrders = orders
    .filter((o) => recentOrderFilter === 'all' || o.orderStatus === recentOrderFilter)
    .slice(0, 6);

  // Command search quick matches
  const searchQueryTrimmed = globalSearch.trim().toLowerCase();
  const quickProductMatches = searchQueryTrimmed
    ? products.filter((p) => p.name.toLowerCase().includes(searchQueryTrimmed) || p.sku.toLowerCase().includes(searchQueryTrimmed)).slice(0, 3)
    : [];
  const quickOrderMatches = searchQueryTrimmed
    ? orders.filter((o) => o.orderNumber.toLowerCase().includes(searchQueryTrimmed) || o.customerName.toLowerCase().includes(searchQueryTrimmed)).slice(0, 3)
    : [];

  const pendingBidsCount = bids.filter((b) => b.status === 'pending').length;

  const getOrderStatusBadge = (status: OrderStatus) => {
    if (status === 'delivered' || status === 'paid') {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400';
    }
    if (status === 'cancelled' || status === 'returned' || status === 'refunded') {
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400';
    }
    if (status === 'processing' || status === 'shipped' || status === 'confirmed' || status === 'packed') {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const tabTitles: Record<AdminTab, string> = {
    analytics: 'eCommerce Overview',
    products: 'Products Catalog',
    'add-product':
      productEditorState.mode === 'edit' ? 'Edit Product' : 'Create TheSteps Product',
    orders: 'Orders & Invoices',
    inventory: 'Inventory & Stock Ledger',
    bids: 'Customer Bids & Vouchers',
    finance: 'Finance & P&L Statement',
    suppliers: 'Suppliers & Purchase Orders',
    audit: 'Audit Logs & SOC2 Compliance'
  };

  // Sidebar Content shared between Desktop Rail & Mobile Drawer
  const renderSidebarContent = (isMobile: boolean) => {
    const compact = !isMobile && isSidebarCollapsed;

    return (
      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Brand Header */}
          <div className={`flex items-center ${compact ? 'justify-center px-3' : 'justify-between px-5'} h-[70px] border-b border-gray-200 dark:border-gray-800`}>
            <button
              type="button"
              onClick={() => selectTab('analytics')}
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
            >
              <div className="w-9 h-9 rounded-lg bg-[#465FFF] text-white flex items-center justify-center shrink-0 font-bold">
                <LayoutGrid className="w-5 h-5" />
              </div>
              {!compact && (
                <div className="text-left min-w-0">
                  <span className="block text-base font-bold tracking-tight text-gray-900 dark:text-white truncate">
                    TheSteps
                  </span>
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {isSeller ? 'Seller Console' : 'Admin Suite'}
                  </span>
                </div>
              )}
            </button>

            {isMobile && (
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Menu Sections */}
          <div className="px-3 py-5 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
            {/* Group: Menu */}
            <div>
              {!compact && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Menu
                </p>
              )}

              <div className="space-y-1">
                {/* Dashboard Accordion */}
                <button
                  type="button"
                  onClick={() => {
                    if (compact) {
                      selectTab('analytics');
                    } else {
                      setOpenMenuGroup(openMenuGroup === 'dashboard' ? 'ecommerce' : 'dashboard');
                      selectTab('analytics');
                    }
                  }}
                  className={`w-full flex items-center ${compact ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'analytics' || activeTab === 'finance'
                      ? 'bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                  }`}
                  title="Dashboard"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <LayoutGrid className="w-4 h-4 shrink-0" />
                    {!compact && <span className="truncate">Dashboard</span>}
                  </span>
                  {!compact && (
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform ${openMenuGroup === 'dashboard' ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {!compact && openMenuGroup === 'dashboard' && (
                  <div className="pl-9 pr-2 py-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => selectTab('analytics')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'analytics'
                          ? 'bg-[#ECF3FF]/70 text-[#465FFF] font-semibold dark:bg-[#465FFF]/10 dark:text-[#7592FF]'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                      }`}
                    >
                      eCommerce Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTab('finance')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'finance'
                          ? 'bg-[#ECF3FF]/70 text-[#465FFF] font-semibold dark:bg-[#465FFF]/10 dark:text-[#7592FF]'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                      }`}
                    >
                      Finance &amp; P&amp;L
                    </button>
                  </div>
                )}

                {/* E-Commerce Accordion */}
                <button
                  type="button"
                  onClick={() => {
                    if (compact) {
                      selectTab('products');
                    } else {
                      setOpenMenuGroup(openMenuGroup === 'ecommerce' ? 'dashboard' : 'ecommerce');
                    }
                  }}
                  className={`w-full flex items-center ${compact ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'products' || activeTab === 'add-product' || activeTab === 'orders' || activeTab === 'bids'
                      ? 'bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                  }`}
                  title="E-Commerce"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    {!compact && <span className="truncate">E-Commerce</span>}
                  </span>
                  {!compact && (
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform ${openMenuGroup === 'ecommerce' ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {!compact && (openMenuGroup === 'ecommerce' || activeTab === 'products' || activeTab === 'add-product' || activeTab === 'orders' || activeTab === 'bids') && (
                  <div className="pl-9 pr-2 py-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => selectTab('products')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'products'
                          ? 'bg-[#ECF3FF]/70 text-[#465FFF] font-semibold dark:bg-[#465FFF]/10 dark:text-[#7592FF]'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>Products ({products.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCreateProduct}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'add-product'
                          ? 'bg-[#ECF3FF]/70 text-[#465FFF] font-semibold dark:bg-[#465FFF]/10 dark:text-[#7592FF]'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                      }`}
                    >
                      + Add Product
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTab('orders')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'orders'
                          ? 'bg-[#ECF3FF]/70 text-[#465FFF] font-semibold dark:bg-[#465FFF]/10 dark:text-[#7592FF]'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>Orders &amp; Invoices ({orders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTab('bids')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'bids'
                          ? 'bg-[#ECF3FF]/70 text-[#465FFF] font-semibold dark:bg-[#465FFF]/10 dark:text-[#7592FF]'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>Bids &amp; Vouchers</span>
                      {pendingBidsCount > 0 && (
                        <span className="font-mono-num text-[11px] font-semibold text-[#ff4300]">
                          {pendingBidsCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Inventory */}
                <button
                  type="button"
                  onClick={() => selectTab('inventory')}
                  className={`w-full flex items-center ${compact ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'inventory'
                      ? 'bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                  }`}
                  title="Inventory Ledger"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Layers className="w-4 h-4 shrink-0" />
                    {!compact && <span className="truncate">Inventory Ledger</span>}
                  </span>
                </button>

                {/* Suppliers */}
                <button
                  type="button"
                  onClick={() => selectTab('suppliers')}
                  className={`w-full flex items-center ${compact ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'suppliers'
                      ? 'bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                  }`}
                  title="Suppliers & POs"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Users className="w-4 h-4 shrink-0" />
                    {!compact && <span className="truncate">Suppliers &amp; POs</span>}
                  </span>
                </button>
              </div>
            </div>

            {/* Group: Governance */}
            <div>
              {!compact && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Governance
                </p>
              )}

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => selectTab('audit')}
                  className={`w-full flex items-center ${compact ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                  }`}
                  title="Audit & SOC2"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    {!compact && <span className="truncate">Audit &amp; SOC2</span>}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full flex items-center ${compact ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 transition-colors cursor-pointer`}
                  title="Back to Storefront"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Store className="w-4 h-4 shrink-0" />
                    {!compact && <span className="truncate">Back to Storefront</span>}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sidebar Summary Card (hidden when collapsed) */}
        {!compact && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-200 dark:bg-white/[0.03] dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                TheSteps ERP Backup
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {lastBackupDate
                  ? `Last snapshot: ${new Date(lastBackupDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Automated nightly cloud sync active.'}
              </p>
              <button
                type="button"
                onClick={runManualBackup}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Export Snapshot
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex ${isDark ? 'dark' : ''}`}>
      <div className="flex w-full h-full bg-[#F9FAFB] text-gray-900 dark:bg-gray-950 dark:text-gray-100 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 transition-all duration-200 ${
            isSidebarCollapsed ? 'w-[78px]' : 'w-[260px]'
          }`}
        >
          {renderSidebarContent(false)}
        </aside>

        {/* Mobile Off-Canvas Sidebar */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-60 flex lg:hidden">
            <div
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <aside className="relative z-10 w-[270px] max-w-[85vw] h-full bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 shadow-2xl">
              {renderSidebarContent(true)}
            </aside>
          </div>
        )}

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Application Header */}
          <header className="sticky top-0 z-30 h-[70px] bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
            {/* Left: Sidebar Toggle + Command Search */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileSidebarOpen(true);
                  } else {
                    setIsSidebarCollapsed((p) => !p);
                  }
                }}
                className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Command Search Bar */}
              <div className="relative flex-1 max-w-md hidden sm:block">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search products, orders, SKUs..."
                  className="w-full h-10 pl-10 pr-14 rounded-lg border border-gray-200 bg-transparent text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#465FFF] dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-mono-num text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 pointer-events-none">
                  ⌘K
                </span>

                {/* Live Search Results Popover */}
                {searchQueryTrimmed && (
                  <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-gray-200 bg-white p-2 shadow-xl z-40 dark:border-gray-700 dark:bg-gray-900">
                    {quickProductMatches.length === 0 && quickOrderMatches.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-500">
                        No products or orders match &quot;{globalSearch}&quot;.
                      </p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {quickProductMatches.length > 0 && (
                          <div>
                            <p className="px-2 py-1 text-[10px] font-semibold uppercase text-gray-400">
                              Products
                            </p>
                            {quickProductMatches.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setProductSearch(globalSearch);
                                  setGlobalSearch('');
                                  selectTab('products');
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left cursor-pointer"
                              >
                                <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                                  {p.name}
                                </span>
                                <span className="font-mono-num text-gray-500 shrink-0 ml-2">
                                  ৳{p.discountedPrice.toLocaleString()}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {quickOrderMatches.length > 0 && (
                          <div>
                            <p className="px-2 py-1 text-[10px] font-semibold uppercase text-gray-400">
                              Orders
                            </p>
                            {quickOrderMatches.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => {
                                  setOrderSearch(globalSearch);
                                  setGlobalSearch('');
                                  selectTab('orders');
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left cursor-pointer"
                              >
                                <span className="font-mono-num font-semibold text-gray-800 dark:text-gray-200">
                                  {o.orderNumber} · {o.customerName}
                                </span>
                                <span className="font-mono-num text-gray-500 shrink-0 ml-2">
                                  ৳{o.grandTotal.toLocaleString()}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Utility Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Theme Switcher */}
              <button
                type="button"
                onClick={() => setIsDark((d) => !d)}
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                aria-label="Toggle dashboard light or dark mode"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifDropdownOpen((p) => !p);
                    setIsUserDropdownOpen(false);
                  }}
                  className="relative w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff4300] text-white text-[10px] font-mono-num font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl z-40 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                      <h5 className="text-sm font-semibold text-gray-800 dark:text-white">
                        Notification
                      </h5>
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-[#465FFF] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 my-1">
                      {notifications.length === 0 ? (
                        <p className="py-6 text-center text-xs text-gray-500">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className={`w-full text-left py-2.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                              !n.isRead ? 'bg-blue-50/40 dark:bg-blue-500/5' : ''
                            }`}
                          >
                            <p className="text-xs font-semibold text-gray-800 dark:text-white">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Profile Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserDropdownOpen((p) => !p);
                    setIsNotifDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#292933] text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (currentUser?.displayName || 'A').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="hidden md:block text-left">
                    <span className="block text-xs font-semibold text-gray-800 dark:text-white truncate max-w-[120px]">
                      {currentUser?.displayName || 'Admin User'}
                    </span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl z-40 dark:border-gray-800 dark:bg-gray-900">
                    <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {currentUser?.displayName || 'Platform Owner'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {currentUser?.email || 'faruk017@gmail.com'}
                      </p>
                      <p className="text-[11px] font-mono text-[#465FFF] mt-1 capitalize">
                        Role: {currentUser?.role?.replace('_', ' ') || 'superadmin'}
                      </p>
                    </div>
                    <div className="pt-2 space-y-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          selectTab('audit');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        Security &amp; Audit Logs
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          onClose();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 font-medium cursor-pointer"
                      >
                        Exit to Storefront
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Explicit Close Admin Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
                title="Close Admin Dashboard"
                aria-label="Close Admin Dashboard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Main Scrollable Viewport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1440px] space-y-6">
              {/* Contextual Page Header & Breadcrumb (TailAdmin style) */}
              {activeTab !== 'add-product' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      {tabTitles[activeTab]}
                    </h1>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <button
                        type="button"
                        onClick={() => selectTab('analytics')}
                        className="hover:text-gray-800 dark:hover:text-white cursor-pointer"
                      >
                        Home
                      </button>
                      <span>/</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {tabTitles[activeTab]}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Strip */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenCreateProduct}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Storefront</span>
                    </button>
                  </div>
                </div>
              )}

              {/* INLINE PAGE: CREATE / EDIT PRODUCT (NON-POPUP) */}
              {activeTab === 'add-product' && (
                <ProductEditorPage
                  mode={productEditorState.mode}
                  initialProduct={productEditorState.product}
                  onCancel={() => selectTab('products')}
                  onSubmit={handleProductFormSubmit}
                />
              )}

              {/* VIEW 1: TAILADMIN ECOMMERCE OVERVIEW */}
              {activeTab === 'analytics' && (
                <div className="grid grid-cols-12 gap-4 sm:gap-6">
                  {/* Left 7 Cols: 2 KPI Cards + Monthly Sales Chart */}
                  <div className="col-span-12 xl:col-span-7 space-y-4 sm:space-y-6">
                    {/* 2 KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Customers Card */}
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white/90">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="flex items-end justify-between mt-5 gap-2">
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Customers
                            </span>
                            <h4 className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-num text-gray-800 dark:text-white/90">
                              {(3780 + orders.length).toLocaleString()}
                            </h4>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono-num">
                              Net Sales: ৳{financialSummary.netSales.toLocaleString()}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 whitespace-nowrap shrink-0">
                            <ArrowUp className="w-3 h-3" />
                            11.01%
                          </span>
                        </div>
                      </div>

                      {/* Orders Card */}
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white/90">
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="flex items-end justify-between mt-5 gap-2">
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Orders
                            </span>
                            <h4 className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-num text-gray-800 dark:text-white/90">
                              {(5357 + orders.length).toLocaleString()}
                            </h4>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono-num">
                              Active Queue: {orders.length} · Low Stock: {financialSummary.lowStockItemsCount}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 whitespace-nowrap shrink-0">
                            <ArrowUp className="w-3 h-3" />
                            9.05%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Sales Bar Chart */}
                    <MonthlySalesChart
                      onOpenFinance={() => selectTab('finance')}
                      onExportCsv={() =>
                        downloadCsvFile(
                          exportSalesCsv(),
                          `TheSteps_Sales_Orders_${new Date().toISOString().split('T')[0]}.csv`
                        )
                      }
                    />
                  </div>

                  {/* Right 5 Cols: Monthly Target Radial Gauge */}
                  <div className="col-span-12 xl:col-span-5">
                    <MonthlyTargetGauge
                      netSales={financialSummary.netSales}
                      grossSales={financialSummary.grossSales}
                      netProfit={financialSummary.netProfit}
                      onOpenFinance={() => selectTab('finance')}
                      onRunBackup={runManualBackup}
                    />
                  </div>

                  {/* Full Width Row: Statistics Area Chart */}
                  <div className="col-span-12">
                    <StatisticsAreaChart
                      dateRange={dateRange}
                      onChangeDateRange={setDateRange}
                    />
                  </div>

                  {/* Bottom Left 5 Cols: Customers Demographic */}
                  <div className="col-span-12 xl:col-span-5">
                    <BangladeshDemographicCard
                      orders={orders}
                      onViewOrders={() => selectTab('orders')}
                    />
                  </div>

                  {/* Bottom Right 7 Cols: Recent Orders Table */}
                  <div className="col-span-12 xl:col-span-7">
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Recent Orders
                          </h3>

                          <div className="flex items-center gap-2.5 relative">
                            <button
                              type="button"
                              onClick={() => setIsRecentFilterOpen((p) => !p)}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.05] cursor-pointer whitespace-nowrap"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>
                                {recentOrderFilter === 'all'
                                  ? 'Filter'
                                  : recentOrderFilter.replace('_', ' ')}
                              </span>
                            </button>

                            {isRecentFilterOpen && (
                              <div
                                onMouseLeave={() => setIsRecentFilterOpen(false)}
                                className="absolute right-20 top-10 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl z-20 dark:border-gray-700 dark:bg-gray-900"
                              >
                                {(['all', 'delivered', 'processing', 'shipped', 'paid', 'pending_payment', 'cancelled'] as const).map(
                                  (statusKey) => (
                                    <button
                                      key={statusKey}
                                      type="button"
                                      onClick={() => {
                                        setRecentOrderFilter(statusKey);
                                        setIsRecentFilterOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs capitalize cursor-pointer ${
                                        recentOrderFilter === statusKey
                                          ? 'bg-[#ECF3FF] text-[#465FFF] font-semibold dark:bg-[#465FFF]/15'
                                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                      }`}
                                    >
                                      {statusKey.replace('_', ' ')}
                                    </button>
                                  )
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => selectTab('orders')}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.05] cursor-pointer whitespace-nowrap"
                            >
                              See all
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full text-left">
                            <thead>
                              <tr className="border-y border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400">
                                <th className="py-3 pr-3">Products</th>
                                <th className="py-3 px-3">Channel</th>
                                <th className="py-3 px-3 text-right">Price</th>
                                <th className="py-3 pl-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                              {recentOverviewOrders.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-gray-500">
                                    No orders match this filter.
                                  </td>
                                </tr>
                              ) : (
                                recentOverviewOrders.map((ord) => {
                                  const firstItem = ord.items[0];
                                  return (
                                    <tr
                                      key={ord.id}
                                      onClick={() => onPrintInvoice(ord)}
                                      className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    >
                                      <td className="py-3 pr-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                                            {firstItem?.image ? (
                                              <img
                                                src={firstItem.image}
                                                alt={firstItem.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Package className="w-5 h-5" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-semibold text-gray-800 dark:text-white/90 truncate max-w-[200px] sm:max-w-[240px]">
                                              {firstItem?.name || ord.orderNumber}
                                            </p>
                                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                              {ord.items.length} {ord.items.length === 1 ? 'Item' : 'Items'} · {ord.customerName}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                        <span className="block font-medium text-gray-700 dark:text-gray-300">
                                          {getPaymentChannelName(ord.paymentMethod)}
                                        </span>
                                        <span className="text-[11px] font-mono-num text-gray-400">
                                          {ord.orderNumber}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-right font-mono-num font-semibold text-gray-800 dark:text-white/90 whitespace-nowrap">
                                        ৳{ord.grandTotal.toLocaleString()}
                                      </td>
                                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                                        <span
                                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${getOrderStatusBadge(
                                            ord.orderStatus
                                          )}`}
                                        >
                                          {ord.orderStatus.replace('_', ' ')}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Quick CSV Export Footer */}
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          Click any order row to preview invoice
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              downloadCsvFile(
                                exportFinancialCsv(),
                                `TheSteps_Financial_Statement_${new Date().toISOString().split('T')[0]}.csv`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>P&amp;L CSV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              downloadCsvFile(
                                exportSalesCsv(),
                                `TheSteps_Sales_Orders_${new Date().toISOString().split('T')[0]}.csv`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Orders CSV</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: PRODUCTS & VARIANTS */}
              {activeTab === 'products' && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by product name, SKU, category..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full h-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-9 pr-3 text-xs focus:outline-none focus:border-[#465FFF]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() =>
                          downloadCsvFile(
                            exportInventoryCsv(),
                            `TheSteps_Product_Catalog_${new Date().toISOString().split('T')[0]}.csv`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg cursor-pointer text-xs whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Catalog CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenCreateProduct}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold rounded-lg cursor-pointer text-xs whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Product</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                    <table className="min-w-[820px] w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">SKU / Brand</th>
                          <th className="py-3 px-4">Specs</th>
                          <th className="py-3 px-4 text-right">Selling Price</th>
                          <th className="py-3 px-4 text-center">Variants &amp; Stock</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {filteredProducts.map((p) => {
                          const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                          return (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={p.images[0]}
                                    alt={p.name}
                                    className="w-11 h-11 object-cover rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                      {p.name}
                                    </p>
                                    <span className="text-[11px] text-gray-500 capitalize">{p.category}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono-num">
                                <span className="font-semibold text-gray-900 dark:text-gray-200">{p.sku}</span>
                                <span className="block text-[11px] text-gray-500 font-sans">{p.brand}</span>
                              </td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                <span>{p.fabric}</span>
                                {p.gsm && <span className="block text-[10px] font-mono-num text-gray-400">{p.gsm} GSM</span>}
                              </td>
                              <td className="py-3 px-4 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                                ৳{p.discountedPrice.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-semibold font-mono-num text-xs ${
                                    totalStock <= 10
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  }`}
                                >
                                  {totalStock} units ({p.variants.length})
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <select
                                  value={p.status}
                                  onChange={(e) => updateProduct(p.id, { status: e.target.value as any })}
                                  className={`px-2 py-1 rounded-md text-[11px] font-semibold uppercase cursor-pointer border ${
                                    p.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                      : p.status === 'draft'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                                      : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                  }`}
                                >
                                  <option value="active">Active</option>
                                  <option value="draft">Draft</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditProduct(p)}
                                    className="p-1.5 text-gray-600 hover:text-[#465FFF] hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                                    title="Edit Product Details & Variants"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateProduct(p)}
                                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                                    title="Duplicate Product Draft"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setProductToDelete(p)}
                                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                                    title="Delete or Archive Product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 3: INVENTORY LEDGER */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Traceable Stock Ledger &amp; Variants
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          Audit every stock increase, sale deduction, damage adjustment, and cancellation return
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setInventoryLowStockOnly(!inventoryLowStockOnly)}
                        className={`px-3.5 py-2 rounded-lg font-semibold text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                          inventoryLowStockOnly
                            ? 'bg-amber-500 text-gray-950 border-amber-600'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {inventoryLowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                      <table className="min-w-[760px] w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-4">Variant SKU</th>
                            <th className="py-3 px-4">Product &amp; Color</th>
                            <th className="py-3 px-4">Option</th>
                            <th className="py-3 px-4 text-right">Cost (COGS)</th>
                            <th className="py-3 px-4 text-center">Available</th>
                            <th className="py-3 px-4 text-center">Reserved</th>
                            <th className="py-3 px-4 text-right">Adjustment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {products.flatMap((p) =>
                            p.variants
                              .filter((v) => !inventoryLowStockOnly || v.stock <= v.minStockAlert)
                              .map((v) => (
                                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                  <td className="py-3 px-4 font-mono-num font-semibold text-gray-900 dark:text-white">
                                    {v.sku}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{p.name}</span>
                                    <span className="block text-[11px] text-gray-500">{v.color}</span>
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{v.size}</td>
                                  <td className="py-3 px-4 text-right font-mono-num text-gray-600 dark:text-gray-400">
                                    ৳{v.purchasePrice.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono-num">
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-semibold ${
                                        v.stock <= v.minStockAlert
                                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
                                          : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                                      }`}
                                    >
                                      {v.stock}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono-num text-gray-500">
                                    {v.reservedStock || 0}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedVariantForAdj({
                                          productId: p.id,
                                          variantId: v.id,
                                          sku: v.sku,
                                          currentStock: v.stock
                                        });
                                        setStockAdjustmentQty(0);
                                        setShowAdjustStockModal(true);
                                      }}
                                      className="px-3 py-1.5 bg-[#465FFF] hover:bg-[#3641F5] text-white rounded-lg font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      Adjust Stock
                                    </button>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Transaction Logs */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-3">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                      Recent Stock Transaction Logs ({transactions.length})
                    </h4>
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl max-h-72 overflow-y-auto">
                      <table className="min-w-[680px] w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase text-[10px]">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Variant SKU</th>
                            <th className="py-2.5 px-3 text-center">Delta</th>
                            <th className="py-2.5 px-3 text-center">New Qty</th>
                            <th className="py-2.5 px-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono-num text-[11px]">
                          {transactions.slice(0, 20).map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                              <td className="py-2 px-3 text-gray-500 whitespace-nowrap">
                                {new Date(tx.transactionDate).toLocaleDateString([], {
                                  month: 'short',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-2 px-3 font-sans font-semibold capitalize text-gray-800 dark:text-gray-200">
                                {tx.transactionType.replace('_', ' ')}
                              </td>
                              <td className="py-2 px-3 text-gray-900 dark:text-white font-semibold">
                                {tx.variantSku}
                              </td>
                              <td
                                className={`py-2 px-3 text-center font-bold ${
                                  tx.quantityIn > 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {tx.quantityIn > 0 ? `+${tx.quantityIn}` : `-${tx.quantityOut}`}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-gray-900 dark:text-white">
                                {tx.newQuantity}
                              </td>
                              <td className="py-2 px-3 text-gray-500 font-sans truncate max-w-xs">
                                {tx.remarks}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 4: ORDERS & INVOICES */}
              {activeTab === 'orders' && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-72">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search order #, phone, customer..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          className="w-full h-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-9 pr-3 text-xs focus:outline-none focus:border-[#465FFF]"
                        />
                      </div>

                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="h-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending_payment">Pending Payment</option>
                        <option value="paid">Paid</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        downloadCsvFile(
                          exportSalesCsv(),
                          `TheSteps_Orders_${new Date().toISOString().split('T')[0]}.csv`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg cursor-pointer text-xs whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Orders CSV</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                    <table className="min-w-[820px] w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Order #</th>
                          <th className="py-3 px-4">Customer &amp; Location</th>
                          <th className="py-3 px-4">Items</th>
                          <th className="py-3 px-4 text-right">Grand Total</th>
                          <th className="py-3 px-4 text-center">Payment</th>
                          <th className="py-3 px-4 text-center">Fulfillment Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-mono-num font-bold text-gray-900 dark:text-white">
                              {ord.orderNumber}
                              <span className="block text-[10px] text-gray-400 font-sans font-normal">
                                {new Date(ord.orderDate).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-gray-900 dark:text-white">{ord.customerName}</p>
                              <p className="text-[11px] text-gray-500">
                                {ord.contactNumber} · {ord.shippingAddress.division}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                              <p className="truncate max-w-[200px]">
                                {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                              ৳{ord.grandTotal.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {getPaymentChannelName(ord.paymentMethod)}
                              </span>
                              <span className="block text-[10px] uppercase text-gray-400">
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <select
                                value={ord.orderStatus}
                                onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-[11px] font-semibold text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer"
                              >
                                <option value="pending_payment">Pending Payment</option>
                                <option value="paid">Paid</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="packed">Packed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => onPrintInvoice(ord)}
                                  className="p-1.5 text-gray-600 hover:text-[#465FFF] hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                                  title="Print Invoice"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                {ord.orderStatus !== 'cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => cancelOrder(ord.id, 'Customer requested cancellation via admin')}
                                    className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 5: FINANCE & P&L */}
              {activeTab === 'finance' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Authoritative Financial Statement (P&amp;L)
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          Revenue, COGS, operating expenses, gateway settlements, and Net Operating Margin
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            downloadCsvFile(
                              exportFinancialCsv(),
                              `TheSteps_Financial_Statement_${new Date().toISOString().split('T')[0]}.csv`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export P&amp;L CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddExpenseModal(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold rounded-lg cursor-pointer text-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Record Expense</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                      <table className="min-w-[520px] w-full text-left text-xs">
                        <thead className="bg-gray-900 text-white">
                          <tr>
                            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                              Financial Accounting Line Item
                            </th>
                            <th className="py-3 px-4 text-right font-semibold uppercase tracking-wider text-[11px]">
                              Amount (BDT)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-mono-num">
                          <tr className="bg-gray-50 dark:bg-gray-900/50 font-sans font-bold">
                            <td className="py-3 px-4">Gross Sales (Total Orders Placed)</td>
                            <td className="py-3 px-4 text-right font-mono-num">
                              ৳{financialSummary.grossSales.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans text-gray-600 dark:text-gray-400">
                              Less: Coupons &amp; Promotional Discounts
                            </td>
                            <td className="py-3 px-4 text-right text-rose-600">
                              -৳{financialSummary.totalDiscounts.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans text-gray-600 dark:text-gray-400">
                              Less: Returns &amp; Customer Refunds
                            </td>
                            <td className="py-3 px-4 text-right text-rose-600">
                              -৳{financialSummary.totalRefunds.toLocaleString()}
                            </td>
                          </tr>
                          <tr className="bg-gray-100/70 dark:bg-gray-800/40 font-sans font-bold">
                            <td className="py-3 px-4">NET SALES REVENUE</td>
                            <td className="py-3 px-4 text-right font-mono-num text-sm">
                              ৳{financialSummary.netSales.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans text-gray-600 dark:text-gray-400">
                              Less: Cost of Goods Sold (COGS)
                            </td>
                            <td className="py-3 px-4 text-right text-amber-700 dark:text-amber-400">
                              -৳{financialSummary.cogs.toLocaleString()}
                            </td>
                          </tr>
                          <tr className="bg-emerald-50/60 dark:bg-emerald-500/10 font-sans font-bold">
                            <td className="py-3 px-4 text-emerald-900 dark:text-emerald-300">GROSS PROFIT</td>
                            <td className="py-3 px-4 text-right font-mono-num text-emerald-900 dark:text-emerald-300 text-sm">
                              ৳{financialSummary.grossProfit.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans text-gray-600 dark:text-gray-400">
                              Less: Operating, Courier &amp; Warehouse Expenses
                            </td>
                            <td className="py-3 px-4 text-right text-rose-600">
                              -৳{financialSummary.operatingExpenses.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans text-gray-600 dark:text-gray-400">
                              Less: EPS Payment Gateway Fees (1.5%)
                            </td>
                            <td className="py-3 px-4 text-right text-rose-600">
                              -৳{Math.round(financialSummary.gatewayFees).toLocaleString()}
                            </td>
                          </tr>
                          <tr className="bg-gray-900 text-white font-sans font-bold">
                            <td className="py-4 px-4 text-sm">NET OPERATING PROFIT</td>
                            <td className="py-4 px-4 text-right font-mono-num text-base text-emerald-400">
                              ৳{Math.round(financialSummary.netProfit).toLocaleString()} (
                              {financialSummary.profitMarginPercent.toFixed(2)}%)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Logged Business Expenses */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-3">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                      Logged Business Expenses ({expenses.length})
                    </h4>
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl max-h-64 overflow-y-auto">
                      <table className="min-w-[600px] w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase text-[10px]">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                            <th className="py-2.5 px-3">Logged By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                              <td className="py-2.5 px-3 text-gray-500 font-mono-num">{exp.date}</td>
                              <td className="py-2.5 px-3 font-semibold uppercase text-[10px] text-gray-800 dark:text-gray-200">
                                {exp.category.replace('_', ' ')}
                              </td>
                              <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">{exp.description}</td>
                              <td className="py-2.5 px-3 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                                ৳{exp.amount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-gray-500 text-[11px]">{exp.createdBy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 6: SUPPLIERS & POs */}
              {activeTab === 'suppliers' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Suppliers &amp; Purchase Orders
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          Manage vendors and receive inbound inventory shipments
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddSupplierModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold rounded-lg cursor-pointer text-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register Supplier</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {suppliers.map((s) => (
                        <div
                          key={s.id}
                          className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white text-xs">{s.name}</h5>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                              {s.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400">
                            {s.contactPerson} · {s.phoneNumber}
                          </p>
                          <p className="text-[11px] text-gray-500">{s.address}</p>
                          {s.bankInfo && (
                            <p className="text-[10px] font-mono-num text-gray-500">{s.bankInfo}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                      <table className="min-w-[740px] w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase text-[10px]">
                            <th className="py-3 px-4">PO #</th>
                            <th className="py-3 px-4">Supplier</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Items / Batch</th>
                            <th className="py-3 px-4 text-right">Total Amount</th>
                            <th className="py-3 px-4 text-center">Receiving Status</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {purchaseOrders.map((po) => (
                            <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                              <td className="py-3 px-4 font-mono-num font-bold text-gray-900 dark:text-white">
                                {po.poNumber}
                              </td>
                              <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">
                                {po.supplierName}
                              </td>
                              <td className="py-3 px-4 font-mono-num text-gray-500">{po.purchaseDate}</td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                {po.items.map((i) => `${i.productName} (${i.quantity} pcs)`).join(', ')}
                              </td>
                              <td className="py-3 px-4 text-right font-mono-num font-bold text-gray-900 dark:text-white">
                                ৳{po.totalAmount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                    po.receivedStatus === 'received'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                                  }`}
                                >
                                  {po.receivedStatus}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {po.receivedStatus !== 'received' ? (
                                  <button
                                    type="button"
                                    onClick={() => receivePurchaseOrder(po.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] cursor-pointer"
                                  >
                                    Receive &amp; Restock
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Restocked
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 7: BIDS & VOUCHERS */}
              {activeTab === 'bids' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Customer Price Bids */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
                    <div>
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
                        <Handshake className="w-4 h-4 text-[#465FFF]" />
                        <span>Customer Product Bids ({bids.length})</span>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Accept, counter-offer, or decline custom shopper price proposals.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {bids.map((bid) => (
                        <div
                          key={bid.id}
                          className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={bid.productImage}
                              alt={bid.productName}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-gray-900 dark:text-white truncate text-xs">
                                  {bid.productName}
                                </p>
                                <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 font-mono-num text-[10px] font-semibold uppercase">
                                  {bid.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {bid.customerName} ({bid.customerPhone}) · Qty {bid.quantity}
                              </p>
                              <p className="text-xs font-mono-num mt-1">
                                List: ৳{bid.originalPrice.toLocaleString()} · Offer:{' '}
                                <span className="font-bold text-[#ff4300]">৳{bid.bidAmount.toLocaleString()}</span>
                              </p>
                              {bid.note && <p className="text-[11px] italic text-gray-500 mt-1">&quot;{bid.note}&quot;</p>}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                            <button
                              type="button"
                              onClick={() => respondToBid(bid.id, 'accepted')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] cursor-pointer"
                            >
                              Accept Bid
                            </button>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="Counter ৳"
                                value={counterOfferMap[bid.id] || ''}
                                onChange={(e) =>
                                  setCounterOfferMap((prev) => ({ ...prev, [bid.id]: Number(e.target.value) }))
                                }
                                className="w-24 px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num text-[11px]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const amt =
                                    counterOfferMap[bid.id] || Math.round((bid.originalPrice + bid.bidAmount) / 2);
                                  respondToBid(bid.id, 'countered', amt);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold text-[11px] cursor-pointer"
                              >
                                Counter
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => respondToBid(bid.id, 'declined')}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 font-semibold text-[11px] cursor-pointer ml-auto"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Vouchers */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
                    <div>
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-[#EC1561]" />
                        <span>TheSteps Vouchers &amp; Promo Codes</span>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Create and toggle promotional vouchers for shoppers.
                      </p>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newVoucherCode.trim()) return;
                        await addCoupon({
                          code: newVoucherCode.trim().toUpperCase(),
                          title: newVoucherTitle.trim() || `৳${newVoucherValue} TheSteps Voucher`,
                          shopName: currentUser?.shopName || 'TheSteps Official',
                          discountType: 'fixed',
                          discountValue: newVoucherValue,
                          minOrderAmount: newVoucherMinSpend,
                          expiryDate: '2026-12-31',
                          usageLimit: 500,
                          isActive: true,
                          terms: `Valid on orders above ৳${newVoucherMinSpend.toLocaleString()}.`
                        });
                        setNewVoucherCode('');
                        setNewVoucherTitle('');
                      }}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Code (e.g. FLASH300)"
                          value={newVoucherCode}
                          onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num uppercase text-xs"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Display Title"
                          value={newVoucherTitle}
                          onChange={(e) => setNewVoucherTitle(e.target.value)}
                          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Discount ৳"
                          value={newVoucherValue}
                          onChange={(e) => setNewVoucherValue(Number(e.target.value))}
                          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Min Spend ৳"
                          value={newVoucherMinSpend}
                          onChange={(e) => setNewVoucherMinSpend(Number(e.target.value))}
                          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold text-xs cursor-pointer"
                      >
                        + Create Voucher
                      </button>
                    </form>

                    <div className="space-y-2.5">
                      {coupons.map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl border border-dashed border-[#465FFF]/40 bg-gray-50/40 dark:bg-gray-900/30 flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="font-mono-num font-bold text-[#465FFF] bg-[#ECF3FF] dark:bg-[#465FFF]/15 px-2 py-0.5 rounded text-xs">
                              {c.code}
                            </span>
                            <p className="font-semibold text-gray-900 dark:text-white mt-1 text-xs">
                              {c.title}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {c.discountType === 'percentage' ? `${c.discountValue}%` : `৳${c.discountValue}`} off · Min ৳
                              {c.minOrderAmount.toLocaleString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleCouponStatus(c.id)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              c.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Paused'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 8: AUDIT LOGS & SOC2 */}
              {activeTab === 'audit' && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                        SOC2 &amp; GDPR Compliance Audit Trail
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Immutable record of administrative, financial, and inventory actions
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-full font-semibold text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Audit Active</span>
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl max-h-[540px] overflow-y-auto">
                    <table className="min-w-[760px] w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase text-[10px]">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Action</th>
                          <th className="py-3 px-4">Entity</th>
                          <th className="py-3 px-4">Performed By</th>
                          <th className="py-3 px-4">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono-num text-[11px]">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}{' '}
                              · {new Date(log.timestamp).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px]">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-sans text-gray-600 dark:text-gray-400">
                              {log.entity} ({log.entityId})
                            </td>
                            <td className="py-2.5 px-4 font-sans font-medium text-gray-800 dark:text-gray-200">
                              {log.performedByName}
                            </td>
                            <td className="py-2.5 px-4 font-sans text-gray-500">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* MODAL: DELETE / ARCHIVE PRODUCT */}
      <DeleteProductModal
        isOpen={productToDelete !== null}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onArchive={handleArchiveProduct}
        onPermanentDelete={handlePermanentDelete}
      />

      {/* MODAL: ADJUST STOCK */}
      {showAdjustStockModal && selectedVariantForAdj && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                Adjust Stock for {selectedVariantForAdj.sku}
              </h4>
              <button
                type="button"
                onClick={() => setShowAdjustStockModal(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmStockAdjustment} className="space-y-3 text-xs">
              <p className="text-gray-600 dark:text-gray-400">
                Current Stock:{' '}
                <span className="font-mono-num font-bold text-gray-900 dark:text-white">
                  {selectedVariantForAdj.currentStock} units
                </span>
              </p>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Quantity Adjustment (+ or -)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10 or -5"
                  value={stockAdjustmentQty}
                  onChange={(e) => setStockAdjustmentQty(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 font-mono-num text-sm font-bold text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={stockAdjustmentType}
                  onChange={(e) => setStockAdjustmentType(e.target.value as any)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-2 text-gray-900 dark:text-white"
                >
                  <option value="stock_adjustment">Standard Audit Recount</option>
                  <option value="damaged_stock">Damaged in Warehouse Storage</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Reason / Reference Note *
                </label>
                <input
                  type="text"
                  value={stockAdjustmentReason}
                  onChange={(e) => setStockAdjustmentReason(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustStockModal(false)}
                  className="w-1/3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold rounded-lg cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                Record Business Expense
              </h4>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Expense Category
                </label>
                <select
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-2 text-gray-900 dark:text-white"
                >
                  <option value="packaging">Packaging Materials &amp; Boxes</option>
                  <option value="delivery_courier">Pathao / Steadfast Courier Fees</option>
                  <option value="marketing">Advertising &amp; Studio Photography</option>
                  <option value="salaries">Employee &amp; Staff Salaries</option>
                  <option value="office_rent">Showroom / Warehouse Rent</option>
                  <option value="electricity_utilities">Electricity &amp; Utilities</option>
                  <option value="other">Other Operating Expenses</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 500 pcs branded shipping cartons"
                  value={newExpenseDesc}
                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Amount (BDT) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={newExpenseAmount || ''}
                  onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 font-mono-num font-bold text-gray-900 dark:text-white text-sm"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="w-1/3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold rounded-lg cursor-pointer"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                Register Supplier
              </h4>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Company / Mill Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka Apparel & Tech Supply"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Enamul Kabir"
                    value={newSupplierContact}
                    onChange={(e) => setNewSupplierContact(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+8801XXXXXXXXX"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 font-mono-num text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse / Office Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uttara Sector-11, Dhaka"
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="w-1/3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold rounded-lg cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
