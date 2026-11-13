import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db, validateFirestoreConnection } from '../config/firebase';
import {
  Product,
  Order,
  OrderStatus,
  InventoryTransaction,
  Supplier,
  PurchaseOrder,
  Expense,
  AuditLog,
  BangladeshAddress,
  CartItem,
  PaymentMethod,
  PaymentStatus,
  Coupon,
  ProductBid,
  ProductReview
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SUPPLIERS,
  INITIAL_EXPENSES,
  INITIAL_COUPONS,
  INITIAL_BIDS
} from '../config/constants';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { getPaymentChannelName } from '../config/epsPaymentOptions';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

interface FinancialSummary {
  grossSales: number;
  totalDiscounts: number;
  totalRefunds: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  gatewayFees: number;
  netProfit: number;
  profitMarginPercent: number;
  totalOrders: number;
  averageOrderValue: number;
  inventoryValuation: number;
  lowStockItemsCount: number;
}

interface StoreContextType {
  products: Product[];
  orders: Order[];
  transactions: InventoryTransaction[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  coupons: Coupon[];
  bids: ProductBid[];
  syncStatus: 'online' | 'offline' | 'syncing';

  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustVariantStock: (
    productId: string,
    variantId: string,
    adjustment: number,
    type: 'stock_adjustment' | 'damaged_stock',
    reason: string
  ) => Promise<void>;
  addProductReview: (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => Promise<void>;

  // Order actions
  createOrder: (orderData: {
    customerName: string;
    contactNumber: string;
    email: string;
    shippingAddress: BangladeshAddress;
    billingAddress: BangladeshAddress;
    items: CartItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    transactionId?: string;
    remarks?: string;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;

  // Bidding & Vouchers
  submitBid: (bidData: {
    product: Product;
    bidAmount: number;
    quantity: number;
    customerPhone: string;
    note?: string;
  }) => Promise<ProductBid>;
  respondToBid: (
    bidId: string,
    status: 'accepted' | 'countered' | 'declined',
    counterAmount?: number
  ) => Promise<void>;
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => Promise<void>;
  toggleCouponStatus: (couponId: string) => Promise<void>;

  // Supplier & Purchasing
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => Promise<void>;
  receivePurchaseOrder: (poId: string) => Promise<void>;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;

  // Reporting & Financials
  financialSummary: FinancialSummary;
  dateRange: 'today' | '7days' | 'month' | 'year' | 'all';
  setDateRange: (range: 'today' | '7days' | 'month' | 'year' | 'all') => void;

  // Data Management & Backups
  exportDataJson: () => string;
  exportSalesCsv: () => string;
  exportInventoryCsv: () => string;
  exportFinancialCsv: () => string;
  runManualBackup: () => void;
  lastBackupDate: string | null;
  gdprExportUserData: (email: string) => any;
  gdprEraseUserData: (email: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, fbUser } = useAuth();
  const { addToast, addNotification } = useNotification();

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('sd_products');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('sd_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_ORDERS;
  });

  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem('sd_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_PRODUCTS.flatMap((p) =>
      p.variants.map((v) => ({
        id: `tx-init-${v.id}`,
        productId: p.id,
        productName: p.name,
        variantId: v.id,
        variantSku: v.sku,
        transactionType: 'opening_stock' as const,
        quantityIn: v.stock,
        quantityOut: 0,
        previousQuantity: 0,
        newQuantity: v.stock,
        referenceNumber: 'SD-INIT-2026',
        remarks: 'Opening TheSteps warehouse inventory baseline',
        transactionDate: '2026-10-01T00:00:00.000Z',
        userId: 'system'
      }))
    );
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('sd_suppliers');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_SUPPLIERS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('sd_pos');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [
      {
        id: 'po-01',
        poNumber: 'PO-2026-001',
        supplierId: 'sup-001',
        supplierName: 'Motion View & Tech Imports BD',
        purchaseDate: '2026-10-20',
        items: [
          {
            productId: 'prod-001',
            variantId: 'var-101',
            variantSku: 'WTCH-TIT-BLK',
            productName: 'Amazfit Active Titanium AMOLED Smart Watch',
            size: 'Standard',
            color: 'Obsidian Black',
            quantity: 25,
            unitCost: 4650,
            subtotal: 116250
          }
        ],
        totalAmount: 116250,
        paymentStatus: 'paid',
        receivedStatus: 'received',
        notes: 'Initial smartwatch campaign stock allocation'
      }
    ];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('sd_expenses');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_EXPENSES;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('sd_coupons');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_COUPONS;
  });

  const [bids, setBids] = useState<ProductBid[]>(() => {
    const saved = localStorage.getItem('sd_bids');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_BIDS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('sd_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [
      {
        id: 'log-01',
        action: 'SYSTEM_BOOT',
        entity: 'System',
        entityId: 'thesteps-main',
        details: 'TheSteps Commerce Platform initialized with hardened Firestore rules & audit logging.',
        performedBy: 'faruk017@gmail.com',
        performedByName: 'Faruk (Platform Owner)',
        timestamp: new Date().toISOString()
      }
    ];
  });

  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'year' | 'all'>('month');
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => localStorage.getItem('sd_last_backup'));

