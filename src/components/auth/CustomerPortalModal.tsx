import React, { useState } from 'react';
import {
  X,
  User,
  ShoppingBag,
  Heart,
  Ticket,
  Handshake,
  MapPin,
  Camera,
  Printer,
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { Order, Product } from '../../types';
import { optimizeLocalImage } from '../../utils/imageUtils';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice: (order: Order) => void;
  onSelectProduct: (product: Product) => void;
  onOpenDashboard: () => void;
  onOpenAuth: () => void;
  onOpenCheckout: () => void;
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  isOpen,
  onClose,
  onPrintInvoice,
  onSelectProduct,
  onOpenDashboard,
  onOpenAuth,
  onOpenCheckout
}) => {
  const { currentUser, updateProfile, toggleWishlist, isManager } = useAuth();
  const { orders, products, bids, coupons, cancelOrder } = useStore();
  const { addToCart, applyCouponCode, setIsCartOpen } = useCart();
  const { addToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'orders' | 'bids' | 'wishlist' | 'vouchers' | 'profile'>('orders');
  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.displayName || '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phoneNumber || '');

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
          <User className="w-10 h-10 text-[#ff4300] mx-auto" />
          <h3 className="text-base font-bold text-[#292933]">Sign in to TheSteps</h3>
          <p className="text-xs text-neutral-500">Access your orders, bids, saved wishlist, and collected vouchers.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-neutral-300 rounded text-xs font-semibold cursor-pointer">
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="flex-1 py-2 bg-[#ff4300] text-white rounded text-xs font-semibold cursor-pointer"
            >
              Login / Sign up
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myOrders = isManager
    ? orders
    : orders.filter(
        (o) =>
          o.customerId === currentUser.uid ||
          o.email.toLowerCase() === currentUser.email.toLowerCase() ||
          (currentUser.phoneNumber && o.contactNumber === currentUser.phoneNumber)
      );

  const wishlistProducts = products.filter((p) => (currentUser.savedWishlist || []).includes(p.id));
  const collectedVouchers = coupons.filter((c) => (currentUser.collectedVouchers || []).includes(c.code));
  const myBids = isManager
    ? bids
    : bids.filter((b) => b.customerId === currentUser.uid || b.customerPhone === currentUser.phoneNumber);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeLocalImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.82 });
      await updateProfile({ photoURL: optimized.dataUrl });
      addToast('Photo Updated', 'Profile photo saved from local drive.', 'success');
    } catch (err: any) {
      addToast('Upload Error', err.message || 'Could not process photo.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName: displayNameInput.trim() || currentUser.displayName,
      phoneNumber: phoneInput.trim()
    });
    addToast('Profile Saved', 'Your TheSteps account details have been updated.', 'success');
  };

  const handleCheckoutAcceptedBid = (productId: string, acceptedPrice: number, qty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || !prod.variants[0]) return;
    const ok = addToCart(prod, prod.variants[0], qty, acceptedPrice);
    if (ok) {
      onClose();
      onOpenCheckout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Top Banner */}
        <div className="px-5 py-4 bg-[#292933] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#ff4300] text-white flex items-center justify-center font-bold text-base overflow-hidden border-2 border-white/20">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
              ) : (
                currentUser.displayName.charAt(0)
              )}
            </div>
            <div>
              <h3 className="text-base font-bold">{currentUser.displayName}</h3>
              <p className="text-xs text-neutral-300">
                {currentUser.email} · <span className="uppercase font-semibold text-[#ff4300]">{currentUser.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isManager && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDashboard();
                }}
                className="px-3 py-1.5 rounded bg-[#008ED2] hover:bg-[#0074ad] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Seller / Admin Hub</span>
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1.5 text-neutral-300 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 gap-6 text-xs font-semibold overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'orders', label: `My Orders (${myOrders.length})`, icon: ShoppingBag },
            { id: 'bids', label: `My Bids (${myBids.length})`, icon: Handshake },
            { id: 'wishlist', label: `Wishlist (${wishlistProducts.length})`, icon: Heart },
            { id: 'vouchers', label: `Vouchers (${collectedVouchers.length})`, icon: Ticket },
            { id: 'profile', label: 'Profile & Addresses', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  active ? 'border-[#ff4300] text-[#ff4300]' : 'border-transparent text-neutral-600 hover:text-[#292933]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#ebedf0] text-xs space-y-4">
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {myOrders.length === 0 ? (
                <div className="bg-white rounded-lg p-10 text-center text-neutral-500">
                  You have no orders yet. Explore Deals You Can&apos;t Miss to place your first TheSteps order!
                </div>
              ) : (
                myOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-100">
                      <div>
                        <span className="font-mono-num font-bold text-sm text-[#292933]">{order.orderNumber}</span>
                        <span className="ml-2 text-neutral-500">{new Date(order.orderDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#E6F4FB] text-[#008ED2] font-semibold uppercase text-[11px]">
                          {order.orderStatus.replace('_', ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => onPrintInvoice(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-neutral-300 hover:bg-neutral-100 font-semibold cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Invoice</span>
                        </button>
                        {(order.orderStatus === 'pending_payment' || order.orderStatus === 'confirmed') && (
                          <button
                            type="button"
                            onClick={() => cancelOrder(order.id, 'Cancelled by customer from My Orders portal')}
                            className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {order.items.slice(0, 3).map((it, idx) => (
                          <img key={idx} src={it.image} alt={it.name} className="w-10 h-10 rounded object-cover border border-neutral-200" />
                        ))}
                        <span className="text-neutral-600">
                          {order.items[0]?.name} {order.items.length > 1 ? `+ ${order.items.length - 1} more` : ''}
                        </span>
                      </div>
                      <span className="font-mono-num font-bold text-sm text-[#ff4300]">
                        ৳{order.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'bids' && (
            <div className="space-y-3">
              {myBids.length === 0 ? (
                <div className="bg-white rounded-lg p-10 text-center text-neutral-500">
                  No price offers submitted yet. Look for &quot;Bid For Product&quot; on eligible TheSteps items!
                </div>
              ) : (
                myBids.map((bid) => (
                  <div key={bid.id} className="bg-white rounded-lg border border-neutral-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={bid.productImage} alt={bid.productName} className="w-14 h-14 rounded object-cover border border-neutral-200 shrink-0" />
                      <div>
                        <p className="font-semibold text-[#292933]">{bid.productName}</p>
                        <p className="text-neutral-500 mt-0.5 font-mono-num">
                          List: ৳{bid.originalPrice.toLocaleString()} · Your Bid:{' '}
                          <span className="font-bold text-[#ff4300]">৳{bid.bidAmount.toLocaleString()}</span> × {bid.quantity}
                        </p>
                        {bid.status === 'countered' && bid.counterAmount && (
                          <p className="text-[#008ED2] font-semibold mt-0.5 font-mono-num">
                            Seller Counter Offer: ৳{bid.counterAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase ${
                          bid.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bid.status === 'countered'
                            ? 'bg-[#E6F4FB] text-[#008ED2]'
                            : bid.status === 'declined'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {bid.status}
                      </span>

                      {(bid.status === 'accepted' || bid.status === 'countered') && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCheckoutAcceptedBid(
                              bid.productId,
                              bid.status === 'countered' && bid.counterAmount ? bid.counterAmount : bid.bidAmount,
                              bid.quantity
                            )
                          }
                          className="px-3 py-1.5 rounded bg-[#ff4300] hover:bg-[#d93800] text-white font-semibold cursor-pointer"
                        >
                          Checkout at Agreed Price
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wishlistProducts.length === 0 ? (
                <div className="sm:col-span-2 bg-white rounded-lg p-10 text-center text-neutral-500">
                  Your wishlist is empty. Tap the heart icon on any TheSteps product to save it here.
                </div>
              ) : (
                wishlistProducts.map((prod) => (
                  <div key={prod.id} className="bg-white rounded-lg border border-neutral-200 p-3 flex items-center gap-3">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      onClick={() => {
                        onClose();
                        onSelectProduct(prod);
                      }}
                      className="w-16 h-16 rounded object-cover cursor-pointer shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        onClick={() => {
                          onClose();
                          onSelectProduct(prod);
                        }}
                        className="font-semibold text-[#292933] truncate cursor-pointer hover:text-[#ff4300]"
                      >
                        {prod.name}
                      </p>
                      <p className="font-mono-num font-bold text-[#ff4300] mt-0.5">
                        ৳{prod.discountedPrice.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (prod.variants[0]) {
                              addToCart(prod, prod.variants[0], 1);
                              onClose();
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-[#ff4300] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Add to cart</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(prod.id)}
                          className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'vouchers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {collectedVouchers.length === 0 ? (
                <div className="sm:col-span-2 bg-white rounded-lg p-10 text-center text-neutral-500">
                  No collected vouchers yet. Visit the Voucher Center to collect discounts!
                </div>
              ) : (
                collectedVouchers.map((c) => (
                  <div key={c.id} className="bg-white rounded-lg border-2 border-dashed border-[#008ED2]/50 p-4 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono font-bold text-[#008ED2] bg-[#E6F4FB] px-2 py-0.5 rounded">{c.code}</span>
                      <p className="font-bold text-[#292933] mt-1">{c.title}</p>
                      <p className="text-[11px] text-neutral-500">Min spend ৳{c.minOrderAmount.toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (applyCouponCode(c.code)) {
                          onClose();
                          setIsCartOpen(true);
                        }
                      }}
                      className="px-3 py-1.5 rounded bg-[#008ED2] text-white font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Apply</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <form onSubmit={handleSaveProfile} className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3">
                <h4 className="font-bold text-[#292933] text-sm">Personal Information</h4>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200 flex items-center justify-center font-bold text-lg text-[#292933]">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.displayName.charAt(0)
                    )}
                  </div>
                  <label className="px-3 py-1.5 rounded border border-neutral-300 hover:bg-neutral-50 font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                    <Camera className="w-3.5 h-3.5 text-[#ff4300]" />
                    <span>Upload Photo from Drive</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded font-mono-num"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff4300] hover:bg-[#d93800] text-white font-semibold rounded cursor-pointer"
                >
                  Save Profile
                </button>
              </form>

              <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3">
                <h4 className="font-bold text-[#292933] text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#ff4300]" />
                  <span>Saved Delivery Addresses</span>
                </h4>
                {(currentUser.addresses || []).length === 0 ? (
                  <p className="text-neutral-500">Addresses used at checkout will automatically be saved here.</p>
                ) : (
                  <div className="space-y-2.5">
                    {currentUser.addresses!.map((addr, idx) => (
                      <div key={idx} className="p-3 rounded bg-neutral-50 border border-neutral-200 space-y-0.5">
                        <p className="font-bold text-[#292933]">{addr.fullName} · {addr.phone}</p>
                        <p className="text-neutral-600">{addr.detailedAddress}</p>
                        <p className="text-neutral-500">{addr.upazila}, {addr.district}, {addr.division}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
