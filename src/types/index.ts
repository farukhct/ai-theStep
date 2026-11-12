export type UserRole = 
  | 'superadmin' 
  | 'admin' 
  | 'product_manager' 
  | 'inventory_manager' 
  | 'order_manager' 
  | 'accountant' 
  | 'customer';

export type PaymentMethod = 
  | 'bkash' 
  | 'nagad' 
  | 'sonali' 
  | 'card' 
  | 'bank_transfer' 
  | 'cod';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'paid' 
  | 'failed' 
  | 'refunded';

export type OrderStatus = 
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type InventoryTransactionType = 
  | 'opening_stock'
  | 'purchase'
  | 'sales'
  | 'sales_return'
  | 'purchase_return'
  | 'stock_adjustment'
  | 'damaged_stock'
  | 'cancellation';

export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | 'Free';

export interface ProductVariant {
  id: string;
  sku: string;
  size: GarmentSize;
  color: string;
  colorHex: string;
  purchasePrice: number; // Cost of goods sold (COGS)
  regularPrice: number;
  discountedPrice: number;
  stock: number;
  reservedStock: number;
  minStockAlert: number;
}

export interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  images: string[];
  fabric: string; // e.g. 100% Combed Cotton
  material: string; // e.g. Single Jersey
  gsm?: number; // e.g. 220 GSM
  weight?: string;
  regularPrice: number;
  discountedPrice: number;
  availableQuantity: number;
  minimumStockLevel: number;
  status: 'active' | 'draft' | 'archived';
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  variants: ProductVariant[];
  rating: number;
  reviewsCount: number;
  reviews?: ProductReview[];
  createdAt: string;
  updatedAt: string;
}

export interface BangladeshAddress {
  fullName: string;
  phone: string;
  altPhone?: string;
  email: string;
  division: string; // Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh
  district: string;
  upazila: string;
  detailedAddress: string;
  postcode?: string;
  deliveryNotes?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  size: GarmentSize;
  color: string;
  image: string;
  regularPrice: number;
  discountedPrice: number;
  purchasePrice: number;
  quantity: number;
  maxStock: number;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  variantSku: string;
  name: string;
  size: GarmentSize;
  color: string;
  image: string;
  price: number;
  purchasePrice: number;
  quantity: number;
  total: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  updatedBy: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  contactNumber: string;
  email: string;
  shippingAddress: BangladeshAddress;
  billingAddress: BangladeshAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  transactionId?: string;
  trackingNumber?: string;
  orderDate: string;
  remarks?: string;
  statusHistory: OrderStatusHistoryItem[];
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  transactionType: InventoryTransactionType;
  quantityIn: number;
  quantityOut: number;
  previousQuantity: number;
  newQuantity: number;
  referenceNumber: string;
  remarks: string;
  transactionDate: string;
  userId: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  companyName: string;
  address: string;
  bankInfo?: string;
  status: 'active' | 'inactive';
}

export interface PurchaseOrderItem {
  productId: string;
  variantId: string;
  variantSku: string;
  productName: string;
  size: GarmentSize;
  color: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  notes?: string;
  receivedStatus: 'received' | 'pending' | 'partial';
}

export interface Expense {
  id: string;
  category: 
    | 'fabric_purchase'
    | 'delivery_courier'
    | 'packaging'
    | 'marketing'
    | 'advertising'
    | 'salaries'
    | 'office_rent'
    | 'electricity_utilities'
    | 'payment_gateway_fees'
    | 'returns_refunds'
    | 'other';
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  referenceNumber?: string;
  createdBy: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole;
  mfaEnabled: boolean;
  mfaMethod: 'sms' | 'email' | 'totp' | 'none';
  addresses?: BangladeshAddress[];
  savedWishlist?: string[];
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'inventory' | 'payment' | 'security' | 'system';
  isRead: boolean;
  timestamp: string;
  link?: string;
}
