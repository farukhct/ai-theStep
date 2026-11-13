import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  Edit,
  Handshake,
  Ticket,
  CheckCircle2,
  Heart,
  Store
} from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useNotification } from '../../context/NotificationContext';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSizeGuide: () => void;
  onInstantBuy: (product: Product, variant: ProductVariant, quantity: number) => void;
  onEditProduct?: (product: Product) => void;
  onOpenBid?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onOpenSizeGuide,
  onInstantBuy,
  onEditProduct,
  onOpenBid
}) => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { currentUser, isManager, collectVoucher, toggleWishlist } = useAuth();
  const { coupons, addProductReview } = useStore();
  const { addToast } = useNotification();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');

  // Review composer state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (product) {
      const firstAvail = product.variants.find((v) => v.stock - (v.reservedStock || 0) > 0) || product.variants[0];
      setSelectedVariant(firstAvail || null);
      setSelectedImageIdx(0);
      setQuantity(1);
      setActiveTab('specs');
    }
  }, [product, isOpen]);

  if (!isOpen || !product || !selectedVariant) return null;

  const available = Math.max(0, selectedVariant.stock - (selectedVariant.reservedStock || 0));
  const discountPct =
    selectedVariant.regularPrice > selectedVariant.discountedPrice
      ? Math.round(((selectedVariant.regularPrice - selectedVariant.discountedPrice) / selectedVariant.regularPrice) * 100)
      : 0;

  const collectedCodes = currentUser?.collectedVouchers || [];
  const activeVouchers = coupons.filter((c) => c.isActive).slice(0, 3);
  const isWishlisted = (currentUser?.savedWishlist || []).includes(product.id);

  const handleCollectAll = () => {
    activeVouchers.forEach((v) => collectVoucher(v.code));
    addToast('Vouchers Collected', 'All eligible product vouchers saved to your account.', 'success');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    await addProductReview(product.id, {
      userName: currentUser?.displayName || 'TheSteps Shopper',
      rating: reviewRating,
      comment: reviewComment.trim(),
      verifiedPurchase: true
    });
    setReviewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-[#f7f8fa] shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-600 min-w-0">
            <Store className="w-4 h-4 text-[#ff4300] shrink-0" />
            <span className="font-semibold text-[#292933] truncate">{product.shopName || 'TheSteps Official'}</span>
            <span>·</span>
            <span className="font-mono-num text-neutral-500">SKU: {selectedVariant.sku}</span>
          </div>

          <div className="flex items-center gap-2">
            {isManager && onEditProduct && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditProduct(product);
                }}
                className="px-3 py-1.5 rounded bg-[#292933] hover:bg-[#1b1b28] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-[#292933] rounded-lg cursor-pointer"
              aria-label="Close product modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Left Gallery (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                <img
                  src={product.images[selectedImageIdx] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {discountPct > 0 && (
                  <span className="absolute top-3 left-3 bg-[#ff4300] text-white text-xs font-bold font-mono-num px-2.5 py-1 rounded">
                    -{discountPct}%
                  </span>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImageIdx(i)}
                      className={`w-16 h-16 rounded border-2 overflow-hidden shrink-0 cursor-pointer ${
                        selectedImageIdx === i ? 'border-[#ff4300]' : 'border-neutral-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Purchase Column (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#008ED2]">{product.brand}</span>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className={`inline-flex items-center gap-1 text-xs font-medium cursor-pointer ${
                      isWishlisted ? 'text-[#ff4300]' : 'text-neutral-500 hover:text-[#ff4300]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    <span>{isWishlisted ? 'Saved' : 'Save'}</span>
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[#292933] leading-snug mt-1">
                  {product.name}
                </h2>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[#292933] font-mono-num">{product.rating.toFixed(1)}</span>
                    <span className="text-neutral-500">({product.reviewsCount} ratings)</span>
                  </div>
                  <span className="text-neutral-300">|</span>
                  <span className={available > 0 ? 'text-[#1b8a3a] font-semibold' : 'text-rose-600 font-semibold'}>
                    {available > 0 ? `${available} in stock` : t('outOfStock')}
                  </span>
                </div>
              </div>

              {/* Price Box */}
              <div className="p-4 rounded-lg bg-[#f7f8fa] border border-neutral-200 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-[#ff4300] font-mono-num">
                  ৳{selectedVariant.discountedPrice.toLocaleString()}
                </span>
                {selectedVariant.regularPrice > selectedVariant.discountedPrice && (
                  <span className="text-sm text-neutral-400 line-through font-mono-num">
                    ৳{selectedVariant.regularPrice.toLocaleString()}
                  </span>
                )}
                {product.freeDelivery && (
                  <span className="ml-auto text-xs font-semibold text-[#1b8a3a] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                    Free Nationwide Delivery
                  </span>
                )}
              </div>

              {/* Ticket-Stub Vouchers Row (TheSteps signature component) */}
              {activeVouchers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#292933] flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-[#EC1561]" />
                      <span>Vouchers</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCollectAll}
                      className="text-[#008ED2] font-semibold hover:underline cursor-pointer"
                    >
                      Collect All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {activeVouchers.map((v) => {
                      const collected = collectedCodes.includes(v.code);
                      return (
                        <div
                          key={v.id}
                          className="border border-dashed border-[#008ED2]/60 bg-[#E6F4FB]/40 rounded px-2.5 py-2 flex items-center justify-between gap-2 text-[11px]"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-[#008ED2] truncate">{v.code}</p>
                            <p className="text-neutral-600 truncate">
                              {v.discountType === 'percentage' ? `${v.discountValue}% off` : `৳${v.discountValue} off`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              collectVoucher(v.code);
                              addToast('Voucher Saved', `${v.code} collected.`, 'success');
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                              collected
                                ? 'bg-[#1b8a3a] text-white'
                                : 'bg-[#008ED2] hover:bg-[#0074ad] text-white'
                            }`}
                          >
                            {collected ? 'Collected' : 'Collect'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variant Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#292933]">
                    Option: <span className="text-[#ff4300]">{selectedVariant.color} · {selectedVariant.size}</span>
                  </span>
                  {product.category === 'fashion' && (
                    <button
                      type="button"
                      onClick={onOpenSizeGuide}
                      className="text-[#008ED2] hover:underline font-medium cursor-pointer"
                    >
                      {t('sizeGuide')}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = v.id === selectedVariant.id;
                    const vAvail = v.stock - (v.reservedStock || 0);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 rounded-[4px] border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#ff4300] bg-[#ff4300]/10 text-[#ff4300] font-semibold'
                            : 'border-neutral-300 bg-white text-[#292933] hover:border-neutral-500'
                        } ${vAvail <= 0 ? 'opacity-50' : ''}`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-neutral-300 shrink-0"
                          style={{ backgroundColor: v.colorHex }}
                        />
                        <span>{v.color} ({v.size})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper & Dual CTA Buttons */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-[#292933]">Quantity</span>
                  <div className="flex items-center border border-neutral-300 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 font-mono-num font-bold text-[#292933]">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(Math.max(1, available), q + 1))}
                      disabled={quantity >= available}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 font-bold disabled:opacity-40 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* TheSteps Signature Dual CTA Row + Bid For Product */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={available <= 0}
                    onClick={() => {
                      onInstantBuy(product, selectedVariant, quantity);
                      onClose();
                    }}
                    className="py-3 px-4 rounded-[5px] bg-[#ff4300] hover:bg-[#d93800] disabled:bg-neutral-300 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    {t('buyNow')}
                  </button>

                  <button
                    type="button"
                    disabled={available <= 0}
                    onClick={() => addToCart(product, selectedVariant, quantity)}
                    className="py-3 px-4 rounded-[5px] bg-[#008ED2] hover:bg-[#0074ad] disabled:bg-neutral-300 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t('addToCart')}</span>
                  </button>
                </div>

                {product.allowBid && onOpenBid && available > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenBid(product)}
                    className="w-full py-2.5 px-4 rounded-[5px] border-2 border-[#008ED2] text-[#008ED2] hover:bg-[#E6F4FB] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Handshake className="w-4 h-4" />
                    <span>Bid For Product (Min ৳{(product.minBidPrice || Math.round(product.discountedPrice * 0.85)).toLocaleString()})</span>
                  </button>
                )}
              </div>

              {/* Delivery & Warranty Highlights */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-neutral-600 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#ff4300] shrink-0" />
                  <span>Dhaka ৳60 · Outside ৳120 (Free ৳2,500+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1b8a3a] shrink-0" />
                  <span>{product.warranty || '7-Day Easy Replacement Warranty'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lower Tabs: Specs & Interactive Reviews */}
          <div className="border-t border-neutral-200 pt-5 space-y-4">
            <div className="flex gap-6 border-b border-neutral-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`pb-2.5 border-b-2 cursor-pointer ${
                  activeTab === 'specs' ? 'border-[#ff4300] text-[#ff4300]' : 'border-transparent text-neutral-500'
                }`}
              >
                {t('specifications')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`pb-2.5 border-b-2 cursor-pointer ${
                  activeTab === 'reviews' ? 'border-[#ff4300] text-[#ff4300]' : 'border-transparent text-neutral-500'
                }`}
              >
                {t('customerReviews')} ({(product.reviews || []).length})
              </button>
            </div>

            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="space-y-2">
                  <h4 className="font-bold text-[#292933]">Product Overview</h4>
                  <p className="text-neutral-600 leading-relaxed">{product.description}</p>
                </div>
                <div className="bg-[#f7f8fa] rounded-lg p-4 border border-neutral-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Key Highlight</span>
                    <span className="font-semibold text-[#292933]">{product.fabric}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Technical Spec</span>
                    <span className="font-semibold text-[#292933]">{product.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Warranty</span>
                    <span className="font-semibold text-[#1b8a3a]">{product.warranty || 'Official TheSteps Guarantee'}</span>
                  </div>
                  {product.weight && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Package Weight</span>
                      <span className="font-semibold font-mono-num text-[#292933]">{product.weight}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <form onSubmit={handleSubmitReview} className="bg-[#f7f8fa] p-4 rounded-lg border border-neutral-200 space-y-3">
                  <h4 className="font-bold text-[#292933]">Write a Customer Review</h4>
                  <div className="flex items-center gap-2">
                    <span>Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with delivery speed and product authenticity..."
                    className="w-full p-2.5 bg-white border border-neutral-300 rounded text-xs focus:outline-none focus:border-[#ff4300]"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#ff4300] hover:bg-[#d93800] text-white font-semibold rounded cursor-pointer"
                  >
                    Submit Review
                  </button>
                </form>

                <div className="space-y-3">
                  {(product.reviews || []).length === 0 ? (
                    <div className="p-5 bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-500">
                      No written reviews yet. Be the first verified buyer to rate this TheSteps item!
                    </div>
                  ) : (
                    (product.reviews || []).map((rev) => (
                      <div key={rev.id} className="p-3.5 rounded-lg border border-neutral-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#292933] flex items-center gap-1.5">
                            {rev.userName}
                            {rev.verifiedPurchase && <CheckCircle2 className="w-3.5 h-3.5 text-[#1b8a3a]" />}
                          </span>
                          <span className="text-neutral-400 font-mono-num">{rev.date}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-neutral-600">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
