'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Wallet,
  Settings,
  CreditCard,
  ShoppingBag,
  Shield,
  Save,
  QrCode,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { updateUserProfile, updateUserCredits } from '@/lib/firestore/users';
import { TierBadge, RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils/formatters';

function ProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const { user, profile, refreshProfile } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  // Top-up simulation
  const [topupAmount, setTopupAmount] = useState<number>(300);
  const [isTopupProcessing, setIsTopupProcessing] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-xs text-slate-400">เข้าสู่ระบบเพื่อจัดการข้อมูลส่วนตัวและยอดเครดิตของคุณ</p>
        <Link href="/login">
          <Button variant="primary" size="md">
            เข้าสู่ระบบ
          </Button>
        </Link>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        phone: phone.trim(),
      });
      await refreshProfile();
      success('อัปเดตข้อมูลบัญชีสำเร็จแล้ว');
    } catch (err: any) {
      error(`เกิดข้อผิดพลาด: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateTopup = async () => {
    setIsTopupProcessing(true);
    try {
      const current = profile?.credits || 0;
      await updateUserCredits(user.uid, current + topupAmount);
      await refreshProfile();
      success(`เติมเครดิตเข้ากระเป๋าจำนวน ${formatCurrency(topupAmount)} สำเร็จแล้ว!`);
    } catch (err: any) {
      error(`เติมเครดิตไม่สำเร็จ: ${err.message || 'กรุณาลองใหม่'}`);
    } finally {
      setIsTopupProcessing(false);
    }
  };

  const credits = profile?.credits || 0;
  const userInitials = (profile?.displayName || user.displayName || 'U').charAt(0).toUpperCase();

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* User Profile Header Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] bg-slate-800 flex items-center justify-center shrink-0">
              {profile?.photoURL || user.photoURL ? (
                <Image
                  src={profile?.photoURL || user.photoURL || ''}
                  alt={profile?.displayName || 'Avatar'}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-cyan-400">{userInitials}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {profile?.displayName || user.displayName || 'Customer'}
                </h1>
                <RoleBadge role={profile?.role || 'customer'} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">UID: {user.uid}</p>
              <div className="mt-2 flex items-center gap-2">
                <TierBadge tier={profile?.tier || 'Bronze'} />
                <span className="text-xs text-slate-400">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Credits Balance Highlight */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-5 min-w-[240px]">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">เครดิตคงเหลือ</span>
              <span className="text-2xl font-black text-cyan-400">
                {formatCurrency(credits)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            ภาพรวมบัญชี (Overview)
          </button>
          <button
            onClick={() => setActiveTab('topup')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'topup'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            เติมเงินเข้าระบบ (Top-up)
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            ตั้งค่าบัญชี (Settings)
          </button>
          <Link
            href="/orders"
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>ประวัติการสั่งซื้อ</span>
          </Link>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-3">
              <span className="text-xs font-semibold text-slate-400">ระดับสิทธิ์ (Role)</span>
              <p className="text-lg font-bold text-white uppercase">{profile?.role || 'Customer'}</p>
              <p className="text-xs text-slate-500">บัญชีผู้ใช้งานระบบ J3A STORE</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-3">
              <span className="text-xs font-semibold text-slate-400">ระดับสมาชิก (Tier)</span>
              <div className="flex items-center gap-2">
                <TierBadge tier={profile?.tier || 'Bronze'} />
                <span className="text-xs text-amber-400 font-semibold">รับสิทธิ์สะสมส่วนลด</span>
              </div>
              <p className="text-xs text-slate-500">อัปเกรดอัตโนมัติเมื่อสั่งซื้อต่อเนื่อง</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-3">
              <span className="text-xs font-semibold text-slate-400">สถานะความปลอดภัย</span>
              <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" /> ป้องกันด้วย Firebase Auth
              </div>
              <p className="text-xs text-slate-500">ข้อมูลของคุณถูกเข้ารหัสอย่างปลอดภัย</p>
            </div>
          </div>
        )}

        {/* Tab 2: Topup */}
        {activeTab === 'topup' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <span>เติมเงินเข้ากระเป๋าเครดิต (Top-up Balance)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                เลือกจำนวนเงินที่ต้องการเติมเพื่อนำไปใช้สั่งซื้อสินค้าได้ทันทีโดยไม่ต้องโอนเงินทีละชิ้น
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[50, 100, 300, 500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(amt)}
                  className={`p-3.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                    topupAmount === amt
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">ยอดเงินที่จะได้รับในบัญชี:</span>
                <p className="text-xl font-black text-cyan-400">{formatCurrency(topupAmount)}</p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleSimulateTopup}
                isLoading={isTopupProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                ยืนยันการเติมเงิน
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Settings */}
        {activeTab === 'settings' && (
          <form
            onSubmit={handleUpdateProfile}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-5 max-w-xl"
          >
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span>แก้ไขข้อมูลส่วนตัว</span>
            </h2>

            <Input
              label="ชื่อที่ต้องการแสดง (Display Name)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ชื่อของคุณ"
              required
            />

            <Input
              label="เบอร์โทรศัพท์ (Phone)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812345678"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">อีเมล (ไม่สามารถเปลี่ยนได้)</label>
              <input
                type="text"
                disabled
                value={user.email || ''}
                className="w-full bg-slate-950/50 text-slate-500 text-sm rounded-xl px-3.5 py-2.5 border border-slate-800 cursor-not-allowed"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              className="mt-2"
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-cyan-400">กำลังโหลดข้อมูลโปรไฟล์...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
