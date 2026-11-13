import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  Truck, 
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
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { EpsLogo, PaymentChannelLogo } from './EpsPaymentBadge';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess
}) => {
  const { cart, subtotal, discount, shippingFee, grandTotal, clearCart, selectedDivision, setSelectedDivision } = useCart();
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

  // Shipping Form State
  const defaultSavedAddr = currentUser?.addresses?.[0];
  const [shipping, setShipping] = useState<BangladeshAddress>({
    fullName: currentUser?.displayName || defaultSavedAddr?.fullName || '',
    phone: currentUser?.phoneNumber || defaultSavedAddr?.phone || '',
    altPhone: defaultSavedAddr?.altPhone || '',
    email: currentUser?.email || defaultSavedAddr?.email || '',
    division: selectedDivision || defaultSavedAddr?.division || 'Dhaka',
    district: defaultSavedAddr?.district || 'Dhaka City',
    upazila: defaultSavedAddr?.upazila || '',
    detailedAddress: defaultSavedAddr?.detailedAddress || '',
    postcode: defaultSavedAddr?.postcode || '',
    deliveryNotes: defaultSavedAddr?.deliveryNotes || ''
  });

  // Billing Form State
  const [billing, setBilling] = useState<BangladeshAddress>({
    fullName: currentUser?.displayName || '',
    phone: currentUser?.phoneNumber || '',
    email: currentUser?.email || '',
    division: 'Dhaka',
    district: 'Dhaka City',
    upazila: '',
    detailedAddress: '',
    postcode: ''
  });

  if (!isOpen) return null;

  const handleDivisionChange = (div: string) => {
    setShipping((prev) => ({
      ...prev,
      division: div,
      district: BD_DISTRICTS_MAP[div]?.[0] || 'Dhaka City'
    }));
    setSelectedDivision(div);
  };

  const validateShipping = () => {
    if (!shipping.fullName.trim()) return 'Please enter your full name.';
    if (!shipping.phone.trim() || shipping.phone.length < 11) {
      return 'Please enter a valid 11-digit Bangladeshi mobile number (+880).';
    }
    if (!shipping.detailedAddress.trim()) {
      return 'Please enter your detailed house, road, and area address.';
    }
    if (!shipping.upazila.trim()) {
      return 'Please specify your Thana / Upazila.';
    }
    return '';
  };

  const handleNextToReview = () => {
    const err = validateShipping();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    // Auto-save address for future orders
    saveAddress(shipping);
    setStep(2);
  };

  const handleProceedToPayment = async () => {
    if (paymentMethod === 'cod') {
      // Cash on delivery: instant order creation with payment status = pending
      setIsSubmitting(true);
      try {
        const order = await createOrder({
          customerName: shipping.fullName,
          contactNumber: shipping.phone,
          email: shipping.email || currentUser?.email || 'customer@thesteps.com.bd',
          shippingAddress: shipping,
          billingAddress: isSameBilling ? shipping : billing,
          items: cart,
          subtotal,
          discount,
          shippingFee,
          grandTotal,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          remarks: 'Cash on delivery verified'
        });
        clearCart();
        setIsSubmitting(false);
        onClose();
        onOrderSuccess(order);
      } catch (e: any) {
        setIsSubmitting(false);
        setError(e.message || 'Failed to place order');
      }
    } else {
      // Open Gateway simulation for bKash, Nagad, Sonali Bank, Card, Bank Transfer
      setIsGatewayOpen(true);
    }
  };

  const handleGatewaySuccess = async (transactionId: string) => {
    setIsGatewayOpen(false);
    setIsSubmitting(true);
    try {
      const channelInfo = getPaymentChannelInfo(paymentMethod);
      const isPaid = paymentMethod !== 'bank_transfer';
      const order = await createOrder({
        customerName: shipping.fullName,
        contactNumber: shipping.phone,
        email: shipping.email || currentUser?.email || 'customer@thesteps.com.bd',
        shippingAddress: shipping,
        billingAddress: isSameBilling ? shipping : billing,
        items: cart,
        subtotal,
        discount,
        shippingFee,
        grandTotal,
        paymentMethod,
        paymentStatus: isPaid ? 'paid' : 'pending',
        transactionId,
        remarks: `EPS ${channelInfo.name} (${channelInfo.categoryLabel}) verified: ${transactionId}`
      });
      clearCart();
      setIsSubmitting(false);
      onClose();
      onOrderSuccess(order);
    } catch (e: any) {
      setIsSubmitting(false);
      setError(e.message || 'Failed to finalize transaction');
    }
  };

  const handlePaymentTabChange = (cat: PaymentCategory) => {
    setActivePaymentTab(cat);
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
                <h3 className="text-base font-bold">Secure Garments Checkout</h3>
                <p className="text-xs text-neutral-400">256-Bit Encrypted Bangladesh Payment Architecture</p>
              </div>
            </div>
            <button
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
                    >
                    </input>
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
                    <div className="pt-2 space-y-3 border-t border-neutral-200">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Billing Name"
                          value={billing.fullName}
                          onChange={(e) => setBilling({ ...billing, fullName: e.target.value })}
                          className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5"
                        />
                        <input
                          type="text"
                          placeholder="Billing Phone"
                          value={billing.phone}
                          onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                          className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Detailed Billing Address"
                        value={billing.detailedAddress}
                        onChange={(e) => setBilling({ ...billing, detailedAddress: e.target.value })}
                        className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5"
                      />
                    </div>
                  )}
                </div>

                {/* Shipping Summary Review Card */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold uppercase tracking-wider text-neutral-500 text-[11px]">Deliver To:</h5>
                    <button
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
                      <span>Discount</span>
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
                          {selectedChannel.categoryLabel} · Atomic stock reservation on confirmation
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
                onClick={() => setStep((s) => (s - 1) as any)}
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
                onClick={handleNextToReview}
                className="flex items-center gap-2 px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <span>Select Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                disabled={isSubmitting}
                onClick={handleProceedToPayment}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md"
              >
                <span>
                  {paymentMethod === 'cod'
                    ? 'Confirm Order (COD)'
                    : `Pay ৳${grandTotal.toLocaleString()} · ${getPaymentChannelInfo(paymentMethod).shortName}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EPS Payment Gateway Simulator */}
      {isGatewayOpen && (
        <PaymentGatewayModal
          isOpen={isGatewayOpen}
          paymentMethod={paymentMethod}
          amount={grandTotal}
          orderNumber={`AURA-26-${Date.now().toString().slice(-4)}`}
          onSuccess={handleGatewaySuccess}
          onCancel={() => setIsGatewayOpen(false)}
        />
      )}
    </>
  );
};
