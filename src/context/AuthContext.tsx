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
  isManager: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  signInWithGoogle: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleMfa: (enabled: boolean, method?: 'sms' | 'email' | 'totp') => Promise<void>;
  isMfaChallenged: boolean;
  verifyMfaOtp: (code: string) => boolean;
  saveAddress: (address: BangladeshAddress) => void;
}

const DEFAULT_ADMIN: UserProfile = {
  uid: 'admin-faruk-01',
  email: 'faruk017@gmail.com',
  displayName: 'Faruk (Architect)',
  phoneNumber: '+8801711000111',
  role: 'superadmin',
  mfaEnabled: true,
  mfaMethod: 'sms',
  createdAt: '2026-01-01T00:00:00.000Z',
  addresses: [
    {
      fullName: 'Faruk Hossain',
      phone: '+8801711000111',
      email: 'faruk017@gmail.com',
      division: 'Dhaka',
      district: 'Dhaka City',
      upazila: 'Banani',
      detailedAddress: 'Road 11, Block D, Banani Commercial Area',
      postcode: '1213'
    }
  ]
};

const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  superadmin: DEFAULT_ADMIN,
  admin: {
    uid: 'admin-02',
    email: 'admin@auragarments.bd',
    displayName: 'AURA Admin',
    phoneNumber: '+8801711223344',
    role: 'admin',
    mfaEnabled: true,
    mfaMethod: 'totp',
    createdAt: '2026-02-01T00:00:00.000Z'
  },
  product_manager: {
    uid: 'mgr-prod-01',
    email: 'catalog@auragarments.bd',
    displayName: 'Sartorial Catalog Manager',
    phoneNumber: '+8801711334455',
    role: 'product_manager',
    mfaEnabled: false,
    mfaMethod: 'none',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  inventory_manager: {
    uid: 'mgr-inv-01',
    email: 'warehouse@auragarments.bd',
    displayName: 'Warehouse Logistics Head',
    phoneNumber: '+8801811445566',
    role: 'inventory_manager',
    mfaEnabled: false,
    mfaMethod: 'none',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  order_manager: {
    uid: 'mgr-ord-01',
    email: 'orders@auragarments.bd',
    displayName: 'Fulfillment Supervisor',
    phoneNumber: '+8801911556677',
    role: 'order_manager',
    mfaEnabled: false,
    mfaMethod: 'none',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  accountant: {
    uid: 'acc-01',
    email: 'accounts@auragarments.bd',
    displayName: 'Chief Financial Accountant',
    phoneNumber: '+8801711667788',
    role: 'accountant',
    mfaEnabled: true,
    mfaMethod: 'email',
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
    const saved = localStorage.getItem('aura_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    // Default to the Superadmin Faruk (owner of applet per environment info)
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
          
          const isFaruk = user.email === 'faruk017@gmail.com';
          const defaultRole: UserRole = isFaruk ? 'superadmin' : 'customer';

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const updatedUser = {
              ...data,
              role: isFaruk ? 'superadmin' : data.role || defaultRole
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('aura_auth_user', JSON.stringify(updatedUser));
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
              phoneNumber: user.phoneNumber || '',
              role: defaultRole,
              mfaEnabled: isFaruk,
              mfaMethod: isFaruk ? 'sms' : 'none',
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
            localStorage.setItem('aura_auth_user', JSON.stringify(newProfile));
          }
        } catch (err) {
          console.warn('Firestore user fetch failed, fallback to local state:', err);
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

  const switchDemoRole = (role: UserRole) => {
    const profile = DEMO_PROFILES[role] || DEFAULT_ADMIN;
    setCurrentUser(profile);
    localStorage.setItem('aura_auth_user', JSON.stringify(profile));
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('aura_auth_user');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('aura_auth_user', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
    } catch (e) {
      console.warn('Profile sync to Firestore skipped (offline mode):', e);
    }
  };

  const toggleMfa = async (enabled: boolean, method: 'sms' | 'email' | 'totp' = 'sms') => {
    await updateProfile({
      mfaEnabled: enabled,
      mfaMethod: enabled ? method : 'none'
    });
  };

  const verifyMfaOtp = (code: string): boolean => {
    // Accepts simulated code '123456' or any 6-digit number in test mode
    if (code.length === 6) {
      setIsMfaChallenged(false);
      return true;
    }
    return false;
  };

  const saveAddress = (address: BangladeshAddress) => {
    if (!currentUser) return;
    const existing = currentUser.addresses || [];
    const updated = [address, ...existing.filter(a => a.detailedAddress !== address.detailedAddress)];
    updateProfile({ addresses: updated });
  };

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  const isManager = isAdmin || 
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
        isManager,
        hasRole,
        signInWithGoogle,
        switchDemoRole,
        signOut,
        updateProfile,
        toggleMfa,
        isMfaChallenged,
        verifyMfaOtp,
        saveAddress
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
