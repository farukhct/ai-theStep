import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User as FbUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleAuthProvider, db } from '../config/firebase';
import { UserProfile, UserRole, BangladeshAddress } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  fbUser: FbUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isManager: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMobilePin: (phone: string, pin: string, fullName?: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleMfa: (enabled: boolean, method?: 'sms' | 'email' | 'totp') => Promise<void>;
  isMfaChallenged: boolean;
  verifyMfaOtp: (code: string) => boolean;
  saveAddress: (address: BangladeshAddress) => void;
  toggleWishlist: (productId: string) => void;
  collectVoucher: (code: string) => void;
}

const DEFAULT_ADMIN: UserProfile = {
  uid: 'admin-faruk-01',
  email: 'faruk017@gmail.com',
  displayName: 'Faruk (Platform Owner)',
  phoneNumber: '+8801711000111',
  shopName: 'TheSteps Official',
  role: 'superadmin',
  mfaEnabled: true,
  mfaMethod: 'sms',
  savedWishlist: ['prod-001', 'prod-003'],
  collectedVouchers: ['SMART10'],
  createdAt: '2026-01-01T00:00:00.000Z',
  addresses: [
    {
      fullName: 'Faruk Hossain',
      phone: '+8801711000111',
      email: 'faruk017@gmail.com',
      division: 'Dhaka',
      district: 'Dhaka City',
      upazila: 'Uttara Sector-11',
      detailedAddress: 'Road 11, Sector-11, Uttara, Dhaka',
      postcode: '1230'
    }
  ]
};

