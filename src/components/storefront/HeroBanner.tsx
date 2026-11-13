import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  BadgePercent,
  ShieldCheck,
  CreditCard,
  Truck,
  Flame
} from 'lucide-react';
import { GARMENT_CATEGORIES } from '../../config/constants';
import { MEDIA_ASSETS } from '../../config/mediaAssets';
import { useLanguage } from '../../context/LanguageContext';

interface HeroBannerProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onOpenVoucherCenter: () => void;
  onOpenEpsOptions: () => void;
}

const HERO_SLIDES = [
  {
    id: 1,
    badge: 'MEGA CAMPAIGN · UP TO 40% OFF',
    title: 'TheSteps Bangladesh 11.11 Mega Electronics & Lifestyle Sale',
    subtitle: 'Official Brand Warranty · Instant bKash, Nagad & Card Payments via EPS · 64-District Delivery',
    cta: 'Shop Flash Deals',
    category: 'mobile-gadgets',
    image: MEDIA_ASSETS.heroTheStepsCampaign
  },
  {
    id: 2,
    badge: 'TECH & WEARABLES',
    title: 'Titanium AMOLED Smart Watches & Hybrid ANC Earbuds',
    subtitle: 'Direct factory pricing with 1-Year TheSteps Care+ replacement warranty.',
    cta: 'Explore Gadgets',
    category: 'audio-headphones',
    image: MEDIA_ASSETS.prodSmartwatchPro
  },
  {
    id: 3,
    badge: 'AUTHENTIC BEAUTY & HOME',
    title: '100% Authentic K-Beauty Skincare & Smart Home Living',
    subtitle: 'Batch-verified skincare serums, air purifiers, and ergonomic furniture.',
    cta: 'Explore Beauty',
    category: 'health-beauty',
    image: MEDIA_ASSETS.prodSkincareSerum
  }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenVoucherCenter,
  onOpenEpsOptions
}) => {
  const { language } = useLanguage();
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = HERO_SLIDES[slideIdx];

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-4">
      {/* TheSteps Split Layout: Left Department Sidebar + Right Promotional Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Department Sidebar (Desktop) */}
        <aside className="hidden lg:flex lg:col-span-3 bg-white rounded-[6px] border border-neutral-200/80 flex-col py-2 shadow-2xs">
          {GARMENT_CATEGORIES.slice(1).map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#ff4300]/10 text-[#ff4300] font-semibold'
                    : 'text-[#292933] hover:bg-neutral-50 hover:text-[#ff4300]'
                }`}
              >
                <span className="truncate">{language === 'bn' ? cat.nameBn : cat.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </button>
            );
          })}
        </aside>

        {/* Right Multi-Slide Hero Carousel */}
        <div className="lg:col-span-9 relative rounded-[6px] overflow-hidden bg-[#292933] min-h-[290px] sm:min-h-[360px] flex items-center shadow-sm">
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-55 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1b1b28]/95 via-[#1b1b28]/75 to-transparent" />

          <div className="relative z-10 p-6 sm:p-10 max-w-xl space-y-4 text-white">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#ff4300] bg-white/10 px-2.5 py-1 rounded">
              <Flame className="w-3.5 h-3.5" />
              <span>{currentSlide.badge}</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-bold leading-tight text-white">
              {currentSlide.title}
            </h1>

            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
              {currentSlide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onSelectCategory(currentSlide.category)}
                className="px-5 py-2.5 bg-[#ff4300] hover:bg-[#d93800] text-white text-xs font-semibold rounded-[5px] cursor-pointer transition-colors"
              >
                {currentSlide.cta}
              </button>
              <button
                type="button"
                onClick={onOpenVoucherCenter}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-semibold rounded-[5px] cursor-pointer transition-colors"
              >
                Collect Vouchers
              </button>
            </div>
          </div>

          {/* Slide Navigation Controls */}
          <button
            type="button"
            onClick={() => setSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-[#ff4300] text-white items-center justify-center cursor-pointer transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-[#ff4300] text-white items-center justify-center cursor-pointer transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {HERO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlideIdx(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  slideIdx === idx ? 'w-6 bg-[#ff4300]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* TheSteps 4-Pillar Guarantee Strip */}
      <div className="bg-white rounded-[6px] border border-neutral-200/80 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100">
        <div className="p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ff4300]/10 text-[#ff4300] flex items-center justify-center shrink-0">
            <BadgePercent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#292933]">Competitive Price</h2>
            <p className="text-[11px] text-neutral-500">Direct Deals &amp; Price Bidding</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E6F4FB] text-[#008ED2] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#292933]">Authentic Products</h2>
            <p className="text-[11px] text-neutral-500">Verified Official Brand Sellers</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenEpsOptions}
          className="p-3.5 sm:p-4 flex items-center gap-3 text-left hover:bg-neutral-50 cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#1b8a3a] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#292933]">Easy &amp; Secured Payment</h2>
            <p className="text-[11px] text-neutral-500">EPS · Cards, bKash, Nagad &amp; COD</p>
          </div>
        </button>

        <div className="p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#292933]">Fast Delivery</h2>
            <p className="text-[11px] text-neutral-500">64 Districts Express Shipping</p>
          </div>
        </div>
      </div>
    </section>
  );
};
