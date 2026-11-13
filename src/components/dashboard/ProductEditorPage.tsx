import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Package,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Layers,
  DollarSign,
  Check,
  Wand2,
  HardDrive,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Zap,
  Handshake,
  Truck,
  Tag,
  Award,
  CheckCircle2,
  Circle,
  RotateCcw,
  RefreshCw,
  Star,
  Store
} from 'lucide-react';
import { Product, ProductVariant, GarmentSize } from '../../types';
import { GARMENT_CATEGORIES } from '../../config/constants';
import { MEDIA_ASSETS } from '../../config/mediaAssets';
import { useNotification } from '../../context/NotificationContext';
import { LocalImageUploader } from '../common/LocalImageUploader';
import {
  estimateImagesPayloadBytes,
  formatBytes
} from '../../utils/imageUtils';

export interface ProductEditorPageProps {
  mode: 'create' | 'edit';
  initialProduct?: Product | null;
  onCancel: () => void;
  onSubmit: (productData: any) => Promise<void>;
}

const PRESET_COLORS = [
  { name: 'Midnight Jet Black', hex: '#18181b' },
  { name: 'Crisp Snow White', hex: '#ffffff' },
  { name: 'Warm Oatmeal Stone', hex: '#e4d5b7' },
  { name: 'Deep Royal Navy', hex: '#0f172a' },
  { name: 'Charcoal Heather', hex: '#334155' },
  { name: 'Imperial Maroon', hex: '#881337' },
  { name: 'Vintage Deep Indigo', hex: '#1e3a8a' },
  { name: 'British Khaki', hex: '#c2b280' },
  { name: 'Olive Drab Green', hex: '#3f4f34' }
];

const PRESET_IMAGES = [
  { label: 'Titanium Smart Watch', url: MEDIA_ASSETS.prodSmartwatchPro },
  { label: 'ANC Wireless Earbuds', url: MEDIA_ASSETS.prodEarbudsAnc },
  { label: 'K-Beauty Serum Combo', url: MEDIA_ASSETS.prodSkincareSerum },
  { label: 'Festive Panjabi Combo', url: MEDIA_ASSETS.prodMensPanjabi },
  { label: 'Air Purifier & Kettle', url: MEDIA_ASSETS.prodHomeAppliance },
  { label: 'Ergonomic Mesh Chair', url: MEDIA_ASSETS.prodErgoChair },
  { label: 'Mechanical Keyboard', url: MEDIA_ASSETS.prodMechanicalKeyboard },
  { label: 'TheSteps Creator Kit', url: MEDIA_ASSETS.heroTheStepsCampaign }
];

const SPEC_PRESETS = [
  {
    label: '240 GSM Heavyweight Cotton',
    fab: '100% Combed Ring-Spun Cotton',
    mat: 'Single Jersey Compact Yarn',
    g: 240,
    w: '280g'
  },
  {
    label: '80s Egyptian Giza Cotton',
    fab: '100% Giza Long-Staple Cotton',
    mat: 'Pinpoint Oxford Weave',
    g: 140,
    w: '220g'
  },
  {
    label: '14.5oz Narayanganj Selvedge',
    fab: '100% Ring-Spun Cotton',
    mat: '14.5oz Shuttle Selvedge Denim',
    g: 410,
    w: '620g'
  },
  {
    label: 'Festive Jacquard Viscose',
    fab: '65% Cotton, 35% Viscose Jacquard',
    mat: 'Textured Jacquard Self-Weave',
    g: 175,
    w: '340g'
  },
  {
    label: 'Flagship Electronics Box',
    fab: 'Official Sealed Retail Box',
    mat: '64-District Express Eligible',
    g: undefined,
    w: '350g'
  }
];

