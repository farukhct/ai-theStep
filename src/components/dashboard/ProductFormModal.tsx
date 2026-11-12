import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Sparkles, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Layers, 
  DollarSign, 
  Check, 
  AlertCircle,
  HelpCircle,
  Wand2,
  HardDrive,
  Link,
  UploadCloud
} from 'lucide-react';
import { Product, ProductVariant, GarmentSize } from '../../types';
import { GARMENT_CATEGORIES } from '../../config/constants';
import { useNotification } from '../../context/NotificationContext';
import { LocalImageUploader } from '../common/LocalImageUploader';

interface ProductFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialProduct?: Product | null;
  onClose: () => void;
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
  { label: 'Heavyweight Tee Black', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80' },
  { label: 'Heavyweight Tee White', url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80' },
  { label: 'Executive Oxford Shirt', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80' },
  { label: 'Raw Selvedge Denim', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80' },
  { label: 'Smart Stretch Chinos', url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80' },
  { label: 'Tech Spacer Zip Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80' },
  { label: 'Jacquard Festive Panjabi', url: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&auto=format&fit=crop&q=80' }
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  mode,
  initialProduct,
  onClose,
  onSubmit
}) => {
  const { addToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'fabric' | 'images'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('t-shirts');
  const [subcategory, setSubcategory] = useState('Garments');
  const [brand, setBrand] = useState('AURA Atelier');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Pricing & Fabric
  const [regularPrice, setRegularPrice] = useState(1400);
  const [discountedPrice, setDiscountedPrice] = useState(1150);
  const [fabric, setFabric] = useState('100% Combed Ring-Spun Cotton');
  const [material, setMaterial] = useState('Single Jersey Compact Yarn');
  const [gsm, setGsm] = useState<number | undefined>(240);
  const [weight, setWeight] = useState('320g');

  // Images State
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageSourceMode, setImageSourceMode] = useState<'local' | 'url' | 'presets'>('local');

  // Variants State
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: `var-${Date.now()}-M`,
      sku: 'TSH-BLK-M',
      size: 'M',
      color: 'Midnight Jet Black',
      colorHex: '#18181b',
      purchasePrice: 450,
      regularPrice: 1400,
      discountedPrice: 1150,
      stock: 20,
      reservedStock: 0,
      minStockAlert: 5
    },
    {
      id: `var-${Date.now()}-L`,
      sku: 'TSH-BLK-L',
      size: 'L',
      color: 'Midnight Jet Black',
      colorHex: '#18181b',
      purchasePrice: 450,
      regularPrice: 1400,
      discountedPrice: 1150,
      stock: 15,
      reservedStock: 0,
      minStockAlert: 5
    }
  ]);

  // Prepopulate on edit
  useEffect(() => {
    if (mode === 'edit' && initialProduct) {
      setName(initialProduct.name);
      setSku(initialProduct.sku);
      setCategory(initialProduct.category);
      setSubcategory(initialProduct.subcategory || 'Garments');
      setBrand(initialProduct.brand || 'AURA Atelier');
      setDescription(initialProduct.description || '');
      setStatus(initialProduct.status || 'active');
      setIsFeatured(Boolean(initialProduct.isFeatured));
      setIsNewArrival(Boolean(initialProduct.isNewArrival));
      setIsBestSeller(Boolean(initialProduct.isBestSeller));
      setRegularPrice(initialProduct.regularPrice);
      setDiscountedPrice(initialProduct.discountedPrice);
      setFabric(initialProduct.fabric || '100% Combed Cotton');
      setMaterial(initialProduct.material || 'Single Jersey');
      setGsm(initialProduct.gsm || 240);
      setWeight(initialProduct.weight || '320g');
      setImages(initialProduct.images && initialProduct.images.length > 0 ? initialProduct.images : [PRESET_IMAGES[0].url]);
      setVariants(initialProduct.variants && initialProduct.variants.length > 0 ? initialProduct.variants : []);
    } else if (mode === 'create') {
      // Default reset for creation
      setName('');
      setSku(`GAR-${Date.now().toString().slice(-4)}`);
      setCategory('t-shirts');
      setSubcategory('Garments');
      setBrand('AURA Atelier');
      setDescription('Crafted with premium Bangladeshi textile engineering.');
      setStatus('active');
      setIsFeatured(true);
      setIsNewArrival(true);
      setIsBestSeller(false);
      setRegularPrice(1400);
      setDiscountedPrice(1150);
      setFabric('100% Combed Ring-Spun Cotton');
      setMaterial('Single Jersey');
      setGsm(240);
      setWeight('300g');
      setImages([PRESET_IMAGES[0].url]);
      setVariants([
        {
          id: `var-${Date.now()}-M`,
          sku: 'GAR-BLK-M',
          size: 'M',
          color: 'Midnight Jet Black',
          colorHex: '#18181b',
          purchasePrice: 450,
          regularPrice: 1400,
          discountedPrice: 1150,
          stock: 20,
          reservedStock: 0,
          minStockAlert: 5
        },
        {
          id: `var-${Date.now()}-L`,
          sku: 'GAR-BLK-L',
          size: 'L',
          color: 'Midnight Jet Black',
          colorHex: '#18181b',
          purchasePrice: 450,
          regularPrice: 1400,
          discountedPrice: 1150,
          stock: 15,
          reservedStock: 0,
          minStockAlert: 5
        }
      ]);
    }
  }, [mode, initialProduct, isOpen]);

  if (!isOpen) return null;

  // Auto generate standard S-XXL sizes
  const handleAutoGenerateVariants = () => {
    const baseSku = sku || 'GAR';
    const standardSizes: GarmentSize[] = ['S', 'M', 'L', 'XL', 'XXL'];
    const newVars: ProductVariant[] = standardSizes.map((s) => ({
      id: `var-${Date.now()}-${s}-${Math.random().toString(36).substring(2, 5)}`,
      sku: `${baseSku}-${s}`,
      size: s,
      color: 'Midnight Jet Black',
      colorHex: '#18181b',
      purchasePrice: Math.round(discountedPrice * 0.4),
      regularPrice: regularPrice,
      discountedPrice: discountedPrice,
      stock: 15,
      reservedStock: 0,
      minStockAlert: 4
    }));
    setVariants(newVars);
    addToast('Standard Sizes Generated', '5 size variants (S-XXL) created.', 'info');
  };

  const handleAddSingleVariant = () => {
    const baseSku = sku || 'GAR';
    const newV: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sku: `${baseSku}-${Date.now().toString().slice(-3)}`,
      size: 'M',
      color: 'Midnight Jet Black',
      colorHex: '#18181b',
      purchasePrice: Math.round(discountedPrice * 0.4),
      regularPrice: regularPrice,
      discountedPrice: discountedPrice,
      stock: 10,
      reservedStock: 0,
      minStockAlert: 3
    };
    setVariants((prev) => [...prev, newV]);
  };

  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const handleDeleteVariant = (id: string) => {
    if (variants.length <= 1) {
      addToast('Cannot Remove', 'A garment must have at least one variant size/color.', 'warning');
      return;
    }
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
    addToast('Image Added', 'Image URL added to gallery.', 'info');
  };

  const handleLocalImagesUploaded = (newUrls: string[]) => {
    if (newUrls.length === 0) return;
    setImages((prev) => {
      // If previous only has the single default sample and user is inserting their own local images, replace it
      const isOnlyDefault = prev.length === 1 && prev[0] === PRESET_IMAGES[0].url;
      if (isOnlyDefault) {
        return newUrls;
      }
      return [...prev, ...newUrls];
    });
    addToast('Local Images Inserted', `${newUrls.length} image${newUrls.length > 1 ? 's' : ''} loaded from local drive.`, 'success');
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      addToast('Image Required', 'Product requires at least one primary image.', 'warning');
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Validation', 'Product name is required.', 'warning');
      return;
    }
    if (!sku.trim()) {
      addToast('Validation', 'Product SKU is required.', 'warning');
      return;
    }
    if (variants.length === 0) {
      addToast('Validation', 'At least one variant size/color is required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const totalAvailable = variants.reduce((acc, v) => acc + (v.stock || 0), 0);

    const productPayload = {
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sku: sku.trim().toUpperCase(),
      category,
      subcategory,
      brand,
      description: description.trim(),
      images,
      fabric,
      material,
      gsm: gsm ? Number(gsm) : undefined,
      weight,
      regularPrice: Number(regularPrice),
      discountedPrice: Number(discountedPrice),
      availableQuantity: totalAvailable,
      minimumStockLevel: 10,
      status,
      isFeatured,
      isNewArrival,
      isBestSeller,
      variants,
      rating: initialProduct?.rating || 5.0,
      reviewsCount: initialProduct?.reviewsCount || 0
    };

    try {
      await onSubmit(productPayload);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      addToast('Operation Failed', err.message || 'Could not save product', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {mode === 'create' ? 'Create New Garment Product' : `Edit Product · ${initialProduct?.name}`}
              </h3>
              <p className="text-xs text-neutral-400">
                {mode === 'create' ? 'Add catalog item with multi-variant stock ledger' : `SKU: ${initialProduct?.sku}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 sm:px-6 pt-3 gap-6 text-xs font-bold shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'general' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>General & Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'variants' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Variants & Stock ({variants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fabric')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'fabric' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fabric & Specs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'images' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Gallery Images ({images.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* TAB 1: GENERAL & PRICING */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-neutral-800 mb-1">Product Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Heavyweight Combed Cotton Oversized T-Shirt"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-950 font-medium focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Base Master SKU *</label>
                  <input
                    type="text"
                    placeholder="TSH-HVY-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono uppercase text-neutral-950 font-bold focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-2 font-medium"
                  >
                    {GARMENT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. Oversized Tees / Formal"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Brand Line</label>
                  <input
                    type="text"
                    placeholder="AURA Atelier"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <h5 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Bangladeshi Pricing (BDT / ৳)</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Regular Tag Price (৳)</label>
                    <input
                      type="number"
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold text-neutral-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Discounted Selling Price (৳) *</label>
                    <input
                      type="number"
                      value={discountedPrice}
                      onChange={(e) => setDiscountedPrice(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold text-neutral-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Discount Rate</label>
                    <div className="px-3 py-2 bg-neutral-200/60 rounded-lg font-mono font-bold text-emerald-800">
                      {regularPrice > discountedPrice
                        ? `Save ${Math.round(((regularPrice - discountedPrice) / regularPrice) * 100)}%`
                        : 'No Discount'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed tailoring notes, silhouette cut, collar reinforcement..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-950 focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Merchandising & Status Toggles */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Catalog Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-bold capitalize"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="archived">Archived (Deactivated)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-neutral-900"
                  />
                  <span>Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="rounded text-neutral-900"
                  />
                  <span>New Arrival Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="rounded text-neutral-900"
                  />
                  <span>Best Seller Badge</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: VARIANTS & STOCK MATRIX */}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-sm text-neutral-950">Size & Color Variant Stock Matrix</h4>
                  <p className="text-neutral-500 text-[11px]">
                    Every variant has its own unique SKU, purchase cost (COGS), selling price, and stock counter.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoGenerateVariants}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Fill S to XXL</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddSingleVariant}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>
              </div>

              {/* Variant Rows Table */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Color & Swatch</th>
                      <th className="py-2.5 px-3">Variant SKU</th>
                      <th className="py-2.5 px-3 text-right">Cost (COGS ৳)</th>
                      <th className="py-2.5 px-3 text-right">Retail Price (৳)</th>
                      <th className="py-2.5 px-3 text-center">Stock</th>
                      <th className="py-2.5 px-3 text-center">Min Alert</th>
                      <th className="py-2.5 px-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {variants.map((v) => (
                      <tr key={v.id} className="hover:bg-neutral-50">
                        {/* Size */}
                        <td className="py-2 px-3">
                          <select
                            value={v.size}
                            onChange={(e) => handleUpdateVariant(v.id, { size: e.target.value as GarmentSize })}
                            className="bg-white border border-neutral-300 rounded px-2 py-1 font-bold text-xs"
                          >
                            {(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free'] as GarmentSize[]).map((sz) => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                        </td>

                        {/* Color & Hex */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={v.colorHex}
                              onChange={(e) => handleUpdateVariant(v.id, { colorHex: e.target.value })}
                              className="w-6 h-6 rounded border border-neutral-300 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={v.color}
                              onChange={(e) => handleUpdateVariant(v.id, { color: e.target.value })}
                              placeholder="Color Name"
                              className="w-28 bg-white border border-neutral-300 rounded px-2 py-1 text-xs"
                            />
                          </div>
                        </td>

                        {/* Variant SKU */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleUpdateVariant(v.id, { sku: e.target.value.toUpperCase() })}
                            className="w-28 bg-white border border-neutral-300 rounded px-2 py-1 font-mono uppercase text-xs font-bold"
                          />
                        </td>

                        {/* Purchase Price (COGS) */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={v.purchasePrice}
                            onChange={(e) => handleUpdateVariant(v.id, { purchasePrice: Number(e.target.value) })}
                            className="w-18 bg-white border border-neutral-300 rounded px-2 py-1 font-mono text-xs text-right"
                          />
                        </td>

                        {/* Retail Selling Price */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={v.discountedPrice}
                            onChange={(e) => handleUpdateVariant(v.id, { discountedPrice: Number(e.target.value) })}
                            className="w-18 bg-white border border-neutral-300 rounded px-2 py-1 font-mono text-xs text-right font-bold"
                          />
                        </td>

                        {/* Stock Quantity */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => handleUpdateVariant(v.id, { stock: Math.max(0, Number(e.target.value)) })}
                            className="w-16 bg-white border border-neutral-300 rounded px-2 py-1 font-mono text-xs text-center font-bold text-neutral-950"
                          />
                        </td>

                        {/* Min Stock Alert */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={v.minStockAlert}
                            onChange={(e) => handleUpdateVariant(v.id, { minStockAlert: Number(e.target.value) })}
                            className="w-14 bg-white border border-neutral-300 rounded px-2 py-1 font-mono text-xs text-center text-neutral-600"
                          />
                        </td>

                        {/* Delete Button */}
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(v.id)}
                            className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Stock Summary */}
              <div className="p-3 bg-neutral-100 rounded-lg flex items-center justify-between font-mono text-xs">
                <span>Total Calculated Stock for this Garment:</span>
                <span className="font-bold text-neutral-950">
                  {variants.reduce((acc, v) => acc + (v.stock || 0), 0)} units in warehouse
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: FABRIC & SPECIFICATIONS */}
          {activeTab === 'fabric' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Fabric Composition *</label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Combed Ring-Spun Cotton"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Shown prominently on storefront garment cards.</p>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Weave / Knit Construction</label>
                  <input
                    type="text"
                    placeholder="e.g. Single Jersey Compact Yarn / Pinpoint Oxford"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Fabric Weight (GSM)</label>
                  <input
                    type="number"
                    placeholder="e.g. 240"
                    value={gsm || ''}
                    onChange={(e) => setGsm(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-neutral-900"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Grams per square meter (e.g. 180 light, 240 heavy).</p>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Total Garment Weight</label>
                  <input
                    type="text"
                    placeholder="e.g. 320g"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                  />
                </div>
              </div>

              {/* Quick Presets for Bangladeshi Fabrics */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-800 text-[11px] uppercase tracking-wider block">
                  Quick Bangladeshi Textile Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '240 GSM Heavyweight Cotton', fab: '100% Combed Ring-Spun Cotton', mat: 'Single Jersey', g: 240 },
                    { label: '80s Egyptian Giza Cotton', fab: '100% Giza Long-Staple Cotton', mat: 'Pinpoint Oxford Weave', g: 140 },
                    { label: '14.5oz Narayanganj Selvedge', fab: '100% Ring-Spun Cotton', mat: '14.5oz Shuttle Selvedge Denim', g: 410 },
                    { label: 'Festive Jacquard Viscose', fab: '65% Cotton, 35% Viscose Jacquard', mat: 'Textured Jacquard Self-Weave', g: 175 },
                    { label: 'Stretch Peach Twill', fab: '97% Combed Cotton, 3% Spandex', mat: 'High-Count Peach Finish Twill', g: 260 }
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setFabric(preset.fab);
                        setMaterial(preset.mat);
                        setGsm(preset.g);
                        addToast('Preset Applied', preset.label, 'info');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-[11px] font-medium text-neutral-800 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GALLERY IMAGES */}
          {activeTab === 'images' && (
            <div className="space-y-5">
              {/* Image Source Mode Selector */}
              <div className="flex border-b border-neutral-200">
                <button
                  type="button"
                  onClick={() => setImageSourceMode('local')}
                  className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    imageSourceMode === 'local'
                      ? 'border-neutral-950 text-neutral-950 bg-neutral-50 rounded-t-lg'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span>Insert from Local Drive</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                    Recommended
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageSourceMode('url')}
                  className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    imageSourceMode === 'url'
                      ? 'border-neutral-950 text-neutral-950 bg-neutral-50 rounded-t-lg'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  <span>Web Image URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageSourceMode('presets')}
                  className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    imageSourceMode === 'presets'
                      ? 'border-neutral-950 text-neutral-950 bg-neutral-50 rounded-t-lg'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Studio Presets</span>
                </button>
              </div>

              {/* Mode 1: Local Drive Uploader */}
              {imageSourceMode === 'local' && (
                <div className="space-y-2">
                  <LocalImageUploader
                    onImagesUploaded={handleLocalImagesUploaded}
                    multiple={true}
                    maxFiles={8}
                    label="Select Images from your Local Drive"
                    description="Supports PNG, JPG, WebP, AVIF, SVG. Automatically optimized & compressed for e-commerce catalog."
                  />
                </div>
              )}

              {/* Mode 2: Add Custom Image URL Form */}
              {imageSourceMode === 'url' && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                  <label className="block text-xs font-bold text-neutral-800">
                    Paste Image Web Address (CDN / Unsplash / S3)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-bold text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Direct public image URLs will be linked in the garment catalog.
                  </p>
                </div>
              )}

              {/* Mode 3: Preset Curated Images */}
              {imageSourceMode === 'presets' && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <span className="block font-bold text-neutral-700 text-[11px] uppercase tracking-wider mb-2">
                    Select Curated Studio Garment Photos:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!images.includes(preset.url)) {
                            setImages((prev) => [...prev, preset.url]);
                            addToast('Preset Added', preset.label, 'info');
                          }
                        }}
                        className="p-2 border border-neutral-200 rounded-lg hover:border-neutral-900 text-left flex items-center gap-2 cursor-pointer transition-all bg-white hover:shadow-xs"
                      >
                        <img src={preset.url} alt={preset.label} className="w-10 h-12 object-cover rounded bg-neutral-100 shrink-0" />
                        <span className="text-[11px] font-medium text-neutral-800 line-clamp-1">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Gallery Thumbnails Grid */}
              <div className="pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-neutral-900 text-xs">
                    Current Catalog Images ({images.length}) · First image is Primary Cover
                  </span>
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setImages([images[0]]);
                        addToast('Gallery Reset', 'Retained only primary cover image.', 'info');
                      }}
                      className="text-[11px] text-neutral-500 hover:text-neutral-950 underline cursor-pointer"
                    >
                      Keep Cover Only
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, index) => {
                    const isLocal = img.startsWith('data:image/');
                    return (
                      <div key={index} className="relative aspect-4/5 rounded-xl overflow-hidden border-2 border-neutral-200 group bg-neutral-100 shadow-2xs">
                        <img src={img} alt={`Garment ${index + 1}`} className="w-full h-full object-cover" />
                        
                        {index === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-neutral-950 text-white text-[9px] font-extrabold tracking-wider uppercase shadow-xs">
                            PRIMARY COVER
                          </span>
                        )}

                        {/* Local vs URL Origin Badge */}
                        <span className={`absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 backdrop-blur-xs shadow-xs ${
                          isLocal ? 'bg-emerald-700/90 text-white' : 'bg-neutral-900/80 text-white'
                        }`}>
                          {isLocal ? <HardDrive className="w-2.5 h-2.5" /> : <Link className="w-2.5 h-2.5" />}
                          <span>{isLocal ? 'Local Drive' : 'Web URL'}</span>
                        </span>

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...images];
                                const [moved] = updated.splice(index, 1);
                                updated.unshift(moved);
                                setImages(updated);
                                addToast('Cover Changed', 'Set as primary garment photo.', 'info');
                              }}
                              className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-[10px] cursor-pointer shadow-sm transition-transform hover:scale-105"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-sm transition-transform hover:scale-105"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit Bar */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">
              * Required fields will sync to PostgreSQL and Firestore instantly.
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-xl uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{mode === 'create' ? 'Publish Garment' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