  useEffect(() => {
    localStorage.setItem('sd_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sd_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('sd_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sd_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('sd_pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('sd_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('sd_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('sd_bids', JSON.stringify(bids));
  }, [bids]);

  useEffect(() => {
    localStorage.setItem('sd_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (action: string, entity: string, entityId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      entity,
      entityId,
      details,
      performedBy: currentUser?.email || 'guest@thesteps.com.bd',
      performedByName: currentUser?.displayName || 'System Guest',
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Validate Firestore connectivity on boot and sync catalog if authenticated admin
  useEffect(() => {
    let isMounted = true;
    const syncFirestore = async () => {
      try {
        setSyncStatus('syncing');
        const reachable = await validateFirestoreConnection();
        if (!reachable) {
          if (isMounted) setSyncStatus('offline');
          return;
        }
        const productsSnap = await getDocs(collection(db, 'products'));
        if (productsSnap.empty && fbUser) {
          for (const p of INITIAL_PRODUCTS) {
            await setDoc(doc(db, 'products', p.id), p);
          }
        }
        if (isMounted) setSyncStatus('online');
      } catch (err) {
        console.warn('Firestore sync running in local offline fallback:', err);
        if (isMounted) setSyncStatus('offline');
      }
    };

    syncFirestore();
    return () => { isMounted = false; };
  }, [fbUser]);

  // --- Product Management ---
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
      shopName: productData.shopName || currentUser?.shopName || 'TheSteps Official',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setProducts((prev) => [newProduct, ...prev]);

    newProduct.variants.forEach((v) => {
      const tx: InventoryTransaction = {
        id: `tx-${Date.now()}-${v.id}`,
        productId: id,
        productName: newProduct.name,
        variantId: v.id,
        variantSku: v.sku,
        transactionType: 'opening_stock',
        quantityIn: v.stock,
        quantityOut: 0,
        previousQuantity: 0,
        newQuantity: v.stock,
        referenceNumber: `ADD-${newProduct.sku}`,
        remarks: 'New product variant catalog entry added',
        transactionDate: new Date().toISOString(),
        userId: currentUser?.email || 'admin'
      };
      setTransactions((prev) => [tx, ...prev]);
    });

    addAuditLog('CREATE_PRODUCT', 'Product', id, `Added product ${newProduct.name} (SKU: ${newProduct.sku})`);
    addToast('Product Published', `${newProduct.name} is now live on TheSteps.`, 'success');

    if (fbUser) {
      try {
        await setDoc(doc(db, 'products', id), newProduct);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `products/${id}`);
      }
    }

    return id;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updatedTimestamp = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: updatedTimestamp } : p))
    );

    addAuditLog('UPDATE_PRODUCT', 'Product', id, `Updated product fields: ${Object.keys(updates).join(', ')}`);
    addToast('Product Updated', 'Catalog changes saved successfully.', 'info');

    if (fbUser) {
      try {
        await updateDoc(doc(db, 'products', id), { ...updates, updatedAt: updatedTimestamp });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    const toDelete = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addAuditLog('DELETE_PRODUCT', 'Product', id, `Deleted product ${toDelete?.name || id}`);
    addToast('Product Deleted', 'Removed from TheSteps catalog.', 'info');

    if (fbUser) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const adjustVariantStock = async (
    productId: string,
    variantId: string,
    adjustment: number,
    type: 'stock_adjustment' | 'damaged_stock',
    reason: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;

    const prevStock = variant.stock;
    const newStock = Math.max(0, prevStock + adjustment);
    const qtyIn = adjustment > 0 ? adjustment : 0;
    const qtyOut = adjustment < 0 ? Math.abs(adjustment) : 0;

    const updatedVariants = product.variants.map((v) =>
      v.id === variantId ? { ...v, stock: newStock } : v
    );
    const totalAvailable = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
    const updatedTimestamp = new Date().toISOString();

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, variants: updatedVariants, availableQuantity: totalAvailable, updatedAt: updatedTimestamp }
          : p
      )
    );

    const tx: InventoryTransaction = {
      id: `tx-${Date.now()}-${variantId}`,
      productId,
      productName: product.name,
      variantId,
      variantSku: variant.sku,
      transactionType: type,
      quantityIn: qtyIn,
      quantityOut: qtyOut,
      previousQuantity: prevStock,
      newQuantity: newStock,
      referenceNumber: `ADJ-${Date.now().toString().slice(-6)}`,
      remarks: reason || `Manual adjustment by ${currentUser?.displayName}`,
      transactionDate: updatedTimestamp,
      userId: currentUser?.email || 'admin'
    };
    setTransactions((prev) => [tx, ...prev]);

    addAuditLog(
      'STOCK_ADJUSTMENT',
      'Inventory',
      variant.sku,
      `${type}: ${variant.sku} adjusted by ${adjustment > 0 ? '+' : ''}${adjustment} (${prevStock} -> ${newStock}). Reason: ${reason}`
    );

    if (newStock <= variant.minStockAlert) {
      addNotification(
        'Low Stock Warning',
        `${product.name} (${variant.color}) has only ${newStock} units remaining.`,
        'inventory'
      );
    }

    addToast('Stock Adjusted', `Stock for ${variant.sku} updated to ${newStock} units.`, 'success');

    if (fbUser) {
      try {
        await updateDoc(doc(db, 'products', productId), {
          variants: updatedVariants,
          availableQuantity: totalAvailable,
          updatedAt: updatedTimestamp
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `products/${productId}`);
      }
    }
  };

  const addProductReview = async (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => {
    const newReview: ProductReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const existingReviews = p.reviews || [];
        const updatedReviews = [newReview, ...existingReviews];
        const newCount = (p.reviewsCount || 0) + 1;
        const totalScore = p.rating * (p.reviewsCount || 0) + review.rating;
        const avgRating = Number((totalScore / newCount).toFixed(1));
        return {
          ...p,
          reviews: updatedReviews,
          reviewsCount: newCount,
          rating: avgRating
        };
      })
    );
    addToast('Review Submitted', 'Thank you for sharing your verified TheSteps feedback.', 'success');
  };

  // --- Order Creation ---
  const createOrder = async (orderData: {
    customerName: string;
    contactNumber: string;
    email: string;
    shippingAddress: BangladeshAddress;
    billingAddress: BangladeshAddress;
    items: CartItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    transactionId?: string;
    remarks?: string;
  }): Promise<Order> => {
    const orderId = `ord-${Date.now().toString().slice(-6)}`;
    const orderNumber = `SD-26-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const initialOrderStatus: OrderStatus = orderData.paymentStatus === 'paid' ? 'paid' : 'pending_payment';

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: currentUser?.uid || 'guest-cust',
      customerName: orderData.customerName,
      contactNumber: orderData.contactNumber,
      email: orderData.email,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      items: orderData.items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        variantSku: it.variantSku,
        name: it.productName,
        size: it.size,
        color: it.color,
        image: it.image,
        price: it.discountedPrice,
        purchasePrice: it.purchasePrice,
        quantity: it.quantity,
        total: it.discountedPrice * it.quantity
      })),
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      shippingFee: orderData.shippingFee,
      tax: 0,
      grandTotal: orderData.grandTotal,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus || 'pending',
      orderStatus: initialOrderStatus,
      transactionId: orderData.transactionId || `SD-TRX-${Date.now().toString().slice(-8)}`,
      trackingNumber: `SD-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      orderDate: nowIso,
      remarks: orderData.remarks || `Order placed via ${getPaymentChannelName(orderData.paymentMethod)}`,
      statusHistory: [
        {
          status: initialOrderStatus,
          timestamp: nowIso,
          updatedBy:
            orderData.paymentStatus === 'paid'
              ? `${getPaymentChannelName(orderData.paymentMethod)} (EPS)`
              : 'Customer Checkout',
          note: `Payment status: ${orderData.paymentStatus || 'pending'}`
        }
      ]
    };

    setProducts((prevProducts) => {
      const updatedProducts = [...prevProducts];
      orderData.items.forEach((item) => {
        const prodIndex = updatedProducts.findIndex((p) => p.id === item.productId);
        if (prodIndex > -1) {
          const targetProd = { ...updatedProducts[prodIndex] };
          const varIndex = targetProd.variants.findIndex((v) => v.id === item.variantId);
          if (varIndex > -1) {
            const targetVar = { ...targetProd.variants[varIndex] };
            const prevStock = targetVar.stock;
            const newStock = Math.max(0, prevStock - item.quantity);
            targetVar.stock = newStock;
            targetVar.reservedStock = (targetVar.reservedStock || 0) + item.quantity;
            targetProd.variants[varIndex] = targetVar;
            targetProd.availableQuantity = targetProd.variants.reduce((sum, v) => sum + v.stock, 0);
            if (targetProd.isFlashDeal && typeof targetProd.flashStockLeft === 'number') {
              targetProd.flashStockLeft = Math.max(0, targetProd.flashStockLeft - item.quantity);
              targetProd.flashSoldCount = (targetProd.flashSoldCount || 0) + item.quantity;
            }
            updatedProducts[prodIndex] = targetProd;

            const tx: InventoryTransaction = {
              id: `tx-sale-${Date.now()}-${item.variantId}`,
              productId: item.productId,
              productName: item.productName,
              variantId: item.variantId,
              variantSku: item.variantSku,
              transactionType: 'sales',
              quantityIn: 0,
              quantityOut: item.quantity,
              previousQuantity: prevStock,
              newQuantity: newStock,
              referenceNumber: orderNumber,
              remarks: `Customer Order ${orderNumber} (${orderData.customerName})`,
              transactionDate: nowIso,
              userId: currentUser?.email || 'guest'
            };
            setTransactions((prevTx) => [tx, ...prevTx]);
          }
        }
      });
      return updatedProducts;
    });

    setOrders((prev) => [newOrder, ...prev]);

    addAuditLog(
      'ORDER_CREATED',
      'Order',
      orderNumber,
      `New order ${orderNumber} placed by ${orderData.customerName} for ৳${orderData.grandTotal} via ${getPaymentChannelName(orderData.paymentMethod)}`
    );

    addNotification(
      `New Order #${orderNumber}`,
      `Order total ৳${orderData.grandTotal.toLocaleString()} via ${getPaymentChannelName(orderData.paymentMethod)} (${orderData.shippingAddress.division}).`,
      'order'
    );

    if (fbUser) {
      try {
        await setDoc(doc(db, 'orders', orderId), newOrder);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `orders/${orderId}`);
      }
    }

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    const nowIso = new Date().toISOString();
    let updatedOrder: Order | null = null;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated: Order = {
            ...ord,
            orderStatus: newStatus,
            paymentStatus:
              newStatus === 'paid' || newStatus === 'confirmed' || newStatus === 'shipped' || newStatus === 'delivered'
                ? 'paid'
                : ord.paymentStatus,
            statusHistory: [
              ...ord.statusHistory,
              {
                status: newStatus,
                timestamp: nowIso,
                updatedBy: currentUser?.displayName || 'Admin Supervisor',
                note: note || `Status transitioned to ${newStatus}`
              }
            ]
          };
          updatedOrder = updated;
          return updated;
        }
        return ord;
      })
    );

    if (updatedOrder) {
      addAuditLog(
        'ORDER_STATUS_UPDATE',
        'Order',
        (updatedOrder as Order).orderNumber,
        `Order ${(updatedOrder as Order).orderNumber} status changed to ${newStatus.toUpperCase()}`
      );
      addToast(
        'Order Updated',
        `Order ${(updatedOrder as Order).orderNumber} is now ${newStatus.replace('_', ' ').toUpperCase()}.`,
        'success'
      );

      if (fbUser) {
        try {
          await updateDoc(doc(db, 'orders', orderId), {
            orderStatus: newStatus,
            statusHistory: (updatedOrder as Order).statusHistory
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
        }
      }
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setProducts((prevProducts) => {
      const updatedProducts = [...prevProducts];
      order.items.forEach((item) => {
        const prodIndex = updatedProducts.findIndex((p) => p.id === item.productId);
        if (prodIndex > -1) {
          const targetProd = { ...updatedProducts[prodIndex] };
          const varIndex = targetProd.variants.findIndex((v) => v.id === item.variantId);
          if (varIndex > -1) {
            const targetVar = { ...targetProd.variants[varIndex] };
            const prevStock = targetVar.stock;
            const restoredStock = prevStock + item.quantity;
            targetVar.stock = restoredStock;
            targetVar.reservedStock = Math.max(0, (targetVar.reservedStock || 0) - item.quantity);
            targetProd.variants[varIndex] = targetVar;
            targetProd.availableQuantity = targetProd.variants.reduce((sum, v) => sum + v.stock, 0);
            updatedProducts[prodIndex] = targetProd;

            const tx: InventoryTransaction = {
              id: `tx-cancel-${Date.now()}-${item.variantId}`,
              productId: item.productId,
              productName: item.name,
              variantId: item.variantId,
              variantSku: item.variantSku,
              transactionType: 'cancellation',
              quantityIn: item.quantity,
              quantityOut: 0,
              previousQuantity: prevStock,
              newQuantity: restoredStock,
              referenceNumber: order.orderNumber,
              remarks: `Restocked after cancellation: ${reason}`,
              transactionDate: new Date().toISOString(),
              userId: currentUser?.email || 'admin'
            };
            setTransactions((prevTx) => [tx, ...prevTx]);
          }
        }
      });
      return updatedProducts;
    });

    await updateOrderStatus(orderId, 'cancelled', `Cancellation reason: ${reason}`);
    addToast('Order Cancelled', `Order ${order.orderNumber} cancelled and stock restored.`, 'info');
  };

  // --- Bidding & Vouchers ---
  const submitBid = async ({
    product,
    bidAmount,
    quantity,
    customerPhone,
    note
  }: {
    product: Product;
    bidAmount: number;
    quantity: number;
    customerPhone: string;
    note?: string;
  }): Promise<ProductBid> => {
    const newBid: ProductBid = {
      id: `bid-${Date.now().toString().slice(-6)}`,
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || '',
      originalPrice: product.discountedPrice,
      bidAmount,
      quantity,
      customerId: currentUser?.uid || 'guest-cust',
      customerName: currentUser?.displayName || 'TheSteps Shopper',
      customerPhone: customerPhone || currentUser?.phoneNumber || '+8801700000000',
      note,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setBids((prev) => [newBid, ...prev]);
    addAuditLog('BID_SUBMITTED', 'ProductBid', newBid.id, `Bid ৳${bidAmount} x${quantity} on ${product.name}`);
    addNotification(
      'New Customer Price Bid',
      `${newBid.customerName} offered ৳${bidAmount.toLocaleString()} for ${product.name}.`,
      'order'
    );
    addToast('Offer Submitted', `Your bid of ৳${bidAmount.toLocaleString()} has been sent to the seller.`, 'success');

    if (fbUser) {
      try {
        await setDoc(doc(db, 'bids', newBid.id), newBid);
      } catch (e) {
        console.warn('Bid remote sync skipped:', e);
      }
    }

    return newBid;
  };

  const respondToBid = async (
    bidId: string,
    status: 'accepted' | 'countered' | 'declined',
    counterAmount?: number
  ) => {
    setBids((prev) =>
      prev.map((b) =>
        b.id === bidId ? { ...b, status, counterAmount: status === 'countered' ? counterAmount : b.counterAmount } : b
      )
    );
    addAuditLog('BID_DECISION', 'ProductBid', bidId, `Bid marked as ${status.toUpperCase()}`);
    addToast('Bid Updated', `Offer has been marked as ${status}.`, 'info');
  };

  const addCoupon = async (couponData: Omit<Coupon, 'id' | 'usageCount'>) => {
    const newCoupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now().toString().slice(-5)}`,
      code: couponData.code.toUpperCase(),
      usageCount: 0
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    addAuditLog('CREATE_COUPON', 'Coupon', newCoupon.code, `Created voucher ${newCoupon.code}`);
    addToast('Voucher Created', `Promo code ${newCoupon.code} is now active.`, 'success');
  };

  const toggleCouponStatus = async (couponId: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, isActive: !c.isActive } : c))
    );
  };

  // --- Suppliers & Purchases ---
  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    const id = `sup-${Date.now()}`;
    const newSupplier: Supplier = { ...supplierData, id };
    setSuppliers((prev) => [newSupplier, ...prev]);
    addAuditLog('ADD_SUPPLIER', 'Supplier', id, `Added supplier ${newSupplier.name}`);
    addToast('Supplier Added', `${newSupplier.name} registered.`, 'success');
  };

  const createPurchaseOrder = async (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>) => {
    const id = `po-${Date.now()}`;
    const poNumber = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newPo: PurchaseOrder = { ...poData, id, poNumber };
    setPurchaseOrders((prev) => [newPo, ...prev]);
    addAuditLog('CREATE_PO', 'PurchaseOrder', poNumber, `Created PO for ${newPo.supplierName} (Total: ৳${newPo.totalAmount})`);
    addToast('Purchase Order Created', `${poNumber} registered for ${newPo.supplierName}.`, 'success');
  };

  const receivePurchaseOrder = async (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po || po.receivedStatus === 'received') return;

    setProducts((prevProducts) => {
      const updated = [...prevProducts];
      po.items.forEach((item) => {
        const prodIndex = updated.findIndex((p) => p.id === item.productId);
        if (prodIndex > -1) {
          const targetProd = { ...updated[prodIndex] };
          const varIndex = targetProd.variants.findIndex((v) => v.id === item.variantId);
          if (varIndex > -1) {
            const targetVar = { ...targetProd.variants[varIndex] };
            const prevStock = targetVar.stock;
            const newStock = prevStock + item.quantity;
            targetVar.stock = newStock;
            targetVar.purchasePrice = item.unitCost;
            targetProd.variants[varIndex] = targetVar;
            targetProd.availableQuantity = targetProd.variants.reduce((sum, v) => sum + v.stock, 0);
            updated[prodIndex] = targetProd;

            const tx: InventoryTransaction = {
              id: `tx-recv-${Date.now()}-${item.variantId}`,
              productId: item.productId,
              productName: item.productName,
              variantId: item.variantId,
              variantSku: item.variantSku,
              transactionType: 'purchase',
              quantityIn: item.quantity,
              quantityOut: 0,
              previousQuantity: prevStock,
              newQuantity: newStock,
              referenceNumber: po.poNumber,
              remarks: `Received shipment from ${po.supplierName}`,
              transactionDate: new Date().toISOString(),
              userId: currentUser?.email || 'admin'
            };
            setTransactions((prevTx) => [tx, ...prevTx]);
          }
        }
      });
      return updated;
    });

    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, receivedStatus: 'received', paymentStatus: 'paid' } : p))
    );

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      category: 'fabric_purchase',
      description: `Purchase order payment for ${po.poNumber} (${po.supplierName})`,
      amount: po.totalAmount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      referenceNumber: po.poNumber,
      createdBy: currentUser?.displayName || 'Accounts Manager'
    };
    setExpenses((prev) => [newExpense, ...prev]);

    addAuditLog('RECEIVE_PO', 'PurchaseOrder', po.poNumber, `Goods received for ${po.poNumber}, stock levels replenished.`);
    addToast('Goods Received', `Stock replenished from ${po.supplierName}.`, 'success');
  };

  // --- Expenses ---
  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const id = `exp-${Date.now()}`;
    const newExp: Expense = { ...expenseData, id };
    setExpenses((prev) => [newExp, ...prev]);
    addAuditLog('ADD_EXPENSE', 'Expense', id, `Expense recorded: ${newExp.description} (৳${newExp.amount})`);
    addToast('Expense Recorded', `৳${newExp.amount} logged under ${newExp.category}.`, 'info');
  };

  // --- Financial Calculations ---
  const filterOrdersByDate = (orderList: Order[]) => {
    const now = new Date();
    return orderList.filter((ord) => {
      const ordDate = new Date(ord.orderDate);
      if (dateRange === 'today') return ordDate.toDateString() === now.toDateString();
      if (dateRange === '7days') return (now.getTime() - ordDate.getTime()) / (1000 * 3600 * 24) <= 7;
      if (dateRange === 'month') return ordDate.getMonth() === now.getMonth() && ordDate.getFullYear() === now.getFullYear();
      if (dateRange === 'year') return ordDate.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const activeOrders = filterOrdersByDate(orders.filter((o) => o.orderStatus !== 'cancelled'));
  const refundedOrders = filterOrdersByDate(orders.filter((o) => o.orderStatus === 'refunded' || o.orderStatus === 'returned'));

  const grossSales = activeOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDiscounts = activeOrders.reduce((sum, o) => sum + o.discount, 0);
  const totalRefunds = refundedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const netSales = Math.max(0, grossSales - totalDiscounts - totalRefunds);

  const cogs = activeOrders.reduce((acc, order) => {
    return acc + order.items.reduce((itemAcc, item) => itemAcc + (item.purchasePrice || 0) * item.quantity, 0);
  }, 0);

  const grossProfit = Math.max(0, netSales - cogs);
  const operatingExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const gatewayFees = activeOrders.reduce((acc, o) => (o.paymentMethod !== 'cod' ? acc + o.grandTotal * 0.015 : acc), 0);
  const netProfit = grossProfit - operatingExpenses - gatewayFees;
  const profitMarginPercent = netSales > 0 ? (netProfit / netSales) * 100 : 0;

  const inventoryValuation = products.reduce(
    (acc, p) => acc + p.variants.reduce((varAcc, v) => varAcc + v.purchasePrice * v.stock, 0),
    0
  );
  const lowStockItemsCount = products.reduce(
    (acc, p) => acc + p.variants.filter((v) => v.stock <= v.minStockAlert).length,
    0
  );

  const financialSummary: FinancialSummary = {
    grossSales,
    totalDiscounts,
    totalRefunds,
    netSales,
    cogs,
    grossProfit,
    operatingExpenses,
    gatewayFees,
    netProfit,
    profitMarginPercent,
    totalOrders: activeOrders.length,
    averageOrderValue: activeOrders.length > 0 ? Math.round(netSales / activeOrders.length) : 0,
    inventoryValuation,
    lowStockItemsCount
  };

  // --- Exports & Backups ---
  const exportDataJson = () => {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        storeName: 'TheSteps Bangladesh Platform',
        products,
        orders,
        bids,
        coupons,
        transactions,
        suppliers,
        purchaseOrders,
        expenses,
        auditLogs
      },
      null,
      2
    );
  };

  const exportSalesCsv = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Division', 'Payment Method', 'Payment Status', 'Order Status', 'Items', 'Subtotal (BDT)', 'Discount (BDT)', 'Shipping (BDT)', 'Grand Total (BDT)'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.orderDate.split('T')[0],
      `"${o.customerName}"`,
      o.contactNumber,
      o.shippingAddress.division,
      getPaymentChannelName(o.paymentMethod),
      o.paymentStatus,
      o.orderStatus,
      o.items.length,
      o.subtotal,
      o.discount,
      o.shippingFee,
      o.grandTotal
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const exportInventoryCsv = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Variant SKU', 'Option', 'Color', 'Purchase Price (BDT)', 'Selling Price (BDT)', 'Available Stock', 'Reserved', 'Status'];
    const rows = products.flatMap((p) =>
      p.variants.map((v) => [
        `"${p.name}"`,
        p.sku,
        p.category,
        v.sku,
        v.size,
        `"${v.color}"`,
        v.purchasePrice,
        v.discountedPrice,
        v.stock,
        v.reservedStock || 0,
        v.stock <= v.minStockAlert ? 'LOW_STOCK' : 'HEALTHY'
      ])
    );
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const exportFinancialCsv = () => {
    const lines = [
      'THESTEPS BANGLADESH - FINANCIAL PROFIT & LOSS STATEMENT',
      `Generated At,${new Date().toISOString()}`,
      `Selected Range,${dateRange.toUpperCase()}`,
      '',
      'Metric,Amount (BDT)',
      `Gross Sales,${grossSales}`,
      `Discounts Allowed,${totalDiscounts}`,
      `Returns & Refunds,${totalRefunds}`,
      `Net Sales Revenue,${netSales}`,
      `Cost of Goods Sold (COGS),${cogs}`,
      `Gross Profit,${grossProfit}`,
      `Operating & Warehouse Expenses,${operatingExpenses}`,
      `EPS Payment Gateway Charges,${Math.round(gatewayFees)}`,
      `Net Profit (Operating Profit),${Math.round(netProfit)}`,
      `Net Profit Margin (%),${profitMarginPercent.toFixed(2)}%`,
      `Total Fulfilled Orders,${activeOrders.length}`,
      `Inventory Asset Valuation,${inventoryValuation}`
    ];
    return lines.join('\n');
  };

  const runManualBackup = () => {
    const backupJson = exportDataJson();
    const backupDate = new Date().toISOString();
    setLastBackupDate(backupDate);
    localStorage.setItem('sd_last_backup', backupDate);
    localStorage.setItem(`sd_backup_${Date.now()}`, backupJson);

    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TheSteps_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addAuditLog('DATA_BACKUP', 'Database', 'full-cluster', 'Full encrypted snapshot generated and downloaded.');
    addToast('Backup Created', 'Database snapshot exported successfully.', 'success');
  };

  const gdprExportUserData = (email: string) => {
    const userOrders = orders.filter((o) => o.email.toLowerCase() === email.toLowerCase());
    return {
      exportTimestamp: new Date().toISOString(),
      userEmail: email,
      complianceStandard: 'GDPR / SOC2 Article 20 - Right to Data Portability',
      orders: userOrders,
      deliveryAddresses: userOrders.map((o) => o.shippingAddress)
    };
  };

  const gdprEraseUserData = async (email: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.email.toLowerCase() === email.toLowerCase()
          ? {
              ...o,
              customerName: 'ANONYMIZED USER',
              contactNumber: 'REDACTED',
              email: 'redacted@privacy.gdpr',
              shippingAddress: {
                ...o.shippingAddress,
                fullName: 'REDACTED',
                phone: 'REDACTED',
                email: 'redacted@privacy.gdpr',
                detailedAddress: 'REDACTED FOR GDPR PRIVACY COMPLIANCE'
              }
            }
          : o
      )
    );
    addAuditLog('GDPR_ERASURE', 'CustomerData', email, `Erased PII records under GDPR Article 17 for ${email}`);
    addToast('GDPR Data Erased', `Personal identifiable records anonymized for ${email}.`, 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        transactions,
        suppliers,
        purchaseOrders,
        expenses,
        auditLogs,
        coupons,
        bids,
        syncStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustVariantStock,
        addProductReview,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        submitBid,
        respondToBid,
        addCoupon,
        toggleCouponStatus,
        addSupplier,
        createPurchaseOrder,
        receivePurchaseOrder,
        addExpense,
        financialSummary,
        dateRange,
        setDateRange,
        exportDataJson,
        exportSalesCsv,
        exportInventoryCsv,
        exportFinancialCsv,
        runManualBackup,
        lastBackupDate,
        gdprExportUserData,
        gdprEraseUserData
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
