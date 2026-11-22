import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  MapPin,
  CreditCard,
  CheckCircle,
  Lock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Landmark,
  Banknote
} from 'lucide-react';
import { BangladeshAddress, PaymentCategory, PaymentMethod, Order } from '../../types';
import { BD_DIVISIONS, BD_DISTRICTS_MAP } from '../../config/constants';
import {
  EPS_PAYMENT_CHANNELS,
  EPS_PLATFORM_INFO,
  getPaymentChannelInfo
} from '../../config/epsPaymentOptions';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useNotification } from '../../context/NotificationContext';
import { PaymentGatewayModal, PaymentGatewaySuccessResult } from './PaymentGatewayModal';
import { EpsLogo, PaymentChannelLogo } from './EpsPaymentBadge';
import { apiRequest, ApiError } from '../../services/apiClient';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

const BD_PHONE_REGEX = /^(\+?880)?0?1[3-9]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhoneInput(val: string): string {
  return val.replace(/[\s-]/g, '');
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess
}) => {
  const {
    cart,
    subtotal,
    discount,
    shippingFee,
    grandTotal,
    appliedCoupon,
    hasStockIssue,
    clearCart,
    selectedDivision,
    setSelectedDivision
  } = useCart();
  const { currentUser, saveAddress } = useAuth();
  const { createOrder } = useStore();
  const { addToast } = useNotification();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Shipping, 2: Billing & Review, 3: Payment
  const [isSameBilling, setIsSameBilling] = useState(true);
  const [activePaymentTab, setActivePaymentTab] = useState<PaymentCategory>('mobile_banking');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentSession, setPaymentSession] = useState<{
    paymentSessionId?: string;
    orderNumber: string;
    debugOtp?: string;
    amount: number;
  } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `chk-${Date.now()}`);

  const buildInitialShipping = (): BangladeshAddress => {
    const savedAddr = currentUser?.addresses?.[0];
    const div = selectedDivision || savedAddr?.division || 'Dhaka';
    const allowedDistricts = BD_DISTRICTS_MAP[div] || ['Dhaka City'];
    const dist = savedAddr?.district && allowedDistricts.includes(savedAddr.district)
      ? savedAddr.district
      : allowedDistricts[0];
    return {
      fullName: currentUser?.displayName || savedAddr?.fullName || '',
      phone: currentUser?.phoneNumber || savedAddr?.phone || '',
      altPhone: savedAddr?.altPhone || '',
      email: currentUser?.email || savedAddr?.email || '',
      division: div,
      district: dist,
      upazila: savedAddr?.upazila || '',
      detailedAddress: savedAddr?.detailedAddress || '',
      postcode: savedAddr?.postcode || '',
      deliveryNotes: savedAddr?.deliveryNotes || ''
    };
  };

  const buildInitialBilling = (): BangladeshAddress => ({
    fullName: currentUser?.displayName || '',
    phone: currentUser?.phoneNumber || '',
    email: currentUser?.email || '',
    division: 'Dhaka',
    district: 'Dhaka City',
    upazila: '',
    detailedAddress: '',
    postcode: ''
  });

  const [shipping, setShipping] = useState<BangladeshAddress>(buildInitialShipping);
  const [billing, setBilling] = useState<BangladeshAddress>(buildInitialBilling);

  // Reset modal cleanly every time it opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setIsSubmitting(false);
      setIsGatewayOpen(false);
      setPaymentSession(null);
      setIdempotencyKey(`chk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      setShipping(buildInitialShipping());
      setBilling(buildInitialBilling());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keep division synced when opened
  useEffect(() => {
    if (isOpen && selectedDivision && shipping.division !== selectedDivision) {
      const allowedDistricts = BD_DISTRICTS_MAP[selectedDivision] || ['Dhaka City'];
      setShipping((prev) => ({
        ...prev,
        division: selectedDivision,
        district: allowedDistricts.includes(prev.district) ? prev.district : allowedDistricts[0]
      }));
    }
  }, [isOpen, selectedDivision, shipping.division]);

  if (!isOpen) return null;

  const activeCouponCode = discount > 0 && appliedCoupon ? appliedCoupon.code : undefined;

  const handleDivisionChange = (div: string) => {
    setShipping((prev) => ({
      ...prev,
      division: div,
      district: BD_DISTRICTS_MAP[div]?.[0] || 'Dhaka City'
    }));
    setSelectedDivision(div);
  };

  const handleBillingDivisionChange = (div: string) => {
    setBilling((prev) => ({
      ...prev,
      division: div,
      district: BD_DISTRICTS_MAP[div]?.[0] || 'Dhaka City'
    }));
  };

  const validateShipping = (): string => {
    if (cart.length === 0) return 'Your cart is empty. Add items before checking out.';
    if (hasStockIssue) return 'One or more items in your cart exceed available stock.';
    if (shipping.fullName.trim().length < 2) return 'Please enter your full name.';
    if (!BD_PHONE_REGEX.test(normalizePhoneInput(shipping.phone))) {
      return 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX).';
    }
    if (shipping.altPhone && shipping.altPhone.trim() && !BD_PHONE_REGEX.test(normalizePhoneInput(shipping.altPhone))) {
      return 'Alternative phone must be a valid 11-digit Bangladeshi mobile number.';
    }
    if (shipping.email && shipping.email.trim() && !EMAIL_REGEX.test(shipping.email.trim())) {
      return 'Please enter a valid email address for order updates and invoices.';
    }
    if (!shipping.upazila.trim()) {
      return 'Please specify your Thana / Upazila.';
    }
    if (shipping.detailedAddress.trim().length < 5) {
      return 'Please enter your detailed house, road, and area address.';
    }
    return '';
  };

  const validateBilling = (): string => {
    if (cart.length === 0) return 'Your cart is empty. Add items before checking out.';
    if (hasStockIssue) return 'One or more items in your cart exceed available stock.';
    if (isSameBilling) return '';
    if (billing.fullName.trim().length < 2) return 'Please enter a billing recipient full name.';
    if (!BD_PHONE_REGEX.test(normalizePhoneInput(billing.phone))) {
      return 'Please enter a valid 11-digit Bangladeshi mobile number for billing.';
    }
    if (!billing.upazila.trim()) return 'Please specify the billing Thana / Upazila.';
    if (billing.detailedAddress.trim().length < 5) return 'Please enter the detailed billing street address.';
    return '';
  };

  const handleNextToReview = () => {
    const err = validateShipping();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    if (currentUser) {
      saveAddress(shipping).catch(() => {
        // Non-blocking profile save
      });
    }
    setStep(2);
  };

  const handleNextToPayment = () => {
    const err = validateBilling();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(3);
  };

  const handleProceedToPayment = async () => {
    if (isSubmitting) return;
    const shipErr = validateShipping();
    if (shipErr) {
      setError(shipErr);
      setStep(1);
      return;
    }
    const billErr = validateBilling();
    if (billErr) {
      setError(billErr);
      setStep(2);
      return;
    }

    setError('');

    if (paymentMethod === 'cod' || grandTotal <= 0) {
      setIsSubmitting(true);
      try {
        const order = await createOrder({
          customerName: shipping.fullName.trim(),
          contactNumber: shipping.phone.trim(),
          email: shipping.email.trim() || currentUser?.email || 'customer@thesteps.com.bd',
          shippingAddress: shipping,
          billingAddress: isSameBilling ? shipping : billing,
          items: cart,
          subtotal,
          discount,
          shippingFee,
          grandTotal,
          couponCode: activeCouponCode,
          paymentMethod: grandTotal <= 0 ? 'cod' : 'cod',
          paymentStatus: grandTotal <= 0 ? 'paid' : 'pending',
          idempotencyKey,
          remarks: grandTotal <= 0 ? 'Paid in full by voucher' : 'Cash on delivery verified'
        });
        clearCart();
        setIsSubmitting(false);
        onClose();
        onOrderSuccess(order);
      } catch (e: any) {
        setIsSubmitting(false);
        setError(e?.message || 'Failed to place order.');
      }
      return;
    }

    // Initiate verified EPS online payment session with backend
    setIsSubmitting(true);
    try {
      const initiated = await apiRequest<{
        paymentSessionId: string;
        orderNumber: string;
        amount: number;
        debugOtp?: string;
      }>('/api/commerce/payments/initiate', {
        method: 'POST',
        body: {
          paymentMethod,
          items: cart,
          division: shipping.division,
          couponCode: activeCouponCode,
          customerName: shipping.fullName.trim(),
          contactNumber: shipping.phone.trim(),
          email: shipping.email.trim() || currentUser?.email || 'customer@thesteps.com.bd'
        }
      });

      setPaymentSession({
        paymentSessionId: initiated.paymentSessionId,
        orderNumber: initiated.orderNumber,
        amount: initiated.amount,
        debugOtp: initiated.debugOtp
      });
      setIsSubmitting(false);
      setIsGatewayOpen(true);
    } catch (e: any) {
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
        setIsSubmitting(false);
        setError(e.message || 'Could not initiate online payment.');
        return;
      }
      // Graceful fallback if offline
      setPaymentSession({
        orderNumber: `SD-26-${Date.now().toString().slice(-4)}`,
        amount: grandTotal
      });
      setIsSubmitting(false);
      setIsGatewayOpen(true);
    }
  };

  const handleGatewaySuccess = async (result: PaymentGatewaySuccessResult) => {
    setIsGatewayOpen(false);
    setIsSubmitting(true);
    setError('');
    try {
      const channelInfo = getPaymentChannelInfo(paymentMethod);
      const emiNote = result.emiPlan && result.emiPlan !== 'full' ? ` · EMI ${result.emiPlan.toUpperCase()}` : '';
      const order = await createOrder({
        customerName: shipping.fullName.trim(),
        contactNumber: shipping.phone.trim(),
        email: shipping.email.trim() || currentUser?.email || 'customer@thesteps.com.bd',
        shippingAddress: shipping,
        billingAddress: isSameBilling ? shipping : billing,
        items: cart,
        subtotal,
        discount,
        shippingFee,
        grandTotal: paymentSession?.amount ?? grandTotal,
        couponCode: activeCouponCode,
        paymentMethod,
        paymentStatus: result.paymentStatus,
        paymentSessionId: result.paymentSessionId,
        transactionId: result.transactionId,
        emiPlan: result.emiPlan,
        orderNumber: paymentSession?.orderNumber,
        idempotencyKey,
        remarks: `EPS ${channelInfo.name} (${channelInfo.categoryLabel}) ref: ${result.transactionId}${emiNote}`
      });
      clearCart();
      setIsSubmitting(false);
      onClose();
      onOrderSuccess(order);
    } catch (e: any) {
      setIsSubmitting(false);
      const msg = e?.message || 'Failed to finalize order after payment authorization.';
      setError(msg);
      addToast('Order Finalization Error', msg, 'error');
    }
  };

  const handlePaymentTabChange = (cat: PaymentCategory) => {
    setActivePaymentTab(cat);
    setError('');
    const currentCat = getPaymentChannelInfo(paymentMethod).category;
    if (currentCat !== cat) {
      const firstInCat = EPS_PAYMENT_CHANNELS.find((ch) => ch.category === cat);
      if (firstInCat) setPaymentMethod(firstInCat.id);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-lg text-emerald-400 border border-neutral-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Secure TheSteps Checkout</h3>
                <p className="text-xs text-neutral-400">256-Bit Encrypted Bangladesh Payment Architecture</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-500 shrink-0">
            <span className={step >= 1 ? 'text-neutral-950 flex items-center gap-1.5' : ''}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-neutral-950 text-white' : 'bg-neutral-200'}`}>1</span>
              <span>Shipping Address</span>
            </span>
            <span className="text-neutral-300">———</span>
            <span className={step >= 2 ? 'text-neutral-950 flex items-center gap-1.5' : ''}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-neutral-950 text-white' : 'bg-neutral-200'}`}>2</span>
              <span>Review & Billing</span>
            </span>
            <span className="text-neutral-300">———</span>
            <span className={step >= 3 ? 'text-neutral-950 flex items-center gap-1.5' : ''}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-neutral-950 text-white' : 'bg-neutral-200'}`}>3</span>
              <span>Payment Channel</span>
            </span>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: SHIPPING ADDRESS */}
            {step === 1 && (
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-sm text-neutral-950 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  <span>Customer Delivery Information (Bangladesh)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Tanvir Ahmed"
                      value={shipping.fullName}
                      onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Mobile Number (+880) *</label>
                    <input
                      type="tel"
                      placeholder="017XXXXXXXX"
                      value={shipping.phone}
                      onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Email Address (For Invoice)</label>
                    <input
                      type="email"
                      placeholder="e.g. tanvir@gmail.com"
                      value={shipping.email}
                      onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Alternative Phone (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 018XXXXXXXX"
                      value={shipping.altPhone}
                      onChange={(e) => setShipping({ ...shipping, altPhone: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Division *</label>
                    <select
                      value={shipping.division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-2 text-neutral-900 focus:outline-none"
                    >
                      {BD_DIVISIONS.map((div) => (
                        <option key={div} value={div}>
                          {div}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">District *</label>
                    <select
                      value={shipping.district}
                      onChange={(e) => setShipping({ ...shipping, district: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-2 text-neutral-900 focus:outline-none"
                    >
                      {(BD_DISTRICTS_MAP[shipping.division] || ['Dhaka City']).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Upazila / Thana *</label>
                    <input
                      type="text"
                      placeholder="e.g. Gulshan / Dhanmondi"
                      value={shipping.upazila}
                      onChange={(e) => setShipping({ ...shipping, upazila: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Detailed Street Address *</label>
                  <textarea
                    rows={2}
                    placeholder="House number, road number, flat/floor, sector/block, landmark..."
                    value={shipping.detailedAddress}
                    onChange={(e) => setShipping({ ...shipping, detailedAddress: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Delivery Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Please call before arriving or leave with security"
                    value={shipping.deliveryNotes}
                    onChange={(e) => setShipping({ ...shipping, deliveryNotes: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: BILLING & ORDER SUMMARY */}
            {step === 2 && (
              <div className="space-y-5 text-xs">
                {/* Billing Address Toggle */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sameBilling"
                      checked={isSameBilling}
                      onChange={(e) => setIsSameBilling(e.target.checked)}
                      className="rounded text-neutral-900"
                    />
                    <label htmlFor="sameBilling" className="font-bold text-neutral-900 cursor-pointer">
                      Billing address is same as shipping address
                    </label>
                  </div>

                  {!isSameBilling && (
                    <div className="pt-3 space-y-3 border-t border-neutral-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Billing Full Name *"
                          value={billing.fullName}
                          onChange={(e) => setBilling({ ...billing, fullName: e.target.value })}
                          className="bg-white border border-neutral-300 rounded-lg px-3 py-2"
                        />
                        <input
                          type="tel"
                          placeholder="Billing Mobile (017XXXXXXXX) *"
                          value={billing.phone}
                          onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                          className="bg-white border border-neutral-300 rounded-lg px-3 py-2 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <select
                          value={billing.division}
                          onChange={(e) => handleBillingDivisionChange(e.target.value)}
                          className="bg-white border border-neutral-300 rounded-lg px-2.5 py-2"
                        >
                          {BD_DIVISIONS.map((div) => (
                            <option key={div} value={div}>
                              {div}
                            </option>
                          ))}
                        </select>
                        <select
                          value={billing.district}
                          onChange={(e) => setBilling({ ...billing, district: e.target.value })}
                          className="bg-white border border-neutral-300 rounded-lg px-2.5 py-2"
                        >
                          {(BD_DISTRICTS_MAP[billing.division] || ['Dhaka City']).map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Upazila / Thana *"
                          value={billing.upazila}
                          onChange={(e) => setBilling({ ...billing, upazila: e.target.value })}
                          className="bg-white border border-neutral-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Detailed Billing Address *"
                        value={billing.detailedAddress}
                        onChange={(e) => setBilling({ ...billing, detailedAddress: e.target.value })}
                        className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  )}
                </div>

                {/* Shipping Summary Review Card */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold uppercase tracking-wider text-neutral-500 text-[11px]">Deliver To:</h5>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-neutral-900 font-bold underline text-[11px] cursor-pointer"
                    >
                      Edit Address
                    </button>
                  </div>
                  <p className="font-bold text-neutral-900 text-sm">{shipping.fullName} ({shipping.phone})</p>
                  <p className="text-neutral-600 mt-0.5">{shipping.detailedAddress}, {shipping.upazila}, {shipping.district}, {shipping.division}</p>
                </div>

                {/* Items in Cart */}
                <div className="space-y-2">
                  <h5 className="font-bold uppercase tracking-wider text-neutral-500 text-[11px]">Items ({cart.length})</h5>
                  <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                    {cart.map((it) => (
                      <div key={it.variantId} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={it.image} alt={it.productName} className="w-9 h-11 object-cover rounded bg-neutral-100" />
                          <div>
                            <p className="font-bold text-neutral-900 truncate max-w-[200px]">{it.productName}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              {it.size} · {it.color} · Qty: {it.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-neutral-900">
                          ৳{(it.discountedPrice * it.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-4 bg-neutral-900 text-white rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-300">
                    <span>Subtotal</span>
                    <span className="font-mono">৳{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount{activeCouponCode ? ` (${activeCouponCode})` : ''}</span>
                      <span className="font-mono">-৳{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-300">
                    <span>Delivery Charge ({shipping.division})</span>
                    <span className="font-mono">{shippingFee === 0 ? 'FREE' : `৳${shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-700 text-sm font-black text-white">
                    <span>Grand Total</span>
                    <span className="font-mono">৳{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: EASY PAYMENT SYSTEM (EPS) INTEGRATED CHECKOUT */}
            {step === 3 && (() => {
              const selectedChannel = getPaymentChannelInfo(paymentMethod);
              const channelsInTab = EPS_PAYMENT_CHANNELS.filter((ch) => ch.category === activePaymentTab);

              return (
                <div className="space-y-4 text-xs">
                  {/* EPS Banner Header */}
                  <div className="p-4 rounded-xl bg-neutral-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <EpsLogo />
                      <p className="text-[11px] text-neutral-300 leading-relaxed pt-1">
                        {EPS_PLATFORM_INFO.headline} · Cards, Internet Banking &amp; Mobile Financial Services in one checkout.
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Payable Total</span>
                      <span className="text-lg font-black font-mono tabular-nums text-white">৳{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Interactive Payment Category Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-neutral-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handlePaymentTabChange('mobile_banking')}
                      className={`py-2 px-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activePaymentTab === 'mobile_banking'
                          ? 'bg-white text-neutral-950 shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile Banking</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePaymentTabChange('cards')}
                      className={`py-2 px-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activePaymentTab === 'cards'
                          ? 'bg-white text-neutral-950 shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Cards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePaymentTabChange('internet_banking')}
                      className={`py-2 px-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activePaymentTab === 'internet_banking'
                          ? 'bg-white text-neutral-950 shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      <Landmark className="w-3.5 h-3.5" />
                      <span>Internet Banking</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePaymentTabChange('cod')}
                      className={`py-2 px-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activePaymentTab === 'cod'
                          ? 'bg-white text-neutral-950 shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Cash / Bank</span>
                    </button>
                  </div>

                  {/* EPS Channels Grid for Active Tab */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {channelsInTab.map((ch) => {
                      const isSelected = paymentMethod === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setPaymentMethod(ch.id)}
                          className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? `${ch.borderActive} ${ch.bgTint} shadow-xs`
                              : 'border-neutral-200 hover:border-neutral-300 bg-white'
                          }`}
                        >
                          <PaymentChannelLogo method={ch.id} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-bold text-neutral-950 truncate">{ch.name}</p>
                              {isSelected && <CheckCircle className="w-4 h-4 text-neutral-950 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-neutral-500 truncate mt-0.5">{ch.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Channel Confirmation Strip */}
                  <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PaymentChannelLogo method={selectedChannel.id} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-950 truncate">
                          Selected: {selectedChannel.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">
                          {selectedChannel.categoryLabel} · Atomic stock &amp; payment verification
                        </p>
                      </div>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Stepper Footer Controls */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep((s) => (s - 1) as 1 | 2 | 3);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step === 1 && (
              <button
                type="button"
                disabled={cart.length === 0 || hasStockIssue}
                onClick={handleNextToReview}
                className="flex items-center gap-2 px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={cart.length === 0 || hasStockIssue}
                onClick={handleNextToPayment}
                className="flex items-center gap-2 px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <span>Select Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={isSubmitting || cart.length === 0 || hasStockIssue}
                onClick={handleProceedToPayment}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md"
              >
                <span>
                  {isSubmitting
                    ? 'Preparing...'
                    : paymentMethod === 'cod' || grandTotal <= 0
                    ? 'Confirm Order (COD)'
                    : `Pay ৳${grandTotal.toLocaleString()} · ${getPaymentChannelInfo(paymentMethod).shortName}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EPS Payment Gateway */}
      {isGatewayOpen && (
        <PaymentGatewayModal
          isOpen={isGatewayOpen}
          paymentMethod={paymentMethod}
          amount={paymentSession?.amount ?? grandTotal}
          orderNumber={paymentSession?.orderNumber || `SD-26-${Date.now().toString().slice(-4)}`}
          paymentSessionId={paymentSession?.paymentSessionId}
          debugOtpHint={paymentSession?.debugOtp}
          customerName={shipping.fullName}
          onSuccess={handleGatewaySuccess}
          onCancel={() => {
            setIsGatewayOpen(false);
            setPaymentSession(null);
          }}
        />
      )}
    </>
  );
};
