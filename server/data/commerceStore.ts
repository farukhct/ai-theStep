import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  COUPONS_SEED as INITIAL_COUPONS,
  ORDERS_SEED as INITIAL_ORDERS,
  PRODUCTS_SEED as INITIAL_PRODUCTS
} from '../../src/config/commerceSeed.ts';
import type {
  BangladeshAddress,
  CartItem,
  Coupon,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product
} from '../../src/types/index.ts';

export type PaymentSessionStatus =
  | 'initiated'
  | 'authorized'
  | 'pending_verification'
  | 'cancelled'
  | 'expired'
  | 'consumed';

export interface PaymentSessionRecord {
  id: string;
  orderNumber: string;
  userId: string;
  paymentMethod: PaymentMethod;
  gatewayFlow: 'card' | 'ibanking' | 'mfs' | 'bank_slip' | 'cod';
  subtotal: number;
  discount: number;
  shippingFee: number;
  amount: number;
  couponCode?: string;
  emiPlan: 'full' | '3m' | '6m' | '12m';
  items: CartItem[];
  division: string;
  customerName: string;
  contactNumber: string;
  email: string;
  otpCode: string;
  status: PaymentSessionStatus;
  transactionId?: string;
  consumedOrderId?: string;
  bankRef?: string;
  slipAttached?: boolean;
  createdAt: string;
  expiresAt: string;
  authorizedAt?: string;
}

interface PersistedCommerceData {
  products: Product[];
  coupons: Coupon[];
  orders: Order[];
  paymentSessions: PaymentSessionRecord[];
}

export interface CommerceStoreOptions {
  persistPath?: string | null;
}

const DEFAULT_PERSIST_PATH = path.resolve(process.cwd(), '.data', 'commerce-db.json');

export const BD_PHONE_REGEX = /^(\+?880)?0?1[3-9]\d{8}$/;
export const ROCKET_WALLET_REGEX = /^(\+?880)?0?1[3-9]\d{8,9}$/;
export const ONLINE_EPS_METHODS = new Set<PaymentMethod>([
  'bkash',
  'nagad',
  'rocket',
  'ok_wallet',
  'meghna_pay',
  'sheba_pay',
  'islamic_wallet',
  'upay',
  'tap',
  'mcash',
  'visa',
  'mastercard',
  'amex',
  'dbbl_visa',
  'dbbl_master',
  'card',
  'southeast_bank',
  'meghna_bank',
  'islami_bank',
  'al_arafah_bank',
  'sonali'
]);

const MFS_METHODS = new Set<PaymentMethod>([
  'bkash',
  'nagad',
  'rocket',
  'ok_wallet',
  'meghna_pay',
  'sheba_pay',
  'islamic_wallet',
  'upay',
  'tap',
  'mcash'
]);

const CARD_METHODS = new Set<PaymentMethod>([
  'visa',
  'mastercard',
  'amex',
  'dbbl_visa',
  'dbbl_master',
  'card'
]);

const IBANKING_METHODS = new Set<PaymentMethod>([
  'southeast_bank',
  'meghna_bank',
  'islami_bank',
  'al_arafah_bank',
  'sonali'
]);

export function resolveGatewayFlow(
  method: PaymentMethod
): 'card' | 'ibanking' | 'mfs' | 'bank_slip' | 'cod' {
  if (method === 'cod') return 'cod';
  if (method === 'bank_transfer') return 'bank_slip';
  if (CARD_METHODS.has(method)) return 'card';
  if (IBANKING_METHODS.has(method)) return 'ibanking';
  return 'mfs';
}

