import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, CheckCircle2, AlertCircle, X, Smartphone } from 'lucide-react';
import { PaymentMethod } from '../../types';

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
  const [step, setStep] = useState<'input' | 'otp' | 'pin' | 'processing'>('input');
  const [walletNumber, setWalletNumber] = useState('01712998877');
  const [otp, setOtp] = useState('123456');
  const [pin, setPin] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletNumber || walletNumber.length < 11) {
      setError('Please provide a valid 11-digit mobile number.');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }
    setError('');
    setStep('pin');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter your 4 or 5-digit PIN.');
      return;
    }
    setError('');
    setStep('processing');

    setTimeout(() => {
      const prefix = paymentMethod === 'bkash' ? 'BKASH' : paymentMethod === 'nagad' ? 'NAGAD' : 'SPG';
      const randomTrx = `${prefix}-TX-${Math.floor(10000000 + Math.random() * 90000000)}`;
      onSuccess(randomTrx);
    }, 1800);
  };

  const handleBankTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankRef) {
      setError('Please enter your bank deposit slip / transaction reference number.');
      return;
    }
    setStep('processing');
    setTimeout(() => {
      onSuccess(`BANK-REF-${bankRef.toUpperCase()}`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Gateway Header Branding */}
        {paymentMethod === 'bkash' && (
          <div className="bg-[#E2136E] text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-[#E2136E] text-lg shadow-sm">
                b
              </div>
              <div>
                <h3 className="font-bold text-base">bKash Payment Gateway</h3>
                <p className="text-xs text-pink-100">Merchant: AURA ATELIER LTD</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-pink-200 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {paymentMethod === 'nagad' && (
          <div className="bg-[#F7941D] text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-[#F7941D] text-lg shadow-sm">
                ন
              </div>
              <div>
                <h3 className="font-bold text-base">Nagad Online Checkout</h3>
                <p className="text-xs text-amber-100">Merchant: AURA ATELIER LTD</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-amber-200 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {paymentMethod === 'sonali' && (
          <div className="bg-[#008080] text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-teal-800 text-lg shadow-sm">
                SPG
              </div>
              <div>
                <h3 className="font-bold text-base">Sonali Payment Gateway</h3>
                <p className="text-xs text-teal-100">Govt & Merchant Electronic Collection</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-teal-200 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {paymentMethod === 'card' && (
          <div className="bg-neutral-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-lg text-emerald-400 border border-neutral-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">3D Secure Card Processing</h3>
                <p className="text-xs text-neutral-400">Visa / Mastercard / AMEX Tokenized</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-neutral-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {paymentMethod === 'bank_transfer' && (
          <div className="bg-neutral-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-lg text-amber-400 border border-neutral-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Manual Corporate Bank Transfer</h3>
                <p className="text-xs text-neutral-400">Deposit Slip & Routing Verification</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-neutral-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Invoice Summary Strip */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center text-xs">
          <div>
            <p className="text-neutral-500 font-mono">Invoice: {orderNumber}</p>
            <p className="text-neutral-700 font-medium">Recipient: AURA Garments Atelier</p>
          </div>
          <div className="text-right">
            <span className="text-neutral-500 block text-[10px] uppercase font-bold">Payable Total</span>
            <span className="text-base font-black font-mono text-neutral-950">৳{amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP: PROCESSING */}
          {step === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
              <h4 className="font-bold text-sm text-neutral-900">Verifying Transaction Token...</h4>
              <p className="text-xs text-neutral-500 max-w-xs">
                Communicating with Bangladesh payment switch. Please do not refresh.
              </p>
            </div>
          )}

          {/* MFS (bKash / Nagad / SPG) STEP 1: MOBILE NUMBER */}
          {step === 'input' && (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'sonali') && (
            <form onSubmit={handleWalletSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Your {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Account'} Mobile Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="e.g. 01712998877"
                    value={walletNumber}
                    onChange={(e) => setWalletNumber(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg pl-9 pr-3 py-2.5 font-mono text-sm font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                    maxLength={11}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  A 6-digit one-time verification OTP will be transmitted to this number.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="tos" defaultChecked className="rounded text-neutral-900" />
                <label htmlFor="tos" className="text-neutral-500 text-[11px]">
                  I agree to the merchant terms & conditions
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
                  className={`w-2/3 py-2.5 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === 'bkash' ? 'bg-[#E2136E] hover:bg-[#c20f5c]' : paymentMethod === 'nagad' ? 'bg-[#F7941D] hover:bg-[#db7e10]' : 'bg-[#008080] hover:bg-teal-900'
                  }`}
                >
                  <span>Confirm Mobile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* MFS STEP 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg text-neutral-600">
                <p>OTP code dispatched to <span className="font-mono font-bold text-neutral-900">{walletNumber}</span></p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Demo auto-filled: 123456</p>
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
                  className={`w-2/3 py-2.5 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === 'bkash' ? 'bg-[#E2136E] hover:bg-[#c20f5c]' : paymentMethod === 'nagad' ? 'bg-[#F7941D] hover:bg-[#db7e10]' : 'bg-[#008080] hover:bg-teal-900'
                  }`}
                >
                  <span>Verify OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* MFS STEP 3: PIN */}
          {step === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg text-neutral-600">
                <p>Enter your secret PIN to authorize transfer of <span className="font-bold text-neutral-900">৳{amount.toLocaleString()}</span></p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Demo simulated PIN: any 4-5 digits (e.g. 12345)</p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Secret PIN</label>
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
                  className={`w-2/3 py-2.5 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === 'bkash' ? 'bg-[#E2136E] hover:bg-[#c20f5c]' : paymentMethod === 'nagad' ? 'bg-[#F7941D] hover:bg-[#db7e10]' : 'bg-[#008080] hover:bg-teal-900'
                  }`}
                >
                  <span>Authorize ৳{amount.toLocaleString()}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* CARD PAYMENT FLOW */}
          {paymentMethod === 'card' && step === 'input' && (
            <form onSubmit={handlePinSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4111 2222 3333 4444"
                  defaultValue="4111 2222 3333 4444"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="12/28"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    placeholder="•••"
                    defaultValue="982"
                    maxLength={4}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Pay ৳{amount.toLocaleString()} Securely</span>
              </button>
            </form>
          )}

          {/* BANK TRANSFER DETAILS & REFERENCE SUBMISSION */}
          {paymentMethod === 'bank_transfer' && step === 'input' && (
            <form onSubmit={handleBankTransferSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5 text-neutral-700">
                <p className="font-bold text-neutral-950">AURA Garments Corporate Accounts:</p>
                <p>· Bank: <span className="font-semibold text-neutral-900">The City Bank Ltd</span> (Gulshan Branch)</p>
                <p>· Account Name: <span className="font-semibold text-neutral-900">AURA ATELIER LTD</span></p>
                <p>· Account No: <span className="font-mono font-bold text-neutral-900">110.229.400192</span></p>
                <p>· Routing Number: <span className="font-mono text-neutral-900">225261478</span></p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Bank Transaction Reference / Deposit Slip No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. CITY-DEP-99482 or Cheque No"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2.5 font-mono text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Our accounts team will verify your deposit slip upon order submission.
                </p>
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
      </div>
    </div>
  );
};