interface ToggleRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  checked,
  onChange,
  title,
  subtitle,
  icon
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
      checked
        ? 'border-[#465FFF]/40 bg-[#ECF3FF]/60 dark:border-[#465FFF]/50 dark:bg-[#465FFF]/10'
        : 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-white/[0.02] hover:bg-gray-100/70 dark:hover:bg-white/[0.04]'
    }`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          checked
            ? 'bg-[#465FFF] text-white'
            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <span className="block text-xs font-semibold text-gray-900 dark:text-white truncate">
          {title}
        </span>
        {subtitle && (
          <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>

    <span
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
        checked ? 'bg-[#465FFF]' : 'bg-gray-300 dark:bg-gray-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </span>
  </button>
);

export const ProductEditorPage: React.FC<ProductEditorPageProps> = ({
  mode,
  initialProduct,
  onCancel,
  onSubmit
}) => {
  const { addToast } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Core Identity
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('mobile-gadgets');
  const [subcategory, setSubcategory] = useState('Electronics');
  const [brand, setBrand] = useState('TheSteps Official');
  const [shopName, setShopName] = useState('TheSteps Official');
  const [warranty, setWarranty] = useState('1 Year Official Warranty');
  const [description, setDescription] = useState('');

  // Publishing & Merchandising
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFlashDeal, setIsFlashDeal] = useState(false);
  const [allowBid, setAllowBid] = useState(false);
  const [freeDelivery, setFreeDelivery] = useState(true);

  // Pricing & Specs
  const [regularPrice, setRegularPrice] = useState(2500);
  const [discountedPrice, setDiscountedPrice] = useState(1950);
  const [fabric, setFabric] = useState('Official Sealed Retail Box');
  const [material, setMaterial] = useState('64-District Express Eligible');
  const [gsm, setGsm] = useState<number | undefined>(undefined);
  const [weight, setWeight] = useState('350g');

  // Gallery State
  const [images, setImages] = useState<string[]>([MEDIA_ASSETS.prodSmartwatchPro]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageSourceMode, setImageSourceMode] = useState<'local' | 'url' | 'presets'>('local');

  // Variants State
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const initializeForm = () => {
    if (mode === 'edit' && initialProduct) {
      setName(initialProduct.name);
      setSku(initialProduct.sku);
      setCategory(initialProduct.category);
      setSubcategory(initialProduct.subcategory || 'General');
      setBrand(initialProduct.brand || 'TheSteps Official');
      setShopName(initialProduct.shopName || 'TheSteps Official');
      setWarranty(initialProduct.warranty || '1 Year Official Warranty');
      setDescription(initialProduct.description || '');
      setStatus(initialProduct.status || 'active');
      setIsFeatured(Boolean(initialProduct.isFeatured));
      setIsNewArrival(Boolean(initialProduct.isNewArrival));
      setIsBestSeller(Boolean(initialProduct.isBestSeller));
      setIsFlashDeal(Boolean(initialProduct.isFlashDeal));
      setAllowBid(Boolean(initialProduct.allowBid));
      setFreeDelivery(Boolean(initialProduct.freeDelivery));
      setRegularPrice(initialProduct.regularPrice);
      setDiscountedPrice(initialProduct.discountedPrice);
      setFabric(initialProduct.fabric || 'Official Retail Box');
      setMaterial(initialProduct.material || 'TheSteps Verified');
      setGsm(initialProduct.gsm);
      setWeight(initialProduct.weight || '320g');
      setImages(
        initialProduct.images && initialProduct.images.length > 0
          ? initialProduct.images
          : [PRESET_IMAGES[0].url]
      );
      setVariants(
        initialProduct.variants && initialProduct.variants.length > 0
          ? initialProduct.variants
          : [
              {
                id: `var-${Date.now()}-M`,
                sku: `${initialProduct.sku || 'TS'}-M`,
                size: 'M',
                color: 'Midnight Jet Black',
                colorHex: '#18181b',
                purchasePrice: Math.round((initialProduct.discountedPrice || 1000) * 0.55),
                regularPrice: initialProduct.regularPrice || 1400,
                discountedPrice: initialProduct.discountedPrice || 1150,
                stock: 15,
                reservedStock: 0,
                minStockAlert: 5
              }
            ]
      );
    } else {
      const code = `TS-${Date.now().toString().slice(-4)}`;
      setName('');
      setSku(code);
      setCategory('mobile-gadgets');
      setSubcategory('Electronics');
      setBrand('TheSteps Official');
      setShopName('TheSteps Official');
      setWarranty('1 Year Official Warranty');
      setDescription('100% Authentic product verified by TheSteps Bangladesh.');
      setStatus('active');
      setIsFeatured(true);
      setIsNewArrival(true);
      setIsBestSeller(false);
      setIsFlashDeal(false);
      setAllowBid(false);
      setFreeDelivery(true);
      setRegularPrice(2500);
      setDiscountedPrice(1950);
      setFabric('Official Sealed Box');
      setMaterial('TheSteps Verified Quality');
      setGsm(undefined);
      setWeight('350g');
      setImages([PRESET_IMAGES[0].url]);
      setVariants([
        {
          id: `var-${Date.now()}-M`,
          sku: `${code}-M`,
          size: 'M',
          color: 'Midnight Jet Black',
          colorHex: '#18181b',
          purchasePrice: 1250,
          regularPrice: 2500,
          discountedPrice: 1950,
          stock: 20,
          reservedStock: 0,
          minStockAlert: 5
        },
        {
          id: `var-${Date.now()}-L`,
          sku: `${code}-L`,
          size: 'L',
          color: 'Midnight Jet Black',
          colorHex: '#18181b',
          purchasePrice: 1250,
          regularPrice: 2500,
          discountedPrice: 1950,
          stock: 15,
          reservedStock: 0,
          minStockAlert: 5
        }
      ]);
    }
  };

  useEffect(() => {
    initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialProduct]);

  // Derived metrics
  const discountPct = useMemo(() => {
    if (regularPrice <= 0 || regularPrice <= discountedPrice) return 0;
    return Math.round(((regularPrice - discountedPrice) / regularPrice) * 100);
  }, [regularPrice, discountedPrice]);

  const savingsAmount = useMemo(() => {
    return Math.max(0, regularPrice - discountedPrice);
  }, [regularPrice, discountedPrice]);

  const totalStock = useMemo(() => {
    return variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  }, [variants]);

  const avgMarginPct = useMemo(() => {
    if (variants.length === 0) return 0;
    const margins = variants
      .filter((v) => v.discountedPrice > 0)
      .map((v) => ((v.discountedPrice - v.purchasePrice) / v.discountedPrice) * 100);
    if (margins.length === 0) return 0;
    return Math.round(margins.reduce((a, b) => a + b, 0) / margins.length);
  }, [variants]);

  const totalBytes = useMemo(() => estimateImagesPayloadBytes(images), [images]);
  const isNearLimit = totalBytes > 850 * 1024;

  const selectedCategoryObj = useMemo(
    () => GARMENT_CATEGORIES.find((c) => c.id === category),
    [category]
  );

  // Actions
  const handleGenerateSku = () => {
    const prefix = (name.trim().slice(0, 3) || category.slice(0, 3) || 'TS')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase() || 'TS';
    const nextSku = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSku(nextSku);
    addToast('SKU Generated', `Assigned master SKU ${nextSku}`, 'info');
  };

  const handleAutoGenerateVariants = () => {
    const baseSku = sku.trim().toUpperCase() || 'TS';
    const standardSizes: GarmentSize[] = ['S', 'M', 'L', 'XL', 'XXL'];
    const newVars: ProductVariant[] = standardSizes.map((s) => ({
      id: `var-${Date.now()}-${s}-${Math.random().toString(36).substring(2, 5)}`,
      sku: `${baseSku}-${s}`,
      size: s,
      color: 'Midnight Jet Black',
      colorHex: '#18181b',
      purchasePrice: Math.round(discountedPrice * 0.55),
      regularPrice,
      discountedPrice,
      stock: 15,
      reservedStock: 0,
      minStockAlert: 4
    }));
    setVariants(newVars);
    addToast('Standard Sizes Generated', '5 size variants (S–XXL) created.', 'info');
  };

  const handleAddSingleVariant = () => {
    const baseSku = sku.trim().toUpperCase() || 'TS';
    const newV: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sku: `${baseSku}-${Date.now().toString().slice(-3)}`,
      size: 'M',
      color: 'Midnight Jet Black',
      colorHex: '#18181b',
      purchasePrice: Math.round(discountedPrice * 0.55),
      regularPrice,
      discountedPrice,
      stock: 10,
      reservedStock: 0,
      minStockAlert: 3
    };
    setVariants((prev) => [...prev, newV]);
  };

  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const handleDeleteVariant = (id: string) => {
    if (variants.length <= 1) {
      addToast('Cannot Remove', 'A product must have at least one variant option.', 'warning');
      return;
    }
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setImages((prev) => [...prev, url]);
    setNewImageUrl('');
    addToast('Image Added', 'Image URL added to gallery.', 'info');
  };

  const handleLocalImagesUploaded = (newUrls: string[]) => {
    if (newUrls.length === 0) return;
    setImages((prev) => {
      const isOnlyDefault = prev.length === 1 && prev[0] === PRESET_IMAGES[0].url;
      if (isOnlyDefault) {
        return newUrls;
      }
      return [...prev, ...newUrls];
    });
    addToast(
      'Local Images Inserted',
      `${newUrls.length} image${newUrls.length > 1 ? 's' : ''} loaded from local drive.`,
      'success'
    );
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      addToast('Image Required', 'Product requires at least one primary image.', 'warning');
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const [item] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, item);
    setImages(updated);
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.unshift(moved);
    setImages(updated);
    addToast('Cover Updated', 'Selected image is now the primary storefront cover.', 'info');
  };

  const submitProduct = async (overrideStatus?: 'active' | 'draft' | 'archived') => {
    if (!name.trim()) {
      addToast('Validation Required', 'Please enter a product title before saving.', 'warning');
      return;
    }
    if (!sku.trim()) {
      addToast('Validation Required', 'Base Master SKU is required.', 'warning');
      return;
    }
    if (discountedPrice <= 0) {
      addToast('Validation Required', 'Selling price must be greater than ৳0.', 'warning');
      return;
    }
    if (variants.length === 0) {
      addToast('Validation Required', 'At least one variant row is required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const effectiveStatus = overrideStatus || status;

    const productPayload = {
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sku: sku.trim().toUpperCase(),
      category,
      subcategory: subcategory.trim() || 'General',
      brand: brand.trim() || 'TheSteps Official',
      shopName: shopName.trim() || 'TheSteps Official',
      warranty: warranty.trim() || '7-Day Easy Replacement',
      description: description.trim(),
      images,
      fabric: fabric.trim() || 'TheSteps Verified',
      material: material.trim() || 'Standard Specification',
      gsm: gsm ? Number(gsm) : undefined,
      weight: weight.trim() || '350g',
      regularPrice: Number(regularPrice),
      discountedPrice: Number(discountedPrice),
      availableQuantity: totalStock,
      minimumStockLevel: 10,
      status: effectiveStatus,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isFlashDeal,
      flashStockLeft: isFlashDeal ? Math.min(10, totalStock) : undefined,
      flashSoldCount: isFlashDeal ? 12 : undefined,
      allowBid,
      minBidPrice: allowBid ? Math.round(Number(discountedPrice) * 0.85) : undefined,
      freeDelivery,
      variants,
      rating: initialProduct?.rating || 5.0,
      reviewsCount: initialProduct?.reviewsCount || 0
    };

    try {
      await onSubmit(productPayload);
      setIsSubmitting(false);
      onCancel();
    } catch (err: any) {
      setIsSubmitting(false);
      addToast('Operation Failed', err.message || 'Could not save product.', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitProduct();
  };

  const readinessChecks = [
    { label: 'Product Title entered', ok: name.trim().length >= 3 },
    { label: 'Unique Master SKU', ok: sku.trim().length >= 2 },
    { label: 'Valid Selling Price (৳)', ok: discountedPrice > 0 },
    { label: 'At least 1 Gallery Image', ok: images.length > 0 },
    { label: 'Warehouse Stock Ready', ok: totalStock > 0 }
  ];
  const passedCount = readinessChecks.filter((c) => c.ok).length;

  const inputClass =
    'w-full h-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#465FFF] focus:bg-white dark:focus:bg-gray-900 transition-colors';

  const labelClass = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 pb-10">
      {/* Top Inline Page Header Banner */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-colors cursor-pointer shrink-0"
            title="Back to Products Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {mode === 'create'
                  ? 'Create TheSteps Product'
                  : `Edit Product · ${initialProduct?.name || ''}`}
              </h2>
              {sku && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF] font-mono-num text-[11px] font-semibold">
                  {sku.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {mode === 'create'
                ? 'Configure product identity, local drive media, multi-variant COGS matrix, and live storefront merchandising.'
                : 'Update live catalog pricing, variant stock, gallery photos, and promotional flags.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              initializeForm();
              addToast('Form Reset', 'Restored initial fields.', 'info');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submitProduct('draft')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <span>Save Draft</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Saving...'
                : mode === 'create'
                ? 'Publish Product'
                : 'Save Changes'}
            </span>
          </button>
        </div>
      </div>

      {/* Main 12-Column Two-Pane Builder Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 Cols): Form Sections */}
        <div className="xl:col-span-8 space-y-6">
          {/* SECTION 1: BASIC INFORMATION */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ECF3FF] dark:bg-[#465FFF]/15 text-[#465FFF] dark:text-[#7592FF] flex items-center justify-center shrink-0">
                  <Package className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    General Information
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Core title, category placement, SKU, and brand attribution
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Amazfit GTR 4 Titanium Edition Smartwatch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Base Master SKU *</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="TS-PRO-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className={`${inputClass} font-mono-num font-bold uppercase pr-20`}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:border-[#465FFF] hover:text-[#465FFF] transition-colors cursor-pointer flex items-center gap-1"
                    title="Auto-generate SKU"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Department / Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {GARMENT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Subcategory</label>
                <input
                  type="text"
                  placeholder="e.g. Smart Wearables / Festive Tees"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Seller / Shop Name</label>
                <input
                  type="text"
                  placeholder="TheSteps Official"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Keychron, Anker, TheSteps"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Warranty &amp; Authenticity Policy</label>
                <input
                  type="text"
                  placeholder="1 Year Official Brand Warranty"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Product Description
                </label>
                <span className="text-[11px] font-mono-num text-gray-400">
                  {description.length} chars
                </span>
              </div>
              <textarea
                rows={4}
                placeholder="Write a compelling summary highlighting build quality, box contents, and delivery guarantees..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#465FFF] focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
            </div>
          </section>

          {/* SECTION 2: PRODUCT MEDIA & GALLERY */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Product Images &amp; Local Drive Media
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Upload compressed photos from your drive, link web URLs, or pick studio assets
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg font-mono-num text-[11px] font-semibold ${
                  isNearLimit
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {formatBytes(totalBytes)} / 900 KB
              </span>
            </div>

            {/* Source Mode Switcher */}
            <div className="inline-flex flex-wrap p-1 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 gap-1">
              <button
                type="button"
                onClick={() => setImageSourceMode('local')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  imageSourceMode === 'local'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-[#465FFF]" />
                <span>Local Drive</span>
              </button>

              <button
                type="button"
                onClick={() => setImageSourceMode('url')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  imageSourceMode === 'url'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Web Image URL</span>
              </button>

              <button
                type="button"
                onClick={() => setImageSourceMode('presets')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  imageSourceMode === 'presets'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Studio Presets</span>
              </button>
            </div>

            {imageSourceMode === 'local' && (
              <LocalImageUploader
                onImagesUploaded={handleLocalImagesUploaded}
                multiple={true}
                maxFiles={8}
                label="Insert Images from Local Drive"
                description="Supports PNG, JPG, WebP, AVIF, SVG. Auto-resized & compressed for instant catalog loading."
              />
            )}

            {imageSourceMode === 'url' && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-2.5">
                <label className={labelClass}>Paste Direct Image URL</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/product-photo.jpg"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 h-10 bg-[#465FFF] hover:bg-[#3641F5] text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Add to Gallery
                  </button>
                </div>
              </div>
            )}

            {imageSourceMode === 'presets' && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3">
                <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Click any curated studio asset to add to your gallery:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_IMAGES.map((preset, idx) => {
                    const alreadyAdded = images.includes(preset.url);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!alreadyAdded) {
                            setImages((prev) => [...prev, preset.url]);
                            addToast('Preset Added', preset.label, 'info');
                          }
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          alreadyAdded
                            ? 'border-[#465FFF] bg-[#ECF3FF]/50 dark:bg-[#465FFF]/10'
                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#465FFF]'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-10 h-10 object-cover rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0"
                        />
                        <span className="text-[11px] font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gallery Grid */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Active Gallery ({images.length}) · First photo displays as Cover
                </span>
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setImages([images[0]]);
                      addToast('Gallery Reset', 'Kept primary cover image only.', 'info');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline cursor-pointer"
                  >
                    Keep Cover Only
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {images.map((img, index) => {
                  const isLocal = img.startsWith('data:image/');
                  return (
                    <div
                      key={index}
                      className={`relative aspect-4/5 rounded-xl overflow-hidden border bg-gray-100 dark:bg-gray-900 group transition-all ${
                        index === 0
                          ? 'border-[#465FFF] ring-2 ring-[#465FFF]/25'
                          : 'border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {index === 0 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#465FFF] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                          Cover
                        </span>
                      )}

                      <span
                        className={`absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs ${
                          isLocal
                            ? 'bg-emerald-700/90 text-white'
                            : 'bg-gray-900/80 text-white'
                        }`}
                      >
                        {isLocal ? (
                          <HardDrive className="w-2.5 h-2.5" />
                        ) : (
                          <LinkIcon className="w-2.5 h-2.5" />
                        )}
                        <span>{isLocal ? 'Local' : 'URL'}</span>
                      </span>

                      {/* Action Controls Overlay */}
                      <div className="absolute inset-0 bg-gray-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg text-[11px] cursor-pointer shadow-xs"
                          >
                            Set Cover
                          </button>
                        )}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveImage(index, 'left')}
                            className="p-1.5 bg-white/90 hover:bg-white disabled:opacity-40 text-gray-900 rounded-lg cursor-pointer"
                            title="Move left"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === images.length - 1}
                            onClick={() => handleMoveImage(index, 'right')}
                            className="p-1.5 bg-white/90 hover:bg-white disabled:opacity-40 text-gray-900 rounded-lg cursor-pointer"
                            title="Move right"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 3: PRICING & MULTI-VARIANT MATRIX */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Pricing &amp; Variant Stock Matrix
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Set retail price, promotional discount, COGS margin, and per-option stock
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Regular Tag Price (৳)</label>
                <input
                  type="number"
                  min={0}
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(Number(e.target.value))}
                  className={`${inputClass} font-mono-num font-bold`}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Selling / Offer Price (৳) *</label>
                <input
                  type="number"
                  min={1}
                  value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(Number(e.target.value))}
                  className={`${inputClass} font-mono-num font-bold`}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Calculated Promotion</label>
                <div className="h-10 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 flex items-center justify-between font-mono-num text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {discountPct > 0 ? `${discountPct}% OFF` : 'Standard Price'}
                  </span>
                  {savingsAmount > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-300">
                      -৳{savingsAmount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Variants Header & Actions */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#465FFF]" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  SKU Variants ({variants.length})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoGenerateVariants}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#465FFF]" />
                  <span>Auto-Fill S–XXL</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddSingleVariant}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Variant</span>
                </button>
              </div>
            </div>

            {/* Variants Responsive Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
              <table className="min-w-[740px] w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Size / Option</th>
                    <th className="py-2.5 px-3">Color &amp; Swatch</th>
                    <th className="py-2.5 px-3">Variant SKU</th>
                    <th className="py-2.5 px-3 text-right">Cost (COGS ৳)</th>
                    <th className="py-2.5 px-3 text-right">Retail (৳)</th>
                    <th className="py-2.5 px-3 text-center">Stock</th>
                    <th className="py-2.5 px-3 text-center">Alert</th>
                    <th className="py-2.5 px-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {variants.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <select
                          value={v.size}
                          onChange={(e) =>
                            handleUpdateVariant(v.id, { size: e.target.value as GarmentSize })
                          }
                          className="h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 font-semibold text-xs text-gray-900 dark:text-white"
                        >
                          {(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free'] as GarmentSize[]).map(
                            (sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={v.colorHex}
                            onChange={(e) =>
                              handleUpdateVariant(v.id, { colorHex: e.target.value })
                            }
                            className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer p-0 shrink-0 bg-transparent"
                            title="Pick color swatch"
                          />
                          <input
                            type="text"
                            list="thesteps-color-presets"
                            value={v.color}
                            onChange={(e) => {
                              const val = e.target.value;
                              const match = PRESET_COLORS.find((c) => c.name === val);
                              handleUpdateVariant(
                                v.id,
                                match ? { color: val, colorHex: match.hex } : { color: val }
                              );
                            }}
                            placeholder="Color name"
                            className="w-32 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-xs text-gray-900 dark:text-white"
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) =>
                            handleUpdateVariant(v.id, { sku: e.target.value.toUpperCase() })
                          }
                          className="w-28 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 font-mono-num uppercase text-xs font-semibold text-gray-900 dark:text-white"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={v.purchasePrice}
                          onChange={(e) =>
                            handleUpdateVariant(v.id, { purchasePrice: Number(e.target.value) })
                          }
                          className="w-20 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 font-mono-num text-xs text-right text-gray-700 dark:text-gray-300"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={v.discountedPrice}
                          onChange={(e) =>
                            handleUpdateVariant(v.id, {
                              discountedPrice: Number(e.target.value)
                            })
                          }
                          className="w-20 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 font-mono-num text-xs text-right font-bold text-gray-900 dark:text-white"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) =>
                            handleUpdateVariant(v.id, {
                              stock: Math.max(0, Number(e.target.value))
                            })
                          }
                          className="w-16 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 font-mono-num text-xs text-center font-bold text-gray-900 dark:text-white"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={v.minStockAlert}
                          onChange={(e) =>
                            handleUpdateVariant(v.id, { minStockAlert: Number(e.target.value) })
                          }
                          className="w-14 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 font-mono-num text-xs text-center text-gray-500 dark:text-gray-400"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(v.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <datalist id="thesteps-color-presets">
                {PRESET_COLORS.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* Matrix Summary Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-xs">
              <div className="flex items-center justify-between sm:block">
                <span className="text-gray-500 dark:text-gray-400">Active Variants</span>
                <span className="font-mono-num font-bold text-gray-900 dark:text-white sm:block sm:mt-0.5">
                  {variants.length} options
                </span>
              </div>
              <div className="flex items-center justify-between sm:block">
                <span className="text-gray-500 dark:text-gray-400">Warehouse Units</span>
                <span className="font-mono-num font-bold text-gray-900 dark:text-white sm:block sm:mt-0.5">
                  {totalStock.toLocaleString()} units
                </span>
              </div>
              <div className="flex items-center justify-between sm:block">
                <span className="text-gray-500 dark:text-gray-400">Estimated Margin</span>
                <span
                  className={`font-mono-num font-bold sm:block sm:mt-0.5 ${
                    avgMarginPct >= 20
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {avgMarginPct}% gross margin
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 4: SPECIFICATIONS & HIGHLIGHTS */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Specifications &amp; Material Details
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Shown on product cards and technical spec tables
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Primary Spec / Fabric Composition *</label>
                <input
                  type="text"
                  placeholder="e.g. 100% Combed Ring-Spun Cotton or Official Sealed Box"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Construction / Fulfillment Highlight</label>
                <input
                  type="text"
                  placeholder="e.g. Pinpoint Oxford Weave or 64-District Express"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Fabric Weight (GSM — Apparel Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 240"
                  value={gsm || ''}
                  onChange={(e) =>
                    setGsm(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className={`${inputClass} font-mono-num`}
                />
              </div>

              <div>
                <label className={labelClass}>Shipping / Unit Weight</label>
                <input
                  type="text"
                  placeholder="e.g. 350g"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={`${inputClass} font-mono-num`}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-2.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Quick Spec Presets
              </span>
              <div className="flex flex-wrap gap-2">
                {SPEC_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setFabric(preset.fab);
                      setMaterial(preset.mat);
                      setGsm(preset.g);
                      setWeight(preset.w);
                      addToast('Preset Applied', preset.label, 'info');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#465FFF] text-xs font-medium text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT STICKY SIDEBAR (4 Cols): Live Storefront Card Preview + Status & Publish */}
        <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-6">
          {/* LIVE STOREFRONT PREVIEW CARD */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-[#ff4300]" />
                <span>Live Storefront Preview</span>
              </h3>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                TheSteps Card
              </span>
            </div>

            {/* Storefront Card Simulation */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
              <div className="relative aspect-4/3 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {images[0] ? (
                  <img
                    src={images[0]}
                    alt={name || 'Product cover'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}

                {discountPct > 0 && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#ff4300] text-white text-[11px] font-bold font-mono-num shadow-xs">
                    -{discountPct}%
                  </span>
                )}

                {isFlashDeal && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                    <Zap className="w-3 h-3 fill-white" />
                    <span>Flash</span>
                  </span>
                )}

                {freeDelivery && (
                  <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-emerald-600/95 text-white text-[10px] font-semibold flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>Free Delivery</span>
                  </span>
                )}
              </div>

              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="truncate font-medium">
                    {brand || 'TheSteps Official'} · {selectedCategoryObj?.name || category}
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-mono-num text-amber-500 shrink-0">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{initialProduct?.rating?.toFixed(1) || '5.0'}</span>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 min-h-[2.5rem]">
                  {name.trim() || 'Your Product Title Will Appear Here'}
                </h4>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                  {fabric || 'Official Retail Box'}
                  {gsm ? ` · ${gsm} GSM` : ''}
                </p>

                <div className="flex items-baseline justify-between gap-2 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold font-mono-num text-[#ff4300]">
                      ৳{(discountedPrice || 0).toLocaleString()}
                    </span>
                    {regularPrice > discountedPrice && (
                      <span className="text-xs font-mono-num text-gray-400 line-through">
                        ৳{regularPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Variant Swatch Dots */}
                  <div className="flex items-center -space-x-1">
                    {Array.from(new Set(variants.map((v) => v.colorHex)))
                      .slice(0, 4)
                      .map((hex, idx) => (
                        <span
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full border border-white dark:border-gray-900 shadow-2xs"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] font-mono-num text-gray-500 dark:text-gray-400">
                  <span>{totalStock} in stock</span>
                  {allowBid ? (
                    <span className="text-[#465FFF] dark:text-[#7592FF] font-semibold">
                      Bids from ৳{Math.round((discountedPrice || 0) * 0.85).toLocaleString()}
                    </span>
                  ) : (
                    <span>{shopName || 'TheSteps'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CATALOG VISIBILITY & MERCHANDISING */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Visibility &amp; Merchandising
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Control catalog publishing status and storefront badges
              </p>
            </div>

            {/* Segmented Status Picker */}
            <div>
              <label className={labelClass}>Catalog Status</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                {(['active', 'draft', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      status === st
                        ? st === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : st === 'draft'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-gray-700 text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessible Switch Toggles */}
            <div className="space-y-2">
              <ToggleRow
                checked={isFlashDeal}
                onChange={setIsFlashDeal}
                title="Flash Sale Zone"
                subtitle="Feature in countdown flash deals banner"
                icon={<Zap className="w-4 h-4" />}
              />

              <ToggleRow
                checked={allowBid}
                onChange={setAllowBid}
                title="Allow Customer Bids"
                subtitle={`Min offer: ৳${Math.round((discountedPrice || 0) * 0.85).toLocaleString()}`}
                icon={<Handshake className="w-4 h-4" />}
              />

              <ToggleRow
                checked={freeDelivery}
                onChange={setFreeDelivery}
                title="Free Delivery Badge"
                subtitle="Highlight nationwide free shipping"
                icon={<Truck className="w-4 h-4" />}
              />

              <ToggleRow
                checked={isFeatured}
                onChange={setIsFeatured}
                title="Featured Product"
                subtitle="Pin near top of Deals You Can't Miss"
                icon={<Sparkles className="w-4 h-4" />}
              />

              <ToggleRow
                checked={isNewArrival}
                onChange={setIsNewArrival}
                title="New Arrival"
                subtitle="Include in newest sort & arrival feeds"
                icon={<Tag className="w-4 h-4" />}
              />

              <ToggleRow
                checked={isBestSeller}
                onChange={setIsBestSeller}
                title="Best Seller"
                subtitle="Promote in trending recommendations"
                icon={<Award className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* READINESS CHECKLIST & SUBMIT CARD */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Publish Readiness
              </h3>
              <span className="font-mono-num text-xs font-semibold text-[#465FFF] dark:text-[#7592FF]">
                {passedCount}/{readinessChecks.length}
              </span>
            </div>

            <div className="space-y-2">
              {readinessChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {check.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                  )}
                  <span
                    className={
                      check.ok
                        ? 'text-gray-800 dark:text-gray-200 font-medium'
                        : 'text-gray-400 dark:text-gray-500'
                    }
                  >
                    {check.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Syncing to Catalog...'
                    : mode === 'create'
                    ? 'Publish TheSteps Product'
                    : 'Save Product Changes'}
                </span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              >
                Cancel &amp; Return to Catalog
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
