import React, { useState, useEffect } from 'react';
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
  HardDrive
} from 'lucide-react';
import { PaymentMethod } from '../../types';
import { getPaymentChannelInfo } from '../../config/epsPaymentOptions';
import { EpsLogo, PaymentChannelLogo } from './EpsPaymentBadge';
import { optimizeLocalImage } from '../../utils/imageUtils';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  paymentMethod: PaymentMethod;
  amount: number;
  orderNumber: string;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  paymentMethod,
  amount,
  orderNumber,
  onSuccess,
  onCancel
}) => {
  const channel = getPaymentChannelInfo(paymentMethod);
  const [step, setStep] = useState<'input' | 'otp' | 'pin' | 'processing'>('input');
  const [walletNumber, setWalletNumber] = useState('01712998877');
  const [otp, setOtp] = useState('123456');
  const [pin, setPin] = useState('');
  const [bankUserId, setBankUserId] = useState('');
  const [bankPass, setBankPass] = useState('');
  const [cardHolder, setCardHolder] = useState('AURA CUSTOMER');
  const [cardNumber, setCardNumber] = useState(
    paymentMethod === 'amex' ? '3782 822463 10005' : '4111 2222 3333 4444'
  );
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState(paymentMethod === 'amex' ? '1234' : '982');
  const [emiPlan, setEmiPlan] = useState<'full' | '3m' | '6m' | '12m'>('full');
  const [bankRef, setBankRef] = useState('');
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Reset step cleanly whenever modal opens or method changes
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setPin('');
      setError('');
      setCardNumber(paymentMethod === 'amex' ? '3782 822463 10005' : '4111 2222 3333 4444');
      setCardCvv(paymentMethod === 'amex' ? '1234' : '982');
    }
  }, [isOpen, paymentMethod]);

  if (!isOpen) return null;

  const generateTrxId = () => {
    const cleanCode = channel.shortName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    const rand = Math.floor(10000000 + Math.random() * 90000000);
    return `EPS-${cleanCode}-${rand}`;
  };

  // --- MFS Flow ---
  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = walletNumber.replace(/\D/g, '');
    if (digits.length < 11) {
      setError(`Please provide a valid 11-digit ${channel.name} account number.`);
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleMfsOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit verification OTP.');
      return;
    }
    setError('');
    setStep('pin');
  };

  const handleMfsPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter your 4 or 5-digit wallet PIN.');
      return;
    }
    setError('');
    setStep('processing');
    setTimeout(() => {
      onSuccess(generateTrxId());
    }, 1400);
  };

  // --- Card Flow ---
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 15) {
      setError('Please enter a valid card number.');
      return;
    }
    if (!cardExpiry.trim() || !cardCvv.trim()) {
      setError('Please enter card expiry date and CVV/CVC.');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleCardOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit 3D Secure verification OTP.');
      return;
    }
    setError('');
    setStep('processing');
    setTimeout(() => {
      onSuccess(generateTrxId());
    }, 1500);
  };

  // --- Internet Banking Flow ---
  const handleIBankingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankUserId.trim() || !bankPass.trim()) {
      setError(`Please enter your ${channel.name} Internet Banking User ID and Password.`);
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleIBankingOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit banking token/SMS OTP.');
      return;
    }
    setError('');
    setStep('processing');
    setTimeout(() => {
      onSuccess(generateTrxId());
    }, 1500);
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

  const handleBankTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankRef.trim()) {
      setError('Please enter your bank deposit slip or transaction reference number.');
      return;
    }
    setError('');
    setStep('processing');
    setTimeout(() => {
      onSuccess(`BANK-REF-${bankRef.trim().toUpperCase()}`);
    }, 1100);
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
            onClick={onCancel}
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
            <p className="text-neutral-800 font-semibold">Merchant: AURA ATELIER LTD</p>
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
                    onChange={(e) => setWalletNumber(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg pl-9 pr-3 py-2.5 font-mono text-sm font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                    maxLength={14}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  A 6-digit EPS one-time verification code will be sent to this wallet number.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="eps-tos" defaultChecked className="rounded text-neutral-900" />
                <label htmlFor="eps-tos" className="text-neutral-500 text-[11px]">
                  I agree to Easy Payment System (EPS) checkout terms
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
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
              <div className="p-3 bg-neutral-50 rounded-lg text-neutral-600 border border-neutral-200">
                <p>
                  OTP sent to <span className="font-mono font-bold text-neutral-900">{walletNumber}</span>
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Demo verification code: 123456</p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Enter 6-Digit Verification OTP</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-center tracking-widest text-lg font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
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
                  placeholder="•••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-center tracking-widest text-lg font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                  maxLength={5}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('otp')}
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
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
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
                    onChange={(e) => setCardExpiry(e.target.value)}
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
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={4}
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
                  onClick={onCancel}
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
                <p className="font-bold text-neutral-900">3D Secure Verification ({channel.name})</p>
                <p>Enter the 6-digit OTP sent by your card issuing bank to confirm ৳{amount.toLocaleString()}.</p>
                <p className="text-[11px] text-neutral-400">Demo OTP: 123456</p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">3D Secure OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-center tracking-widest text-lg font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
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

          {/* FLOW 3: INTERNET BANKING (Southeast, Meghna, Islami Bank, Al-Arafah) */}
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
                  onClick={onCancel}
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
                <p className="font-bold text-neutral-900">{channel.name} Transaction Authorization</p>
                <p className="mt-0.5">
                  Confirm instant account debit of <span className="font-mono font-bold text-neutral-950">৳{amount.toLocaleString()}</span>.
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">Demo Token OTP: 123456</p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Bank SMS / Hardware Token OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-center tracking-widest text-lg font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
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
                <p className="font-bold text-neutral-950">AURA Garments Corporate Account:</p>
                <p>Bank: <span className="font-semibold text-neutral-900">The City Bank Ltd</span> (Gulshan Branch)</p>
                <p>Account Name: <span className="font-semibold text-neutral-900">AURA ATELIER LTD</span></p>
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
