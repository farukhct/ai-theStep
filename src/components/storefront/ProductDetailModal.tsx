import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Star, 
  Ruler, 
  Truck, 
  ShieldCheck, 
  RefreshCcw, 
  Check, 
  AlertCircle, 
  Zap,
  Layers,
  Heart,
  Edit3
} from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSizeGuide: () => void;
  onInstantBuy: (product: Product, variant: ProductVariant, quantity: number) => void;
  onEditProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onOpenSizeGuide,
  onInstantBuy,
  onEditProduct
}) => {
  if (!isOpen || !product) return null;

  const { addToCart } = useCart();
  const { formatPrice, t } = useLanguage();
  const { isManager } = useAuth();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');

  const availableStock = selectedVariant.stock - (selectedVariant.reservedStock || 0);
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= selectedVariant.minStockAlert;

  const discountPercent = Math.round(
    ((product.regularPrice - product.discountedPrice) / product.regularPrice) * 100
  );

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    onInstantBuy(product, selectedVariant, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white text-neutral-800 rounded-full shadow-md backdrop-blur-xs transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Product Images Gallery */}
        <div className="w-full md:w-1/2 p-6 bg-neutral-100 flex flex-col justify-between shrink-0">
          <div className="relative aspect-4/5 rounded-xl overflow-hidden bg-white shadow-inner mb-4">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-top transition-all duration-300"
            />
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-md">
                SAVE {discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIndex === idx ? 'border-neutral-900 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Customizer & Checkout */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh] md:max-h-none space-y-6">
          {/* Header & Meta */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 uppercase tracking-wider font-semibold">
              <div className="flex items-center gap-2">
                <span>{product.brand} · {product.category.toUpperCase()}</span>
                {isManager && onEditProduct && (
                  <button
                    onClick={() => {
                      onEditProduct(product);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded transition-colors cursor-pointer"
                    title="Open in Product Form Editor"
                  >
                    <Edit3 className="w-3 h-3 text-amber-700" />
                    <span>Edit Garment</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-amber-500 font-bold font-mono">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                <span className="text-neutral-900 text-xs">{product.rating}</span>
                <span className="text-neutral-400 font-sans font-normal">({product.reviewsCount} reviews)</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight font-serif-heading leading-tight">
              {product.name}
            </h2>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl font-black text-neutral-950 font-mono">
                {formatPrice(selectedVariant.discountedPrice)}
              </span>
              {selectedVariant.regularPrice > selectedVariant.discountedPrice && (
                <span className="text-sm text-neutral-400 line-through font-mono">
                  {formatPrice(selectedVariant.regularPrice)}
                </span>
              )}
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                In Stock & Tax Inclusive
              </span>
            </div>

            {/* Stock Level Banner */}
            <div className="pt-1">
              {isOutOfStock ? (
                <div className="px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-300 text-neutral-600 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-neutral-500" />
                  <span>Currently Sold Out in this Size/Color</span>
                </div>
              ) : isLowStock ? (
                <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Hurry! Only {availableStock} items remaining in Dhaka stock</span>
                </div>
              ) : (
                <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{availableStock} items available in warehouse (SKU: {selectedVariant.sku})</span>
                </div>
              )}
            </div>
          </div>

          {/* Variant Selectors */}
          <div className="space-y-4 pt-2 border-t border-neutral-100">
            {/* Color Selector */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                <span>Color: <span className="font-normal text-neutral-950">{selectedVariant.color}</span></span>
              </div>
              <div className="flex items-center gap-2.5">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setQuantity(1);
                      }}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                        isSelected ? 'border-neutral-950 scale-110 shadow-md' : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                      style={{ backgroundColor: variant.colorHex }}
                      title={`${variant.size} - ${variant.color}`}
                    >
                      {isSelected && (
                        <Check className={`w-4 h-4 ${variant.colorHex === '#f8fafc' || variant.colorHex === '#ffffff' ? 'text-neutral-900' : 'text-white'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector with Size Guide Button */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                <span>Select Size</span>
                <button
                  onClick={onOpenSizeGuide}
                  className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-950 underline cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {product.variants.map((variant) => {
                  const stockLeft = variant.stock - (variant.reservedStock || 0);
                  const isSelected = selectedVariant.id === variant.id;
                  const isSoldOut = stockLeft <= 0;

                  return (
                    <button
                      key={variant.id}
                      disabled={isSoldOut}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setQuantity(1);
                      }}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm'
                          : isSoldOut
                          ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed line-through'
                          : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                      }`}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">Quantity</span>
                <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-neutral-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-200 font-bold transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold font-mono text-neutral-950 bg-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    disabled={quantity >= availableStock}
                    className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-200 font-bold transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-3">
            <div className="flex gap-2.5">
              <button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              <button
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-200 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4 fill-neutral-950" />
                <span>Buy Now (Instant)</span>
              </button>
            </div>

            <p className="text-[11px] text-center text-neutral-500">
              ⚡ Free Express Delivery on orders over ৳2,500 · 7-day exchange guarantee
            </p>

            {isManager && onEditProduct && (
              <div className="p-3 bg-neutral-900 text-white rounded-xl flex items-center justify-between gap-3 shadow-sm border border-neutral-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">Admin & Catalog Control</p>
                    <p className="text-[10px] text-neutral-400">Update variants, pricing, fabric, or delete product</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onEditProduct(product);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 transition-transform active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Garment</span>
                </button>
              </div>
            )}
          </div>

          {/* Specifications Accordion / Details */}
          <div className="border-t border-neutral-100 pt-4 space-y-2">
            <div className="flex gap-4 text-xs font-bold border-b border-neutral-100 pb-2">
              <button
                onClick={() => setActiveTab('details')}
                className={`cursor-pointer ${activeTab === 'details' ? 'text-neutral-950 border-b-2 border-neutral-950 -mb-2.5 pb-2' : 'text-neutral-400'}`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`cursor-pointer ${activeTab === 'specs' ? 'text-neutral-950 border-b-2 border-neutral-950 -mb-2.5 pb-2' : 'text-neutral-400'}`}
              >
                Fabric Specs
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`cursor-pointer ${activeTab === 'reviews' ? 'text-neutral-950 border-b-2 border-neutral-950 -mb-2.5 pb-2' : 'text-neutral-400'}`}
              >
                Reviews ({product.reviewsCount})
              </button>
            </div>

            <div className="pt-2 text-xs text-neutral-600 leading-relaxed">
              {activeTab === 'details' && (
                <p>{product.description}</p>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-400">Fabric Composition:</span>
                    <span className="font-semibold text-neutral-900">{product.fabric}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-400">Knit / Weave:</span>
                    <span className="font-semibold text-neutral-900">{product.material}</span>
                  </div>
                  {product.gsm && (
                    <div className="flex justify-between py-1 border-b border-neutral-100">
                      <span className="text-neutral-400">Weight / GSM:</span>
                      <span className="font-semibold text-neutral-900">{product.gsm} GSM Heavyweight</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Care Instructions:</span>
                    <span className="font-semibold text-neutral-900">Machine wash cold, turn inside out, tumble dry low</span>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-3">
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-900">
                      <span>Tanvir A. (Dhaka)</span>
                      <div className="flex text-amber-500">★★★★★</div>
                    </div>
                    <p className="text-neutral-600 text-[11px] mt-1">
                      "Unbelievable fabric quality. The 240 GSM drop shoulder cut is on par with luxury streetwear brands. Stitching is immaculate."
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-900">
                      <span>Mehedi H. (Chittagong)</span>
                      <div className="flex text-amber-500">★★★★★</div>
                    </div>
                    <p className="text-neutral-600 text-[11px] mt-1">
                      "Delivered within 48 hours. The size chart was 100% accurate. Ordering 2 more colors!"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
