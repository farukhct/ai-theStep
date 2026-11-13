import React from 'react';
import { Banknote, Building2, CreditCard, Landmark, Smartphone, ShieldCheck } from 'lucide-react';
import { PaymentMethod } from '../../types';

export const EpsLogo: React.FC<{ className?: string; compact?: boolean }> = ({
  className = '',
  compact = false
}) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F766E] via-[#0E7490] to-[#0284C7] flex items-center justify-center shadow-sm shrink-0 border border-white/20">
        <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" aria-hidden="true">
          <path
            d="M6 16C6 10.477 10.477 6 16 6H23L19.5 11H16C13.239 11 11 13.239 11 16C11 18.761 13.239 21 16 21H25L21.5 26H16C10.477 26 6 21.523 6 16Z"
            fill="white"
          />
          <circle cx="22.5" cy="16" r="3" fill="#FBBF24" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-tight text-sm">EPS</span>
            <span className="text-[10px] font-semibold opacity-75">Gateway</span>
          </div>
          <span className="text-[10px] opacity-70 block mt-0.5">Easy Payment System</span>
        </div>
      )}
    </div>
  );
};

interface PaymentChannelLogoProps {
  method: PaymentMethod;
  size?: 'sm' | 'md' | 'lg';
}

export const PaymentChannelLogo: React.FC<PaymentChannelLogoProps> = ({ method, size = 'md' }) => {
  const boxSize =
    size === 'sm' ? 'w-8 h-6 text-[9px]' : size === 'lg' ? 'w-14 h-10 text-xs' : 'w-11 h-8 text-[10px]';

  switch (method) {
    // --- CARDS ---
    case 'visa':
      return (
        <div className={`${boxSize} rounded-md bg-white border border-neutral-200 flex items-center justify-center shadow-2xs shrink-0 px-1`}>
          <span className="font-black italic tracking-tighter text-[#1A1F71] text-[12px]">VISA</span>
        </div>
      );

    case 'mastercard':
      return (
        <div className={`${boxSize} rounded-md bg-white border border-neutral-200 flex items-center justify-center shadow-2xs shrink-0`}>
          <svg viewBox="0 0 36 22" className="w-8 h-5" aria-hidden="true">
            <circle cx="13" cy="11" r="7.5" fill="#EB001B" />
            <circle cx="23" cy="11" r="7.5" fill="#F79E1B" fillOpacity="0.9" />
          </svg>
        </div>
      );

    case 'amex':
      return (
        <div className={`${boxSize} rounded-md bg-[#006FCF] text-white flex items-center justify-center shadow-2xs shrink-0 font-black tracking-tight`}>
          AMEX
        </div>
      );

    case 'dbbl_visa':
      return (
        <div className={`${boxSize} rounded-md bg-gradient-to-br from-[#004B8D] to-[#002855] text-white flex flex-col items-center justify-center shadow-2xs shrink-0 leading-none`}>
          <span className="text-[7px] font-bold tracking-wider text-amber-300">DBBL</span>
          <span className="text-[9px] font-black italic">VISA</span>
        </div>
      );

    case 'dbbl_master':
      return (
        <div className={`${boxSize} rounded-md bg-gradient-to-br from-[#0B5345] to-[#06332A] text-white flex flex-col items-center justify-center shadow-2xs shrink-0 leading-none`}>
          <span className="text-[7px] font-bold tracking-wider text-amber-300">DBBL</span>
          <div className="flex items-center -space-x-1 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B]/90 inline-block" />
          </div>
        </div>
      );

    case 'card':
      return (
        <div className={`${boxSize} rounded-md bg-neutral-900 text-white flex items-center justify-center shadow-2xs shrink-0`}>
          <CreditCard className="w-4 h-4" />
        </div>
      );

    // --- INTERNET BANKING ---
    case 'southeast_bank':
      return (
        <div className={`${boxSize} rounded-md bg-[#0D47A1] text-white flex flex-col items-center justify-center shadow-2xs shrink-0 leading-none`}>
          <Landmark className="w-3 h-3 text-amber-300 mb-0.5" />
          <span className="text-[7px] font-extrabold tracking-wide">SEBL</span>
        </div>
      );

    case 'meghna_bank':
      return (
        <div className={`${boxSize} rounded-md bg-[#00695C] text-white flex flex-col items-center justify-center shadow-2xs shrink-0 leading-none`}>
          <Landmark className="w-3 h-3 text-emerald-200 mb-0.5" />
          <span className="text-[7px] font-extrabold tracking-wide">MGBL</span>
        </div>
      );

    case 'islami_bank':
      return (
        <div className={`${boxSize} rounded-md bg-[#006A4E] text-white flex flex-col items-center justify-center shadow-2xs shrink-0 leading-none`}>
          <Landmark className="w-3 h-3 text-amber-200 mb-0.5" />
          <span className="text-[7px] font-extrabold tracking-wide">IBBL</span>
        </div>
      );

    case 'al_arafah_bank':
      return (
        <div className={`${boxSize} rounded-md bg-[#1B5E20] text-white flex flex-col items-center justify-center shadow-2xs shrink-0 leading-none`}>
          <Landmark className="w-3 h-3 text-lime-200 mb-0.5" />
          <span className="text-[7px] font-extrabold tracking-wide">AIBL</span>
        </div>
      );

    case 'sonali':
      return (
        <div className={`${boxSize} rounded-md bg-[#008080] text-white flex items-center justify-center font-black shadow-2xs shrink-0`}>
          SPG
        </div>
      );

    // --- MOBILE BANKING (MFS) ---
    case 'bkash':
      return (
        <div className={`${boxSize} rounded-md bg-[#E2136E] text-white flex items-center justify-center font-black shadow-2xs shrink-0 tracking-tight`}>
          bKash
        </div>
      );

    case 'nagad':
      return (
        <div className={`${boxSize} rounded-md bg-gradient-to-br from-[#F7941D] to-[#ED1C24] text-white flex items-center justify-center font-black shadow-2xs shrink-0`}>
          নগদ
        </div>
      );

    case 'rocket':
      return (
        <div className={`${boxSize} rounded-md bg-[#8C3494] text-white flex items-center justify-center font-black shadow-2xs shrink-0`}>
          Rocket
        </div>
      );

    case 'ok_wallet':
      return (
        <div className={`${boxSize} rounded-md bg-[#D81B60] text-white flex items-center justify-center font-black shadow-2xs shrink-0`}>
          OK
        </div>
      );

    case 'meghna_pay':
      return (
        <div className={`${boxSize} rounded-md bg-[#00796B] text-white flex items-center justify-center font-extrabold shadow-2xs shrink-0 text-[8px]`}>
          MPay
        </div>
      );

    case 'sheba_pay':
      return (
        <div className={`${boxSize} rounded-md bg-[#283593] text-white flex items-center justify-center font-extrabold shadow-2xs shrink-0 text-[8px]`}>
          Sheba
        </div>
      );

    case 'islamic_wallet':
      return (
        <div className={`${boxSize} rounded-md bg-[#2E7D32] text-white flex items-center justify-center font-extrabold shadow-2xs shrink-0 text-[8px]`}>
          iWallet
        </div>
      );

    case 'upay':
      return (
        <div className={`${boxSize} rounded-md bg-[#0056A6] text-amber-300 flex items-center justify-center font-black shadow-2xs shrink-0`}>
          upay
        </div>
      );

    case 'tap':
      return (
        <div className={`${boxSize} rounded-md bg-[#15803D] text-white flex items-center justify-center font-black shadow-2xs shrink-0`}>
          tap
        </div>
      );

    case 'mcash':
      return (
        <div className={`${boxSize} rounded-md bg-[#0F766E] text-white flex items-center justify-center font-black shadow-2xs shrink-0 text-[9px]`}>
          mCash
        </div>
      );

    // --- OFFLINE / COD ---
    case 'bank_transfer':
      return (
        <div className={`${boxSize} rounded-md bg-neutral-800 text-amber-400 flex items-center justify-center shadow-2xs shrink-0`}>
          <Building2 className="w-4 h-4" />
        </div>
      );

    case 'cod':
    default:
      return (
        <div className={`${boxSize} rounded-md bg-emerald-700 text-white flex items-center justify-center shadow-2xs shrink-0 font-bold`}>
          <Banknote className="w-4 h-4" />
        </div>
      );
  }
};
