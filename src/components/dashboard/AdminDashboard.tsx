import React, { useState } from 'react';
import { 
  BarChart3, 
  Package, 
  Layers, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  Printer, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Truck, 
  RefreshCcw, 
  Database,
  ExternalLink,
  X,
  SlidersHorizontal,
  TrendingUp,
  FileText,
  Edit,
  Copy,
  Trash2,
  Archive
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { ProductFormModal } from './ProductFormModal';
import { DeleteProductModal } from './DeleteProductModal';
import { 
  Product, 
  Order, 
  OrderStatus, 
  InventoryTransaction, 
  Supplier, 
  PurchaseOrder, 
  Expense, 
  ProductVariant, 
  GarmentSize 
} from '../../types';
import { GARMENT_CATEGORIES, BD_DIVISIONS } from '../../config/constants';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice: (order: Order) => void;
  initialTab?: 'analytics' | 'products' | 'inventory' | 'orders' | 'suppliers' | 'finance' | 'audit';
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
    financialSummary,
    dateRange,
    setDateRange,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustVariantStock,
    updateOrderStatus,
    cancelOrder,
    addSupplier,
    createPurchaseOrder,
    receivePurchaseOrder,
    addExpense,
    exportSalesCsv,
    exportInventoryCsv,
    exportFinancialCsv,
    runManualBackup,
    lastBackupDate
  } = useStore();

  const { currentUser, isAdmin } = useAuth();
  const { formatPrice } = useLanguage();
  const { addToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'inventory' | 'orders' | 'suppliers' | 'finance' | 'audit'>('analytics');

  React.useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  React.useEffect(() => {
    if (editingProduct && isOpen) {
      setActiveTab('products');
      setProductFormState({
        isOpen: true,
        mode: 'edit',
        product: editingProduct
      });
      if (onClearEditingProduct) {
        onClearEditingProduct();
      }
    }
  }, [editingProduct, isOpen, onClearEditingProduct]);

  // Search & Filter state
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false);

  // Product Form (Create / Edit) & Delete Modal State
  const [productFormState, setProductFormState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    product: Product | null;
  }>({
    isOpen: false,
    mode: 'create',
    product: null
  });
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [selectedVariantForAdj, setSelectedVariantForAdj] = useState<{ productId: string; variantId: string; sku: string; currentStock: number } | null>(null);
  const [stockAdjustmentQty, setStockAdjustmentQty] = useState<number>(0);
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState<string>('Physical warehouse audit adjustment');
  const [stockAdjustmentType, setStockAdjustmentType] = useState<'stock_adjustment' | 'damaged_stock'>('stock_adjustment');

  // New Expense state
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);
  const [newExpenseCategory, setNewExpenseCategory] = useState<any>('packaging');

  // New Supplier / PO state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  if (!isOpen) return null;

  // Handlers for Product CRUD
  const handleOpenCreateProduct = () => {
    setProductFormState({
      isOpen: true,
      mode: 'create',
      product: null
    });
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductFormState({
      isOpen: true,
      mode: 'edit',
      product: prod
    });
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
    if (productFormState.mode === 'create') {
      await addProduct(data);
    } else if (productFormState.mode === 'edit' && productFormState.product) {
      await updateProduct(productFormState.product.id, data);
    }
  };

  const handleArchiveProduct = async (productId: string) => {
    await updateProduct(productId, { status: 'archived' });
    addToast('Product Archived', 'Garment status set to Archived (hidden from storefront).', 'info');
  };

  const handlePermanentDelete = async (productId: string) => {
    await deleteProduct(productId);
  };

  // Handle Stock Adjustment
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

  // Handle Add Expense
  const handleConfirmExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || newExpenseAmount <= 0) return;
    await addExpense({
      category: newExpenseCategory,
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

  // Handle Add Supplier
  const handleConfirmSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName || !newSupplierPhone) return;
    await addSupplier({
      name: newSupplierName,
      contactPerson: newSupplierContact || 'Manager',
      phoneNumber: newSupplierPhone,
      email: `${newSupplierName.toLowerCase().replace(/[^a-z0-9]/g, '')}@fabricmills.bd`,
      companyName: newSupplierName,
      address: newSupplierAddress || 'Gazipur, Dhaka',
      status: 'active'
    });
    setNewSupplierName('');
    setNewSupplierPhone('');
    setShowAddSupplierModal(false);
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchSearch = 
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.contactNumber.includes(orderSearch);
    const matchStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered Products
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-4 max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Management Bar */}
        <div className="bg-neutral-950 text-white p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide font-serif-heading">AURA BUSINESS SUITE</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-emerald-400 border border-neutral-700">
                  {currentUser?.role?.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Integrated Garments Inventory, Accounting & Order Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Backup Button */}
            <button
              onClick={runManualBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg border border-neutral-800 transition-colors cursor-pointer"
              title="Generate Nightly Database Backup Snapshot"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Nightly Backup</span>
            </button>

            {/* Date Range Selector */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-[11px] font-semibold text-neutral-400">
              {(['today', '7days', 'month', 'year', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer capitalize ${
                    dateRange === r ? 'bg-neutral-800 text-white font-bold' : 'hover:text-neutral-200'
                  }`}
                >
                  {r === '7days' ? '7D' : r}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="bg-neutral-50 px-4 sm:px-6 border-b border-neutral-200 flex items-center gap-4 text-xs font-bold overflow-x-auto shrink-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'analytics' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'orders' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'products' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catalog & Variants</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'inventory' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Inventory Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'finance' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Profit & Loss / Finance</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'suppliers' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Suppliers & POs</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail & SOC2</span>
          </button>
        </div>

        {/* Tab Body View */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Primary Financial Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Gross & Net Sales */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Net Sales Revenue</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black font-mono text-neutral-950">
                      ৳{financialSummary.netSales.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                      +18.4%
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Gross: ৳{financialSummary.grossSales.toLocaleString()} · Disc: ৳{financialSummary.totalDiscounts.toLocaleString()}
                  </p>
                </div>

                {/* COGS */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Cost of Goods (COGS)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black font-mono text-neutral-950">
                      ৳{financialSummary.cogs.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">Weighted Avg</span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Gross Profit: ৳{financialSummary.grossProfit.toLocaleString()}
                  </p>
                </div>

                {/* Operating Net Profit */}
                <div className="p-4 rounded-xl bg-neutral-950 text-white border border-neutral-800 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Net Operating Profit</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black font-mono text-white">
                      ৳{Math.round(financialSummary.netProfit).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {financialSummary.profitMarginPercent.toFixed(1)}% margin
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Expenses: ৳{financialSummary.operatingExpenses.toLocaleString()} · GW: ৳{Math.round(financialSummary.gatewayFees).toLocaleString()}
                  </p>
                </div>

                {/* Inventory Asset Valuation */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Inventory Valuation</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black font-mono text-neutral-950">
                      ৳{financialSummary.inventoryValuation.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{financialSummary.lowStockItemsCount} low-stock variants</span>
                  </p>
                </div>
              </div>

              {/* Visual Performance Charts (SVG Responsive Bar & Trends) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales & Profit Trends Chart */}
                <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-neutral-950">Revenue & Profit Trajectory</h4>
                      <p className="text-neutral-400 text-[11px]">Daily trend comparisons across Bangladesh fulfillment cycles</p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-medium">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-neutral-950"></span> Net Sales</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Gross Profit</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> COGS</span>
                    </div>
                  </div>

                  {/* SVG Bar Chart Visualization */}
                  <div className="h-60 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-neutral-200">
                    {[
                      { day: 'Sat', sales: 42000, profit: 24000, cogs: 18000 },
                      { day: 'Sun', sales: 58000, profit: 32000, cogs: 26000 },
                      { day: 'Mon', sales: 69000, profit: 39000, cogs: 30000 },
                      { day: 'Tue', sales: 84000, profit: 47000, cogs: 37000 },
                      { day: 'Wed', sales: 95000, profit: 54000, cogs: 41000 },
                      { day: 'Thu', sales: 112000, profit: 64000, cogs: 48000 },
                      { day: 'Fri', sales: 138000, profit: 79000, cogs: 59000 }
                    ].map((d, idx) => {
                      const maxH = 140000;
                      const salesH = Math.round((d.sales / maxH) * 100);
                      const profitH = Math.round((d.profit / maxH) * 100);
                      const cogsH = Math.round((d.cogs / maxH) * 100);

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                          <div className="w-full flex items-end justify-center gap-1 h-full">
                            <div 
                              className="w-1/3 bg-neutral-900 rounded-t-sm transition-all duration-300 group-hover:bg-neutral-700" 
                              style={{ height: `${salesH}%` }} 
                              title={`Sales: ৳${d.sales.toLocaleString()}`}
                            />
                            <div 
                              className="w-1/3 bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-400" 
                              style={{ height: `${profitH}%` }} 
                              title={`Gross Profit: ৳${d.profit.toLocaleString()}`}
                            />
                            <div 
                              className="w-1/3 bg-amber-500 rounded-t-sm transition-all duration-300 group-hover:bg-amber-400" 
                              style={{ height: `${cogsH}%` }} 
                              title={`COGS: ৳${d.cogs.toLocaleString()}`}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-400 font-medium group-hover:text-neutral-950">{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Channels Breakdown */}
                <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-neutral-950">Payment Channels (BD)</h4>
                    <p className="text-neutral-400 text-[11px]">Volume distribution by customer method</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { method: 'bKash Merchant Pay', percent: 54, color: 'bg-[#E2136E]', amount: '৳148,200' },
                      { method: 'Nagad Online Pay', percent: 24, color: 'bg-[#F7941D]', amount: '৳65,800' },
                      { method: 'Cash on Delivery (COD)', percent: 14, color: 'bg-emerald-600', amount: '৳38,400' },
                      { method: 'Visa / Mastercard', percent: 5, color: 'bg-blue-600', amount: '৳13,700' },
                      { method: 'Sonali SPG & Bank', percent: 3, color: 'bg-teal-700', amount: '৳8,200' }
                    ].map((pm, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-neutral-700">{pm.method}</span>
                          <span className="font-mono font-bold text-neutral-950">{pm.amount} ({pm.percent}%)</span>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${pm.color}`} style={{ width: `${pm.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-700">Quick Reports & Exports:</span>
                  <button
                    onClick={() => {
                      const csv = exportFinancialCsv();
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `AURA_Financial_Statement_${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-neutral-800 font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download P&L CSV</span>
                  </button>

                  <button
                    onClick={() => {
                      const csv = exportSalesCsv();
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `AURA_Sales_Orders_${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-neutral-800 font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Orders CSV</span>
                  </button>
                </div>

                <div className="text-[11px] text-neutral-500 font-mono">
                  Database: <span className="text-emerald-700 font-bold">Cloud Synced</span> · Last Backup: {lastBackupDate ? new Date(lastBackupDate).toLocaleTimeString() : 'Auto-scheduled nightly'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS & VARIANTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const csv = exportInventoryCsv();
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `AURA_Product_Catalog_${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Catalog</span>
                  </button>

                  <button
                    onClick={handleOpenCreateProduct}
                    className="flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg cursor-pointer shadow-sm text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Garment</span>
                  </button>
                </div>
              </div>

              {/* Product Table */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">SKU / Brand</th>
                      <th className="py-3 px-4">Fabric Specs</th>
                      <th className="py-3 px-4 text-right">Selling Price</th>
                      <th className="py-3 px-4 text-center">Variants & Stock</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredProducts.map((p) => {
                      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                      return (
                        <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img src={p.images[0]} alt={p.name} className="w-10 h-12 object-cover rounded bg-neutral-100 shrink-0" />
                              <div>
                                <p className="font-bold text-neutral-950 line-clamp-1">{p.name}</p>
                                <span className="text-[10px] text-neutral-400 capitalize">{p.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className="font-bold text-neutral-900">{p.sku}</span>
                            <span className="block text-[10px] text-neutral-400 font-sans">{p.brand}</span>
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            <span>{p.fabric}</span>
                            {p.gsm && <span className="block text-[10px] font-mono text-neutral-400">{p.gsm} GSM</span>}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-neutral-950">
                            ৳{p.discountedPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold font-mono text-xs ${
                              totalStock <= 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {totalStock} units ({p.variants.length} sizes)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <select
                              value={p.status}
                              onChange={(e) => updateProduct(p.id, { status: e.target.value as any })}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer border ${
                                p.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : p.status === 'draft'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-neutral-100 text-neutral-500 border-neutral-200'
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
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                                title="Edit Garment Details & Variants"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateProduct(p)}
                                className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                                title="Duplicate Garment Draft"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Delete or Archive Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* TAB 3: INVENTORY LEDGER */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <h4 className="font-bold text-sm text-neutral-950">Traceable Stock Ledger & Movements</h4>
                  <p className="text-neutral-500 text-[11px]">Audit every stock increase, sale deduction, damage adjustment, and returns</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInventoryLowStockOnly(!inventoryLowStockOnly)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-colors cursor-pointer ${
                      inventoryLowStockOnly ? 'bg-amber-500 text-neutral-950 border-amber-600' : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    Low Stock Alerts Only
                  </button>
                </div>
              </div>

              {/* Variants Stock Matrix */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Variant SKU</th>
                      <th className="py-3 px-4">Garment & Color</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4 text-right">Cost (COGS)</th>
                      <th className="py-3 px-4 text-center">Available Stock</th>
                      <th className="py-3 px-4 text-center">Reserved</th>
                      <th className="py-3 px-4 text-right">Adjustment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {products.flatMap((p) =>
                      p.variants
                        .filter((v) => !inventoryLowStockOnly || v.stock <= v.minStockAlert)
                        .map((v) => (
                          <tr key={v.id} className="hover:bg-neutral-50">
                            <td className="py-2.5 px-4 font-mono font-bold text-neutral-950">{v.sku}</td>
                            <td className="py-2.5 px-4">
                              <span className="font-medium text-neutral-900">{p.name}</span>
                              <span className="block text-[10px] text-neutral-400">{v.color}</span>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-neutral-800">{v.size}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-neutral-600">৳{v.purchasePrice}</td>
                            <td className="py-2.5 px-4 text-center font-mono">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                v.stock <= v.minStockAlert ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-800'
                              }`}>
                                {v.stock}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-neutral-500">
                              {v.reservedStock || 0}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
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
                                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold text-[11px] transition-colors cursor-pointer"
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

              {/* Recent Ledger Audit Table */}
              <div className="pt-4 space-y-2">
                <h5 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                  Recent Stock Transaction Logs ({transactions.length})
                </h5>
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[10px]">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Variant SKU</th>
                        <th className="py-2 px-3 text-center">Delta</th>
                        <th className="py-2 px-3 text-center">New Qty</th>
                        <th className="py-2 px-3">Reference / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                      {transactions.slice(0, 15).map((tx) => (
                        <tr key={tx.id} className="hover:bg-neutral-50">
                          <td className="py-2 px-3 text-neutral-400">
                            {new Date(tx.transactionDate).toLocaleDateString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-3 font-sans font-bold capitalize text-neutral-800">
                            {tx.transactionType.replace('_', ' ')}
                          </td>
                          <td className="py-2 px-3 text-neutral-900 font-bold">{tx.variantSku}</td>
                          <td className={`py-2 px-3 text-center font-bold ${tx.quantityIn > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.quantityIn > 0 ? `+${tx.quantityIn}` : `-${tx.quantityOut}`}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-neutral-950">{tx.newQuantity}</td>
                          <td className="py-2 px-3 text-neutral-500 font-sans truncate max-w-xs">{tx.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS & FULFILLMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search orders, phone, name..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-800 focus:outline-none"
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
                  onClick={() => {
                    const csv = exportSalesCsv();
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `AURA_Orders_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-lg cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Orders CSV</span>
                </button>
              </div>

              {/* Orders Table */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer & Location</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-center">Fulfillment Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-neutral-950">
                          {ord.orderNumber}
                          <span className="block text-[10px] text-neutral-400 font-sans font-normal">
                            {new Date(ord.orderDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-neutral-900">{ord.customerName}</p>
                          <p className="text-[11px] text-neutral-500 font-mono">{ord.contactNumber}</p>
                          <p className="text-[10px] text-neutral-400">{ord.shippingAddress.division} ({ord.shippingAddress.district})</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-neutral-800">
                            {ord.items.map((i) => `${i.name} (${i.size})`).join(', ')}
                          </span>
                          <span className="block text-[10px] text-neutral-400">Qty: {ord.items.reduce((s, i) => s + i.quantity, 0)}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-neutral-950">
                          ৳{ord.grandTotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-neutral-100 text-neutral-800">
                            {ord.paymentMethod}
                          </span>
                          <span className={`block text-[9px] font-bold capitalize mt-0.5 ${ord.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={ord.orderStatus}
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                            className="bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-[11px] font-semibold text-neutral-900 focus:outline-none"
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
                              onClick={() => onPrintInvoice(ord)}
                              className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                              title="Print Official Tax Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {ord.orderStatus !== 'cancelled' && (
                              <button
                                onClick={() => cancelOrder(ord.id, 'Customer requested cancellation via admin')}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold cursor-pointer"
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

          {/* TAB 5: PROFIT & LOSS / EXPENSES */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <h4 className="font-bold text-sm text-neutral-950">Authoritative Financial Statement (P&L)</h4>
                  <p className="text-neutral-500 text-[11px]">Accurate revenue, COGS, warehouse operations, and Net Operating Margin</p>
                </div>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Expense</span>
                </button>
              </div>

              {/* Detailed Financial Statement Table */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-white">
                    <tr>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Financial Accounting Line Item</th>
                      <th className="py-3 px-4 text-right font-bold uppercase tracking-wider text-[11px]">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono">
                    <tr className="bg-neutral-50 font-sans font-bold">
                      <td className="py-2.5 px-4">Gross Sales (Total Orders Placed)</td>
                      <td className="py-2.5 px-4 text-right font-mono text-neutral-950">৳{financialSummary.grossSales.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-neutral-600">Less: Coupons & Promotional Discounts</td>
                      <td className="py-2.5 px-4 text-right text-rose-600">-৳{financialSummary.totalDiscounts.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-neutral-600">Less: Returns & Customer Refunds</td>
                      <td className="py-2.5 px-4 text-right text-rose-600">-৳{financialSummary.totalRefunds.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-neutral-100/60 font-sans font-bold">
                      <td className="py-3 px-4 text-neutral-950">NET SALES REVENUE</td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-950 text-sm">৳{financialSummary.netSales.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-neutral-600">Less: Cost of Goods Sold (COGS - Purchase Cost of Items Sold)</td>
                      <td className="py-2.5 px-4 text-right text-amber-700">-৳{financialSummary.cogs.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-emerald-50/60 font-sans font-bold">
                      <td className="py-3 px-4 text-emerald-950">GROSS PROFIT</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-950 text-sm">৳{financialSummary.grossProfit.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-neutral-600">Less: Operating, Courier, Packaging & Office Expenses</td>
                      <td className="py-2.5 px-4 text-right text-rose-600">-৳{financialSummary.operatingExpenses.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-neutral-600">Less: Payment Gateway Settlements (bKash & Nagad 1.5%)</td>
                      <td className="py-2.5 px-4 text-right text-rose-600">-৳{Math.round(financialSummary.gatewayFees).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-neutral-950 text-white font-sans font-black">
                      <td className="py-4 px-4 text-sm">NET OPERATING PROFIT</td>
                      <td className="py-4 px-4 text-right font-mono text-base text-emerald-400">
                        ৳{Math.round(financialSummary.netProfit).toLocaleString()} ({financialSummary.profitMarginPercent.toFixed(2)}%)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expenses List */}
              <div className="space-y-2 pt-4">
                <h5 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                  Logged Business Expenses ({expenses.length})
                </h5>
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[10px]">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3">Logged By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-neutral-50">
                          <td className="py-2 px-3 text-neutral-500 font-mono">{exp.date}</td>
                          <td className="py-2 px-3 font-bold uppercase text-[10px] text-neutral-800">{exp.category.replace('_', ' ')}</td>
                          <td className="py-2 px-3 text-neutral-700">{exp.description}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-neutral-950">৳{exp.amount.toLocaleString()}</td>
                          <td className="py-2 px-3 text-neutral-400 text-[11px]">{exp.createdBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUPPLIERS & POs */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <h4 className="font-bold text-sm text-neutral-950">Garments Mills & Supplier Purchase Orders</h4>
                  <p className="text-neutral-500 text-[11px]">Manage textile manufacturers and receive raw fabric stock into inventory</p>
                </div>
                <button
                  onClick={() => setShowAddSupplierModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Supplier</span>
                </button>
              </div>

              {/* Suppliers List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suppliers.map((s) => (
                  <div key={s.id} className="p-4 bg-white rounded-xl border border-neutral-200 space-y-2 shadow-xs">
                    <div className="flex items-start justify-between">
                      <h5 className="font-bold text-neutral-950 text-xs">{s.name}</h5>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {s.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600">Contact: {s.contactPerson} ({s.phoneNumber})</p>
                    <p className="text-[10px] text-neutral-400">{s.address}</p>
                    {s.bankInfo && <p className="text-[10px] font-mono text-neutral-500">{s.bankInfo}</p>}
                  </div>
                ))}
              </div>

              {/* Purchase Orders List */}
              <div className="space-y-2 pt-2">
                <h5 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                  Purchase Orders & Inbound Shipments
                </h5>
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">PO #</th>
                        <th className="py-2.5 px-3">Supplier</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Items / Batch</th>
                        <th className="py-2.5 px-3 text-right">Total Amount</th>
                        <th className="py-2.5 px-3 text-center">Receiving Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {purchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-neutral-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-neutral-950">{po.poNumber}</td>
                          <td className="py-2.5 px-3 font-semibold text-neutral-800">{po.supplierName}</td>
                          <td className="py-2.5 px-3 font-mono text-neutral-500">{po.purchaseDate}</td>
                          <td className="py-2.5 px-3 text-neutral-600">
                            {po.items.map((i) => `${i.productName} (${i.quantity} pcs)`).join(', ')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-950">৳{po.totalAmount.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              po.receivedStatus === 'received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {po.receivedStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {po.receivedStatus !== 'received' ? (
                              <button
                                onClick={() => receivePurchaseOrder(po.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer"
                              >
                                Receive & Restock
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
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

          {/* TAB 7: AUDIT LOGS & SOC2 COMPLIANCE */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-neutral-950">SOC2 & GDPR Compliance Audit Trail</h4>
                  <p className="text-neutral-500 text-[11px]">Immutable record of administrative, financial, and inventory actions</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Audit Active</span>
                  </span>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Performed By</th>
                      <th className="py-2.5 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50">
                        <td className="py-2 px-3 text-neutral-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · {new Date(log.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans text-neutral-600">{log.entity} ({log.entityId})</td>
                        <td className="py-2 px-3 font-sans font-medium text-neutral-800">{log.performedByName}</td>
                        <td className="py-2 px-3 font-sans text-neutral-500">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE / EDIT PRODUCT */}
      <ProductFormModal
        isOpen={productFormState.isOpen}
        mode={productFormState.mode}
        initialProduct={productFormState.product}
        onClose={() => setProductFormState({ isOpen: false, mode: 'create', product: null })}
        onSubmit={handleProductFormSubmit}
      />

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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <h4 className="font-bold text-base text-neutral-950">Adjust Stock for {selectedVariantForAdj.sku}</h4>
              <button onClick={() => setShowAdjustStockModal(false)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmStockAdjustment} className="space-y-3 text-xs">
              <p className="text-neutral-600">
                Current Stock: <span className="font-mono font-bold text-neutral-950">{selectedVariantForAdj.currentStock} units</span>
              </p>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Quantity Adjustment (+ or -)</label>
                <input
                  type="number"
                  placeholder="e.g. +10 or -5"
                  value={stockAdjustmentQty}
                  onChange={(e) => setStockAdjustmentQty(Number(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-sm font-bold text-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Adjustment Type</label>
                <select
                  value={stockAdjustmentType}
                  onChange={(e) => setStockAdjustmentType(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-2"
                >
                  <option value="stock_adjustment">Standard Audit Recount</option>
                  <option value="damaged_stock">Damaged in Warehouse Storage</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Reason / Reference Note *</label>
                <input
                  type="text"
                  placeholder="e.g. Recounted shelf 3B, box sealed"
                  value={stockAdjustmentReason}
                  onChange={(e) => setStockAdjustmentReason(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustStockModal(false)}
                  className="w-1/3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg cursor-pointer"
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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <h4 className="font-bold text-base text-neutral-950">Record Business Expense</h4>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Expense Category</label>
                <select
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-2 font-medium"
                >
                  <option value="packaging">Packaging Materials & Boxes</option>
                  <option value="delivery_courier">Pathao / Steadfast Courier Fees</option>
                  <option value="marketing">Advertising & Studio Photography</option>
                  <option value="salaries">Employee & Tailor Salaries</option>
                  <option value="office_rent">Gulshan Showroom / Warehouse Rent</option>
                  <option value="electricity_utilities">Electricity & Utilities</option>
                  <option value="other">Other Operating Expenses</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  placeholder="e.g. 500 pcs custom matte black garment polybags"
                  value={newExpenseDesc}
                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Amount (BDT) *</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={newExpenseAmount || ''}
                  onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold text-neutral-950 text-sm"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="w-1/3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg cursor-pointer"
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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <h4 className="font-bold text-base text-neutral-950">Register Textile Supplier</h4>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Company / Mill Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ha-Meem Denim Mills Ltd"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Enamul Kabir"
                    value={newSupplierContact}
                    onChange={(e) => setNewSupplierContact(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+8801XXXXXXXXX"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Factory / Mill Address</label>
                <input
                  type="text"
                  placeholder="e.g. Baipail, Ashulia, Dhaka"
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="w-1/3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg cursor-pointer"
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
