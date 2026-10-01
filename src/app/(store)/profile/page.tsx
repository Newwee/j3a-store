'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  UploadCloud,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  FileImage,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { updateUserProfile } from '@/lib/firestore/users';
import { createTopupRequest, getUserTopups } from '@/lib/firestore/topups';
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/firestore/settings';
import { StoreSettings } from '@/types/settings';
import { TopupRequest } from '@/types/topup';
import { TierBadge, RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

function ProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const { user, profile, refreshProfile } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Store Settings (Dynamic PromptPay & Store Name from Admin)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  // Top-up State
  const [topupAmount, setTopupAmount] = useState<number>(300);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [slipPreview, setSlipPreview] = useState<string>('');
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);

  // Top-up History
  const [userTopups, setUserTopups] = useState<TopupRequest[]>([]);
  const [loadingTopups, setLoadingTopups] = useState(false);
  const [viewingSlip, setViewingSlip] = useState<TopupRequest | null>(null);

  const effectiveAmount = customAmount && Number(customAmount) > 0 ? Number(customAmount) : topupAmount;

  // Load Store Settings from Firestore
  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await getStoreSettings();
        setStoreSettings(s);
      } catch (err) {
        console.error('Failed to load store settings:', err);
      }
    }
    loadSettings();
  }, []);

  const loadTopupHistory = async () => {
    if (!user) return;
    setLoadingTopups(true);
    try {
      const history = await getUserTopups(user.uid);
      setUserTopups(history);
    } catch (err) {
      console.error('Failed to load user topups:', err);
    } finally {
      setLoadingTopups(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'topup' && user) {
      loadTopupHistory();
    }
  }, [activeTab, user]);

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

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      await refreshProfile();
      if (activeTab === 'topup') {
        await loadTopupHistory();
      }
      success('อัปเดตยอดเครดิตล่าสุดแล้ว');
    } catch (err) {
      error('ไม่สามารถรีเฟรชยอดเงินได้');
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  const cleanPromptpay = (storeSettings.promptpay || '0812345678').replace(/[^0-9]/g, '');

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText(cleanPromptpay || storeSettings.promptpay);
    setCopiedPromptPay(true);
    success('คัดลอกหมายเลขพร้อมเพย์เรียบร้อยแล้ว');
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  const handleSlipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSlipPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipPreview) {
      error('กรุณาอัปโหลดรูปภาพสลิปหลักฐานการโอนเงิน');
      return;
    }

    if (effectiveAmount <= 0) {
      error('ยอดเงินเติมต้องมากกว่า 0 บาท');
      return;
    }

    setIsSubmittingTopup(true);
    try {
      await createTopupRequest({
        userId: user.uid,
        userEmail: user.email || '',
        userName: profile?.displayName || user.displayName || 'ลูกค้า',
        amount: effectiveAmount,
        paymentSlipUrl: slipPreview,
      });

      success('แจ้งการโอนเงินเรียบร้อยแล้ว! แอดมินจะตรวจสอบและอนุมัติเครดิตเข้าบัญชีของคุณ');
      setSlipPreview('');
      setCustomAmount('');
      // Reload top-up history
      await loadTopupHistory();
    } catch (err: any) {
      error(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถส่งคำขอเติมเงินได้'}`);
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  const credits = profile?.credits || 0;
  const userInitials = (profile?.displayName || user.displayName || 'U').charAt(0).toUpperCase();

  // Dynamic PromptPay QR Code Link from Firestore Admin Settings
  const qrCodeUrl = `https://promptpay.io/${cleanPromptpay || '0812345678'}/${effectiveAmount}.png`;

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
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-5 min-w-[260px]">
            <div className="flex items-center gap-4">
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
            <button
              onClick={handleRefreshBalance}
              disabled={isRefreshingBalance}
              title="รีเฟรชยอดเงิน"
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingBalance ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
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
            เติมเงินเข้าระบบ (Top-up Slip)
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

        {/* Tab 2: Topup (PromptPay QR + Slip Upload + Admin Approval) */}
        {activeTab === 'topup' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form & Amount Picker */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-cyan-400" />
                    <span>แจ้งเติมเงินเข้ากระเป๋าเครดิต (PromptPay QR)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    สแกน QR Code โอนเงิน แล้วแนบสลิปเพื่อให้แอดมินตรวจสอบและอนุมัติเครดิตเข้า User ID ของคุณ
                  </p>
                </div>

                {/* Amount presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    ขั้นตอนที่ 1: เลือกหรือระบุจำนวนเงินที่ต้องการเติม
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[50, 100, 300, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setTopupAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2.5 px-2 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                          topupAmount === amt && !customAmount
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                            : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {amt}฿
                      </button>
                    ))}
                  </div>

                  {/* Custom amount */}
                  <div className="pt-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="หรือระบุจำนวนเงินอื่น ๆ (บาท)..."
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                {/* Step 2: Upload Slip */}
                <form onSubmit={handleSubmitTopup} className="space-y-5 pt-3 border-t border-slate-800">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>ขั้นตอนที่ 2: แนบรูปภาพสลิปหลักฐานการโอนเงิน (Slip)</span>
                      {slipPreview && (
                        <button
                          type="button"
                          onClick={() => setSlipPreview('')}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          ลบรูปภาพ
                        </button>
                      )}
                    </label>

                    {slipPreview ? (
                      <div className="relative w-full aspect-[4/3] max-h-60 rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 flex items-center justify-center">
                        <Image
                          src={slipPreview}
                          alt="Slip Preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-700 hover:border-cyan-400/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-colors">
                        <UploadCloud className="w-8 h-8 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-200">
                          คลิกเพื่อเลือกไฟล์รูปภาพสลิปโอนเงิน
                        </span>
                        <span className="text-[11px] text-slate-500">
                          รองรับไฟล์ JPG, PNG, WEBP (สูงสุด 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlipFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">ยอดเงินที่จะแจ้งเติม:</span>
                      <span className="text-xl font-black text-cyan-400">
                        {formatCurrency(effectiveAmount)}
                      </span>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSubmittingTopup || !slipPreview}
                      isLoading={isSubmittingTopup}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      แจ้งโอนเงินให้แอดมินอนุมัติ
                    </Button>
                  </div>
                </form>
              </div>

              {/* Right Column: QR Code & PromptPay Information */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-5 text-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Thai QR Payment
                  </span>
                  <h3 className="text-base font-bold text-white">พร้อมเพย์ (PromptPay)</h3>
                </div>

                {/* QR Code Frame */}
                <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl mx-auto border-4 border-slate-800">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto">
                    <Image
                      src={qrCodeUrl}
                      alt="PromptPay QR Code"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Transfer Info Details */}
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>ชื่อบัญชี:</span>
                    <span className="font-bold text-white">{storeSettings.storeName || 'J3A STORE OFFICIAL'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>พร้อมเพย์:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-cyan-300">
                        {storeSettings.promptpay || '081-234-5678'}
                      </span>
                      <button
                        onClick={handleCopyPromptPay}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="คัดลอกเบอร์พร้อมเพย์"
                      >
                        {copiedPromptPay ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800">
                    <span>ยอดที่ต้องโอน:</span>
                    <span className="font-black text-cyan-400 text-sm">
                      {formatCurrency(effectiveAmount)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  * เมื่อโอนเงินแล้ว กรุณาอัปโหลดรูปภาพสลิปในฟอร์มด้านซ้าย จากนั้นแอดมินจะตรวจสอบและอนุมัติเครดิตเข้ากระเป๋าของคุณทันที
                </p>
              </div>
            </div>

            {/* Bottom Section: Top-up History */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-cyan-400" />
                    <span>ประวัติการแจ้งเติมเงินของคุณ (Top-up History)</span>
                  </h3>
                  <p className="text-xs text-slate-400">รายการแจ้งเติมเงินและสถานะการตรวจสอบจากแอดมิน</p>
                </div>
                <button
                  onClick={loadTopupHistory}
                  disabled={loadingTopups}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTopups ? 'animate-spin' : ''}`} />
                  <span>รีเฟรชประวัติ</span>
                </button>
              </div>

              {loadingTopups ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-slate-950 animate-pulse" />
                  ))}
                </div>
              ) : userTopups.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  คุณยังไม่มีประวัติการแจ้งเติมเงิน
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">รหัสคำขอ</th>
                        <th className="py-3 px-4">ยอดเงิน</th>
                        <th className="py-3 px-4">สถานะ</th>
                        <th className="py-3 px-4">หลักฐานสลิป</th>
                        <th className="py-3 px-4 text-right">วันที่แจ้ง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {userTopups.map((topup) => (
                        <tr key={topup.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            #{topup.topupNumber}
                          </td>
                          <td className="py-3 px-4 font-bold text-cyan-400">
                            {formatCurrency(topup.amount)}
                          </td>
                          <td className="py-3 px-4">
                            {topup.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> อนุมัติเข้ากระเป๋าแล้ว
                              </span>
                            ) : topup.status === 'rejected' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3" /> ปฏิเสธ
                                </span>
                                {topup.adminNote && (
                                  <p className="text-[10px] text-rose-300/80">{topup.adminNote}</p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> รอ Admin ตรวจสอบ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {topup.paymentSlipUrl ? (
                              <button
                                onClick={() => setViewingSlip(topup)}
                                className="inline-flex items-center gap-1 text-cyan-400 hover:underline text-[11px] font-semibold"
                              >
                                <FileImage className="w-3.5 h-3.5" />
                                <span>ดูสลิป</span>
                              </button>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400">
                            {formatDate(topup.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

        {/* Slip Modal View */}
        {viewingSlip && (
          <Modal
            isOpen={Boolean(viewingSlip)}
            onClose={() => setViewingSlip(null)}
            title={`หลักฐานสลิปการโอนเงิน #${viewingSlip.topupNumber}`}
            description={`ยอดเงินแจ้งโอน ${formatCurrency(viewingSlip.amount)}`}
          >
            <div className="space-y-4">
              <div className="relative w-full aspect-[3/4] max-h-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <Image
                  src={viewingSlip.paymentSlipUrl}
                  alt="Payment Slip Proof"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-right">
                <a
                  href={viewingSlip.paymentSlipUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
                >
                  <span>เปิดรูปขนาดเต็ม</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </Modal>
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
