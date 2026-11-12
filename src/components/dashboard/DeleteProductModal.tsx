import React from 'react';
import { AlertTriangle, Trash2, Archive, X } from 'lucide-react';
import { Product } from '../../types';

interface DeleteProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onArchive: (productId: string) => Promise<void>;
  onPermanentDelete: (productId: string) => Promise<void>;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onArchive,
  onPermanentDelete
}) => {
  if (!isOpen || !product) return null;

  const totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-950">Delete or Archive Garment</h3>
              <p className="text-xs text-neutral-500">Confirm catalog mutation for this product</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Preview Card */}
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-14 h-16 object-cover rounded-lg bg-neutral-200 shrink-0"
          />
          <div className="min-w-0 flex-1 text-xs">
            <h4 className="font-bold text-neutral-950 line-clamp-1">{product.name}</h4>
            <p className="font-mono text-[11px] text-neutral-500">SKU: {product.sku}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono font-bold text-neutral-900">৳{product.discountedPrice.toLocaleString()}</span>
              <span className="text-neutral-300">·</span>
              <span className={`font-mono font-semibold ${totalStock > 0 ? 'text-emerald-700' : 'text-neutral-500'}`}>
                {totalStock} units in stock
              </span>
            </div>
          </div>
        </div>

        {totalStock > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
            <p className="font-bold">Active Inventory Notice:</p>
            <p className="mt-0.5 text-[11px]">
              This product currently has <span className="font-bold">{totalStock} units</span> across {product.variants.length} size variants. We recommend archiving rather than permanently deleting to preserve stock movement ledgers.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Option 1: Archive (Safe) */}
          <button
            type="button"
            onClick={async () => {
              await onArchive(product.id);
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4 text-neutral-600" />
            <span>Archive Product (Hide from Storefront)</span>
          </button>

          {/* Option 2: Permanent Delete */}
          <button
            type="button"
            onClick={async () => {
              await onPermanentDelete(product.id);
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Permanently Delete from Database</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-neutral-500 hover:text-neutral-800 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
