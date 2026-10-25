'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
  Gift,
  Building2,
  Send,
  Ticket,
  LayoutDashboard,
  FlaskConical,
  Crown,
  Award,
  ChevronDown,
  ChevronUp,
  Lock,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';
import { updateUserProfile } from '@/lib/firestore/users';
import { createTopupRequest, getUserTopups, subscribeUserTopups, redeemAngpaoTopup } from '@/lib/firestore/topups';
import { redeemCodeForUser } from '@/lib/firestore/redeem';
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/firestore/settings';
import { StoreSettings, RankTier } from '@/types/settings';
import { TopupRequest } from '@/types/topup';
import { TierBadge, RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { compressImageToDataUrl } from '@/lib/utils/image';
import { uploadProductImage } from '@/lib/storage/upload';
import { supabase } from '@/lib/supabase/client';

const DEFAULT_RANKS: RankTier[] = [
  { id: 'bronze', name: 'Bronze', minSpent: 0, discountPercent: 0, badgeColor: '#cd7f32', description: 'สมาชิกทั่วไป' },
  { id: 'silver', name: 'Silver', minSpent: 200, discountPercent: 5, badgeColor: '#94a3b8', description: 'ส่วนลด 5% ทุกคำสั่งซื้อ (สะสมครบ ฿200)' },
  { id: 'gold', name: 'Gold', minSpent: 500, discountPercent: 10, badgeColor: '#eab308', description: 'ส่วนลด 10% ทุกคำสั่งซื้อ (สะสมครบ ฿500)' },
  { id: 'platinum', name: 'Platinum', minSpent: 1000, discountPercent: 15, badgeColor: '#06b6d4', description: 'ส่วนลด 15% ทุกคำสั่งซื้อ (สะสมครบ ฿1,000)' },
  { id: 'vip', name: 'VIP', minSpent: 5000, discountPercent: 25, badgeColor: '#a855f7', description: 'ส่วนลดพิเศษ 25% ทุกคำสั่งซื้อ (สะสมครบ ฿5,000)' },
];
import { SettingsTabContent } from '@/components/profile/SettingsTabContent';
import { triggerMoneyCelebration } from '@/lib/utils/moneyConfetti';
import { AngpaoAdminDebugBanner } from '@/components/topup/AngpaoAdminDebugBanner';

function ProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const { user, profile, refreshProfile, isAdmin } = useAuth();
  const { success, error, toast } = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Store Settings (Dynamic PromptPay & Store Name from Admin)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  // Top-up Method selection: 'promptpay_slip' | 'bank_auto' | 'angpao' | 'redeem'
  const [topupMethod, setTopupMethod] = useState<'promptpay_slip' | 'bank_auto' | 'angpao' | 'redeem'>('promptpay_slip');

  // Top-up State
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>('');
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      success('คัดลอก UID บัญชีเรียบร้อยแล้ว');
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  // Redeem Code state
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Angpao Voucher state
  const [angpaoLinkInput, setAngpaoLinkInput] = useState('');
  const [isSubmittingAngpao, setIsSubmittingAngpao] = useState(false);

  // Top-up History
  const [userTopups, setUserTopups] = useState<TopupRequest[]>([]);
  const [loadingTopups, setLoadingTopups] = useState(false);
  const [viewingSlip, setViewingSlip] = useState<TopupRequest | null>(null);

  const effectiveAmount = customAmount && Number(customAmount) > 0 ? Number(customAmount) : (selectedPreset || 0);
  const hasSelectedAmount = effectiveAmount > 0;

  // User Cumulative Spending for Rank Progression
  const [userTotalSpent, setUserTotalSpent] = useState<number>(0);
  const [showRankDetails, setShowRankDetails] = useState<boolean>(true);

  useEffect(() => {
    async function loadSpending() {
      if (!user?.uid) return;
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('total, status')
          .eq('user_id', user.uid);

        if (!error && orders) {
          const validOrders = orders.filter(
            (o) => o.status !== 'cancelled' && o.status !== 'refunded'
          );
          const spent = validOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
          setUserTotalSpent(spent);
        }
      } catch (e) {
        console.warn('Failed to load user spending for ranks:', e);
      }
    }
    loadSpending();
  }, [user?.uid]);

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

  const ranksList: RankTier[] = useMemo(() => {
    if (storeSettings?.rankSettings?.ranks && storeSettings.rankSettings.ranks.length > 0) {
      return storeSettings.rankSettings.ranks;
    }
    return DEFAULT_RANKS;
  }, [storeSettings]);

  const sortedRanks = useMemo(() => {
    return [...ranksList].sort((a, b) => a.minSpent - b.minSpent);
  }, [ranksList]);

  // Find user's active rank by profile.tier or by spending (whichever is higher)
  const currentTierName = profile?.tier || 'Bronze';
  const activeRankIndex = useMemo(() => {
    const byNameIndex = sortedRanks.findIndex(
      (r) => r.name.toLowerCase() === currentTierName.toLowerCase() || r.id.toLowerCase() === currentTierName.toLowerCase()
    );
    let bySpendIndex = 0;
    for (let i = sortedRanks.length - 1; i >= 0; i--) {
      if (userTotalSpent >= sortedRanks[i].minSpent) {
        bySpendIndex = i;
        break;
      }
    }
    return Math.max(byNameIndex >= 0 ? byNameIndex : 0, bySpendIndex);
  }, [sortedRanks, currentTierName, userTotalSpent]);

  const activeRank = sortedRanks[activeRankIndex] || sortedRanks[0];
  const nextRank = activeRankIndex < sortedRanks.length - 1 ? sortedRanks[activeRankIndex + 1] : null;
  const isMaxRank = !nextRank;

  // Remaining spend to reach next rank
  const remainingToNext = nextRank ? Math.max(0, nextRank.minSpent - userTotalSpent) : 0;

  // Percentage progress to next rank
  const progressPercent = useMemo(() => {
    if (isMaxRank) return 100;
    const currentBase = activeRank.minSpent;
    const target = nextRank.minSpent;
    const range = target - currentBase;
    if (range <= 0) return 100;
    const gained = Math.max(0, userTotalSpent - currentBase);
    return Math.min(100, Math.max(5, Math.round((gained / range) * 100)));
  }, [isMaxRank, activeRank, nextRank, userTotalSpent]);

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
      // Pre-warm Angpao service in the background
      fetch('/api/topup/angpao').catch(() => {});

      setLoadingTopups(true);
      const unsubscribe = subscribeUserTopups(user.uid, (history) => {
        setUserTopups(history);
        setLoadingTopups(false);
      });
      return () => unsubscribe();
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

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    showLoading('กำลังอัปเดตยอดเครดิต...');
    try {
      await refreshProfile();
      if (activeTab === 'topup') {
        await loadTopupHistory();
      }
      success('อัปเดตยอดเครดิตล่าสุดแล้ว');
    } catch {
      error('ไม่สามารถรีเฟรชยอดเงินได้');
    } finally {
      setIsRefreshingBalance(false);
      hideLoading();
    }
  };

  const cleanPromptpay = (storeSettings.promptpay || '0812345678').replace(/[^0-9]/g, '');

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText(cleanPromptpay || storeSettings.promptpay);
    setCopiedPromptPay(true);
    success('คัดลอกหมายเลขพร้อมเพย์เรียบร้อยแล้ว');
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  const handleSlipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      error('ขนาดไฟล์รูปภาพต้องไม่เกิน 20MB');
      return;
    }

    showLoading('กำลังประมวลผลรูปภาพสลิป...');
    try {
      setSlipFile(file);
      // Auto compress to lightweight data URL (safe for Firestore < 600,000 bytes)
      const compressed = await compressImageToDataUrl(file);
      setSlipPreview(compressed);
    } catch (err: any) {
      error(err.message || 'ไม่สามารถประมวลผลรูปภาพได้');
    } finally {
      hideLoading();
    }
  };

  const handleSubmitTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSelectedAmount) {
      error('กรุณาเลือกหรือระบุจำนวนเงินที่ต้องการเติมก่อน');
      return;
    }
    if (!slipPreview) {
      error('กรุณาอัปโหลดรูปภาพสลิปหลักฐานการโอนเงิน');
      return;
    }

    setIsSubmittingTopup(true);
    showLoading('กำลังอัปโหลดสลิปและส่งคำขอเติมเงิน...');
    try {
      let finalSlipUrl = slipPreview;

      // 1. Try uploading to Firebase Storage first (gets clean short URL)
      if (slipFile) {
        try {
          const uploadRes = await uploadProductImage(slipFile, 'slips');
          if (uploadRes?.downloadUrl) {
            finalSlipUrl = uploadRes.downloadUrl;
          }
        } catch (storageErr) {
          console.warn('Firebase Storage upload skipped/failed, using compressed data URL fallback:', storageErr);
        }
      }

      const createdTopup = await createTopupRequest({
        userId: user.uid,
        userEmail: user.email || '',
        userName: profile?.displayName || user.displayName || 'ลูกค้า',
        amount: effectiveAmount,
        paymentSlipUrl: finalSlipUrl,
      });

      // Dispatch Discord Webhook Notification to Admin (୨-💳-୧-⁺-˖-สลิปรออนุมัติ)
      try {
        await fetch('/api/notifications/discord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'slip_submitted',
            data: {
              topupNumber: createdTopup.topupNumber,
              userName: profile?.displayName || user.displayName || 'ลูกค้า',
              userEmail: user.email || '',
              amount: effectiveAmount,
              slipUrl: finalSlipUrl,
            },
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch (notifyErr) {
        console.warn('Discord slip notify error:', notifyErr);
      }

      success('แจ้งการโอนเงินเรียบร้อยแล้ว! แอดมินจะตรวจสอบและอนุมัติเครดิตเข้าบัญชีของคุณ');
      setSlipFile(null);
      setSlipPreview('');
      setSelectedPreset(null);
      setCustomAmount('');
      // Reload top-up history
      await loadTopupHistory();
    } catch (err: any) {
      error(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถส่งคำขอเติมเงินได้'}`);
    } finally {
      setIsSubmittingTopup(false);
      hideLoading();
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCodeInput.trim()) {
      error('กรุณากรอกโค้ดของขวัญ');
      return;
    }
    setIsRedeeming(true);
    showLoading('กำลังตรวจสอบและแลกรับของขวัญ...');
    try {
      const res = await redeemCodeForUser(redeemCodeInput, user.uid);
      if (res.success) {
        success(res.message);
        setRedeemCodeInput('');
        triggerMoneyCelebration(res.amount || 50);
        await refreshProfile();
      } else {
        error(res.message);
      }
    } catch (err: any) {
      error(err.message || 'เกิดข้อผิดพลาดในการแลกโค้ด');
    } finally {
      setIsRedeeming(false);
      hideLoading();
    }
  };

  const handleRedeemAngpao = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLink = angpaoLinkInput.trim();
    if (!cleanLink) {
      error('กรุณากรอกหรือวางลิงก์ซองของขวัญ TrueMoney Wallet');
      return;
    }

    setIsSubmittingAngpao(true);
    showLoading('กำลังตัดยอดซองของขวัญและเติมเครดิตเข้าบัญชี...');
    try {
      const result = await redeemAngpaoTopup(cleanLink);
      success(result.message || `เติมเงินสำเร็จ! ได้รับเครดิต ${result.amount} บาท`);
      setAngpaoLinkInput('');
      triggerMoneyCelebration(result.amount);
      await refreshProfile();
      await loadTopupHistory();
    } catch (err: any) {
      error(err.message || 'ไม่สามารถรับซองของขวัญได้ กรุณาตรวจสอบลิงก์อีกครั้ง');
    } finally {
      setIsSubmittingAngpao(false);
      hideLoading();
    }
  };

  const handlePasteAngpao = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAngpaoLinkInput(text.trim());
        success('วางลิงก์จากคลิปบอร์ดแล้ว');
      }
    } catch {
      // Ignore if permission denied
    }
  };

  const credits = profile?.credits || 0;
  const userDisplayName = (profile?.displayName && profile.displayName !== 'Customer')
    ? profile.displayName
    : (user.displayName || (user.email ? user.email.split('@')[0] : 'Customer'));
  const userInitials = userDisplayName.charAt(0).toUpperCase();

  // Dynamic PromptPay QR Code Link from Firestore Admin Settings
  const qrCodeUrl = `https://promptpay.io/${cleanPromptpay || '0812345678'}/${effectiveAmount}.png`;

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* User Profile Header Card with Cyberpunk Styling */}
        <div className="relative bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Top Neon Gradient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]" />

          {/* Ambient Background Glows */}
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: User Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar with Neon Gradient Frame */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-amber-400 p-1 shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-transform duration-300 group-hover:scale-105">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden relative">
                    {profile?.photoURL || user.photoURL ? (
                      <Image
                        src={profile?.photoURL || user.photoURL || ''}
                        alt={userDisplayName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-indigo-300">
                        {userInitials}
                      </span>
                    )}
                  </div>
                </div>
                {/* Active Online Indicator */}
                <span
                  className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-[0_0_8px_#34d399]"
                  title="ระบบออนไลน์"
                />
              </div>

              {/* Names & Badges */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {userDisplayName}
                  </h1>
                  <RoleBadge role={profile?.role || 'customer'} />
                  {profile?.role === 'admin' && (
                    <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full shadow-sm">
                      ADMIN PRIVILEGES
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={handleCopyUid}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white font-mono text-[11px] transition-all cursor-pointer group"
                    title="คลิกเพื่อคัดลอก UID"
                  >
                    <span>UID: {user.uid.slice(0, 12)}...</span>
                    {copiedUid ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                    )}
                  </button>

                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{user.email}</span>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <TierBadge tier={profile?.tier || 'Bronze'} />
                  <Link
                    href={`/profile/${user.uid}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 px-2.5 py-0.5 rounded-full"
                  >
                    <span>ดูโปรไฟล์สาธารณะ</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Credits Balance HUD Card */}
            <div className="w-full lg:w-auto bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 hover:border-amber-400/70 rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(245,158,11,0.2)] transition-all min-w-[280px]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      เครดิตคงเหลือในกระเป๋า
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                      {formatCurrency(credits)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRefreshBalance}
                  disabled={isRefreshingBalance}
                  title="รีเฟรชยอดเครดิตล่าสุด"
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingBalance ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>

              {/* Quick Action Topup Button inside the Card */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  ระบบอัตโนมัติ 24 ชม.
                </span>
                <button
                  onClick={() => setActiveTab('topup')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(245,158,11,0.35)] flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>+ เติมเงินด่วน</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls with Neon Glass Accents */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto scrollbar-none text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <span>ภาพรวมบัญชี (Overview)</span>
          </button>

          <button
            onClick={() => setActiveTab('topup')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 relative ${
              activeTab === 'topup'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.3)] font-black'
                : 'text-amber-300/80 hover:text-amber-200 hover:bg-slate-900/60'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>เติมเงินเข้าระบบ (Top-up & Redeem)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950 animate-pulse">
              AUTO
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'settings'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>ตั้งค่าบัญชี (Settings)</span>
          </button>

          <Link
            href="/orders"
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/60 transition-all flex items-center gap-2 shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-slate-400" />
            <span>ประวัติการสั่งซื้อ (Orders)</span>
          </Link>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-3 overflow-hidden group hover:border-cyan-500/40 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ระดับสิทธิ์ (Role)</span>
                  <Shield className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-xl font-black text-white uppercase tracking-tight">{profile?.role || 'Customer'}</p>
                <p className="text-xs text-slate-400">บัญชีผู้ใช้งานระบบ J3A STORE</p>
              </div>

              {/* Tier Card with Progress & Discount */}
              <div className="relative bg-slate-900/60 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md space-y-3 overflow-hidden group hover:border-amber-500/50 transition-all shadow-[0_0_20px_rgba(245,158,11,0.06)]">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ระดับสมาชิก (Tier)</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center gap-2">
                  <TierBadge tier={activeRank.name as any} />
                  <span className="text-xs text-amber-400 font-bold">
                    {activeRank.discountPercent > 0 ? `ลด ${activeRank.discountPercent}% ทุกคำสั่งซื้อ` : 'สิทธิ์สะสมยอดเลื่อนขั้น'}
                  </span>
                </div>

                {!isMaxRank ? (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">
                        เป้าหมาย: <strong className="text-amber-300 font-bold">{nextRank?.name}</strong>
                      </span>
                      <span className="text-amber-400 font-bold font-mono">
                        ขาดอีก ฿{remainingToNext.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <Crown className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>ระดับสูงสุด (VIP) รับส่วนลด 25% ตลอดชีพ</span>
                  </div>
                )}

                <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                  <span>ยอดสะสม: <strong className="text-white font-mono">฿{userTotalSpent.toLocaleString()}</strong></span>
                  <button
                    type="button"
                    onClick={() => setShowRankDetails(!showRankDetails)}
                    className="text-amber-400 hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-0.5 text-[11px] font-semibold"
                  >
                    <span>{showRankDetails ? 'ซ่อนแผนผัง Rank' : 'ดูแผนผัง Rank'}</span>
                    {showRankDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-3 overflow-hidden group hover:border-emerald-500/40 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะความปลอดภัย</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold">
                  <span>ป้องกันด้วย Supabase Auth</span>
                </div>
                <p className="text-xs text-slate-400">ข้อมูลของคุณถูกเข้ารหัสอย่างปลอดภัย 100%</p>
              </div>
            </div>

            {/* Detailed Rank Progression & VIP Milestones Container */}
            {showRankDetails && (
              <div className="bg-slate-900/70 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-md space-y-6 shadow-[0_0_30px_rgba(245,158,11,0.05)]">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-bold text-white">
                        เส้นทางความคืบหน้าระดับสมาชิก (Rank Progression)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      สะสมยอดสั่งซื้อเพื่อปลดล็อกส่วนลดพิเศษถาวร ยิ่งระดับสูง ยิ่งลดมาก ระบบหักส่วนลดที่หน้า Checkout อัตโนมัติ
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">ยอดซื้อสะสมของคุณ</p>
                      <p className="text-base font-black text-cyan-300 font-mono">฿{userTotalSpent.toLocaleString()} THB</p>
                    </div>
                    <div className="h-8 w-px bg-slate-800" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">สิทธิ์ส่วนลดปัจจุบัน</p>
                      <p className="text-base font-black text-amber-400 font-mono">
                        {activeRank.discountPercent > 0 ? `ลด ${activeRank.discountPercent}%` : 'ไม่มีส่วนลด'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual Milestone Stepper (5 Ranks) */}
                <div className="py-2">
                  <div className="grid grid-cols-5 gap-2 relative">
                    {/* Background track line */}
                    <div className="hidden sm:block absolute top-5 left-[10%] right-[10%] h-1 bg-slate-800 -z-0" />
                    {/* Active progress fill line */}
                    <div
                      className="hidden sm:block absolute top-5 left-[10%] h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-purple-500 -z-0 transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                      style={{
                        width: isMaxRank
                          ? '80%'
                          : `${Math.min(80, (activeRankIndex / (sortedRanks.length - 1)) * 80 + (progressPercent / 100) * (80 / (sortedRanks.length - 1)))}%`,
                      }}
                    />

                    {sortedRanks.map((rank, idx) => {
                      const isAchieved = userTotalSpent >= rank.minSpent || activeRankIndex >= idx;
                      const isCurrent = activeRank.id === rank.id;
                      const isNext = nextRank?.id === rank.id;

                      return (
                        <div key={rank.id} className="flex flex-col items-center text-center space-y-2 relative z-10">
                          {/* Circle Node */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.7)] scale-110'
                                : isAchieved
                                ? 'bg-slate-800 text-amber-400 border-2 border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                : isNext
                                ? 'bg-slate-900 text-slate-300 border-2 border-slate-600 ring-2 ring-cyan-500/20'
                                : 'bg-slate-950 text-slate-600 border border-slate-800'
                            }`}
                          >
                            {isCurrent ? (
                              <Crown className="w-5 h-5 animate-pulse" />
                            ) : isAchieved ? (
                              <Check className="w-5 h-5 stroke-[3]" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-500" />
                            )}
                          </div>

                          {/* Node Labels */}
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-white flex items-center justify-center gap-1">
                              <span>{rank.name}</span>
                              {isCurrent && (
                                <span className="hidden md:inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              )}
                            </p>
                            <p className="text-[10px] font-mono font-semibold text-slate-400">
                              {rank.minSpent === 0 ? 'เริ่มต้น' : `฿${rank.minSpent.toLocaleString()}`}
                            </p>
                            <p className="text-[11px] font-bold text-amber-400">
                              {rank.discountPercent === 0 ? 'ราคาปกติ' : `ลด ${rank.discountPercent}%`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Announcement Banner */}
                <div
                  className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center gap-3 ${
                    isMaxRank
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>
                    {isMaxRank ? (
                      <>
                        <strong>👑 ยินดีด้วยครับ!</strong> คุณอยู่ในระดับสมาชิกสูงสุด <strong>VIP</strong> รับสิทธิ์ส่วนลดพิเศษ <strong>25%</strong> อัตโนมัติทุกคำสั่งซื้อตลอดชีพ
                      </>
                    ) : (
                      <>
                        ยอดสะสมปัจจุบันของคุณคือ <strong className="font-mono text-white">฿{userTotalSpent.toLocaleString()}</strong> อีกเพียง{' '}
                        <strong className="font-mono text-amber-300 underline underline-offset-2">฿{remainingToNext.toLocaleString()}</strong>{' '}
                        จะได้รับการเลื่อนระดับเป็น <strong>{nextRank?.name}</strong> เพื่อรับส่วนลดสินค้าเพิ่มเป็น <strong>{nextRank?.discountPercent}%</strong>!
                      </>
                    )}
                  </span>
                </div>

                {/* Breakdown Cards of all 5 Tiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                  {sortedRanks.map((rank, idx) => {
                    const isCurrent = activeRank.id === rank.id;
                    const isAchieved = userTotalSpent >= rank.minSpent || activeRankIndex >= idx;
                    const needed = Math.max(0, rank.minSpent - userTotalSpent);

                    return (
                      <div
                        key={rank.id}
                        className={`rounded-xl p-3.5 border transition-all space-y-2 relative ${
                          isCurrent
                            ? 'bg-gradient-to-b from-amber-500/15 to-slate-900/90 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                            : isAchieved
                            ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-80'
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                            ระดับของคุณ
                          </span>
                        )}

                        <div className="flex items-center justify-between">
                          <TierBadge tier={rank.name as any} />
                          <span className="text-[11px] font-bold text-amber-400">
                            {rank.discountPercent > 0 ? `ลด ${rank.discountPercent}%` : 'ไม่มีส่วนลด'}
                          </span>
                        </div>

                        <div className="space-y-0.5 pt-1">
                          <p className="text-xs font-semibold text-slate-300">
                            ยอดสะสม: <strong className="text-white font-mono">฿{rank.minSpent.toLocaleString()}</strong>
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {rank.description || `ส่วนลด ${rank.discountPercent}% ทุกออเดอร์`}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 text-[10px]">
                          {isCurrent ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> ใช้งานอยู่ตอนนี้
                            </span>
                          ) : isAchieved ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> ปลดล็อคแล้ว
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> ขาดอีก ฿{needed.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Topup (Methods + Redeem) */}
        {activeTab === 'topup' && (
          <div className="space-y-8">
            {/* Top-up Method Switcher High-Tech Cards */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 backdrop-blur-md grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setTopupMethod('angpao')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
                  topupMethod === 'angpao'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.45)]'
                    : 'text-rose-300 hover:text-white hover:bg-slate-800/80 border border-rose-500/20'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-rose-300" />
                  <span>1. ซองอั่งเปา TrueMoney</span>
                </div>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950 animate-bounce">
                  AUTO 24 ชม.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTopupMethod('promptpay_slip')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  topupMethod === 'promptpay_slip'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>2. สแกนพร้อมเพย์ (สลิป)</span>
              </button>

              <button
                type="button"
                onClick={() => setTopupMethod('bank_auto')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  topupMethod === 'bank_auto'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>3. โอนธนาคารอัตโนมัติ</span>
              </button>

              <button
                type="button"
                onClick={() => setTopupMethod('redeem')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  topupMethod === 'redeem'
                    ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>4. โค้ดของขวัญ (Redeem)</span>
              </button>
            </div>

            {/* Method 1: PromptPay Slip Upload */}
            {topupMethod === 'promptpay_slip' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form & Amount Picker */}
                <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-cyan-400" />
                      <span>แจ้งเติมเงินเข้ากระเป๋าเครดิต (พร้อมเพย์สลิป)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      เลือกจำนวนเงินที่ต้องการเติม → QR Code จะแสดงผลทันที → โอนเงินแล้วแนบสลิปเพื่อให้แอดมินอนุมัติ
                    </p>
                  </div>

                  {/* Step 1: Amount presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>ขั้นตอนที่ 1: เลือกจำนวนเงินที่ต้องการเติม</span>
                      {hasSelectedAmount && (
                        <span className="text-xs font-bold text-cyan-400">
                          เลือกแล้ว: {formatCurrency(effectiveAmount)}
                        </span>
                      )}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[50, 100, 300, 500, 1000, 2000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setSelectedPreset(amt);
                            setCustomAmount('');
                          }}
                          className={`py-2.5 px-2 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                            selectedPreset === amt && !customAmount
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
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedPreset(null);
                        }}
                        className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Step 2: Upload Slip (Unlocks only when amount is chosen) */}
                  {hasSelectedAmount ? (
                    <form onSubmit={handleSubmitTopup} className="space-y-5 pt-3 border-t border-slate-800 animate-in fade-in">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                          <span>ขั้นตอนที่ 2: แนบรูปภาพสลิปหลักฐานการโอนเงิน (Slip)</span>
                          {slipPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setSlipPreview('');
                                setSlipFile(null);
                              }}
                              className="text-[11px] text-rose-400 hover:underline cursor-pointer"
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
                              รองรับไฟล์ JPG, JPEG, PNG, GIF, WEBP (บีบอัดอัตโนมัติ)
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
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-300">
                        กรุณาเลือกจำนวนเงินด้านบนก่อน
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ช่องอัปโหลดสลิปและ QR Code พร้อมเพย์จะแสดงเมื่อคุณเลือกราคาแล้ว
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: QR Code (Appears only after choosing price) */}
                <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-5 text-center">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Thai QR Payment
                    </span>
                    <h3 className="text-base font-bold text-white">พร้อมเพย์ (PromptPay QR)</h3>
                  </div>

                  {hasSelectedAmount ? (
                    <div className="space-y-4 animate-in zoom-in-95">
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
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                              title="คัดลอกเบอร์พร้อมเพย์"
                            >
                              {copiedPromptPay ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800">
                          <span>ยอดที่ต้องโอน:</span>
                          <span className="font-black text-cyan-400 text-base">
                            {formatCurrency(effectiveAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 px-4 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
                      <QrCode className="w-12 h-12 text-slate-600 animate-pulse" />
                      <p className="text-xs font-semibold text-slate-300">
                        QR Code จะแสดงที่นี่
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xs">
                        เลือกจำนวนเงินที่ต้องการเติมในกล่องซ้ายมือ แล้ว QR Code ยอดตรงจะถูกสร้างขึ้นอัตโนมัติ
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Method 2: Bank Auto Transfer (Coming Soon) */}
            {topupMethod === 'bank_auto' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md text-center max-w-2xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  โอนผ่านธนาคารเงินเข้าอัตโนมัติ (Automated Bank Transfer)
                </h3>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ⚡ Coming Soon
                </span>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  ระบบเชื่อมต่อ Payment Gateway และ Slip Verification อัตโนมัติกำลังอยู่ระหว่างการพัฒนา ในระหว่างนี้ กรุณาใช้ช่องทาง <strong>"1. อัปโหลดสลิป"</strong> หรือ <strong>"4. Redeem Code"</strong> ในการเติมเครดิต
                </p>
              </div>
            )}

            {/* Method 3: Angpao Voucher (Live & Fully Automated) */}
            {topupMethod === 'angpao' && (
              <div className="max-w-2xl mx-auto space-y-5">
                {/* Admin Debug Mode Diagnostic Panel (Visible only to Admin) */}
                <AngpaoAdminDebugBanner
                  isAdmin={Boolean(isAdmin || profile?.role === 'admin')}
                  onTopupSuccess={() => {
                    if (refreshProfile) refreshProfile();
                    loadTopupHistory();
                  }}
                />

                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/20 via-rose-600/30 to-amber-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
                    <span className="animate-ping absolute inset-0 rounded-2xl bg-rose-500 opacity-20"></span>
                    <Gift className="w-8 h-8 text-rose-400" />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      AUTO 24 ชม.
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      เงินเข้าทันที
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      <Sparkles className="w-3 h-3" />
                      ฟรีค่าธรรมเนียม 0%
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white tracking-tight">
                    ซองของขวัญ TrueMoney Wallet (อั่งเปาอัตโนมัติ)
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    วางลิงก์ซองของขวัญ TrueMoney แล้วกดยืนยัน ระบบจะตัดยอดเข้ากระเป๋าและเติมเครดิตเข้าบัญชีของคุณทันที
                  </p>
                </div>

                {/* 3 Step Instructions */}
                <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>ขั้นตอนการสร้างซองของขวัญในแอป TrueMoney</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        ขั้นตอนที่ 1
                      </span>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        เปิดแอป <strong>TrueMoney</strong> กด <strong>โอนเงิน</strong> &gt; <strong>ส่งซองของขวัญ</strong>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/30 space-y-1">
                      <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        ขั้นตอนที่ 2 (สำคัญ)
                      </span>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        ใส่ยอดเงินที่ต้องการเติม และเลือก <strong>จำนวนคนรับ = 1 คน</strong>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        ขั้นตอนที่ 3
                      </span>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        คัดลอกลิงก์ซองของขวัญมาวางในช่องด้านล่าง แล้วกดยืนยัน
                      </p>
                    </div>
                  </div>
                </div>

                {/* Redemption Form */}
                <form onSubmit={handleRedeemAngpao} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-rose-400" />
                        <span>ลิงก์ซองของขวัญ TrueMoney Wallet *</span>
                      </label>
                      {typeof navigator !== 'undefined' && navigator.clipboard && (
                        <button
                          type="button"
                          onClick={handlePasteAngpao}
                          className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>วางจากคลิปบอร์ด</span>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={angpaoLinkInput}
                        onChange={(e) => setAngpaoLinkInput(e.target.value)}
                        placeholder="https://gift.truemoney.com/campaign/?v=xxxxxxx"
                        className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-600 rounded-2xl px-4 py-3.5 border border-slate-700/80 focus:border-rose-500 outline-none transition-all pr-20 font-mono shadow-inner"
                        disabled={isSubmittingAngpao}
                      />
                      {angpaoLinkInput && (
                        <button
                          type="button"
                          onClick={() => setAngpaoLinkInput('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          ล้าง
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ตัวอย่าง: <span className="font-mono text-slate-500">https://gift.truemoney.com/campaign/?v=37013acbde0846068e...</span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmittingAngpao}
                    leftIcon={<Send className="w-4 h-4" />}
                    className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 border-none shadow-[0_0_25px_rgba(244,63,94,0.4)] hover:shadow-[0_0_35px_rgba(244,63,94,0.6)] font-bold text-sm cursor-pointer"
                  >
                    {isSubmittingAngpao ? 'กำลังตัดยอดซองและเติมเครดิต...' : 'ยืนยันเติมเงินด้วยซองของขวัญ (รับเครดิตทันที)'}
                  </Button>
                </form>

                {/* Safety & Notice */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                  <p className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ข้อควรทราบและคำแนะนำความปลอดภัย</span>
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
                    <li>ระบบจะตัดยอดเงินเข้า TrueMoney ของร้านค้าทันที และเพิ่มเครดิตในเว็บให้อัตโนมัติในไม่กี่วินาที</li>
                    <li>ซองของขวัญต้องตั้งค่า <strong>"จำนวนคนที่ได้รับสิทธิ์ = 1 คน"</strong> เท่านั้น</li>
                    <li>ไม่สามารถใช้ซองของขวัญที่สร้างจากเบอร์เดียวกันกับเบอร์ร้านค้าได้ (กฎของ TrueMoney)</li>
                  </ul>
                </div>
              </div>
            </div>
            )}

            {/* Method 4: Redeem Code */}
            {topupMethod === 'redeem' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
                    <Ticket className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    แลกรับโค้ดของขวัญ (Redeem Code)
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    กรอกโค้ดแจกฟรีจากกิจกรรมของร้าน J3A STORE เพื่อรับเครดิตเข้าบัญชีของคุณทันที
                  </p>
                </div>

                <form onSubmit={handleRedeemCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      รหัสโค้ดของขวัญ (Code) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={redeemCodeInput}
                        onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                        placeholder="กรอกรหัสโค้ดของขวัญ"
                        className="flex-1 bg-slate-950/80 text-white font-mono font-bold tracking-wider uppercase text-sm rounded-xl px-4 py-3 border border-slate-800 focus:border-amber-400 outline-none"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={isRedeeming}
                        disabled={!redeemCodeInput.trim() || isRedeeming}
                        leftIcon={<Sparkles className="w-4 h-4" />}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      >
                        แลกรับเครดิต
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300">💡 เงื่อนไขการใช้งาน:</p>
                  <p>• แต่ละโค้ดสามารถใช้ได้ 1 ครั้งต่อ 1 บัญชีผู้ใช้งาน</p>
                  <p>• โค้ดมีจำนวนจำกัดและมีวันหมดอายุตามช่วงเวลากิจกรรม</p>
                  <p>• ติดตามโค้ดแจกฟรีได้ทาง Discord และ LINE Official ของทางร้าน</p>
                </div>
              </div>
            )}

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
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
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
                        <th className="py-3 px-4">ช่องทาง</th>
                        <th className="py-3 px-4">ยอดเงิน</th>
                        <th className="py-3 px-4">สถานะ</th>
                        <th className="py-3 px-4">หลักฐาน</th>
                        <th className="py-3 px-4 text-right">วันที่แจ้ง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {userTopups.map((topup) => {
                        const isTestAngpao = topup.paymentMethod === 'truemoney_angpao_test';
                        const isAngpao =
                          isTestAngpao ||
                          topup.paymentMethod === 'truemoney_angpao' ||
                          Boolean(topup.voucherHash) ||
                          Boolean(topup.paymentSlipUrl?.includes('gift.truemoney.com'));

                        return (
                          <tr key={topup.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-white">
                              #{topup.topupNumber}
                            </td>
                            <td className="py-3 px-4">
                              {isTestAngpao ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.25)]">
                                  <FlaskConical className="w-3 h-3 text-purple-400" />
                                  ซอง TrueMoney (TEST)
                                </span>
                              ) : isAngpao ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                                  <Gift className="w-3 h-3 text-rose-400" />
                                  ซอง TrueMoney
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-full">
                                  <QrCode className="w-3 h-3 text-cyan-400" />
                                  สลิป QR Code
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-cyan-400">
                              {formatCurrency(topup.amount)}
                            </td>
                            <td className="py-3 px-4">
                              {topup.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> อนุมัติเข้ากระเป๋าแล้ว
                                </span>
                              ) : topup.status === 'test' ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.25)]">
                                    <FlaskConical className="w-3 h-3 text-purple-400" /> 🧪 ทดสอบ (Test)
                                  </span>
                                  <p className="text-[10px] text-purple-300/80">ระบบจำลองเครดิตสำหรับทดสอบ</p>
                                </div>
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
                              {isAngpao ? (
                                topup.paymentSlipUrl?.startsWith('http') ? (
                                  <a
                                    href={topup.paymentSlipUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 hover:underline text-[11px] font-semibold"
                                  >
                                    <Gift className="w-3.5 h-3.5" />
                                    <span>ลิ้งค์ซอง</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-mono">ซองของขวัญ</span>
                                )
                              ) : topup.paymentSlipUrl ? (
                                <button
                                  onClick={() => setViewingSlip(topup)}
                                  className="inline-flex items-center gap-1 text-cyan-400 hover:underline text-[11px] font-semibold cursor-pointer"
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Settings (Full 5 categories) */}
        {activeTab === 'settings' && <SettingsTabContent />}

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
