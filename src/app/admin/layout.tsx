'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/Button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, isAdmin, loading, isFirebaseReady } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/admin');
      }
    }
  }, [user, loading, router]);

  // Loading state while checking authentication and role
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
          กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ (Admin Authorization)...
        </p>
      </div>
    );
  }

  // Not logged in guard
  if (!user) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white">จำเป็นต้องเข้าสู่ระบบ</h1>
        <p className="text-xs text-slate-400 max-w-sm">
          กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบเพื่อเข้าถึงแผงควบคุม J3A STORE
        </p>
        <Button variant="primary" size="md" onClick={() => router.push('/login?redirect=/admin')}>
          เข้าสู่ระบบ
        </Button>
      </div>
    );
  }

  // Logged in but not admin guard (Strict Role Check)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">การเข้าถึงถูกจำกัด (Access Denied)</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md">
          บัญชีของคุณ (<strong className="text-white">{user.email}</strong>) มีระดับสิทธิ์เป็น{' '}
          <strong className="text-cyan-400 uppercase">{profile?.role || 'customer'}</strong>{' '}
          ซึ่งไม่ได้รับอนุญาตให้เข้าถึงหน้าจัดการ Admin
        </p>
        <div className="pt-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push('/')}
          >
            กลับสู่หน้าร้านค้า J3A STORE
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080c14] text-slate-100">
      {/* Admin Sidebar */}
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
