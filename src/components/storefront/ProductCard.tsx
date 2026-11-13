import React from 'react';
import { ShoppingCart, Star, Heart, Handshake } from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onOpenBid?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onOpenBid }) => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { currentUser, toggleWishlist } = useAuth();

  const totalStock = product.variants.reduce((acc, v) => acc + Math.max(0, v.stock - (v.reservedStock || 0)), 0);
  const isOutOfStock = totalStock <= 0;

  const discountPct =
    product.regularPrice > product.discountedPrice
      ? Math.round(((product.regularPrice - product.discountedPrice) / product.regularPrice) * 100)
      : 0;

  const isWishlisted = (currentUser?.savedWishlist || []).includes(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const availableVariant = product.variants.find((v) => v.stock - (v.reservedStock || 0) > 0);
    if (availableVariant) {
      addToCart(product, availableVariant, 1);
    } else {
      onSelect(product);
    }
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="sd-card border border-neutral-200/80 overflow-hidden flex flex-col cursor-pointer group"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top-Left TheSteps Discount Badge */}
        {discountPct > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-[#ff4300] text-white text-[11px] font-bold font-mono-num px-2 py-0.5 rounded-[3px] shadow-xs">
            -{discountPct}%
          </span>
        )}

        {/* Top-Right Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label="Toggle wishlist"
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-xs cursor-pointer transition-colors ${
            isWishlisted
              ? 'bg-[#ff4300] text-white'
              : 'bg-white/90 text-neutral-500 hover:text-[#ff4300]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Bottom-Left Green Free Delivery Tag */}
        {product.freeDelivery && !isOutOfStock && (
          <span className="absolute bottom-2 left-2 bg-[#1b8a3a] text-white text-[10px] font-semibold px-2 py-0.5 rounded-[3px]">
            Free Delivery
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <span className="px-3 py-1 bg-[#292933] text-white text-xs font-bold rounded">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        <div className="space-y-1.5">
          {/* Unboxed clean metadata */}
          <p className="text-[11px] text-neutral-500 truncate">
            {product.shopName || 'TheSteps Official'} · {product.brand}
          </p>

          <h3 className="text-xs sm:text-[13px] font-medium text-[#292933] leading-snug line-clamp-2 group-hover:text-[#ff4300] transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 text-[11px]">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-[#292933] font-mono-num">{product.rating.toFixed(1)}</span>
            <span className="text-neutral-400 font-mono-num">({product.reviewsCount})</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Pricing Row */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#ff4300] font-mono-num">
              ৳{product.discountedPrice.toLocaleString()}
            </span>
            {product.regularPrice > product.discountedPrice && (
              <span className="text-xs text-neutral-400 line-through font-mono-num">
                ৳{product.regularPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className="flex-1 py-2 px-2.5 rounded-[4px] bg-[#ff4300] hover:bg-[#d93800] disabled:bg-neutral-300 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{t('quickAdd')}</span>
            </button>

            {product.allowBid && onOpenBid && !isOutOfStock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBid(product);
                }}
                title="Bid For Product"
                className="p-2 rounded-[4px] bg-[#E6F4FB] hover:bg-[#008ED2] text-[#008ED2] hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <Handshake className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
