import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  UserPlus,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { apiRequest, clearInMemorySessionTokens } from '../../services/apiClient';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { PersonalSecurityPanel } from '../../components/auth/PersonalSecurityPanel';

const AuthShell: React.FC<{
  title: string;
  subtitle: string;
  darkBadge?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, darkBadge, children }) => (
  <div className="min-h-screen bg-[#ebedf0] flex flex-col justify-center py-8 px-4">
    <div className="max-w-md w-full mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#ff4300]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to TheSteps Store</span>
        </Link>
        {darkBadge && (
          <span className="px-2.5 py-0.5 rounded bg-[#292933] text-white text-[10px] font-bold uppercase tracking-wider">
            {darkBadge}
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-[#292933] text-white px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#ff4300] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold">{title}</h1>
              <p className="text-xs text-gray-300 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  </div>
);

export const CustomerLoginPage: React.FC = () => {
  const { signInWithCredentials, signInWithGoogle, currentUser } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { verifyMfaChallenge } = useAuth();

  useEffect(() => {
    if (currentUser && !mfaStep) {
      const target = (location.state as { from?: string } | null)?.from || '/account/profile';
      navigate(target, { replace: true });
    }
  }, [currentUser, mfaStep, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await signInWithCredentials(identifier, password, rememberMe);
      if (res.mfaRequired) {
        setMfaStep(true);
        return;
      }
      addToast('Signed In', 'Welcome back to TheSteps.', 'success');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyMfaChallenge(mfaCode, false, rememberMe);
      addToast('MFA Verified', 'Signed in securely.', 'success');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid MFA code.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const res = await signInWithGoogle('storefront');
      if (res.authenticated) {
        addToast('Signed In', 'Authenticated with Google.', 'success');
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    }
  };

  return (
    <AuthShell
      title="Sign In to TheSteps"
      subtitle="Customer account & order protection portal"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {mfaStep ? (
        <form onSubmit={handleVerifyMfa} className="space-y-4 text-xs">
          <p className="text-gray-600">Enter your 6-digit Authenticator code or recovery backup code:</p>
          <input
            type="text"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder="000000 or XXXX-XXXX"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg font-mono-num text-center text-base font-bold"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-[#ff4300] hover:bg-[#d93800] text-white font-bold cursor-pointer"
          >
            {busy ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>
      ) : (
        <div className="space-y-4 text-xs">
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full py-2.5 rounded-lg bg-[#292933] hover:bg-[#1b1b28] text-white font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-[#ff4300]" />
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-3 text-[11px] text-gray-400">or credentials</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-gray-800 mb-1">Email, Username, or Mobile</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or 017XXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff4300]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-800">Password</label>
                <Link to="/forgot-password" className="text-[#ff4300] hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff4300]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 accent-[#ff4300]"
              />
              <span>Keep me signed in on this device</span>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-[#ff4300] hover:bg-[#d93800] disabled:opacity-60 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{busy ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <p className="text-center text-gray-500 pt-1">
            New to TheSteps?{' '}
            <Link to="/register" className="font-bold text-[#ff4300] hover:underline">
              Create Customer Account
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
};

export const CustomerRegisterPage: React.FC = () => {
  const { registerWithAccount } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await registerWithAccount({
        fullName,
        username: username || undefined,
        email,
        phoneNumber,
        password,
        confirmPassword,
        acceptedTerms
      });
      if (res.requiresVerification) {
        addToast('Verify Account', 'Registration created! Please verify your email code.', 'info');
        navigate(`/verify-account?email=${encodeURIComponent(email)}`);
        return;
      }
      addToast('Welcome to TheSteps', 'Customer account created cleanly.', 'success');
      navigate('/');
    } catch (err: any) {
      const msg = err?.message || 'Registration failed.';
      setError(msg);
      addToast('Registration Failed', msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Register Customer Account"
      subtitle="Automatically provisioned with standard customer role"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block font-semibold text-gray-800 mb-1">Full Name *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Nusrat Jahan"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-gray-800 mb-1">Username (optional)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Auto-generated if blank"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-800 mb-1">Mobile Number *</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono-num"
              required
            />
          </div>
        </div>
        <div>
          <label className="block font-semibold text-gray-800 mb-1">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-800 mb-1">Password *</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="Minimum 8 characters"
              className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthMeter
            password={password}
            minLength={8}
            personalTerms={[fullName, username, email.split('@')[0]]}
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-800 mb-1">Confirm Password *</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            placeholder="Re-enter password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <label className="flex items-start gap-2 text-gray-600 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 rounded accent-[#ff4300]"
            required
          />
          <span>I agree to TheSteps Terms &amp; Privacy Policy.</span>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-[#ff4300] hover:bg-[#d93800] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{busy ? 'Creating Account...' : 'Create Customer Account'}</span>
        </button>
      </form>
      <p className="text-center text-xs text-gray-500 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-[#ff4300] hover:underline">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
};

export const ForgotPasswordPage: React.FC<{ isAdminPortal?: boolean }> = ({ isAdminPortal }) => {
  const { addToast } = useNotification();
  const [identifier, setIdentifier] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState('');
  const [previewToken, setPreviewToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const endpoint = isAdminPortal ? '/api/admin/auth/forgot-password' : '/api/auth/forgot-password';
      const res = await apiRequest<{ message: string; resetTokenPreview?: string }>(endpoint, {
        method: 'POST',
        body: { identifier: identifier.trim() }
      });
      setSubmittedMsg(res.message);
      if (res.resetTokenPreview) setPreviewToken(res.resetTokenPreview);
    } catch (err: any) {
      const msg = err?.message || 'Unable to process password reset request.';
      setError(msg);
      addToast('Reset Request Failed', msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={isAdminPortal ? 'Administrator Password Recovery' : 'Forgot Password'}
      subtitle="Single-use time-limited reset workflow"
      darkBadge={isAdminPortal ? 'Admin Recovery' : undefined}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {submittedMsg ? (
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            {submittedMsg}
          </div>
          {previewToken && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
              <p className="font-bold text-amber-900">Development Reset Token Issued:</p>
              <Link
                to={`/reset-password?token=${encodeURIComponent(previewToken)}${isAdminPortal ? '&portal=admin' : ''}`}
                className="inline-block px-3 py-1.5 rounded bg-[#ff4300] text-white font-bold"
              >
                Open Reset Password Page
              </Link>
            </div>
          )}
          <Link to={isAdminPortal ? '/admin/login' : '/login'} className="block text-center font-bold text-[#ff4300] hover:underline">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-800 mb-1">Registered Email, Username, or Mobile</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-[#ff4300] hover:bg-[#d93800] disabled:opacity-60 text-white font-bold cursor-pointer"
          >
            {busy ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const { refreshSessionUser } = useAuth();

  const [token, setToken] = useState(params.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [minLength, setMinLength] = useState(params.get('portal') === 'admin' ? 12 : 8);
  const [isPrivilegedToken, setIsPrivilegedToken] = useState(params.get('portal') === 'admin');
  const [tokenInvalidMsg, setTokenInvalidMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const queryToken = params.get('token');
    if (queryToken) setToken(queryToken);
  }, [params]);

  useEffect(() => {
    const clean = token.trim();
    if (!clean) {
      setTokenInvalidMsg('');
      return;
    }
    let cancelled = false;
    apiRequest<{ valid: boolean; isPrivileged: boolean; minLength: number }>(
      `/api/auth/reset-password/validate?token=${encodeURIComponent(clean)}`,
      { skipRefresh: true }
    )
      .then((res) => {
        if (cancelled) return;
        setTokenInvalidMsg('');
        setMinLength(res.minLength);
        setIsPrivilegedToken(res.isPrivileged);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setTokenInvalidMsg(err?.message || 'Reset token is invalid, expired, or already used.');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleTokenChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.includes('token=')) {
      const match = trimmed.match(/[?&]token=([^&]+)/);
      if (match?.[1]) {
        setToken(decodeURIComponent(match[1]));
        return;
      }
    }
    setToken(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < minLength) {
      setError(`Password must be at least ${minLength} characters long.`);
      return;
    }
    setBusy(true);
    try {
      const res = await apiRequest<{ success: boolean; isPrivileged?: boolean }>('/api/auth/reset-password', {
        method: 'POST',
        body: { token: token.trim(), newPassword }
      });
      clearInMemorySessionTokens();
      await refreshSessionUser().catch(() => null);
      addToast('Password Reset Complete', 'Active sessions were revoked. Sign in with your new password.', 'success');
      const goAdmin = Boolean(res.isPrivileged || isPrivilegedToken || params.get('portal') === 'admin');
      navigate(goAdmin ? '/admin/login' : '/login', { replace: true });
    } catch (err: any) {
      const msg = err?.message || 'Invalid or expired reset token.';
      setError(msg);
      addToast('Password Reset Failed', msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Set New Password"
      subtitle="All active sessions are invalidated after reset"
      darkBadge={isPrivilegedToken ? 'Admin Password Reset' : undefined}
    >
      {(error || tokenInvalidMsg) && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1.5">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error || tokenInvalidMsg}</span>
          </div>
          {tokenInvalidMsg && (
            <Link
              to={isPrivilegedToken ? '/admin/forgot-password' : '/forgot-password'}
              className="inline-block font-bold text-[#ff4300] hover:underline"
            >
              Request a fresh reset token →
            </Link>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block font-semibold text-gray-800 mb-1">Reset Token *</label>
          <input
            type="text"
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
            placeholder="Paste reset token or full reset link"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-800 mb-1">
            New Password (min {minLength} characters) *
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={minLength}
              placeholder={`Minimum ${minLength} characters`}
              className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthMeter password={newPassword} minLength={minLength} />
        </div>
        <div>
          <label className="block font-semibold text-gray-800 mb-1">Confirm New Password *</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            minLength={minLength}
            placeholder="Re-enter new password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy || Boolean(tokenInvalidMsg)}
          className="w-full py-2.5 rounded-lg bg-[#ff4300] hover:bg-[#d93800] disabled:opacity-60 text-white font-bold cursor-pointer"
        >
          {busy ? 'Resetting...' : 'Update Password'}
        </button>
      </form>
    </AuthShell>
  );
};

export const VerifyAccountPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState(params.get('token') || '');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiRequest('/api/auth/verify-email', {
        method: 'POST',
        body: { email: email || undefined, code }
      });
      setDone(true);
      addToast('Verified', 'Your account email is now verified.', 'success');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    }
  };

  return (
    <AuthShell title="Verify Account" subtitle="Activate pending account via OTP or verification token">
      {done ? (
        <div className="space-y-4 text-center text-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <p className="font-bold text-gray-900">Your account is now active!</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-2.5 rounded-lg bg-[#ff4300] text-white font-bold cursor-pointer"
          >
            Proceed to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {error && <div className="p-3 rounded bg-rose-50 text-rose-700">{error}</div>}
          <div>
            <label className="block font-semibold text-gray-800 mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-800 mb-1">6-Digit OTP or Token *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-center font-bold"
              required
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-[#ff4300] text-white font-bold cursor-pointer">
            Verify Account
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export const AcceptInvitationPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const token = params.get('token') || '';

  const [preview, setPreview] = useState<{
    email: string;
    username: string;
    fullName: string;
    designation: string;
    roleNames: string[];
  } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiRequest<{ invitation: any }>(`/api/admin/auth/invitation-preview?token=${encodeURIComponent(token)}`)
      .then((res) => setPreview(res.invitation))
      .catch((err) => setError(err.message || 'Invitation invalid or expired.'));
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await apiRequest('/api/admin/auth/accept-invitation', {
        method: 'POST',
        body: { token, password }
      });
      addToast('Account Activated', 'Welcome to TheSteps team! Sign in via Admin Login.', 'success');
      navigate('/admin/login');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Accept Team Invitation"
      subtitle="Establish your strong 12+ character administrator/staff password"
      darkBadge="Authorized Invite"
    >
      {error && <div className="mb-3 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{error}</div>}
      {preview ? (
        <form onSubmit={handleAccept} className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
            <p className="font-bold text-gray-900">{preview.fullName} (@{preview.username})</p>
            <p className="text-gray-600">{preview.email} · {preview.designation}</p>
            <p className="text-[#465FFF] font-semibold">Roles: {preview.roleNames.join(', ')}</p>
          </div>
          <div>
            <label className="block font-semibold text-gray-800 mb-1">Establish Password (min 12 chars) *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <PasswordStrengthMeter password={password} minLength={12} />
          </div>
          <div>
            <label className="block font-semibold text-gray-800 mb-1">Confirm Password *</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              minLength={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white font-bold cursor-pointer"
          >
            {busy ? 'Provisioning...' : 'Complete Onboarding & Activate Account'}
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-500 text-center py-6">
          {error ? 'Unable to load invitation.' : 'Validating invitation link...'}
        </p>
      )}
    </AuthShell>
  );
};

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, signInWithGoogle, currentUser, isManager, isAdminSession } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (currentUser && isManager && isAdminSession) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [currentUser, isManager, isAdminSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await loginAdmin(identifier, password, rememberMe);
      if (res.mfaRequired) {
        navigate('/admin/verify-mfa', { state: { rememberMe } });
        return;
      }
      addToast('Admin Authenticated', 'Welcome to TheSteps Security & Commerce Console.', 'success');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleOwner = async () => {
    setError('');
    try {
      const res = await signInWithGoogle('admin');
      if (res.mfaRequired) {
        navigate('/admin/verify-mfa', { state: { rememberMe: true } });
        return;
      }
      if (res.authenticated) {
        addToast('Owner Verified', 'Signed in via Google Identity.', 'success');
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Verified Google administrator sign-in failed.');
    }
  };

  return (
    <AuthShell
      title="Administrator Console Sign In"
      subtitle="Separated privileged login portal · Zero public signup"
      darkBadge="Restricted Admin"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4 text-xs">
        <button
          type="button"
          onClick={handleGoogleOwner}
          className="w-full py-2.5 rounded-lg bg-[#292933] hover:bg-[#1b1b28] text-white font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          <Lock className="w-4 h-4 text-[#ff4300]" />
          <span>Sign In with Verified Owner Google Account</span>
        </button>

        <div className="relative flex items-center">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-[11px] text-gray-400">or administrator credentials</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block font-semibold text-gray-800 mb-1">Email Address or Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@thesteps.com.bd"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#465FFF]"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-gray-800">Password</label>
              <Link to="/admin/forgot-password" className="text-[#465FFF] hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg focus:outline-none focus:border-[#465FFF]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded accent-[#465FFF]"
            />
            <span>Remember Me (extended trusted admin session)</span>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] disabled:opacity-60 text-white font-bold cursor-pointer"
          >
            {busy ? 'Verifying Credentials...' : 'Login to Admin Console'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export const AdminMfaPage: React.FC = () => {
  const { verifyMfaChallenge } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const rememberMe = Boolean((location.state as { rememberMe?: boolean } | null)?.rememberMe);

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyMfaChallenge(code, true, rememberMe);
      addToast('MFA Verified', 'Admin session authorized.', 'success');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid MFA or recovery code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Administrator MFA Verification"
      subtitle="Second-factor verification required"
      darkBadge="TOTP Challenge"
    >
      {error && <div className="mb-3 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 shrink-0" />
          <span>Enter the 6-digit TOTP code from your Authenticator app or an 8-character recovery code.</span>
        </div>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000 or A1B2-C3D4"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg font-mono-num text-center text-base font-bold tracking-widest"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white font-bold cursor-pointer"
        >
          {busy ? 'Verifying...' : 'Verify MFA & Open Dashboard'}
        </button>
      </form>
    </AuthShell>
  );
};

export const CustomerAccountPage: React.FC<{
  initialSection?: 'profile' | 'security' | 'sessions';
}> = ({ initialSection = 'security' }) => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#ebedf0] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200 p-5">
          <div>
            <Link to="/" className="text-xs font-semibold text-[#ff4300] hover:underline inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to TheSteps Storefront</span>
            </Link>
            <h1 className="text-lg font-bold text-[#292933]">
              My Account &amp; Personal Security
            </h1>
            <p className="text-xs text-gray-500">
              {currentUser?.displayName} ({currentUser?.email}) · Role: <span className="uppercase font-semibold">{currentUser?.role}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/account/security"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${initialSection !== 'sessions' ? 'bg-[#292933] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Security &amp; MFA
            </Link>
            <Link
              to="/account/sessions"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${initialSection === 'sessions' ? 'bg-[#292933] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Active Sessions
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        <PersonalSecurityPanel initialSection={initialSection === 'sessions' ? 'sessions' : 'mfa'} />
      </div>
    </div>
  );
};
