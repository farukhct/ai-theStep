import React, { useState } from 'react';
import {
  PhoneCall,
  Mail,
  MapPin,
  ShieldCheck,
  FileText,
  ExternalLink,
  Home,
  LayoutGrid,
  ShoppingCart,
  User,
  MessageCircle
} from 'lucide-react';
import { THESTEPS_CONTACT } from '../../config/constants';
import { useNotification } from '../../context/NotificationContext';
import { useCart } from '../../context/CartContext';

interface FooterProps {
  onOpenDevDocs: () => void;
  onOpenGdpr: () => void;
  onOpenEpsOptions: () => void;
  onOpenTrackOrder: () => void;
  onOpenVoucherCenter: () => void;
  onOpenCart: () => void;
  onOpenPortal: () => void;
  onScrollTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDevDocs,
  onOpenGdpr,
  onOpenEpsOptions,
  onOpenTrackOrder,
  onOpenVoucherCenter,
  onOpenCart,
  onOpenPortal,
  onScrollTop
}) => {
  const { addToast } = useNotification();
  const { itemCount } = useCart();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      addToast('Invalid Email', 'Please enter a valid email address.', 'warning');
      return;
    }
    addToast('Subscribed!', 'You will receive TheSteps Flash Sale alerts and weekly vouchers.', 'success');
    setEmail('');
  };

  return (
    <>
      <footer className="bg-[#292933] text-neutral-300 pt-12 pb-20 sm:pb-10 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10 text-xs">
            {/* Brand & Rajshahi / Dhaka Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  The<span className="text-[#ff4300]">Steps</span>
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                {THESTEPS_CONTACT.tagline}. Trusted marketplace across all 64 districts of Bangladesh.
              </p>
              <div className="space-y-1.5 text-neutral-300 pt-1">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#ff4300] shrink-0 mt-0.5" />
                  <span>{THESTEPS_CONTACT.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#ff4300] shrink-0" />
                  <span className="font-mono-num">{THESTEPS_CONTACT.phoneHours}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#ff4300] shrink-0" />
                  <span>{THESTEPS_CONTACT.email}</span>
                </p>
              </div>
            </div>

            {/* TheSteps Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">TheSteps</h4>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <button type="button" onClick={onOpenVoucherCenter} className="hover:text-[#ff4300] cursor-pointer">
                    Voucher Center &amp; Discounts
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenTrackOrder} className="hover:text-[#ff4300] cursor-pointer">
                    Track Your Order
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenPortal} className="hover:text-[#ff4300] cursor-pointer">
                    Customer Account &amp; Bids
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenDevDocs} className="hover:text-[#ff4300] inline-flex items-center gap-1 cursor-pointer">
                    <FileText className="w-3.5 h-3.5" />
                    <span>API &amp; Architecture Docs</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Customer Care & Compliance */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Customer Care</h4>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <button type="button" onClick={onOpenGdpr} className="hover:text-[#ff4300] inline-flex items-center gap-1 cursor-pointer">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>GDPR &amp; SOC2 Privacy Center</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenEpsOptions} className="hover:text-[#ff4300] inline-flex items-center gap-1 cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5 text-[#008ED2]" />
                    <span>EPS Payment Gateway Options</span>
                  </button>
                </li>
                <li className="text-neutral-500">7-Day Easy Return &amp; Exchange</li>
                <li className="text-neutral-500">100% Authentic Product Guarantee</li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Get Flash Deal Alerts</h4>
              <p className="text-neutral-400">Subscribe for exclusive voucher drops and flash sale alerts.</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-3 py-2 rounded bg-[#1b1b28] border border-white/15 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff4300]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded bg-[#ff4300] hover:bg-[#d93800] text-white font-semibold text-xs cursor-pointer shrink-0"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Payment Strip & Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-neutral-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-white">Payment Methods (EPS):</span>
              <span>VISA · Mastercard · AMEX · bKash · Nagad · Rocket · Upay · Internet Banking · COD</span>
            </div>
            <p>© {new Date().getFullYear()} TheSteps Bangladesh (thesteps.com.bd). All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Direct Support Floating Button (Desktop) */}
      <a
        href={`tel:${THESTEPS_CONTACT.phone}`}
        title={`Call TheSteps Support: ${THESTEPS_CONTACT.phoneHours}`}
        className="hidden sm:flex fixed bottom-5 right-5 z-30 items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#1b8a3a] hover:bg-[#15702f] text-white text-xs font-semibold shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Help · {THESTEPS_CONTACT.phone}</span>
      </a>

      {/* Compact Mobile Sticky Bottom Bar (well within <=15% viewport height) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white border-t border-neutral-200 grid grid-cols-4 text-[10px] font-medium text-neutral-600">
        <button type="button" onClick={onScrollTop} className="flex flex-col items-center justify-center gap-0.5 text-[#ff4300]">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button type="button" onClick={onOpenVoucherCenter} className="flex flex-col items-center justify-center gap-0.5">
          <LayoutGrid className="w-4 h-4" />
          <span>Vouchers</span>
        </button>
        <button type="button" onClick={onOpenCart} className="relative flex flex-col items-center justify-center gap-0.5">
          <ShoppingCart className="w-4 h-4" />
          {itemCount > 0 && (
            <span className="absolute top-1.5 right-6 min-w-4 h-4 px-1 bg-[#ff4300] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
          <span>Cart</span>
        </button>
        <button type="button" onClick={onOpenPortal} className="flex flex-col items-center justify-center gap-0.5">
          <User className="w-4 h-4" />
          <span>Account</span>
        </button>
      </nav>
    </>
  );
};
