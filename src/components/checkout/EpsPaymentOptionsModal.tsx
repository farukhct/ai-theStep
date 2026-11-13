import React from 'react';
import { X, CreditCard, Landmark, Smartphone, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import { EPS_PAYMENT_CHANNELS, EPS_PLATFORM_INFO } from '../../config/epsPaymentOptions';
import { EpsLogo, PaymentChannelLogo } from './EpsPaymentBadge';

interface EpsPaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EpsPaymentOptionsModal: React.FC<EpsPaymentOptionsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const cards = EPS_PAYMENT_CHANNELS.filter((c) => c.category === 'cards');
  const internetBanking = EPS_PAYMENT_CHANNELS.filter((c) => c.category === 'internet_banking');
  const mobileBanking = EPS_PAYMENT_CHANNELS.filter((c) => c.category === 'mobile_banking');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <EpsLogo />
            <div className="hidden sm:block pl-3 border-l border-neutral-800">
              <p className="text-xs font-bold text-white">{EPS_PLATFORM_INFO.title}</p>
              <p className="text-[11px] text-neutral-400">{EPS_PLATFORM_INFO.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close Payment Options"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8">
          {/* Headline */}
          <div className="space-y-2 border-b border-neutral-200 pb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Payment Options
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight font-serif-heading">
              {EPS_PLATFORM_INFO.headline}
            </h2>
            <p className="text-sm text-neutral-600 max-w-2xl">
              {EPS_PLATFORM_INFO.tagline}
            </p>
          </div>

          {/* 1. Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-neutral-800" />
                <h3 className="text-sm font-bold text-neutral-950">Cards · Card payments</h3>
              </div>
              <span className="text-xs text-neutral-500 font-mono">{cards.length} networks</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 flex items-center gap-3"
                >
                  <PaymentChannelLogo method={ch.id} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-950 truncate">{ch.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{ch.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Internet Banking */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-neutral-800" />
                <h3 className="text-sm font-bold text-neutral-950">Internet Banking</h3>
              </div>
              <span className="text-xs text-neutral-500 font-mono">{internetBanking.length} banks</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {internetBanking.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 flex items-center gap-3"
                >
                  <PaymentChannelLogo method={ch.id} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-950 truncate">{ch.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{ch.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Mobile Banking (MFS) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-neutral-800" />
                <h3 className="text-sm font-bold text-neutral-950">Mobile Banking · Mobile financial services</h3>
              </div>
              <span className="text-xs text-neutral-500 font-mono">{mobileBanking.length} wallets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {mobileBanking.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col items-center text-center gap-2"
                >
                  <PaymentChannelLogo method={ch.id} size="md" />
                  <p className="text-xs font-bold text-neutral-950">{ch.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* EPS Gateway Support Info */}
          <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 space-y-2 text-xs text-neutral-600">
            <div className="flex items-center gap-2 font-bold text-neutral-900">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>EPS Gateway Security & Merchant Support</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
              <a href={`tel:${EPS_PLATFORM_INFO.supportPhone}`} className="flex items-center gap-1.5 hover:text-neutral-950">
                <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="font-mono">{EPS_PLATFORM_INFO.supportPhone}</span>
              </a>
              <a href={`mailto:${EPS_PLATFORM_INFO.supportEmail}`} className="flex items-center gap-1.5 hover:text-neutral-950">
                <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">{EPS_PLATFORM_INFO.supportEmail}</span>
              </a>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">Sector-11, Uttara, Dhaka-1230</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
