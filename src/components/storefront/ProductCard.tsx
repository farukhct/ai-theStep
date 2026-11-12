import React, { useState } from 'react';
import { ShoppingBag, Star, Eye, Check, AlertCircle } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();
  const { formatPrice } = useLanguage();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const availableStock = selectedVariant.stock - (selectedVariant.reservedStock || 0);
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= selectedVariant.minStockAlert;

  const discountPercent = Math.round(
    ((product.regularPrice - product.discountedPrice) / product.regularPrice) * 100
  );

  const handleQuickAdd = (variant: ProductVariant, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, variant, 1);
    setShowQuickAdd(false);
  };

  return (
    <div 
      onClick={() => onSelect(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickAdd(false);
      }}
      className="group bg-white rounded-2xl border border-neutral-200/80 hover:border-neutral-400/80 transition-all duration-300 hover:shadow-xl flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-4/5 bg-neutral-100 overflow-hidden">
        <img
          src={isHovered && product.images[1] ? product.images[1] : product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isNewArrival && (
            <span className="px-2 py-0.5 rounded bg-neutral-950 text-white font-extrabold text-[9px] tracking-wider uppercase shadow-xs">
              NEW
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-extrabold text-[9px] tracking-wider uppercase shadow-xs">
              -{discountPercent}%
            </span>
          )}
          {product.gsm && (
            <span className="px-2 py-0.5 rounded bg-white/90 backdrop-blur-xs text-neutral-800 font-bold text-[9px] tracking-wider uppercase border border-neutral-200">
              {product.gsm} GSM
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="p-2 bg-white/90 hover:bg-white text-neutral-900 rounded-full shadow-md backdrop-blur-xs transition-transform hover:scale-110 cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Stock Alert Badge */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <span className="px-3 py-1 bg-white text-neutral-950 text-xs font-bold uppercase tracking-wider rounded-md shadow-lg">
              Sold Out
            </span>
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="px-2.5 py-1 bg-amber-950/80 backdrop-blur-md border border-amber-500/30 text-amber-200 text-[10px] font-bold rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>Only {availableStock} items left in stock</span>
            </div>
          </div>
        ) : null}

        {/* Quick Add Overlay on bottom hover */}
        {!isOutOfStock && (
          <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickAdd(!showQuickAdd);
              }}
              className="p-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Quick Add to Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        )}

        {/* Quick Size Picker Dropdown */}
        {showQuickAdd && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-3 bottom-3 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-neutral-300 z-20 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center justify-between">
              <span>Select Size:</span>
              <button 
                onClick={() => setShowQuickAdd(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {product.variants.map((v) => {
                const stockLeft = v.stock - (v.reservedStock || 0);
                const disabled = stockLeft <= 0;
                return (
                  <button
                    key={v.id}
                    disabled={disabled}
                    onClick={(e) => handleQuickAdd(v, e)}
                    className={`py-1.5 text-xs font-bold rounded-md border transition-colors cursor-pointer ${
                      disabled
                        ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed line-through'
                        : 'bg-white hover:bg-neutral-900 hover:text-white border-neutral-300 text-neutral-900'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
            <span>{product.brand}</span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
              <span className="text-neutral-700 font-bold font-mono">{product.rating}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-bold text-neutral-950 group-hover:text-neutral-700 transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>

          {/* Fabric specification snippet */}
          <p className="text-[11px] text-neutral-500 line-clamp-1 font-medium">
            {product.fabric}
          </p>
        </div>

        {/* Color Swatches & Price */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
          {/* Color Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from(new Set(product.variants.map((v) => v.colorHex))).slice(0, 4).map((hex, i) => (
              <span
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-2xs"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
            {product.variants.length > 4 && (
              <span className="text-[10px] text-neutral-400 font-bold">
                +{product.variants.length - 4}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-neutral-950 font-mono">
                {formatPrice(product.discountedPrice)}
              </span>
              {product.regularPrice > product.discountedPrice && (
                <span className="text-[11px] text-neutral-400 line-through font-mono">
                  {formatPrice(product.regularPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
