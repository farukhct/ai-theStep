import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ShieldCheck,
  Lock,
  LogOut,
  Layers,
  MapPin,
  Mail,
  Camera,
  Trash2,
  Loader2,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { optimizeLocalImage } from '../../utils/imageUtils';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { PersonalSecurityPanel } from './PersonalSecurityPanel';
import { apiRequest } from '../../services/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'register';
  onClose: () => void;
  onOpenDashboard: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signin',
  onClose,
  onOpenDashboard
}) => {
  const {
    currentUser,
    signInWithGoogle,
    registerWithAccount,
    signInWithCredentials,
    verifyMfaChallenge,
    signOut,
    updateProfile,
    isManager
  } = useAuth();
  const { addToast } = useNotification();

  const [guestTab, setGuestTab] = useState<'signin' | 'register' | 'verify'>(initialMode);
  const [accountTab, setAccountTab] = useState<'profile' | 'security'>('profile');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Email OTP Verify state
  const [verifyOtp, setVerifyOtp] = useState('');
  const [otpPreviewHint, setOtpPreviewHint] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGuestTab(initialMode);
      setAuthError('');
      setMfaStep(false);
      setMfaCode('');
      setAccountTab('profile');
    }
  }, [isOpen, initialMode]);

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
    setAuthError('');
    try {
      const res = await signInWithGoogle('storefront');
      if (res.authenticated) {
        addToast('Signed In', 'Welcome to TheSteps Bangladesh.', 'success');
        onClose();
      }
    } catch (err: any) {
      const msg = err?.message || 'Google authentication failed.';
      setAuthError(msg);
      addToast('Sign-In Failed', msg, 'error');
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const res = await signInWithCredentials(loginIdentifier, loginPassword, rememberMe);
      if (res.mfaRequired) {
        setMfaStep(true);
        return;
      }
      addToast('Welcome Back', 'Signed in cleanly to your TheSteps customer account.', 'success');
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      await verifyMfaChallenge(mfaCode, false, rememberMe);
      addToast('MFA Verified', 'Signed in securely.', 'success');
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid MFA verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await registerWithAccount({
        fullName: regName,
        username: regUsername || undefined,
        email: regEmail,
        phoneNumber: regPhone,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        acceptedTerms
      });
      if (res.requiresVerification) {
        if (res.verificationOtpPreview) setOtpPreviewHint(res.verificationOtpPreview);
        setGuestTab('verify');
        addToast('Verify Email', 'Check your inbox verification code to activate account.', 'info');
        return;
      }
      addToast('Registration Complete', 'Welcome to TheSteps! Your customer account is ready.', 'success');
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Could not create customer account.';
      setAuthError(msg);
      addToast('Registration Failed', msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      await apiRequest('/api/auth/verify-email', {
        method: 'POST',
        body: { email: regEmail, code: verifyOtp }
      });
      addToast('Account Verified', 'Your email is verified! You may now sign in.', 'success');
      setGuestTab('signin');
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-[#292933] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff4300] flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {currentUser
                  ? 'TheSteps Account & Security'
                  : guestTab === 'register'
                  ? 'Register Customer Account'
                  : guestTab === 'verify'
                  ? 'Verify Email Address'
                  : 'Sign In to TheSteps'}
              </h3>
              <p className="text-xs text-neutral-300">
                {currentUser
                  ? 'Profile, TOTP MFA, Active Sessions & Password Management'
                  : 'Secure cookie-backed authentication & account protection'}
              </p>
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
        {!currentUser ? (
          <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 pt-3 gap-6 text-xs font-semibold shrink-0">
            {[
              { id: 'signin', label: 'Sign In' },
              { id: 'register', label: 'Register' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setAuthError('');
                  setMfaStep(false);
                  setGuestTab(tab.id as 'signin' | 'register');
                }}
                className={`pb-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                  guestTab === tab.id
                    ? 'border-[#ff4300] text-[#ff4300]'
                    : 'border-transparent text-neutral-500 hover:text-[#292933]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 pt-3 gap-6 text-xs font-semibold shrink-0">
            {[
              { id: 'profile', label: 'Account Profile' },
              { id: 'security', label: 'MFA, Password & Sessions' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAccountTab(tab.id as 'profile' | 'security')}
                className={`pb-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                  accountTab === tab.id
                    ? 'border-[#ff4300] text-[#ff4300]'
                    : 'border-transparent text-neutral-500 hover:text-[#292933]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {!currentUser ? (
            <>
              {authError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {authError}
                </div>
              )}

              {guestTab === 'signin' && mfaStep && (
                <form onSubmit={handleMfaSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <span>Enter your 6-digit Authenticator code or recovery backup code.</span>
                  </div>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="000000 or XXXX-XXXX"
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg font-mono-num text-center text-base font-bold tracking-widest"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#ff4300] hover:bg-[#d93800] text-white font-bold rounded-lg cursor-pointer"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </form>
              )}

              {guestTab === 'signin' && !mfaStep && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-2.5 bg-[#292933] hover:bg-[#1b1b28] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#ff4300]" />
                    <span>Continue with Google Account</span>
                  </button>

                  <div className="relative flex items-center py-1">
                    <div className="flex-1 border-t border-neutral-200" />
                    <span className="px-3 text-[11px] font-medium text-neutral-400">or sign in with email, username, or mobile</span>
                    <div className="flex-1 border-t border-neutral-200" />
                  </div>

                  <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                    <div>
                      <label className="block font-semibold text-[#292933] mb-1">Email, Username, or Mobile *</label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="you@example.com or 017XXXXXXXX"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff4300]"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#292933]">Password *</label>
                        <Link
                          to="/forgot-password"
                          onClick={onClose}
                          className="text-[11px] font-semibold text-[#ff4300] hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full px-3 py-2 pr-9 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff4300]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#292933] cursor-pointer"
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-neutral-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded accent-[#ff4300]"
                      />
                      <span>Remember me on this device</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-[#ff4300] hover:bg-[#d93800] disabled:opacity-60 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                    </button>
                  </form>

                  <p className="text-center text-neutral-500 pt-1">
                    New to TheSteps?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError('');
                        setGuestTab('register');
                      }}
                      className="font-bold text-[#ff4300] hover:underline cursor-pointer"
                    >
                      Create a Customer Account
                    </button>
                  </p>
                </div>
              )}

              {guestTab === 'register' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-2.5 bg-[#292933] hover:bg-[#1b1b28] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#ff4300]" />
                    <span>Sign Up Quickly with Google</span>
                  </button>

                  <div className="relative flex items-center py-1">
                    <div className="flex-1 border-t border-neutral-200" />
                    <span className="px-3 text-[11px] font-medium text-neutral-400">or register a customer account</span>
                    <div className="flex-1 border-t border-neutral-200" />
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#292933] mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Nusrat Jahan"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff4300]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#292933] mb-1">Username (optional)</label>
                        <input
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="Auto-generated if blank"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff4300]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#292933] mb-1">Mobile Number *</label>
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono-num focus:outline-none focus:border-[#ff4300]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#292933] mb-1">Email Address *</label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff4300]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#292933] mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          minLength={8}
                          className="w-full px-3 py-2 pr-9 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff4300]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#292933] cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordStrengthMeter
                        password={regPassword}
                        minLength={8}
                        personalTerms={[regName, regUsername, regEmail.split('@')[0]]}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#292933] mb-1">Confirm Password *</label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        minLength={8}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff4300]"
                        required
                      />
                    </div>

                    <label className="flex items-start gap-2 text-neutral-600 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 rounded accent-[#ff4300]"
                        required
                      />
                      <span>I accept the Terms &amp; Conditions and Privacy Policy.</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-[#ff4300] hover:bg-[#d93800] disabled:opacity-60 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Creating Account...' : 'Create Customer Account'}</span>
                    </button>
                  </form>

                  <p className="text-center text-neutral-500 pt-1">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError('');
                        setGuestTab('signin');
                      }}
                      className="font-bold text-[#ff4300] hover:underline cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </p>
                </div>
              )}

              {guestTab === 'verify' && (
                <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <p className="font-bold">Verify Your Email ({regEmail})</p>
                    <p className="text-[11px] mt-1">
                      Enter the 6-digit OTP issued for your registration.
                      {otpPreviewHint && (
                        <span className="block font-mono font-bold mt-1">
                          Verification OTP Preview: {otpPreviewHint}
                        </span>
                      )}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={verifyOtp}
                    onChange={(e) => setVerifyOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg font-mono-num text-center text-base font-bold"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#ff4300] text-white font-bold rounded-lg cursor-pointer"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify Account'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              {accountTab === 'profile' && (
                <div className="space-y-5">
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
                          {currentUser.role === 'customer' ? 'Customer' : currentUser.role}
                        </span>
                      </div>
                      <p className="text-neutral-500 text-xs mt-0.5 truncate">{currentUser.email}</p>
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

                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <h5 className="font-bold text-[#292933] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#ff4300]" />
                      <span>Account Privileges</span>
                    </h5>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      {currentUser.role === 'customer'
                        ? 'Customer account: Shopping cart, price bidding, order tracking, wishlist, vouchers, and personal security.'
                        : 'Authorized Administrative access: RBAC security suite, user governance, catalog management, orders, financials, and audit trail.'}
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
                        <span>Open Admin Dashboard</span>
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
                    onClick={async () => {
                      await signOut();
                      addToast('Signed Out', 'You have been signed out cleanly.', 'info');
                      onClose();
                    }}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out Current Account</span>
                  </button>
                </div>
              )}

              {accountTab === 'security' && (
                <PersonalSecurityPanel initialSection="mfa" />
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-right shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#292933] text-white rounded-lg font-bold text-xs hover:bg-[#1b1b28] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
