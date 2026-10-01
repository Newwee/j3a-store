'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase/client';
import { getUserProfile, createUserProfile } from '@/lib/firestore/users';
import { UserProfile, UserRole } from '@/types/user';

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

  // Sync profile from Firestore
  const syncProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      let p = await getUserProfile(firebaseUser.uid);
      if (!p) {
        // First-time record initialization
        p = await createUserProfile(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Customer',
          photoURL: firebaseUser.photoURL,
        });
      }
      setProfile(p);
    } catch (err) {
      console.error('Error syncing user profile from Firestore:', err);
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'mynameisyee0@gmail.com')
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
        displayName: firebaseUser.displayName || 'Customer',
        photoURL: firebaseUser.photoURL,
        role: isMaster ? 'admin' : 'customer',
        credits: 0,
        tier: isMaster ? 'VIP' : 'Bronze',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, []);

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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncProfile]);

  const login = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth ไม่ได้เปิดใช้งาน กรุณาตั้งค่า .env.local');
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await syncProfile(cred.user);
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error('Firebase Auth ไม่ได้เปิดใช้งาน กรุณาตั้งค่า .env.local');
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      const newProfile = await createUserProfile(cred.user.uid, {
        email,
        displayName: name,
      });
      setProfile(newProfile);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth ไม่ได้เปิดใช้งาน กรุณาตั้งค่า .env.local');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    if (cred.user) {
      await syncProfile(cred.user);
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase Auth ไม่ได้เปิดใช้งาน');
    await sendPasswordResetEmail(auth, email);
  };

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'mynameisyee0@gmail.com')
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