const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  superadmin: DEFAULT_ADMIN,
  admin: {
    uid: 'admin-02',
    email: 'admin@thesteps.com.bd',
    displayName: 'TheSteps Operations Admin',
    phoneNumber: '+8801326052866',
    shopName: 'TheSteps Official',
    role: 'admin',
    mfaEnabled: true,
    mfaMethod: 'totp',
    savedWishlist: [],
    collectedVouchers: ['SMART10', 'DEAL250'],
    createdAt: '2026-02-01T00:00:00.000Z'
  },
  seller: {
    uid: 'seller-01',
    email: 'merchant@gadgethub.bd',
    displayName: 'Gadget Hub BD (Seller)',
    phoneNumber: '+8801711998822',
    shopName: 'Gadget Hub BD',
    role: 'seller',
    mfaEnabled: true,
    mfaMethod: 'sms',
    savedWishlist: [],
    collectedVouchers: [],
    createdAt: '2026-02-15T00:00:00.000Z'
  },
  product_manager: {
    uid: 'mgr-prod-01',
    email: 'catalog@thesteps.com.bd',
    displayName: 'Catalog & Merchandising Lead',
    phoneNumber: '+8801711334455',
    role: 'product_manager',
    mfaEnabled: false,
    mfaMethod: 'none',
    savedWishlist: [],
    collectedVouchers: [],
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  inventory_manager: {
    uid: 'mgr-inv-01',
    email: 'warehouse@thesteps.com.bd',
    displayName: 'Rajshahi Hub Logistics Head',
    phoneNumber: '+8801811445566',
    role: 'inventory_manager',
    mfaEnabled: false,
    mfaMethod: 'none',
    savedWishlist: [],
    collectedVouchers: [],
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  order_manager: {
    uid: 'mgr-ord-01',
    email: 'orders@thesteps.com.bd',
    displayName: 'Fulfillment Supervisor',
    phoneNumber: '+8801911556677',
    role: 'order_manager',
    mfaEnabled: false,
    mfaMethod: 'none',
    savedWishlist: [],
    collectedVouchers: [],
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  accountant: {
    uid: 'acc-01',
    email: 'accounts@thesteps.com.bd',
    displayName: 'Chief Financial Accountant',
    phoneNumber: '+8801711667788',
    role: 'accountant',
    mfaEnabled: true,
    mfaMethod: 'email',
    savedWishlist: [],
    collectedVouchers: [],
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  customer: {
    uid: 'cust-demo-01',
    email: 'arif.khan@gmail.com',
    displayName: 'Arif Khan',
    phoneNumber: '+8801712345678',
    role: 'customer',
    mfaEnabled: false,
    mfaMethod: 'none',
    savedWishlist: ['prod-001', 'prod-004'],
    collectedVouchers: ['SMART10'],
    createdAt: '2026-05-15T00:00:00.000Z',
    addresses: [
      {
        fullName: 'Arif Khan',
        phone: '+8801712345678',
        email: 'arif.khan@gmail.com',
        division: 'Dhaka',
        district: 'Dhaka City',
        upazila: 'Dhanmondi',
        detailedAddress: 'House 28, Road 7A, Dhanmondi R/A, Dhaka',
        postcode: '1209'
      }
    ]
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sd_auth_user') || localStorage.getItem('aura_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return DEFAULT_ADMIN;
  });

  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMfaChallenged, setIsMfaChallenged] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          const isFaruk = user.email === 'faruk017@gmail.com' && user.emailVerified;
          const defaultRole: UserRole = isFaruk ? 'superadmin' : 'customer';

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const updatedUser: UserProfile = {
              ...data,
              role: isFaruk ? 'superadmin' : data.role || defaultRole
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('sd_auth_user', JSON.stringify(updatedUser));
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
              phoneNumber: user.phoneNumber || '',
              photoURL: user.photoURL || '',
              role: defaultRole,
              mfaEnabled: isFaruk,
              mfaMethod: isFaruk ? 'sms' : 'none',
              savedWishlist: [],
              collectedVouchers: ['SMART10'],
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            if (isFaruk) {
              await setDoc(doc(db, 'admins', user.uid), {
                uid: user.uid,
                email: user.email,
                role: 'superadmin',
                addedAt: new Date().toISOString()
              });
            }
            setCurrentUser(newProfile);
            localStorage.setItem('sd_auth_user', JSON.stringify(newProfile));
          }
        } catch (err) {
          console.warn('Firestore user fetch failed, using local session:', err);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithMobilePin = async (phone: string, pin: string, fullName?: string) => {
    const cleaned = phone.replace(/\s+/g, '');
    if (cleaned.length < 11) {
      throw new Error('Please enter a valid 11-digit Bangladesh mobile number (01XXX-XXXXXX).');
    }
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('TheSteps Quick Login requires a 4-digit OTP / PIN.');
    }

    const mobileProfile: UserProfile = {
      uid: `mob-${cleaned.slice(-8)}`,
      email: `${cleaned.slice(-8)}@mobile.thesteps.com.bd`,
      displayName: fullName?.trim() || `TheSteps Shopper (${cleaned.slice(-4)})`,
      phoneNumber: cleaned,
      role: 'customer',
      mfaEnabled: true,
      mfaMethod: 'sms',
      savedWishlist: currentUser?.savedWishlist || [],
      collectedVouchers: currentUser?.collectedVouchers || ['SMART10'],
      createdAt: new Date().toISOString()
    };
    setCurrentUser(mobileProfile);
    localStorage.setItem('sd_auth_user', JSON.stringify(mobileProfile));
  };

  const switchDemoRole = (role: UserRole) => {
    const profile = DEMO_PROFILES[role] || DEFAULT_ADMIN;
    setCurrentUser(profile);
    localStorage.setItem('sd_auth_user', JSON.stringify(profile));
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('sd_auth_user');
    localStorage.removeItem('aura_auth_user');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('sd_auth_user', JSON.stringify(updated));

    if (fbUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
      } catch (e) {
        console.warn('Profile sync to Firestore skipped (offline/demo session):', e);
      }
    }
  };

  const toggleMfa = async (enabled: boolean, method: 'sms' | 'email' | 'totp' = 'sms') => {
    await updateProfile({
      mfaEnabled: enabled,
      mfaMethod: enabled ? method : 'none'
    });
  };

  const verifyMfaOtp = (code: string): boolean => {
    if (code.length === 4 || code.length === 6) {
      setIsMfaChallenged(false);
      return true;
    }
    return false;
  };

  const saveAddress = (address: BangladeshAddress) => {
    if (!currentUser) return;
    const existing = currentUser.addresses || [];
    const updated = [address, ...existing.filter((a) => a.detailedAddress !== address.detailedAddress)];
    updateProfile({ addresses: updated });
  };

  const toggleWishlist = (productId: string) => {
    if (!currentUser) return;
    const currentList = currentUser.savedWishlist || [];
    const exists = currentList.includes(productId);
    const updated = exists ? currentList.filter((id) => id !== productId) : [productId, ...currentList];
    updateProfile({ savedWishlist: updated });
  };

  const collectVoucher = (code: string) => {
    if (!currentUser) return;
    const upper = code.trim().toUpperCase();
    const currentList = currentUser.collectedVouchers || [];
    if (!currentList.includes(upper)) {
      updateProfile({ collectedVouchers: [...currentList, upper] });
    }
  };

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  const isSeller = currentUser?.role === 'seller';
  const isManager =
    isAdmin ||
    isSeller ||
    currentUser?.role === 'product_manager' ||
    currentUser?.role === 'inventory_manager' ||
    currentUser?.role === 'order_manager' ||
    currentUser?.role === 'accountant';

  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    return roles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        fbUser,
        isLoading,
        isAdmin,
        isSeller,
        isManager,
        hasRole,
        signInWithGoogle,
        signInWithMobilePin,
        switchDemoRole,
        signOut,
        updateProfile,
        toggleMfa,
        isMfaChallenged,
        verifyMfaOtp,
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
