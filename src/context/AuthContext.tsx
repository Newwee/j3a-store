'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase/client';
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  subscribeUserProfile,
} from '@/lib/firestore/users';
import {
  getUserDeletionRequest,
  subscribeUserDeletionRequest,
  clearOrArchiveDeletionRequest,
} from '@/lib/firestore/deletionRequests';
import { UserProfile, UserRole } from '@/types/user';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  isFirebaseReady: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const prevCreditsRef = useRef<number | null>(null);
  const isKickingOutRef = useRef(false);

  // Sync profile from Firestore
  const syncProfile = useCallback(async (firebaseUser: FirebaseUser, options?: { isExplicitLogin?: boolean }) => {
    try {
      if (options?.isExplicitLogin) {
        // Deliberate user action (e.g. login with Google, register): clear old deletion request so user can start fresh
        await clearOrArchiveDeletionRequest(firebaseUser.uid);
      } else {
        // Background session restoration: check if account was deleted while offline
        const delReq = await getUserDeletionRequest(firebaseUser.uid);
        if (delReq?.status === 'approved') {
          if (!isKickingOutRef.current) {
            isKickingOutRef.current = true;
            showLoading('บัญชีของคุณได้รับการอนุมัติการลบออกจากระบบเรียบร้อยแล้ว กำลังออกจากระบบ...');
            await clearOrArchiveDeletionRequest(firebaseUser.uid);
            if (auth) await signOut(auth);
            setUser(null);
            setProfile(null);
            setTimeout(() => {
              hideLoading();
              toast('บัญชีผู้ใช้นี้ถูกลบออกจากระบบเรียบร้อยแล้ว', 'info');
              if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login?deleted=true';
              }
            }, 1200);
          }
          return;
        }
      }

      let p = await getUserProfile(firebaseUser.uid);
      const effectiveName = (firebaseUser.displayName && firebaseUser.displayName !== 'Customer')
        ? firebaseUser.displayName
        : (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer');

      if (!p) {
        // First-time record initialization (or re-registration after deletion)
        p = await createUserProfile(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: effectiveName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        // If the profile document still has 'Customer', but we now have a real name, sync it!
        if ((!p.displayName || p.displayName === 'Customer') && effectiveName !== 'Customer') {
          try {
            await updateUserProfile(firebaseUser.uid, { displayName: effectiveName });
            p.displayName = effectiveName;
          } catch (e) {
            console.warn('Could not sync user profile name:', e);
          }
        }
      }
      setProfile(p);
      prevCreditsRef.current = p ? p.credits : 0;
    } catch (err: any) {
      if (err.message?.includes('บัญชีผู้ใช้นี้ถูกลบ')) {
        if (!isKickingOutRef.current) {
          isKickingOutRef.current = true;
          showLoading('บัญชีของคุณถูกลบออกจากระบบเรียบร้อยแล้ว...');
          await clearOrArchiveDeletionRequest(firebaseUser.uid);
          if (auth) await signOut(auth);
          setUser(null);
          setProfile(null);
          setTimeout(() => {
            hideLoading();
            toast('บัญชีผู้ใช้นี้ถูกลบออกจากระบบเรียบร้อยแล้ว', 'info');
            if (typeof window !== 'undefined') window.location.href = '/login?deleted=true';
          }, 1200);
        }
        return;
      }

      console.error('Error syncing user profile from Firestore:', err);
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'pongpataradanai@gmail.com,admin@j3astore.com,mynameisyee0@gmail.com')
        .toLowerCase()
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      const isMaster = Boolean(
        firebaseUser.email && adminEmails.includes(firebaseUser.email.toLowerCase())
      );

      // Fallback profile if firestore unavailable
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer'),
        photoURL: firebaseUser.photoURL,
        role: isMaster ? 'admin' : 'customer',
        credits: 0,
        tier: isMaster ? 'VIP' : 'Bronze',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [showLoading, hideLoading, toast]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await syncProfile(user);
    }
  }, [user, syncProfile]);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // Explicitly guarantee browserLocalPersistence for staying logged in across closing & reopening browser
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Could not set persistence on Firebase Auth:', err);
    });

    let unsubProfile: (() => void) | undefined;
    let unsubDeletion: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Clean up previous listeners
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = undefined;
      }
      if (unsubDeletion) {
        unsubDeletion();
        unsubDeletion = undefined;
      }

      if (currentUser) {
        await syncProfile(currentUser);

        // 1. Real-time User Profile & Credits listener
        unsubProfile = subscribeUserProfile(currentUser.uid, async (updatedProfile) => {
          if (updatedProfile) {
            // Check for credit changes
            if (prevCreditsRef.current !== null && prevCreditsRef.current !== updatedProfile.credits) {
              const diff = updatedProfile.credits - prevCreditsRef.current;
              if (diff > 0) {
                toast(`🎉 แอดมินได้อนุมัติ/เติมเครดิตเข้าบัญชีแล้ว! +฿${diff} (ยอดคงเหลือ ฿${updatedProfile.credits})`, 'success');
              } else if (diff < 0) {
                toast(`💳 ยอดเครดิตในบัญชีของคุณได้รับการอัปเดต: คงเหลือ ฿${updatedProfile.credits}`, 'info');
              }
            }
            prevCreditsRef.current = updatedProfile.credits;
            setProfile(updatedProfile);
          } else {
            // Document was deleted from users collection
            const delReq = await getUserDeletionRequest(currentUser.uid);
            if (delReq?.status === 'approved') {
              if (!isKickingOutRef.current) {
                isKickingOutRef.current = true;
                showLoading('บัญชีของคุณได้รับการอนุมัติการลบออกจากระบบเรียบร้อยแล้ว กำลังออกจากระบบ...');
                await clearOrArchiveDeletionRequest(currentUser.uid);
                if (auth) await signOut(auth);
                setUser(null);
                setProfile(null);
                setTimeout(() => {
                  hideLoading();
                  toast('บัญชีผู้ใช้นี้ถูกลบออกจากระบบเรียบร้อยแล้ว', 'info');
                  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login?deleted=true';
                  }
                }, 1400);
              }
            }
          }
        });

        // 2. Real-time Deletion Request listener
        unsubDeletion = subscribeUserDeletionRequest(currentUser.uid, async (delReq) => {
          if (delReq?.status === 'approved') {
            if (!isKickingOutRef.current) {
              isKickingOutRef.current = true;
              showLoading('บัญชีของคุณได้รับการอนุมัติการลบออกจากระบบเรียบร้อยแล้ว กำลังออกจากระบบ...');
              await clearOrArchiveDeletionRequest(currentUser.uid);
              if (auth) await signOut(auth);
              setUser(null);
              setProfile(null);
              setTimeout(() => {
                hideLoading();
                toast('บัญชีผู้ใช้ของคุณถูกลบออกจากระบบเรียบร้อยแล้ว', 'info');
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                  window.location.href = '/login?deleted=true';
                }
              }, 1500);
            }
          }
        });
      } else {
        setProfile(null);
        prevCreditsRef.current = null;
        isKickingOutRef.current = false;
      }
      setLoading(false);
    });

    return () => {
      if (unsubProfile) unsubProfile();
      if (unsubDeletion) unsubDeletion();
      unsubscribeAuth();
    };
  }, [syncProfile, showLoading, hideLoading, toast]);

  const login = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth ไม่ได้เปิดใช้งาน กรุณาตั้งค่า .env.local');
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await clearOrArchiveDeletionRequest(cred.user.uid);
      await syncProfile(cred.user, { isExplicitLogin: true });
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error('Firebase Auth ไม่ได้เปิดใช้งาน กรุณาตั้งค่า .env.local');
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      await clearOrArchiveDeletionRequest(cred.user.uid);
      const newProfile = await createUserProfile(cred.user.uid, {
        email,
        displayName: name,
      });
      try {
        await updateUserProfile(cred.user.uid, { displayName: name });
        newProfile.displayName = name;
      } catch (e) {
        console.warn('Could not force update displayName in firestore:', e);
      }
      setProfile(newProfile);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth ไม่ได้เปิดใช้งาน กรุณาตั้งค่า .env.local');
    // Set local persistence so user remains logged in across closing and reopening browser
    await setPersistence(auth, browserLocalPersistence).catch(() => {});
    const provider = new GoogleAuthProvider();
    // Intentionally no forced 'select_account' prompt so Google automatically uses the existing session
    const cred = await signInWithPopup(auth, provider);
    if (cred.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('j3a_last_auth_provider', 'google');
        localStorage.setItem('j3a_last_email', cred.user.email || '');
      }
      await clearOrArchiveDeletionRequest(cred.user.uid);
      await syncProfile(cred.user, { isExplicitLogin: true });
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('j3a_last_auth_provider');
    }
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase Auth ไม่ได้เปิดใช้งาน');
    await sendPasswordResetEmail(auth, email);
  };

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'pongpataradanai@gmail.com,admin@j3astore.com,mynameisyee0@gmail.com')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  const isMasterAdmin = Boolean(
    user?.email && adminEmails.includes(user.email.toLowerCase())
  );
  const role: UserRole = isMasterAdmin ? 'admin' : (profile?.role || 'customer');
  const isAdmin = role === 'admin' || isMasterAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        loading,
        isFirebaseReady: isFirebaseConfigured,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
