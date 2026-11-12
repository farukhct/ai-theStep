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
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDashboard: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenDashboard }) => {
  const { 
    currentUser, 
    signInWithGoogle, 
    switchDemoRole, 
    signOut, 
    toggleMfa, 
    isAdmin, 
    isManager 
  } = useAuth();
  const { addToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'profile' | 'roles' | 'security'>('profile');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      addToast('Signed In', 'Welcome to AURA ATELIER.', 'success');
      onClose();
    } catch (err: any) {
      addToast('Sign-In Failed', err.message || 'Popup closed or blocked', 'error');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Identity & Access Control (RBAC)</h3>
              <p className="text-xs text-neutral-400">SOC2 Certified Multi-Factor Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 pt-3 gap-6 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'profile' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            User Profile
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'roles' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Switch Role (Demo)
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'security' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            MFA & Security
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-neutral-950 text-sm truncate">{currentUser.displayName}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-900 text-white uppercase">
                          {currentUser.role}
                        </span>
                      </div>
                      <p className="text-neutral-500 text-xs mt-0.5">{currentUser.email}</p>
                      {currentUser.phoneNumber && (
                        <p className="text-neutral-400 text-[11px] font-mono mt-0.5">{currentUser.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Role Capabilities Card */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <h5 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                      Access Permissions
                    </h5>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      {currentUser.role === 'superadmin' && 'Full superuser privileges: Financial reports, P&L, stock adjustments, purchase orders, audit trails, and catalog CRUD.'}
                      {currentUser.role === 'admin' && 'Administrative access: Catalog management, order processing, stock adjustments, customer support.'}
                      {currentUser.role === 'product_manager' && 'Catalog management: Add/edit garments, manage sizes/colors, update retail prices.'}
                      {currentUser.role === 'inventory_manager' && 'Warehouse logistics: Real-time stock ledger, damage adjustments, receiving supplier goods.'}
                      {currentUser.role === 'accountant' && 'Financial accounts: Business expenses, COGS analysis, Gross & Net profit calculations.'}
                      {currentUser.role === 'customer' && 'Customer account: Browsing, shopping bag, order tracking, and invoice downloads.'}
                    </p>

                    {isManager && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenDashboard();
                        }}
                        className="mt-2 w-full py-2 bg-neutral-900 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-800 transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Open Business Dashboard</span>
                      </button>
                    )}
                  </div>

                  {/* Saved Address if present */}
                  {currentUser.addresses && currentUser.addresses.length > 0 && (
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1 text-neutral-700">
                      <h5 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Default Shipping Address</span>
                      </h5>
                      <p className="font-semibold text-neutral-900">{currentUser.addresses[0].fullName} ({currentUser.addresses[0].phone})</p>
                      <p className="text-[11px] text-neutral-500">
                        {currentUser.addresses[0].detailedAddress}, {currentUser.addresses[0].upazila}, {currentUser.addresses[0].district}, {currentUser.addresses[0].division}
                      </p>
                    </div>
                  )}

                  {/* Sign Out Button */}
                  <button
                    onClick={signOut}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out Current Account</span>
                  </button>
                </>
              ) : (
                <div className="space-y-4 text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center mx-auto">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-neutral-950">Customer & Admin Authentication</h4>
                    <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                      Sign in using Google or switch instantly to any enterprise management role below.
                    </p>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Sign in with Google Account</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SWITCH ROLE (DEMO & TESTING SUITE) */}
          {activeTab === 'roles' && (
            <div className="space-y-3">
              <p className="text-neutral-500 leading-normal">
                Select an enterprise role below to preview permission levels and operational dashboard capabilities:
              </p>

              <div className="space-y-2">
                {[
                  { role: 'superadmin' as UserRole, name: 'Faruk (Architect / Superadmin)', email: 'faruk017@gmail.com', desc: 'Unrestricted access: full financial reports, P&L, audits, stock ledger.' },
                  { role: 'admin' as UserRole, name: 'AURA Store Administrator', email: 'admin@auragarments.bd', desc: 'Order fulfillment, customer records, and product catalogue management.' },
                  { role: 'inventory_manager' as UserRole, name: 'Warehouse Logistics Head', email: 'warehouse@auragarments.bd', desc: 'Stock movements ledger, damage adjustments, and receiving vendor POs.' },
                  { role: 'product_manager' as UserRole, name: 'Sartorial Catalog Manager', email: 'catalog@auragarments.bd', desc: 'Garments creation, variant sizing, price updates, and fabric tags.' },
                  { role: 'accountant' as UserRole, name: 'Chief Financial Accountant', email: 'accounts@auragarments.bd', desc: 'Operating expenses, COGS, bKash gateway fee reconciliation, and P&L.' },
                  { role: 'customer' as UserRole, name: 'Arif Khan (Regular Customer)', email: 'arif.khan@gmail.com', desc: 'Dhanmondi shopper with order history, cart, and address book.' }
                ].map((item) => {
                  const isCurrent = currentUser?.role === item.role;
                  return (
                    <div
                      key={item.role}
                      onClick={() => handleRoleSelect(item.role)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isCurrent
                          ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-neutral-950 text-xs">{item.name}</h5>
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-800 font-bold">
                            {item.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{item.email}</p>
                        <p className="text-[11px] text-neutral-600 mt-1 leading-snug">{item.desc}</p>
                      </div>

                      {isCurrent && (
                        <div className="p-1 rounded-full bg-neutral-900 text-white shrink-0 mt-0.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MFA & SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">Multi-Factor Authentication (MFA / 2FA)</h4>
                  <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                    Protect your administrative and financial operations with secondary challenge verification.
                  </p>
                </div>
              </div>

              {currentUser && (
                <div className="space-y-3">
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-neutral-900 text-xs">MFA Protection Status</h5>
                      <p className="text-[11px] text-neutral-500">
                        Current: <span className="font-semibold text-neutral-900 uppercase">{currentUser.mfaEnabled ? `ACTIVE (${currentUser.mfaMethod})` : 'DISABLED'}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleMfa('sms')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        currentUser.mfaEnabled
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {currentUser.mfaEnabled ? 'Disable 2FA' : 'Enable SMS 2FA'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleToggleMfa('sms')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        currentUser.mfaMethod === 'sms' && currentUser.mfaEnabled ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-neutral-700 mb-1" />
                      <h6 className="font-bold text-xs">SMS OTP</h6>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Bangladeshi SIM OTP</p>
                    </button>

                    <button
                      onClick={() => handleToggleMfa('totp')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        currentUser.mfaMethod === 'totp' && currentUser.mfaEnabled ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <Key className="w-4 h-4 text-neutral-700 mb-1" />
                      <h6 className="font-bold text-xs">Authenticator App</h6>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Google Authenticator TOTP</p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-bold text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
