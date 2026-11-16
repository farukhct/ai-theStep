import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../config/firebase';
import { UserProfile, UserRole, BangladeshAddress } from '../types';
import {
  apiRequest,
  clearInMemorySessionTokens,
  ensureCsrfToken,
  getInMemoryMfaPendingToken,
  setInMemorySessionTokens
} from '../services/apiClient';

interface LoginResult {
  authenticated: boolean;
  mfaRequired?: boolean;
  mfaPendingToken?: string;
  accessToken?: string;
  refreshToken?: string;
  requiresVerification?: boolean;
  verificationOtpPreview?: string;
  mfaEnrollmentRecommended?: boolean;
  user?: UserProfile;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isManager: boolean;
  isAdminSession: boolean;
  mfaVerified: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  refreshSessionUser: () => Promise<UserProfile | null>;
  signInWithGoogle: (portal?: 'storefront' | 'admin') => Promise<LoginResult>;
  registerWithAccount: (data: {
    fullName: string;
    username?: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword?: string;
    acceptedTerms?: boolean;
  }) => Promise<LoginResult>;
  signInWithCredentials: (identifier: string, password: string, rememberMe?: boolean) => Promise<LoginResult>;
  loginAdmin: (identifier: string, password: string, rememberMe?: boolean) => Promise<LoginResult>;
  verifyMfaChallenge: (code: string, isAdminPortal?: boolean, rememberMe?: boolean) => Promise<LoginResult>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  saveAddress: (address: BangladeshAddress) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  collectVoucher: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PRIVILEGED_ROLES = new Set<string>([
  'superadmin',
  'administrator',
  'admin',
  'manager',
  'staff',
  'seller',
  'product_manager',
  'inventory_manager',
  'order_manager',
  'accountant'
]);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAdminSession, setIsAdminSession] = useState<boolean>(false);
  const [mfaVerified, setMfaVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hydrateFromBackend = useCallback(async (): Promise<UserProfile | null> => {
    try {
      await ensureCsrfToken();
      const data = await apiRequest<{
        authenticated: boolean;
        isAdminSession?: boolean;
        mfaVerified?: boolean;
        user: UserProfile | null;
      }>('/api/auth/me', { skipRefresh: true });
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        setIsAdminSession(Boolean(data.isAdminSession));
        setMfaVerified(Boolean(data.mfaVerified));
        return data.user;
      }
      setCurrentUser(null);
      setIsAdminSession(false);
      setMfaVerified(false);
      return null;
    } catch {
      // Attempt silent refresh using HttpOnly refresh cookie if access token expired
      try {
      const refreshed = await apiRequest<LoginResult>('/api/auth/refresh', { method: 'POST', skipRefresh: true });
      if (refreshed.authenticated && refreshed.user) {
        setInMemorySessionTokens(refreshed);
        setCurrentUser(refreshed.user);
        const roleSlug = refreshed.user.role;
        setIsAdminSession(PRIVILEGED_ROLES.has(roleSlug) && roleSlug !== 'customer');
        return refreshed.user;
      }
    } catch {
      // No valid session
    }
    clearInMemorySessionTokens();
    setCurrentUser(null);
    setIsAdminSession(false);
    setMfaVerified(false);
    return null;
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  // Purge any legacy client-side auth storage keys
  try {
    localStorage.removeItem('sd_auth_user');
    localStorage.removeItem('sd_registered_customers_v1');
    localStorage.removeItem('aura_auth_user');
  } catch {
    // ignore
  }
  hydrateFromBackend();
}, [hydrateFromBackend]);

const signInWithGoogle = async (portal: 'storefront' | 'admin' = 'storefront'): Promise<LoginResult> => {
  const cred = await signInWithPopup(auth, googleAuthProvider);
  const idToken = await cred.user.getIdToken();
  const res = await apiRequest<LoginResult>('/api/auth/firebase-google', {
    method: 'POST',
    body: { idToken, portal }
  });
  setInMemorySessionTokens(res);
  if (res.authenticated && res.user) {
    setCurrentUser(res.user);
    setIsAdminSession(PRIVILEGED_ROLES.has(res.user.role) && res.user.role !== 'customer');
    setMfaVerified(true);
  }
  return res;
};

const registerWithAccount = async (data: {
  fullName: string;
  username?: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword?: string;
  acceptedTerms?: boolean;
}): Promise<LoginResult> => {
  const res = await apiRequest<LoginResult>('/api/auth/register', {
    method: 'POST',
    body: data
  });
  setInMemorySessionTokens(res);
  if (res.authenticated && res.user) {
    setCurrentUser(res.user);
    setIsAdminSession(false);
  }
  return res;
};

const signInWithCredentials = async (
  identifier: string,
  password: string,
  rememberMe = false
): Promise<LoginResult> => {
  const res = await apiRequest<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: { identifier, password, rememberMe }
  });
  setInMemorySessionTokens(res);
  if (res.authenticated && res.user) {
    setCurrentUser(res.user);
    setIsAdminSession(false);
    setMfaVerified(false);
  }
  return res;
};