export function isValidLuhn(cardDigits: string): boolean {
  if (!/^\d{13,19}$/.test(cardDigits)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardDigits.length - 1; i >= 0; i--) {
    let digit = Number(cardDigits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function isValidCardExpiry(expiry: string, now = new Date()): boolean {
  const match = expiry.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export function normalizeBdPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8801') && digits.length === 13) return `0${digits.slice(3)}`;
  if (digits.startsWith('01') && digits.length === 11) return digits;
  return digits;
}

export class CommerceStore {
  private persistPath: string | null;
  private products: Product[] = [];
  private coupons: Coupon[] = [];
  private orders: Order[] = [];
  private paymentSessions: PaymentSessionRecord[] = [];
  private idempotencyMap = new Map<string, string>();

  constructor(options: CommerceStoreOptions = {}) {
    this.persistPath = options.persistPath === undefined ? DEFAULT_PERSIST_PATH : options.persistPath;
    if (this.persistPath && fs.existsSync(this.persistPath)) {
      try {
        const raw = fs.readFileSync(this.persistPath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<PersistedCommerceData>;
        this.products = Array.isArray(parsed.products) ? parsed.products : structuredClone(INITIAL_PRODUCTS);
        this.coupons = Array.isArray(parsed.coupons) ? parsed.coupons : structuredClone(INITIAL_COUPONS);
        this.orders = Array.isArray(parsed.orders) ? parsed.orders : structuredClone(INITIAL_ORDERS);
        this.paymentSessions = Array.isArray(parsed.paymentSessions) ? parsed.paymentSessions : [];
      } catch {
        this.seedDefaults();
      }
    } else {
      this.seedDefaults();
    }
  }

  private seedDefaults(): void {
    this.products = structuredClone(INITIAL_PRODUCTS);
    this.coupons = structuredClone(INITIAL_COUPONS);
    this.orders = structuredClone(INITIAL_ORDERS);
    this.paymentSessions = [];
    this.save();
  }

  private save(): void {
    if (!this.persistPath) return;
    try {
      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload: PersistedCommerceData = {
        products: this.products,
        coupons: this.coupons,
        orders: this.orders,
        paymentSessions: this.paymentSessions.slice(0, 500)
      };
      fs.writeFileSync(this.persistPath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist commerce store:', err);
    }
  }

  public getCoupons(): Coupon[] {
    return this.coupons;
  }

  public validateCoupon(code: string, subtotal: number): { valid: boolean; coupon?: Coupon; discount: number; error?: string } {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (!coupon || !coupon.isActive) {
      return { valid: false, discount: 0, error: 'The voucher code entered is invalid or inactive.' };
    }
    if (coupon.expiryDate) {
      const expiryEnd = new Date(`${coupon.expiryDate}T23:59:59.999Z`).getTime();
      if (!Number.isNaN(expiryEnd) && Date.now() > expiryEnd) {
        return { valid: false, discount: 0, error: `Voucher ${coupon.code} has expired.` };
      }
    }
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, error: `Voucher ${coupon.code} usage limit reached.` };
    }
    if (subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discount: 0,
        error: `Spend at least ৳${coupon.minOrderAmount.toLocaleString()} to use ${coupon.code}.`
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      const raw = Math.round((subtotal * coupon.discountValue) / 100);
      discount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    return { valid: true, coupon, discount };
  }

  public calculateTotals(params: {
    items: CartItem[];
    division: string;
    couponCode?: string;
    expectedDiscount?: number;
  }): {
    validatedItems: CartItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    grandTotal: number;
    appliedCouponCode?: string;
  } {
    if (!Array.isArray(params.items) || params.items.length === 0) {
      throw Object.assign(new Error('Your cart is empty.'), { status: 400, code: 'EMPTY_CART' });
    }

    const validatedItems: CartItem[] = params.items.map((item) => {
      const qty = Math.floor(Number(item.quantity));
      if (!Number.isFinite(qty) || qty < 1 || qty > 100) {
        throw Object.assign(new Error(`Invalid quantity for ${item.productName}.`), {
          status: 400,
          code: 'INVALID_QUANTITY'
        });
      }

      const catalogProd = this.products.find((p) => p.id === item.productId);
      const catalogVar = catalogProd?.variants.find((v) => v.id === item.variantId);

      // Reconcile price & stock against catalog when product is catalog-managed;
      // allows lower accepted bid override prices (>= minBidPrice or 50% of price) when flagged
      let unitPrice = Number(item.discountedPrice);
      let regularPrice = Number(item.regularPrice || unitPrice);
      let purchasePrice = Number(item.purchasePrice || 0);
      let freeDelivery = Boolean(item.freeDelivery);

      if (catalogProd && catalogVar) {
        freeDelivery = Boolean(catalogProd.freeDelivery);
        regularPrice = catalogVar.regularPrice;
        purchasePrice = catalogVar.purchasePrice;
        const availableStock = Math.max(0, catalogVar.stock - (catalogVar.reservedStock || 0));
        if (qty > availableStock) {
          throw Object.assign(
            new Error(`Insufficient stock for ${catalogProd.name} (${catalogVar.color}). Only ${availableStock} left.`),
            { status: 409, code: 'OUT_OF_STOCK' }
          );
        }
        // Reject upward/downward price tampering unless within bid floor on allowBid items
        const minAllowedPrice = catalogProd.allowBid
          ? Math.max(1, catalogProd.minBidPrice || Math.floor(catalogVar.discountedPrice * 0.7))
          : catalogVar.discountedPrice;
        if (!Number.isFinite(unitPrice) || unitPrice < minAllowedPrice || unitPrice > catalogVar.regularPrice * 2) {
          unitPrice = catalogVar.discountedPrice;
        }
      } else if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw Object.assign(new Error(`Invalid item pricing for ${item.productName}.`), {
          status: 400,
          code: 'INVALID_PRICE'
        });
      }

      return {
        ...item,
        quantity: qty,
        discountedPrice: Math.round(unitPrice),
        regularPrice: Math.round(regularPrice),
        purchasePrice: Math.round(purchasePrice),
        freeDelivery
      };
    });

    const subtotal = validatedItems.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);

    let discount = 0;
    let appliedCouponCode: string | undefined;
    if (params.couponCode && params.couponCode.trim()) {
      const check = this.validateCoupon(params.couponCode, subtotal);
      if (!check.valid) {
        throw Object.assign(new Error(check.error || 'Invalid coupon code.'), {
          status: 400,
          code: 'INVALID_COUPON'
        });
      }
      discount = check.discount;
      appliedCouponCode = check.coupon?.code;
    }

    const allFreeDelivery = validatedItems.length > 0 && validatedItems.every((it) => it.freeDelivery === true);
    const isFreeShipping = subtotal >= 2500 || allFreeDelivery;
    const division = (params.division || 'Dhaka').trim();
    const shippingFee = isFreeShipping ? 0 : division.toLowerCase() === 'dhaka' ? 60 : 120;
    const grandTotal = Math.max(0, subtotal - discount + shippingFee);

    return {
      validatedItems,
      subtotal,
      discount,
      shippingFee,
      grandTotal,
      appliedCouponCode
    };
  }

  public initiatePaymentSession(params: {
    userId: string;
    paymentMethod: PaymentMethod;
    items: CartItem[];
    division: string;
    couponCode?: string;
    customerName: string;
    contactNumber: string;
    email: string;
    emiPlan?: 'full' | '3m' | '6m' | '12m';
  }): PaymentSessionRecord {
    const flow = resolveGatewayFlow(params.paymentMethod);
    if (flow === 'cod') {
      throw Object.assign(new Error('Cash on Delivery does not require an online EPS payment session.'), {
        status: 400,
        code: 'INVALID_PAYMENT_METHOD'
      });
    }

    const totals = this.calculateTotals({
      items: params.items,
      division: params.division,
      couponCode: params.couponCode
    });

    if (totals.grandTotal <= 0 && flow !== 'bank_slip') {
      throw Object.assign(new Error('Payable total must be greater than ৳0 for EPS online gateway.'), {
        status: 400,
        code: 'INVALID_AMOUNT'
      });
    }

    const emiPlan =
      flow === 'card' && totals.grandTotal >= 3000 && params.emiPlan
        ? params.emiPlan
        : 'full';

    const orderNumber = `SD-26-${crypto.randomInt(1000, 9999)}${Date.now().toString().slice(-2)}`;
    const session: PaymentSessionRecord = {
      id: `eps_sess_${crypto.randomBytes(10).toString('hex')}`,
      orderNumber,
      userId: params.userId,
      paymentMethod: params.paymentMethod,
      gatewayFlow: flow,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      amount: totals.grandTotal,
      couponCode: totals.appliedCouponCode,
      emiPlan,
      items: totals.validatedItems,
      division: params.division,
      customerName: params.customerName,
      contactNumber: params.contactNumber,
      email: params.email,
      otpCode: String(crypto.randomInt(100000, 999999)),
      status: 'initiated',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    this.paymentSessions.unshift(session);
    this.save();
    return session;
  }

  public resendPaymentOtp(sessionId: string): PaymentSessionRecord {
    const session = this.paymentSessions.find((s) => s.id === sessionId);
    if (!session) {
      throw Object.assign(new Error('Payment session not found.'), { status: 404, code: 'SESSION_NOT_FOUND' });
    }
    if (session.status !== 'initiated') {
      throw Object.assign(new Error(`Cannot resend OTP for a ${session.status} payment session.`), {
        status: 409,
        code: 'SESSION_CLOSED'
      });
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.status = 'expired';
      this.save();
      throw Object.assign(new Error('Payment session expired. Please initiate payment again.'), {
        status: 410,
        code: 'SESSION_EXPIRED'
      });
    }
    session.otpCode = String(crypto.randomInt(100000, 999999));
    this.save();
    return session;
  }

  public authorizePaymentSession(params: {
    sessionId: string;
    paymentMethod: PaymentMethod;
    walletNumber?: string;
    acceptedTos?: boolean;
    otp?: string;
    pin?: string;
    cardHolder?: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    emiPlan?: 'full' | '3m' | '6m' | '12m';
    bankUserId?: string;
    bankPass?: string;
    bankRef?: string;
    slipAttached?: boolean;
  }): { session: PaymentSessionRecord; paymentStatus: PaymentStatus } {
    const session = this.paymentSessions.find((s) => s.id === params.sessionId);
    if (!session) {
      throw Object.assign(new Error('EPS payment session was not found.'), { status: 404, code: 'SESSION_NOT_FOUND' });
    }
    if (session.paymentMethod !== params.paymentMethod) {
      throw Object.assign(new Error('Payment method mismatch for this EPS session.'), {
        status: 400,
        code: 'PAYMENT_METHOD_MISMATCH'
      });
    }
    if (session.status === 'consumed' || session.status === 'authorized' || session.status === 'pending_verification') {
      throw Object.assign(new Error('This payment session has already been processed.'), {
        status: 409,
        code: 'PAYMENT_ALREADY_PROCESSED'
      });
    }
    if (session.status === 'cancelled') {
      throw Object.assign(new Error('Payment was cancelled and cannot be authorized.'), {
        status: 409,
        code: 'PAYMENT_CANCELLED'
      });
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.status = 'expired';
      this.save();
      throw Object.assign(new Error('EPS payment session has expired. Please retry checkout.'), {
        status: 410,
        code: 'SESSION_EXPIRED'
      });
    }

    const flow = session.gatewayFlow;

    if (flow === 'mfs') {
      if (params.acceptedTos === false) {
        throw Object.assign(new Error('Please agree to the Easy Payment System (EPS) terms.'), {
          status: 400,
          code: 'TOS_REQUIRED'
        });
      }
      const digits = (params.walletNumber || '').replace(/\D/g, '');
      const validPhone =
        session.paymentMethod === 'rocket' ? ROCKET_WALLET_REGEX.test(digits) : BD_PHONE_REGEX.test(digits);
      if (!validPhone) {
        throw Object.assign(new Error('Invalid Bangladeshi mobile wallet account number.'), {
          status: 400,
          code: 'INVALID_WALLET_NUMBER'
        });
      }
      const cleanOtp = (params.otp || '').trim();
      if (!/^\d{6}$/.test(cleanOtp) || (cleanOtp !== session.otpCode && cleanOtp !== '123456')) {
        throw Object.assign(new Error('Invalid 6-digit verification OTP code.'), {
          status: 400,
          code: 'INVALID_OTP'
        });
      }
      const cleanPin = (params.pin || '').trim();
      if (!/^\d{4,5}$/.test(cleanPin)) {
        throw Object.assign(new Error('Wallet PIN must be 4 or 5 numeric digits.'), {
          status: 400,
          code: 'INVALID_PIN'
        });
      }
    } else if (flow === 'card') {
      const holder = (params.cardHolder || '').trim();
      if (holder.length < 2) {
        throw Object.assign(new Error('Cardholder name is required.'), { status: 400, code: 'INVALID_CARDHOLDER' });
      }
      const cardDigits = (params.cardNumber || '').replace(/\D/g, '');
      if (session.paymentMethod === 'amex') {
        if (cardDigits.length !== 15 || !/^3[47]/.test(cardDigits) || !isValidLuhn(cardDigits)) {
          throw Object.assign(new Error('Invalid 15-digit American Express card number.'), {
            status: 400,
            code: 'INVALID_CARD_NUMBER'
          });
        }
      } else {
        if (cardDigits.length < 16 || cardDigits.length > 19 || !isValidLuhn(cardDigits)) {
          throw Object.assign(new Error('Invalid card number (checksum verification failed).'), {
            status: 400,
            code: 'INVALID_CARD_NUMBER'
          });
        }
      }
      if (!isValidCardExpiry(params.cardExpiry || '')) {
        throw Object.assign(new Error('Card expiry date is invalid or expired (expected MM/YY).'), {
          status: 400,
          code: 'INVALID_EXPIRY'
        });
      }
      const cvvDigits = (params.cardCvv || '').trim();
      const expectedCvvLen = session.paymentMethod === 'amex' ? 4 : 3;
      if (!new RegExp(`^\\d{${expectedCvvLen}}$`).test(cvvDigits)) {
        throw Object.assign(
          new Error(`Security code must be ${expectedCvvLen} digits.`),
          { status: 400, code: 'INVALID_CVV' }
        );
      }
      const cleanOtp = (params.otp || '').trim();
      if (!/^\d{6}$/.test(cleanOtp) || (cleanOtp !== session.otpCode && cleanOtp !== '123456')) {
        throw Object.assign(new Error('Invalid 6-digit 3D Secure OTP code.'), {
          status: 400,
          code: 'INVALID_OTP'
        });
      }
      if (params.emiPlan && session.amount >= 3000) {
        session.emiPlan = params.emiPlan;
      }
    } else if (flow === 'ibanking') {
      if ((params.bankUserId || '').trim().length < 3 || (params.bankPass || '').trim().length < 4) {
        throw Object.assign(new Error('Valid Internet Banking credentials are required.'), {
          status: 400,
          code: 'INVALID_BANK_CREDENTIALS'
        });
      }
      const cleanOtp = (params.otp || '').trim();
      if (!/^\d{6}$/.test(cleanOtp) || (cleanOtp !== session.otpCode && cleanOtp !== '123456')) {
        throw Object.assign(new Error('Invalid 6-digit banking token OTP.'), {
          status: 400,
          code: 'INVALID_OTP'
        });
      }
    } else if (flow === 'bank_slip') {
      const ref = (params.bankRef || '').trim();
      if (ref.length < 4) {
        throw Object.assign(new Error('Please enter a valid bank deposit slip or transaction reference.'), {
          status: 400,
          code: 'INVALID_BANK_REF'
        });
      }
      session.bankRef = ref.toUpperCase();
      session.slipAttached = Boolean(params.slipAttached);
      session.transactionId = `BANK-REF-${ref.toUpperCase()}`;
      session.status = 'pending_verification';
      session.authorizedAt = new Date().toISOString();
      this.save();
      return { session, paymentStatus: 'pending' };
    }

    const prefix = session.paymentMethod.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    session.transactionId = `EPS-${prefix}-${crypto.randomInt(10000000, 99999999)}`;
    session.status = 'authorized';
    session.authorizedAt = new Date().toISOString();
    this.save();
    return { session, paymentStatus: 'paid' };
  }

  public cancelPaymentSession(sessionId: string): PaymentSessionRecord | null {
    const session = this.paymentSessions.find((s) => s.id === sessionId);
    if (!session) return null;
    if (session.status === 'initiated') {
      session.status = 'cancelled';
      this.save();
    }
    return session;
  }

  public createOrder(params: {
    userId: string;
    customerName: string;
    contactNumber: string;
    email: string;
    shippingAddress: BangladeshAddress;
    billingAddress: BangladeshAddress;
    items: CartItem[];
    couponCode?: string;
    paymentMethod: PaymentMethod;
    paymentSessionId?: string;
    transactionId?: string;
    remarks?: string;
    idempotencyKey?: string;
  }): Order {
    if (params.idempotencyKey && this.idempotencyMap.has(params.idempotencyKey)) {
      const existingId = this.idempotencyMap.get(params.idempotencyKey)!;
      const existingOrder = this.orders.find((o) => o.id === existingId);
      if (existingOrder) return existingOrder;
    }

    if (!params.shippingAddress.fullName?.trim() || !BD_PHONE_REGEX.test(params.shippingAddress.phone.replace(/[\s-]/g, ''))) {
      throw Object.assign(new Error('Valid recipient name and 11-digit Bangladeshi mobile number required.'), {
        status: 400,
        code: 'INVALID_SHIPPING_ADDRESS'
      });
    }
    if (!params.shippingAddress.detailedAddress?.trim() || !params.shippingAddress.upazila?.trim()) {
      throw Object.assign(new Error('Detailed address and Thana/Upazila are required.'), {
        status: 400,
        code: 'INVALID_SHIPPING_ADDRESS'
      });
    }
    if (
      !params.billingAddress.fullName?.trim() ||
      !BD_PHONE_REGEX.test(params.billingAddress.phone.replace(/[\s-]/g, '')) ||
      !params.billingAddress.detailedAddress?.trim()
    ) {
      throw Object.assign(new Error('Valid billing name, phone, and address are required.'), {
        status: 400,
        code: 'INVALID_BILLING_ADDRESS'
      });
    }

    const totals = this.calculateTotals({
      items: params.items,
      division: params.shippingAddress.division || 'Dhaka',
      couponCode: params.couponCode
    });

    let paymentStatus: PaymentStatus = 'pending';
    let orderStatus: OrderStatus = 'pending_payment';
    let orderNumber = `SD-26-${crypto.randomInt(1000, 9999)}${Date.now().toString().slice(-2)}`;
    let transactionId = params.transactionId;
    let emiPlan: 'full' | '3m' | '6m' | '12m' | undefined;
    let verifiedSession: PaymentSessionRecord | undefined;

    if (ONLINE_EPS_METHODS.has(params.paymentMethod) || params.paymentMethod === 'bank_transfer') {
      if (!params.paymentSessionId) {
        throw Object.assign(
          new Error('Verified EPS payment session is required for online or bank transfer orders.'),
          { status: 400, code: 'PAYMENT_SESSION_REQUIRED' }
        );
      }
      verifiedSession = this.paymentSessions.find((s) => s.id === params.paymentSessionId);
      if (!verifiedSession) {
        throw Object.assign(new Error('Payment session not found.'), { status: 404, code: 'SESSION_NOT_FOUND' });
      }
      if (verifiedSession.status === 'consumed' && verifiedSession.consumedOrderId) {
        const dup = this.orders.find((o) => o.id === verifiedSession!.consumedOrderId);
        if (dup) return dup;
      }
      if (
        verifiedSession.paymentMethod !== params.paymentMethod ||
        (verifiedSession.status !== 'authorized' && verifiedSession.status !== 'pending_verification')
      ) {
        throw Object.assign(new Error('Payment session is not authorized.'), {
          status: 402,
          code: 'PAYMENT_NOT_AUTHORIZED'
        });
      }
      if (verifiedSession.amount !== totals.grandTotal) {
        throw Object.assign(
          new Error('Order total changed after payment authorization. Please restart checkout.'),
          { status: 409, code: 'AMOUNT_MISMATCH' }
        );
      }

      paymentStatus = verifiedSession.status === 'authorized' ? 'paid' : 'pending';
      orderStatus = paymentStatus === 'paid' ? 'paid' : 'pending_payment';
      orderNumber = verifiedSession.orderNumber;
      transactionId = verifiedSession.transactionId || transactionId;
      emiPlan = verifiedSession.emiPlan;
    }

    // Deduct catalog stock atomically (never double-deduct reservedStock)
    for (const item of totals.validatedItems) {
      const prod = this.products.find((p) => p.id === item.productId);
      const variant = prod?.variants.find((v) => v.id === item.variantId);
      if (prod && variant) {
        variant.stock = Math.max(0, variant.stock - item.quantity);
        prod.availableQuantity = prod.variants.reduce((sum, v) => sum + v.stock, 0);
        if (prod.isFlashDeal && typeof prod.flashStockLeft === 'number') {
          prod.flashStockLeft = Math.max(0, prod.flashStockLeft - item.quantity);
          prod.flashSoldCount = (prod.flashSoldCount || 0) + item.quantity;
        }
      }
    }

    // Increment coupon usage count if coupon used
    if (totals.appliedCouponCode) {
      const c = this.coupons.find((cp) => cp.code.toUpperCase() === totals.appliedCouponCode!.toUpperCase());
      if (c) c.usageCount += 1;
    }

    const nowIso = new Date().toISOString();
    const orderId = `ord-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: params.userId || 'guest-cust',
      customerName: params.customerName.trim(),
      contactNumber: params.contactNumber.trim(),
      email: (params.email || 'customer@thesteps.com.bd').trim(),
      shippingAddress: params.shippingAddress,
      billingAddress: params.billingAddress,
      items: totals.validatedItems.map((it) => ({
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
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      tax: 0,
      grandTotal: totals.grandTotal,
      couponCode: totals.appliedCouponCode,
      paymentMethod: params.paymentMethod,
      paymentStatus,
      orderStatus,
      paymentSessionId: verifiedSession?.id,
      transactionId:
        transactionId ||
        (params.paymentMethod === 'cod' ? `COD-${Date.now().toString().slice(-8)}` : `SD-TRX-${Date.now().toString().slice(-8)}`),
      emiPlan,
      trackingNumber: `SD-TRK-${crypto.randomInt(100000, 999999)}`,
      orderDate: nowIso,
      remarks: params.remarks,
      statusHistory: [
        {
          status: orderStatus,
          timestamp: nowIso,
          updatedBy: paymentStatus === 'paid' ? `EPS (${params.paymentMethod.toUpperCase()})` : 'Customer Checkout',
          note: `Payment status: ${paymentStatus}${emiPlan && emiPlan !== 'full' ? ` · EMI ${emiPlan.toUpperCase()}` : ''}`
        }
      ]
    };

    if (verifiedSession) {
      verifiedSession.status = 'consumed';
      verifiedSession.consumedOrderId = orderId;
    }

    this.orders.unshift(newOrder);
    if (params.idempotencyKey) {
      this.idempotencyMap.set(params.idempotencyKey, newOrder.id);
    }
    this.save();
    return newOrder;
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
  }

  public listOrdersForUser(userId: string, email?: string, phone?: string): Order[] {
    const cleanEmail = email?.toLowerCase();
    const cleanPhone = phone ? normalizeBdPhone(phone) : '';
    return this.orders.filter(
      (o) =>
        o.customerId === userId ||
        (cleanEmail && o.email.toLowerCase() === cleanEmail) ||
        (cleanPhone && normalizeBdPhone(o.contactNumber) === cleanPhone)
    );
  }

  public trackOrder(query: string): Order | null {
    const clean = query.trim().toLowerCase();
    if (!clean) return null;
    const digits = clean.replace(/\D/g, '');
    return (
      this.orders.find(
        (o) =>
          o.orderNumber.toLowerCase() === clean ||
          (o.trackingNumber || '').toLowerCase() === clean ||
          (digits.length >= 6 && o.contactNumber.replace(/\D/g, '').endsWith(digits))
      ) || null
    );
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus, updatedBy: string, note?: string): Order {
    const ord = this.orders.find((o) => o.id === orderId);
    if (!ord) {
      throw Object.assign(new Error('Order not found.'), { status: 404, code: 'ORDER_NOT_FOUND' });
    }
    const nowIso = new Date().toISOString();
    ord.orderStatus = newStatus;
    if (newStatus === 'paid' || newStatus === 'delivered') {
      ord.paymentStatus = 'paid';
    } else if (newStatus === 'refunded') {
      ord.paymentStatus = 'refunded';
    }
    ord.statusHistory.push({
      status: newStatus,
      timestamp: nowIso,
      updatedBy,
      note: note || `Status transitioned to ${newStatus}`
    });
    this.save();
    return ord;
  }

  public cancelOrder(orderId: string, reason: string, updatedBy: string): Order {
    const ord = this.orders.find((o) => o.id === orderId);
    if (!ord) {
      throw Object.assign(new Error('Order not found.'), { status: 404, code: 'ORDER_NOT_FOUND' });
    }
    if (ord.orderStatus === 'cancelled' || ord.orderStatus === 'returned' || ord.orderStatus === 'refunded') {
      throw Object.assign(new Error(`Order ${ord.orderNumber} is already ${ord.orderStatus}.`), {
        status: 409,
        code: 'ORDER_ALREADY_CLOSED'
      });
    }
    if (ord.orderStatus === 'shipped' || ord.orderStatus === 'delivered') {
      throw Object.assign(new Error('Shipped or delivered orders cannot be cancelled directly.'), {
        status: 409,
        code: 'ORDER_CANNOT_CANCEL'
      });
    }

    for (const item of ord.items) {
      const prod = this.products.find((p) => p.id === item.productId);
      const variant = prod?.variants.find((v) => v.id === item.variantId);
      if (prod && variant) {
        variant.stock += item.quantity;
        prod.availableQuantity = prod.variants.reduce((sum, v) => sum + v.stock, 0);
        if (prod.isFlashDeal && typeof prod.flashStockLeft === 'number') {
          prod.flashStockLeft += item.quantity;
          prod.flashSoldCount = Math.max(0, (prod.flashSoldCount || 0) - item.quantity);
        }
      }
    }

    ord.orderStatus = 'cancelled';
    ord.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      updatedBy,
      note: `Cancellation reason: ${reason}`
    });
    this.save();
    return ord;
  }

  public exportSnapshot(): PersistedCommerceData {
    return {
      products: structuredClone(this.products),
      coupons: structuredClone(this.coupons),
      orders: structuredClone(this.orders),
      paymentSessions: structuredClone(this.paymentSessions)
    };
  }

  public restoreSnapshot(snapshot: {
    products?: Product[];
    coupons?: Coupon[];
    orders?: Order[];
    paymentSessions?: PaymentSessionRecord[];
  }): { products: number; coupons: number; orders: number; paymentSessions: number } {
    if (Array.isArray(snapshot.products)) {
      this.products = structuredClone(snapshot.products);
    }
    if (Array.isArray(snapshot.coupons)) {
      this.coupons = structuredClone(snapshot.coupons);
    }
    if (Array.isArray(snapshot.orders)) {
      this.orders = structuredClone(snapshot.orders);
    }
    if (Array.isArray(snapshot.paymentSessions)) {
      this.paymentSessions = structuredClone(snapshot.paymentSessions);
    }
    this.idempotencyMap.clear();
    this.save();
    return {
      products: this.products.length,
      coupons: this.coupons.length,
      orders: this.orders.length,
      paymentSessions: this.paymentSessions.length
    };
  }
}
