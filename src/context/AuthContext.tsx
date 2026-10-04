'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
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

export interface AppUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  [key: string]: any;
}

interface AuthContextType {
  user: AppUser | null;
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

function mapSupabaseUserToAppUser(user: any): AppUser | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const email = user.email || null;
  const displayName = meta.full_name || meta.name || meta.user_name || (email ? email.split('@')[0] : 'Customer');
  const photoURL = meta.avatar_url || meta.picture || null;

  return {
    ...user,
    id: user.id,
    uid: user.id,
    email,
    displayName,
    photoURL,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const prevCreditsRef = useRef<number | null>(null);
  const isKickingOutRef = useRef(false);

  // Sync profile from Supabase
  const syncProfile = useCallback(async (appUser: AppUser, options?: { isExplicitLogin?: boolean }) => {
    try {
      if (options?.isExplicitLogin) {
        await clearOrArchiveDeletionRequest(appUser.uid);
      } else {
        const delReq = await getUserDeletionRequest(appUser.uid);
        if (delReq?.status === 'approved') {
          if (!isKickingOutRef.current) {
            isKickingOutRef.current = true;
            showLoading('บัญชีของคุณได้รับการอนุมัติการลบออกจากระบบเรียบร้อยแล้ว กำลังออกจากระบบ...');
            await clearOrArchiveDeletionRequest(appUser.uid);
            await supabase.auth.signOut();
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

      let p = await getUserProfile(appUser.uid);
      const effectiveName = (appUser.displayName && appUser.displayName !== 'Customer')
        ? appUser.displayName
        : (appUser.email ? appUser.email.split('@')[0] : 'Customer');

      if (!p) {
        p = await createUserProfile(appUser.uid, {
          email: appUser.email || undefined,
          displayName: effectiveName,
          photoURL: appUser.photoURL || undefined,
        });
      } else {
        if ((!p.displayName || p.displayName === 'Customer') && effectiveName !== 'Customer') {
          try {
            await updateUserProfile(appUser.uid, { displayName: effectiveName });
            p.displayName = effectiveName;
          } catch (e) {
            console.warn('Could not sync user profile name:', e);
          }
        }
      }

      setProfile(p);
      prevCreditsRef.current = p ? p.credits : 0;
      if (typeof window !== 'undefined' && appUser.email) {
        localStorage.setItem('j3a_last_google_email', appUser.email);
      }
    } catch (err: any) {
      console.error('Error syncing user profile from Supabase:', err);
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'pongpataradanai@gmail.com,admin@j3astore.com,mynameisyee0@gmail.com')
        .toLowerCase()
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      const isMaster = Boolean(
        appUser.email && adminEmails.includes(appUser.email.toLowerCase())
      );

      setProfile({
        uid: appUser.uid,
        email: appUser.email,
        displayName: appUser.displayName || (appUser.email ? appUser.email.split('@')[0] : 'Customer'),
        photoURL: appUser.photoURL,
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
    let unsubProfile: (() => void) | undefined;
    let unsubDeletion: (() => void) | undefined;

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const initialUser = mapSupabaseUserToAppUser(session?.user);
      setUser(initialUser);

      if (initialUser) {
        await syncProfile(initialUser);

        unsubProfile = subscribeUserProfile(initialUser.uid, async (updatedProfile) => {
          if (updatedProfile) {
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
          }
        });

        unsubDeletion = subscribeUserDeletionRequest(initialUser.uid, async (delReq) => {
          if (delReq?.status === 'approved') {
            if (!isKickingOutRef.current) {
              isKickingOutRef.current = true;
              showLoading('บัญชีของคุณได้รับการอนุมัติการลบออกจากระบบเรียบร้อยแล้ว กำลังออกจากระบบ...');
              await clearOrArchiveDeletionRequest(initialUser.uid);
              await supabase.auth.signOut();
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
      }
      setLoading(false);
    });

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = mapSupabaseUserToAppUser(session?.user);
      setUser(currentUser);

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

        unsubProfile = subscribeUserProfile(currentUser.uid, (updatedProfile) => {
          if (updatedProfile) {
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
          }
        });

        unsubDeletion = subscribeUserDeletionRequest(currentUser.uid, async (delReq) => {
          if (delReq?.status === 'approved') {
            if (!isKickingOutRef.current) {
              isKickingOutRef.current = true;
              showLoading('บัญชีของคุณได้รับการอนุมัติการลบออกจากระบบเรียบร้อยแล้ว กำลังออกจากระบบ...');
              await clearOrArchiveDeletionRequest(currentUser.uid);
              await supabase.auth.signOut();
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
      subscription.unsubscribe();
    };
  }, [syncProfile, showLoading, hideLoading, toast]);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('j3a_last_auth_provider', 'email');
        localStorage.setItem('j3a_last_email', data.user.email || '');
      }
      const appUser = mapSupabaseUserToAppUser(data.user)!;
      await clearOrArchiveDeletionRequest(appUser.uid);
      await syncProfile(appUser, { isExplicitLogin: true });
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          full_name: name.trim(),
          name: name.trim(),
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const appUser = mapSupabaseUserToAppUser(data.user)!;
      await clearOrArchiveDeletionRequest(appUser.uid);
      const newProfile = await createUserProfile(appUser.uid, {
        email: appUser.email || undefined,
        displayName: name.trim(),
      });
      setProfile(newProfile);
    }
  };

  const loginWithGoogle = async () => {
    let savedGoogleEmail = '';
    if (typeof window !== 'undefined') {
      localStorage.setItem('j3a_last_auth_provider', 'google');
      savedGoogleEmail = localStorage.getItem('j3a_last_google_email') || '';
    }

    const queryParams: Record<string, string> = {
      access_type: 'offline',
    };
    if (savedGoogleEmail) {
      queryParams.login_hint = savedGoogleEmail;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        queryParams,
      },
    });

    if (error) {
      throw error;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('j3a_last_auth_provider');
    }
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/forgot-password` : undefined,
    });
    if (error) throw error;
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
        isFirebaseReady: true,
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
