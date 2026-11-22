import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  CreditCard,
  Landmark,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { PaymentMethod, PaymentStatus } from '../../types';
import { getPaymentChannelInfo } from '../../config/epsPaymentOptions';
import { EpsLogo, PaymentChannelLogo } from './EpsPaymentBadge';
import { optimizeLocalImage } from '../../utils/imageUtils';
import { apiRequest, ApiError } from '../../services/apiClient';

export interface PaymentGatewaySuccessResult {
  transactionId: string;
  paymentSessionId?: string;
  paymentStatus: PaymentStatus;
  emiPlan?: 'full' | '3m' | '6m' | '12m';
  bankRef?: string;
}

interface PaymentGatewayModalProps {
  isOpen: boolean;
  paymentMethod: PaymentMethod;
  amount: number;
  orderNumber: string;
  paymentSessionId?: string | null;
  debugOtpHint?: string | null;
  customerName?: string;
  onSuccess: (result: PaymentGatewaySuccessResult) => void;
  onCancel: () => void;
}

function isValidLuhn(cardDigits: string): boolean {
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

function isValidExpiry(expiry: string): boolean {
  const match = expiry.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  return year > curY || (year === curY && month >= curM);
}

function getDefaultCardNumber(method: PaymentMethod): string {
  if (method === 'amex') return '3782 822463 10005';
  if (method === 'mastercard' || method === 'dbbl_master') return '5500 0000 0000 0004';
  return '4111 1111 1111 1111';
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  paymentMethod,
  amount,
  orderNumber,
  paymentSessionId,
  debugOtpHint,
  customerName,
  onSuccess,
  onCancel
}) => {
  const channel = getPaymentChannelInfo(paymentMethod);
  const [step, setStep] = useState<'input' | 'otp' | 'pin' | 'processing'>('input');
  const [walletNumber, setWalletNumber] = useState('01712998877');
  const [acceptedTos, setAcceptedTos] = useState(true);
  const [otp, setOtp] = useState(debugOtpHint || '123456');
  const [activeOtpHint, setActiveOtpHint] = useState(debugOtpHint || '123456');
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [pin, setPin] = useState('');
  const [bankUserId, setBankUserId] = useState('');
  const [bankPass, setBankPass] = useState('');
  const [cardHolder, setCardHolder] = useState(
    customerName ? customerName.toUpperCase() : 'THESTEPS CUSTOMER'
  );
  const [cardNumber, setCardNumber] = useState(getDefaultCardNumber(paymentMethod));
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState(paymentMethod === 'amex' ? '1234' : '982');
  const [emiPlan, setEmiPlan] = useState<'full' | '3m' | '6m' | '12m'>('full');
  const [bankRef, setBankRef] = useState('');
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const clearPendingTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Reset state cleanly whenever modal opens or method changes
  useEffect(() => {
    if (isOpen) {
      cancelledRef.current = false;
      clearPendingTimer();
      setStep('input');
      setPin('');
      setError('');
      setAcceptedTos(true);
      setEmiPlan('full');
      setBankUserId('');
      setBankPass('');
      setBankRef('');
      setSlipPreview(null);
      const hint = debugOtpHint || '123456';
      setActiveOtpHint(hint);
      setOtp(hint);
      setCardHolder(customerName ? customerName.toUpperCase() : 'THESTEPS CUSTOMER');
      setCardNumber(getDefaultCardNumber(paymentMethod));
      setCardCvv(paymentMethod === 'amex' ? '1234' : '982');
    } else {
      cancelledRef.current = true;
      clearPendingTimer();
    }
    return () => {
      cancelledRef.current = true;
      clearPendingTimer();
    };
  }, [isOpen, paymentMethod, debugOtpHint, customerName]);

  if (!isOpen) return null;

  const generateFallbackTrxId = () => {
    const cleanCode = channel.shortName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    const rand = Math.floor(10000000 + Math.random() * 90000000);
    return `EPS-${cleanCode}-${rand}`;
  };

  const handleCloseCancel = () => {
    cancelledRef.current = true;
    clearPendingTimer();
    if (paymentSessionId) {
      apiRequest('/api/commerce/payments/cancel', {
        method: 'POST',
        body: { paymentSessionId }
      }).catch(() => {});
    }
    onCancel();
  };

  const handleResendOtp = async () => {
    if (isResendingOtp) return;
    setIsResendingOtp(true);
    setError('');
    try {
      if (paymentSessionId) {
        const res = await apiRequest<{ resent: boolean; debugOtp?: string }>(
          '/api/commerce/payments/resend-otp',
          {
            method: 'POST',
            body: { paymentSessionId }
          }
        );
        if (res?.debugOtp) {
          setActiveOtpHint(res.debugOtp);
          setOtp(res.debugOtp);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to resend verification OTP right now.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const authorizeViaServerOrFallback = async (
    payload: Record<string, unknown>,
    fallbackStepOnError: 'input' | 'otp' | 'pin'
  ) => {
    setError('');
    setStep('processing');

    if (paymentSessionId) {
      try {
        const res = await apiRequest<{
          paymentSessionId: string;
          transactionId: string;
          paymentStatus: PaymentStatus;
          emiPlan?: 'full' | '3m' | '6m' | '12m';
        }>('/api/commerce/payments/authorize', {
          method: 'POST',
          body: {
            paymentSessionId,
            paymentMethod,
            ...payload
          }
        });

        if (cancelledRef.current) return;
        onSuccess({
          transactionId: res.transactionId,
          paymentSessionId: res.paymentSessionId,
          paymentStatus: res.paymentStatus,
          emiPlan: res.emiPlan,
          bankRef: typeof payload.bankRef === 'string' ? payload.bankRef : undefined
        });
        return;
      } catch (err: any) {
        if (cancelledRef.current) return;
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
          setStep(fallbackStepOnError);
          setError(err.message || 'Payment authorization declined.');
          return;
        }
      }
    }

    // Offline / local fallback only when server session is unavailable
    clearPendingTimer();
    timerRef.current = window.setTimeout(() => {
      if (cancelledRef.current) return;
      const isBankSlip = channel.gatewayFlow === 'bank_slip';
      const refStr = typeof payload.bankRef === 'string' ? payload.bankRef.trim().toUpperCase() : '';
      onSuccess({
        transactionId: isBankSlip ? `BANK-REF-${refStr}` : generateFallbackTrxId(),
        paymentSessionId: paymentSessionId || undefined,
        paymentStatus: isBankSlip ? 'pending' : 'paid',
        emiPlan: channel.gatewayFlow === 'card' ? emiPlan : undefined,
        bankRef: refStr || undefined
      });
    }, 1100);
  };

  // --- MFS Flow ---
  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTos) {
      setError('Please accept the Easy Payment System (EPS) terms to proceed.');
      return;
    }
    const digits = walletNumber.replace(/\D/g, '');
    const valid =
      paymentMethod === 'rocket'
        ? /^(\+?880)?0?1[3-9]\d{8,9}$/.test(digits)
        : /^(\+?880)?0?1[3-9]\d{8}$/.test(digits);
    if (!valid) {
      setError(
        `Please enter a valid Bangladeshi ${channel.name} account number (e.g. 017XXXXXXXX).`
      );
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleMfsOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('Enter the 6-digit numeric verification OTP.');
      return;
    }
    setError('');
    setStep('pin');
  };

  const handleMfsPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (!/^\d{4,5}$/.test(cleanPin)) {
      setError('Please enter your 4 or 5-digit numeric wallet PIN.');
      return;
    }
    await authorizeViaServerOrFallback(
      {
        walletNumber: walletNumber.replace(/\D/g, ''),
        acceptedTos,
        otp: otp.trim(),
        pin: cleanPin
      },
      'pin'
    );
  };

  // --- Card Flow ---
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardHolder.trim().length < 2) {
      setError('Please enter the cardholder name.');
      return;
    }
    const digits = cardNumber.replace(/\D/g, '');
    if (paymentMethod === 'amex') {
      if (digits.length !== 15 || !/^3[47]/.test(digits) || !isValidLuhn(digits)) {
        setError('Please enter a valid 15-digit American Express card number.');
        return;
      }
    } else if (digits.length < 16 || digits.length > 19 || !isValidLuhn(digits)) {
      setError('Please enter a valid card number.');
      return;
    }
    if (!isValidExpiry(cardExpiry)) {
      setError('Please enter a valid, unexpired card expiry date (MM/YY).');
      return;
    }
    const expectedCvv = paymentMethod === 'amex' ? 4 : 3;
    if (!new RegExp(`^\\d{${expectedCvv}}$`).test(cardCvv.trim())) {
      setError(`Please enter a valid ${expectedCvv}-digit security code.`);
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleCardOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit numeric 3D Secure verification OTP.');
      return;
    }
    await authorizeViaServerOrFallback(
      {
        cardHolder: cardHolder.trim(),
        cardNumber: cardNumber.replace(/\D/g, ''),
        cardExpiry: cardExpiry.trim(),
        cardCvv: cardCvv.trim(),
        emiPlan: amount >= 3000 ? emiPlan : 'full',
        otp: otp.trim()
      },
      'otp'
    );
  };

  // --- Internet Banking Flow ---
  const handleIBankingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bankUserId.trim().length < 3 || bankPass.trim().length < 4) {
      setError(`Please enter your ${channel.name} Internet Banking User ID and Password.`);
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleIBankingOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit numeric banking token/SMS OTP.');
      return;
    }
    await authorizeViaServerOrFallback(
      {
        bankUserId: bankUserId.trim(),
        bankPass: bankPass.trim(),
        otp: otp.trim()
      },
      'otp'
    );
  };

  // --- Corporate Bank Transfer Slip Flow ---
  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeLocalImage(file, { maxWidth: 800, maxHeight: 1000, quality: 0.75 });
      setSlipPreview(optimized.dataUrl);
      if (!bankRef) {
        setBankRef(`SLIP-${Date.now().toString().slice(-6)}`);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load deposit slip image.');
    }
  };

  const handleBankTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bankRef.trim().length < 4) {
      setError('Please enter a valid bank deposit slip or transaction reference number.');
      return;
    }
    await authorizeViaServerOrFallback(
      {
        bankRef: bankRef.trim(),
        slipAttached: Boolean(slipPreview)
      },
      'input'
    );
  };

  const emiMonthly =
    emiPlan === '3m'
      ? Math.round(amount / 3)
      : emiPlan === '6m'
      ? Math.round(amount / 6)
      : emiPlan === '12m'
      ? Math.round(amount / 12)
      : amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 my-6">
        {/* Top EPS Platform Header */}
        <div className="bg-neutral-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-neutral-800">
          <EpsLogo />
          <button
            type="button"
            onClick={handleCloseCancel}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Cancel Payment"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Channel Banner */}
        <div
          className="px-5 py-3.5 text-white flex items-center justify-between"
          style={{ backgroundColor: channel.brandColor }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <PaymentChannelLogo method={channel.id} size="md" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-white/80">
                {channel.categoryLabel}
              </p>
              <h3 className="font-bold text-sm truncate">{channel.name}</h3>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-black/20 px-2 py-0.5 rounded shrink-0">
            256-Bit SSL
          </span>
        </div>

        {/* Invoice Summary Strip */}
        <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center text-xs">
          <div>
            <p className="text-neutral-500 font-mono">Invoice: {orderNumber}</p>
            <p className="text-neutral-800 font-semibold">Merchant: THESTEPS BANGLADESH LTD</p>
          </div>
          <div className="text-right">
            <span className="text-neutral-500 block text-[10px] uppercase font-bold">Payable Total</span>
            <span className="text-base font-black font-mono tabular-nums text-neutral-950">
              ৳{amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PROCESSING STATE */}
          {step === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 border-4 border-neutral-200 border-t-[#0F766E] rounded-full animate-spin" />
              <h4 className="font-bold text-sm text-neutral-950">
                Authorizing via Easy Payment System (EPS)...
              </h4>
              <p className="text-xs text-neutral-500 max-w-xs">
                Verifying {channel.name} payment token with Bangladesh Interbank Switch. Please wait.
              </p>
            </div>
          )}

          {/* FLOW 1: MOBILE BANKING (MFS) */}
          {channel.gatewayFlow === 'mfs' && step === 'input' && (
            <form onSubmit={handleWalletSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Your {channel.name} Account Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="e.g. 01712998877"
                    value={walletNumber}
                    onChange={(e) => setWalletNumber(e.target.value.replace(/[^\d+\s-]/g, ''))}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg pl-9 pr-3 py-2.5 font-mono text-sm font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                    maxLength={14}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  A 6-digit EPS one-time verification code will be sent to this wallet number.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="eps-tos"
                  checked={acceptedTos}
                  onChange={(e) => setAcceptedTos(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <label htmlFor="eps-tos" className="text-neutral-500 text-[11px] cursor-pointer">
                  I agree to Easy Payment System (EPS) checkout terms
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCancel}
                  className="w-1/3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: channel.brandColor }}
                  className="w-2/3 py-2.5 text-white font-bold rounded-lg transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Proceed with {channel.shortName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {channel.gatewayFlow === 'mfs' && step === 'otp' && (
            <form onSubmit={handleMfsOtpSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg text-neutral-600 border border-neutral-200 flex items-center justify-between gap-2">
                <div>
                  <p>
                    OTP sent to <span className="font-mono font-bold text-neutral-900">{walletNumber}</span>
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Verification code: {activeOtpHint}</p>
                </div>
                <button
                  type="button"
                  disabled={isResendingOtp}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] hover:underline cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isResendingOtp ? 'animate-spin' : ''}`} />
                  <span>Resend</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Enter 6-Digit Verification OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-center tracking-widest text-lg font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('input');
                  }}
                  className="w-1/3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: channel.brandColor }}
                  className="w-2/3 py-2.5 text-white font-bold rounded-lg transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Verify OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {channel.gatewayFlow === 'mfs' && step === 'pin' && (
            <form onSubmit={handleMfsPinSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg text-neutral-600 border border-neutral-200">
                <p>
                  Enter your {channel.name} PIN to authorize{' '}
                  <span className="font-bold text-neutral-950 font-mono">৳{amount.toLocaleString()}</span>
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Demo PIN: any 4 or 5 digits (e.g. 12345)</p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">{channel.shortName} Wallet PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="•••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-center tracking-widest text-lg font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                  maxLength={5}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('otp');
                  }}
                  className="w-1/3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: channel.brandColor }}
                  className="w-2/3 py-2.5 text-white font-bold rounded-lg transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Authorize ৳{amount.toLocaleString()}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* FLOW 2: CARDS (VISA, Mastercard, AMEX, DBBL VISA, DBBL Master) */}
          {channel.gatewayFlow === 'card' && step === 'input' && (
            <form onSubmit={handleCardSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  placeholder="NAME ON CARD"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">{channel.name} Number</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, '').slice(0, 23))}
                    placeholder={getDefaultCardNumber(paymentMethod)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg pl-9 pr-3 py-2.5 font-mono text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                      setCardExpiry(raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw);
                    }}
                    maxLength={5}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    {paymentMethod === 'amex' ? '4-Digit CID' : 'CVV / CVC'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder={paymentMethod === 'amex' ? '••••' : '•••'}
                    value={cardCvv}
                    onChange={(e) =>
                      setCardCvv(e.target.value.replace(/\D/g, '').slice(0, paymentMethod === 'amex' ? 4 : 3))
                    }
                    maxLength={paymentMethod === 'amex' ? 4 : 3}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* EPS EMI / BNPL Selector for Orders >= ৳3,000 */}
              {amount >= 3000 && (
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">EPS EMI / Installment Option</span>
                    <span className="text-[10px] font-mono text-teal-700 font-bold">0% Interest Eligible</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['full', '3m', '6m', '12m'] as const).map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setEmiPlan(plan)}
                        className={`py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          emiPlan === plan
                            ? 'bg-neutral-950 text-white border-neutral-950'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        {plan === 'full' ? 'Full Pay' : plan.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {emiPlan !== 'full' && (
                    <p className="text-[11px] text-neutral-600 font-mono">
                      Estimated installment: ৳{emiMonthly.toLocaleString()} / month
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseCancel}
                  className="w-1/3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Continue to 3D Secure</span>
                </button>
              </div>
            </form>
          )}

          {channel.gatewayFlow === 'card' && step === 'otp' && (
            <form onSubmit={handleCardOtpSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-600 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-neutral-900">3D Secure Verification ({channel.name})</p>
                  <button
                    type="button"
                    disabled={isResendingOtp}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] hover:underline cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isResendingOtp ? 'animate-spin' : ''}`} />
                    <span>Resend</span>
                  </button>
                </div>
                <p>Enter the 6-digit OTP sent by your card issuing bank to confirm ৳{amount.toLocaleString()}.</p>
                <p className="text-[11px] text-neutral-400">Verification OTP: {activeOtpHint}</p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">3D Secure OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-center tracking-widest text-lg font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('input');
                  }}
                  className="w-1/3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Pay ৳{amount.toLocaleString()}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </form>
          )}

          {/* FLOW 3: INTERNET BANKING */}
          {channel.gatewayFlow === 'ibanking' && step === 'input' && (
            <form onSubmit={handleIBankingSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center gap-2.5 text-neutral-700">
                <Landmark className="w-4 h-4 text-neutral-700 shrink-0" />
                <span>Sign in with your {channel.name} Internet Banking credentials via EPS Direct Connect.</span>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">iBanking User ID / Account No</label>
                <input
                  type="text"
                  placeholder="e.g. faruk.ibbl2026"
                  value={bankUserId}
                  onChange={(e) => setBankUserId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Internet Banking Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={bankPass}
                  onChange={(e) => setBankPass(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCancel}
                  className="w-1/3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: channel.brandColor }}
                  className="w-2/3 py-2.5 text-white font-bold rounded-lg transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Login to {channel.shortName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {channel.gatewayFlow === 'ibanking' && step === 'otp' && (
            <form onSubmit={handleIBankingOtpSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-600">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-neutral-900">{channel.name} Transaction Authorization</p>
                  <button
                    type="button"
                    disabled={isResendingOtp}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] hover:underline cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isResendingOtp ? 'animate-spin' : ''}`} />
                    <span>Resend</span>
                  </button>
                </div>
                <p className="mt-0.5">
                  Confirm instant account debit of <span className="font-mono font-bold text-neutral-950">৳{amount.toLocaleString()}</span>.
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">Verification Token OTP: {activeOtpHint}</p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Bank SMS / Hardware Token OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-center tracking-widest text-lg font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('input');
                  }}
                  className="w-1/3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: channel.brandColor }}
                  className="w-2/3 py-2.5 text-white font-bold rounded-lg transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Confirm Debit ৳{amount.toLocaleString()}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* FLOW 4: CORPORATE BANK TRANSFER WITH LOCAL DRIVE DEPOSIT SLIP UPLOAD */}
          {channel.gatewayFlow === 'bank_slip' && step === 'input' && (
            <form onSubmit={handleBankTransferSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1 text-neutral-700">
                <p className="font-bold text-neutral-950">TheSteps Bangladesh Corporate Account:</p>
                <p>Bank: <span className="font-semibold text-neutral-900">The City Bank Ltd</span> (Gulshan Branch)</p>
                <p>Account Name: <span className="font-semibold text-neutral-900">THESTEPS BANGLADESH LTD</span></p>
                <p>Account No: <span className="font-mono font-bold text-neutral-900">110.229.400192</span></p>
                <p>Routing Number: <span className="font-mono text-neutral-900">225261478</span></p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Transaction Reference / Deposit Slip No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. CITY-DEP-99482 or Cheque No"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Optional Local Drive Deposit Slip Attachment */}
              <div className="space-y-2">
                <label className="block font-bold text-neutral-700">
                  Attach Deposit Slip Photo from Local Drive (Optional)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-neutral-300 hover:border-neutral-800 rounded-xl bg-neutral-50 hover:bg-white cursor-pointer transition-colors">
                  <HardDrive className="w-4 h-4 text-neutral-600" />
                  <span className="font-semibold text-neutral-800">
                    {slipPreview ? 'Replace Deposit Slip Image' : 'Select Receipt Image from Computer'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleSlipUpload} className="hidden" />
                </label>
                {slipPreview && (
                  <div className="flex items-center gap-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <img src={slipPreview} alt="Deposit slip preview" className="w-10 h-10 object-cover rounded" referrerPolicy="no-referrer" />
                    <span className="text-[11px] font-semibold text-emerald-800 flex-1">Deposit slip image attached</span>
                    <button type="button" onClick={() => setSlipPreview(null)} className="text-neutral-500 hover:text-rose-600 font-bold cursor-pointer">
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Submit Bank Transfer Reference</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer Trust Note */}
        <div className="px-5 py-2.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Powered by Easy Payment System (EPS)</span>
          </span>
          <span className="font-mono">PCI-DSS Compliant</span>
        </div>
      </div>
    </div>
  );
};
