import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  User,
  Lock,
  Smartphone,
  Key,
  CheckCircle,
  LogOut,
  Layers,
  MapPin,
  Mail,
  Camera,
  Trash2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserRole } from '../../types';
import { optimizeLocalImage } from '../../utils/imageUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDashboard: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenDashboard }) => {
  const {
    currentUser,
    signInWithGoogle,
    signInWithMobilePin,
    switchDemoRole,
    signOut,
    updateProfile,
    toggleMfa,
    isManager
  } = useAuth();
  const { addToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'profile' | 'mobile' | 'roles' | 'security'>('profile');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Mobile + 4-digit PIN (OTP) Login state
  const [mobileNumber, setMobileNumber] = useState('01712345678');
  const [pinCode, setPinCode] = useState('4321');
  const [mobileName, setMobileName] = useState('');
  const [mobileError, setMobileError] = useState('');

  if (!isOpen) return null;

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsUploadingAvatar(true);
    try {
      const optimized = await optimizeLocalImage(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.8
      });
      await updateProfile({ photoURL: optimized.dataUrl });
      addToast('Profile Photo Updated', 'Avatar loaded from local drive and saved.', 'success');
    } catch (err: any) {
      addToast('Upload Failed', err.message || 'Could not process image file.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser) return;
    await updateProfile({ photoURL: '' });
    addToast('Photo Removed', 'Reverted to initial badge.', 'info');
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      addToast('Signed In', 'Welcome to TheSteps Bangladesh.', 'success');
      onClose();
    } catch (err: any) {
      addToast('Sign-In Failed', err.message || 'Popup closed or blocked', 'error');
    }
  };

  const handleMobilePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileError('');
    try {
      await signInWithMobilePin(mobileNumber, pinCode, mobileName);
      addToast('Quick Login Successful', `Signed in with ${mobileNumber}`, 'success');
      setActiveTab('profile');
    } catch (err: any) {
      setMobileError(err.message || 'Invalid mobile number or 4-digit PIN');
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    switchDemoRole(role);
    addToast('Role Switched', `Active identity set to ${role.replace('_', ' ').toUpperCase()}`, 'info');
  };

  const handleToggleMfa = async (method: 'sms' | 'totp' | 'email') => {
    if (!currentUser) return;
    const newState = !currentUser.mfaEnabled;
    await toggleMfa(newState, method);
    addToast(
      newState ? 'MFA Protected' : 'MFA Deactivated',
      newState ? `Multi-Factor Authentication activated via ${method.toUpperCase()}.` : '2FA has been disabled.',
      newState ? 'success' : 'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-[#292933] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff4300] flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">TheSteps Account &amp; RBAC</h3>
              <p className="text-xs text-neutral-300">Mobile PIN, Google Auth &amp; Multi-Factor Security</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 pt-3 gap-5 text-xs font-semibold shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'profile', label: 'User Profile' },
            { id: 'mobile', label: 'Mobile + PIN' },
            { id: 'roles', label: 'Switch Role' },
            { id: 'security', label: 'MFA & Security' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'border-[#ff4300] text-[#ff4300]'
                  : 'border-transparent text-neutral-500 hover:text-[#292933]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 rounded-full bg-[#292933] text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm overflow-hidden border-2 border-white">
                        {isUploadingAvatar ? (
                          <Loader2 className="w-5 h-5 animate-spin text-neutral-300" />
                        ) : currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                        ) : (
                          currentUser.displayName?.charAt(0) || 'U'
                        )}
                      </div>
                      <label
                        title="Upload avatar from local drive"
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#ff4300] hover:bg-[#d93800] text-white flex items-center justify-center cursor-pointer shadow-md border-2 border-white"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          onChange={handleAvatarFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#292933] text-sm truncate">{currentUser.displayName}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ff4300] text-white uppercase">
                          {currentUser.role}
                        </span>
                      </div>
                      <p className="text-neutral-500 text-xs mt-0.5">{currentUser.email}</p>
                      {currentUser.phoneNumber && (
                        <p className="text-neutral-400 text-[11px] font-mono-num mt-0.5">{currentUser.phoneNumber}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <label className="text-[11px] font-bold text-[#008ED2] hover:underline cursor-pointer">
                          {currentUser.photoURL ? 'Change photo from drive' : 'Upload photo from drive'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/avif"
                            onChange={handleAvatarFileChange}
                            className="sr-only"
                          />
                        </label>
                        {currentUser.photoURL && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role Capabilities Card */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <h5 className="font-bold text-[#292933] uppercase tracking-wider text-[11px]">
                      Access Permissions
                    </h5>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      {currentUser.role === 'superadmin' && 'Full superuser privileges: Financial P&L, stock ledger, POs, bids & vouchers, audit trails, and catalog CRUD.'}
                      {currentUser.role === 'admin' && 'Administrative access: Catalog management, order processing, bids & vouchers, stock adjustments.'}
                      {currentUser.role === 'seller' && 'TheSteps Seller Hub: Publish products, manage stock, approve customer bids, and monitor store revenue.'}
                      {currentUser.role === 'product_manager' && 'Catalog management: Add/edit products, manage variants, flash deals, and pricing.'}
                      {currentUser.role === 'inventory_manager' && 'Warehouse logistics: Real-time stock ledger, damage adjustments, receiving supplier POs.'}
                      {currentUser.role === 'accountant' && 'Financial accounts: Business expenses, COGS analysis, EPS fee reconciliation, and P&L.'}
                      {currentUser.role === 'customer' && 'Customer account: Shopping cart, price bidding, order tracking, wishlist, and vouchers.'}
                    </p>

                    {isManager && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDashboard();
                        }}
                        className="mt-2 w-full py-2.5 bg-[#ff4300] hover:bg-[#d93800] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                        <span>{currentUser.role === 'seller' ? 'Open Seller Hub' : 'Open Admin Panel'}</span>
                      </button>
                    )}
                  </div>

                  {currentUser.addresses && currentUser.addresses.length > 0 && (
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1 text-neutral-700">
                      <h5 className="font-bold text-[#292933] uppercase tracking-wider text-[11px] flex items-center gap-1 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-[#ff4300]" />
                        <span>Default Shipping Address</span>
                      </h5>
                      <p className="font-semibold text-[#292933]">
                        {currentUser.addresses[0].fullName} ({currentUser.addresses[0].phone})
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {currentUser.addresses[0].detailedAddress}, {currentUser.addresses[0].upazila}, {currentUser.addresses[0].district},{' '}
                        {currentUser.addresses[0].division}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={signOut}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out Current Account</span>
                  </button>
                </>
              ) : (
                <div className="space-y-4 text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-[#ff4300]/10 text-[#ff4300] flex items-center justify-center mx-auto">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#292933]">Sign in to TheSteps</h4>
                    <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                      Sign in with Google, use Mobile Number + 4-digit PIN, or preview any role.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 bg-[#292933] hover:bg-[#1b1b28] text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Sign in with Google Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('mobile')}
                    className="w-full py-2.5 bg-[#ff4300] hover:bg-[#d93800] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Quick Login with Mobile + 4-Digit PIN</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MOBILE + 4-DIGIT PIN LOGIN */}
          {activeTab === 'mobile' && (
            <form onSubmit={handleMobilePinSubmit} className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#E6F4FB] border border-[#008ED2]/30 text-[#292933]">
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#008ED2]" />
                  <span>TheSteps Quick Mobile &amp; 4-Digit PIN Login</span>
                </p>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Enter any 11-digit Bangladesh mobile number and a 4-digit PIN (OTP) to shop, bid, and track orders immediately.
                </p>
              </div>

              {mobileError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">{mobileError}</div>
              )}

              <div>
                <label className="block font-semibold text-[#292933] mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  value={mobileName}
                  onChange={(e) => setMobileName(e.target.value)}
                  placeholder="e.g. Nusrat Jahan"
                  className="w-full px-3 py-2 border border-neutral-300 rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#292933] mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 border border-neutral-300 rounded font-mono-num"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#292933] mb-1">4-Digit PIN / OTP *</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="4321"
                    className="w-full px-3 py-2 border border-neutral-300 rounded font-mono-num tracking-widest text-center font-bold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#ff4300] hover:bg-[#d93800] text-white font-bold rounded-lg cursor-pointer"
              >
                Verify PIN &amp; Sign In
              </button>
            </form>
          )}

          {/* TAB 3: SWITCH ROLE */}
          {activeTab === 'roles' && (
            <div className="space-y-3">
              <p className="text-neutral-500 leading-normal">
                Select a TheSteps marketplace role below to test customer, seller, warehouse, or superadmin permissions:
              </p>

              <div className="space-y-2">
                {[
                  { role: 'superadmin' as UserRole, name: 'Faruk (Platform Owner / Superadmin)', email: 'faruk017@gmail.com', desc: 'Unrestricted access: full P&L financials, audits, stock ledger, bids & vouchers.' },
                  { role: 'seller' as UserRole, name: 'Gadget Hub BD (Verified Seller)', email: 'merchant@gadgethub.bd', desc: 'Seller Hub: list products, manage flash deals, respond to customer price bids.' },
                  { role: 'admin' as UserRole, name: 'TheSteps Operations Admin', email: 'admin@thesteps.com.bd', desc: 'Order fulfillment, customer support, and multi-department catalog curation.' },
                  { role: 'inventory_manager' as UserRole, name: 'Rajshahi Hub Logistics Head', email: 'warehouse@thesteps.com.bd', desc: 'Stock movements ledger, damage adjustments, and receiving vendor POs.' },
                  { role: 'accountant' as UserRole, name: 'Chief Financial Accountant', email: 'accounts@thesteps.com.bd', desc: 'Operating expenses, COGS, EPS gateway fee reconciliation, and P&L.' },
                  { role: 'customer' as UserRole, name: 'Arif Khan (Shopper)', email: 'arif.khan@gmail.com', desc: 'Dhanmondi customer with order history, wishlist, collected vouchers & active bids.' }
                ].map((item) => {
                  const isCurrent = currentUser?.role === item.role;
                  return (
                    <div
                      key={item.role}
                      onClick={() => handleRoleSelect(item.role)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isCurrent ? 'border-[#ff4300] bg-[#ff4300]/5 shadow-xs' : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-[#292933] text-xs">{item.name}</h5>
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-200 text-[#292933] font-bold">
                            {item.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{item.email}</p>
                        <p className="text-[11px] text-neutral-600 mt-1 leading-snug">{item.desc}</p>
                      </div>

                      {isCurrent && (
                        <div className="p-1 rounded-full bg-[#ff4300] text-white shrink-0 mt-0.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MFA & SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">Multi-Factor Authentication (MFA / 2FA)</h4>
                  <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                    Protect your seller, customer, and administrative accounts with secondary challenge verification.
                  </p>
                </div>
              </div>

              {currentUser && (
                <div className="space-y-3">
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-[#292933] text-xs">MFA Protection Status</h5>
                      <p className="text-[11px] text-neutral-500">
                        Current:{' '}
                        <span className="font-semibold text-[#292933] uppercase">
                          {currentUser.mfaEnabled ? `ACTIVE (${currentUser.mfaMethod})` : 'DISABLED'}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMfa('sms')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        currentUser.mfaEnabled ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-[#1b8a3a] text-white hover:bg-[#15702f]'
                      }`}
                    >
                      {currentUser.mfaEnabled ? 'Disable 2FA' : 'Enable SMS 2FA'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleMfa('sms')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        currentUser.mfaMethod === 'sms' && currentUser.mfaEnabled
                          ? 'border-[#ff4300] bg-[#ff4300]/5'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-[#292933] mb-1" />
                      <h6 className="font-bold text-xs">SMS OTP</h6>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Bangladeshi SIM OTP</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleMfa('totp')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        currentUser.mfaMethod === 'totp' && currentUser.mfaEnabled
                          ? 'border-[#ff4300] bg-[#ff4300]/5'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <Key className="w-4 h-4 text-[#292933] mb-1" />
                      <h6 className="font-bold text-xs">Authenticator App</h6>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Google Authenticator TOTP</p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-right shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#292933] text-white rounded-lg font-bold text-xs hover:bg-[#1b1b28] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
