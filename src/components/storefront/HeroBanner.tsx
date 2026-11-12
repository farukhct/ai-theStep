import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Tag, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  onExplore: (category?: string) => void;
  onOpenSizeGuide: () => void;
}

const SLIDES = [
  {
    id: 1,
    tag: 'LIMITED CAPSULE RELEASE',
    title: 'The Heavyweight 240 GSM Oversized Series',
    subtitle: 'Combed ring-spun cotton engineered in Bangladesh mills. Clean drop-shoulder silhouette built for effortless drape and all-day structure.',
    badge: 'NEW DROP',
    category: 't-shirts',
    bgImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1600&auto=format&fit=crop&q=80',
    accentColor: 'from-neutral-950 via-neutral-950/80 to-transparent'
  },
  {
    id: 2,
    tag: 'FESTIVE SARTORIAL',
    title: 'Jacquard Panjabi & Executive Giza Cotton Shirts',
    subtitle: 'Hand-finished mother-of-pearl hardware, mandarin collars, and 80s 2-ply pinpoint Egyptian cotton tailored for dignified occasions.',
    badge: 'CURATED',
    category: 'panjabi',
    bgImage: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=1600&auto=format&fit=crop&q=80',
    accentColor: 'from-stone-950 via-stone-950/80 to-transparent'
  },
  {
    id: 3,
    tag: 'RAW SELVEDGE LAB',
    title: 'Shuttle-Loom Red-Line Denim & Stretch Chinos',
    subtitle: '14.5oz untreated natural indigo selvedge denim woven in Narayanganj. Pure brass rivets and vegetable-tanned leather patch.',
    badge: 'BEST SELLER',
    category: 'jeans',
    bgImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1600&auto=format&fit=crop&q=80',
    accentColor: 'from-slate-950 via-slate-950/80 to-transparent'
  }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExplore, onOpenSizeGuide }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <div className="relative overflow-hidden bg-neutral-950 text-white min-h-[460px] sm:min-h-[520px] flex items-center">
      {/* Background Image with Cinematic Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${slide.bgImage})` }}
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.accentColor}`} />
      <div className="absolute inset-0 bg-radial from-transparent via-neutral-950/40 to-neutral-950/90" />

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full z-10">
        <div className="max-w-xl space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-white/10 backdrop-blur-md text-[10px] font-extrabold tracking-widest uppercase text-white border border-white/20">
              {slide.badge}
            </span>
            <span className="text-xs font-semibold tracking-wider text-neutral-300 uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{slide.tag}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1] font-serif-heading">
            {slide.title}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-md">
            {slide.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onExplore(slide.category)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-neutral-950 hover:bg-neutral-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl cursor-pointer group"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenSizeGuide}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl text-xs tracking-wider transition-colors border border-white/20 cursor-pointer"
            >
              Size Guide
            </button>
          </div>

          {/* Promo code badge */}
          <div className="pt-2 flex items-center gap-2 text-xs text-neutral-300">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Use code <span className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/20">AURA10</span> for 10% instant discount</span>
          </div>
        </div>
      </div>

      {/* Slide Navigation Dots & Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          className="p-2 rounded-full bg-neutral-900/60 hover:bg-neutral-900 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
          className="p-2 rounded-full bg-neutral-900/60 hover:bg-neutral-900 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
