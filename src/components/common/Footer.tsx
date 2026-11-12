import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  RefreshCcw, 
  FileText, 
  Lock, 
  PhoneCall, 
  Mail, 
  MapPin, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

interface FooterProps {
  onOpenDevDocs: () => void;
  onOpenGdpr: () => void;
  onOpenSizeGuide: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDevDocs,
  onOpenGdpr,
  onOpenSizeGuide
}) => {
  const { t } = useLanguage();
  const { addToast } = useNotification();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      addToast('Invalid Email', 'Please enter a valid email address.', 'warning');
      return;
    }
    setSubscribed(true);
    addToast('Subscribed to AURA Drops', 'You will receive private previews of new garments releases.', 'success');
    setEmail('');
  };

  return (
    <footer className="bg-neutral-950 text-neutral-300 pt-16 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Core Pillars / Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-neutral-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-emerald-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Fast Bangladesh Delivery</h4>
              <p className="text-xs text-neutral-400 mt-1">24-48 hrs in Dhaka, 72 hrs nationwide via Pathao & Steadfast logistics.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-amber-400 shrink-0">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">7-Day Hassle-Free Exchange</h4>
              <p className="text-xs text-neutral-400 mt-1">Size or color mismatch? Instant doorstep exchange across all 64 districts.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-blue-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Encrypted BD Gateways</h4>
              <p className="text-xs text-neutral-400 mt-1">Direct tokenized bKash, Nagad, Sonali Bank SPG & Visa/Mastercard processing.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-purple-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Certified 100% Ring-Spun</h4>
              <p className="text-xs text-neutral-400 mt-1">Heavyweight combed cotton, pre-shrunk and OEKO-TEX standard compliant.</p>
            </div>
          </div>
        </div>

        {/* Links, Brand & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 py-12 border-b border-neutral-800 text-xs">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-widest text-white font-serif-heading">AURA</span>
              <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">ATELIER</span>
            </div>
            <p className="text-neutral-400 leading-relaxed max-w-sm">
              Engineered in Dhaka. AURA designs and crafts contemporary minimalist garments, formal shirts, selvedge denim, and festive panjabi utilizing Bangladesh's world-leading textile manufacturing mills.
            </p>
            <div className="space-y-1 text-neutral-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>Gulshan Avenue, Dhaka-1212, Bangladesh</span>
              </p>
              <p className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-neutral-500" />
                <span>+880 9612-445566 (10 AM - 9 PM)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <span>concierge@auragarments.bd</span>
              </p>
            </div>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Customer Service</h5>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button onClick={onOpenSizeGuide} className="hover:text-white transition-colors cursor-pointer">
                  Garments Size Guide
                </button>
              </li>
              <li>
                <a href="#shipping-policy" className="hover:text-white transition-colors">
                  Delivery & Shipping Charges
                </a>
              </li>
              <li>
                <a href="#returns-policy" className="hover:text-white transition-colors">
                  Exchange & Return Policy
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <a href="#fabric-guide" className="hover:text-white transition-colors">
                  Combed Cotton & GSM Specs
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance & Engineering */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">System & Compliance</h5>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button onClick={onOpenDevDocs} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <FileText className="w-3 h-3 text-neutral-400" />
                  <span>Architecture & API Docs</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenGdpr} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>GDPR / SOC2 Privacy Hub</span>
                </button>
              </li>
              <li>
                <span className="text-neutral-500">PostgreSQL High-Concurrency Schema</span>
              </li>
              <li>
                <span className="text-neutral-500">Multi-Factor Authentication (MFA)</span>
              </li>
              <li>
                <span className="text-neutral-500">Automated Nightly Backups</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Seasonal Capsule Releases</h5>
            <p className="text-neutral-400 leading-normal">
              Subscribe to get secret invitations to limited-edition seasonal drops and festive collections.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
              />
              <button
                type="submit"
                className="w-full bg-white text-neutral-950 hover:bg-neutral-200 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Join Private List
              </button>
            </form>
          </div>
        </div>

        {/* Bangladesh Payment Channels Badges */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold mr-2">
              Payment Partners:
            </span>
            <span className="px-2.5 py-1 rounded bg-[#E2136E]/20 text-[#E2136E] border border-[#E2136E]/40 text-xs font-bold">
              bKash
            </span>
            <span className="px-2.5 py-1 rounded bg-[#F7941D]/20 text-[#F7941D] border border-[#F7941D]/40 text-xs font-bold">
              Nagad
            </span>
            <span className="px-2.5 py-1 rounded bg-[#008080]/20 text-teal-400 border border-[#008080]/40 text-xs font-bold">
              Sonali SPG
            </span>
            <span className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-semibold">
              Visa / Mastercard
            </span>
            <span className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-semibold">
              Bank Transfer
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-xs font-semibold">
              Cash on Delivery (COD)
            </span>
          </div>

          <p className="text-[11px] text-neutral-500">
            © {new Date().getFullYear()} AURA Garments Atelier Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