const loginAdmin = async (
  identifier: string,
  password: string,
  rememberMe = false
): Promise<LoginResult> => {
  const res = await apiRequest<LoginResult>('/api/admin/auth/login', {
    method: 'POST',
    body: { identifier, password, rememberMe }
  });
  setInMemorySessionTokens(res);
  if (res.authenticated && res.user) {
    setCurrentUser(res.user);
    setIsAdminSession(true);
    setMfaVerified(!res.user.mfaEnabled);
  }
  return res;
};

const verifyMfaChallenge = async (
  code: string,
  isAdminPortal = false,
  rememberMe = false
): Promise<LoginResult> => {
  const endpoint = isAdminPortal ? '/api/admin/auth/verify-mfa' : '/api/auth/verify-mfa';
  const mfaPendingToken = getInMemoryMfaPendingToken();
  const res = await apiRequest<LoginResult>(endpoint, {
    method: 'POST',
    body: { code, rememberMe, ...(mfaPendingToken ? { mfaPendingToken } : {}) }
  });
  setInMemorySessionTokens(res);
  if (res.authenticated && res.user) {
    setCurrentUser(res.user);
    setIsAdminSession(isAdminPortal);
    setMfaVerified(true);
  }
  return res;
};

const signOut = async () => {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST', skipRefresh: true });
  } catch {
    // ignore network error on logout
  }
  clearInMemorySessionTokens();
  try {
    await fbSignOut(auth);
  } catch {
    // ignore
  }
  setCurrentUser(null);
  setIsAdminSession(false);
  setMfaVerified(false);
};

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const res = await apiRequest<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PUT',
      body: {
        fullName: updates.displayName || updates.fullName,
        phoneNumber: updates.phoneNumber,
        photoURL: updates.photoURL,
        addresses: updates.addresses,
        savedWishlist: updates.savedWishlist,
        collectedVouchers: updates.collectedVouchers
      }
    });
    setCurrentUser(res.user);
  };

  const saveAddress = async (address: BangladeshAddress) => {
    if (!currentUser) return;
    const existing = currentUser.addresses || [];
    const updated = [address, ...existing.filter((a) => a.detailedAddress !== address.detailedAddress)];
    await updateProfile({ addresses: updated });
  };

  const toggleWishlist = async (productId: string) => {
    if (!currentUser) return;
    const currentList = currentUser.savedWishlist || [];
    const exists = currentList.includes(productId);
    const updated = exists ? currentList.filter((id) => id !== productId) : [productId, ...currentList];
    await updateProfile({ savedWishlist: updated });
  };

  const collectVoucher = async (code: string) => {
    if (!currentUser) return;
    const upper = code.trim().toUpperCase();
    const currentList = currentUser.collectedVouchers || [];
    if (!currentList.includes(upper)) {
      await updateProfile({ collectedVouchers: [...currentList, upper] });
    }
  };

  const roleSlugs = new Set<string>([
    ...(currentUser?.role ? [currentUser.role] : []),
    ...(currentUser?.roles?.map((r) => r.slug) || [])
  ]);

  const userPerms = new Set<string>(currentUser?.permissions || []);

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    if (roleSlugs.has('superadmin')) return true;
    return userPerms.has(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  const isAdmin =
    roleSlugs.has('superadmin') ||
    roleSlugs.has('administrator') ||
    roleSlugs.has('admin');
  const isSeller = roleSlugs.has('seller');
  const isManager =
    Boolean(currentUser) &&
    (Array.from(roleSlugs).some((r) => PRIVILEGED_ROLES.has(r) && r !== 'customer') ||
      hasAnyPermission([
        'users.view',
        'roles.view',
        'security.view',
        'products.view',
        'orders.view',
        'finance.view'
      ]));

  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (roleSlugs.has('superadmin')) return true;
    return roles.some((r) => roleSlugs.has(r));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAdmin,
        isSeller,
        isManager,
        isAdminSession,
        mfaVerified,
        hasRole,
        hasPermission,
        hasAnyPermission,
        refreshSessionUser: hydrateFromBackend,
        signInWithGoogle,
        registerWithAccount,
        signInWithCredentials,
        loginAdmin,
        verifyMfaChallenge,
        signOut,
        updateProfile,
        saveAddress,
        toggleWishlist,
        collectVoucher
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
