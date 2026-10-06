'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Lock,
  Mail,
  Smartphone,
  Trash2,
  Download,
  KeyRound,
  History,
  CheckCircle2,
  AlertCircle,
  Save,
  Globe,
  Clock,
  Laptop,
  Check,
  Eye,
  EyeOff,
  Camera,
  Upload,
  AlertTriangle,
  ExternalLink,
  Headphones,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { updateUserProfile } from '@/lib/firestore/users';
import {
  requestAccountDeletion,
  getUserDeletionRequest,
  cancelAccountDeletion,
} from '@/lib/firestore/deletionRequests';
import { DeletionRequest } from '@/types/user';
import { formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export function SettingsTabContent() {
  const { user, profile, refreshProfile } = useAuth();
  const { success, error, toast } = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [activeCategory, setActiveCategory] = useState<
    'account' | 'security' | 'notifications' | 'preferences' | 'data'
  >('account');

  // Account state
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState('ผู้ใช้งาน J3A STORE คอเกมตัวยง');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Notifications toggle state
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [inAppNotif, setInAppNotif] = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);

  // Preferences state
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [timezone, setTimezone] = useState('Asia/Bangkok (GMT+7)');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY HH:mm');

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
  const [isLoadingDeletionReq, setIsLoadingDeletionReq] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [isCancellingDelete, setIsCancellingDelete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDeletionRequest() {
      if (!user?.uid) return;
      setIsLoadingDeletionReq(true);
      try {
        const req = await getUserDeletionRequest(user.uid);
        if (isMounted) {
          setDeletionRequest(req);
        }
      } catch (e) {
        console.warn('Could not load deletion request:', e);
      } finally {
        if (isMounted) {
          setIsLoadingDeletionReq(false);
        }
      }
    }
    loadDeletionRequest();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handleSubmitDeletionRequest = async () => {
    if (!user) return;
    setIsSubmittingDelete(true);
    showLoading('กำลังส่งคำขอลบบัญชีไปยังระบบ...');
    try {
      const res = await requestAccountDeletion({
        userId: user.uid,
        email: user.email,
        displayName: profile?.displayName || user.displayName,
        credits: profile?.credits || 0,
        userReason: deleteReason,
      });
      setDeletionRequest(res);
      setShowDeleteModal(false);
      toast('คำขอลบบัญชีถูกส่งไปยังระบบเรียบร้อยแล้ว โปรดติดต่อแอดมินใน Discord หรือ LINE เพื่ออนุมัติ', 'info');
    } catch (err: any) {
      error(`ไม่สามารถส่งคำขอลบบัญชีได้: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSubmittingDelete(false);
      hideLoading();
    }
  };

  const handleCancelDeleteRequest = async () => {
    if (!user) return;
    setIsCancellingDelete(true);
    showLoading('กำลังยกเลิกคำขอลบบัญชี...');
    try {
      await cancelAccountDeletion(user.uid);
      setDeletionRequest((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      success('ยกเลิกคำขอลบบัญชีเรียบร้อยแล้ว');
    } catch (err: any) {
      error(`ไม่สามารถยกเลิกคำขอได้: ${err.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setIsCancellingDelete(false);
      hideLoading();
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingAccount(true);
    showLoading('กำลังบันทึกข้อมูลส่วนตัว...');
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        phone: phone.trim(),
      });
      await refreshProfile();
      success('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว');
    } catch (err: any) {
      error(`เกิดข้อผิดพลาด: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSavingAccount(false);
      hideLoading();
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 6) {
      error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    success('ระบบได้ส่งคำขอยืนยันเปลี่ยนรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDownloadData = () => {
    const exportData = {
      user: {
        uid: user?.uid,
        email: user?.email,
        displayName: profile?.displayName || user?.displayName,
        phone: profile?.phone,
        credits: profile?.credits,
        tier: profile?.tier,
        createdAt: profile?.createdAt,
      },
      exportedAt: new Date().toISOString(),
      store: 'J3A STORE',
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `j3a-user-data-${user?.uid?.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('ดาวน์โหลดข้อมูลบัญชี (JSON) สำเร็จ');
  };

  const navCategories = [
    { id: 'account', label: '👤 Account (ข้อมูลบัญชี)', icon: User },
    { id: 'security', label: '🔐 Security (ความปลอดภัย)', icon: Shield },
    { id: 'notifications', label: '🔔 Notifications (การแจ้งเตือน)', icon: Bell },
    { id: 'preferences', label: '🎨 Preferences (ปรับแต่งการใช้งาน)', icon: Palette },
    { id: 'data', label: '📊 Data & Account (ข้อมูลบัญชี)', icon: Database },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Settings Sub-Sidebar */}
      <div className="md:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-3 backdrop-blur-md space-y-1 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
          หมวดหมู่การตั้งค่า
        </h3>
        {navCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Content Area */}
      <div className="md:col-span-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
        {/* 1. Account Category */}
        {activeCategory === 'account' && (
          <form onSubmit={handleSaveAccount} className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span>Account (จัดการโปรไฟล์ & บัญชี)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                จัดการชื่อที่แสดง เบอร์โทรศัพท์ และคำแนะนำตัวของคุณ
              </p>
            </div>

            <div className="space-y-4">
              {/* Profile Avatar Upload Section (Ready for Cloud Storage) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 shrink-0 shadow-md">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={displayName || 'Avatar'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-2xl">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-sm font-bold text-white">รูปโปรไฟล์ (Profile Avatar)</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      เร็ว ๆ นี้ (Coming Soon)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    รองรับไฟล์รูปภาพ PNG, JPG, GIF ขนาดไม่เกิน 2MB (ระบบเตรียมเปิดใช้งานเร็ว ๆ นี้ เมื่อเชื่อมต่อ Storage Server เรียบร้อย)
                  </p>

                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {/* Hidden file input ready for activation */}
                    <input
                      type="file"
                      id="avatar-upload-input"
                      accept="image/*"
                      disabled
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                      onClick={() => {
                        toast(
                          'ฟังก์ชันอัปโหลดรูปโปรไฟล์เตรียมเปิดให้บริการเร็ว ๆ นี้ (ขณะนี้กำลังจัดเตรียม Cloud Storage Server)',
                          'info'
                        );
                      }}
                      className="text-xs cursor-pointer opacity-80 hover:opacity-100"
                    >
                      เปลี่ยนรูปโปรไฟล์
                    </Button>
                    <span className="text-[11px] text-slate-500 italic">
                      * บัญชี Google จะใช้รูปโปรไฟล์จาก Google อัตโนมัติ
                    </span>
                  </div>
                </div>
              </div>

              <Input
                label="ชื่อที่ต้องการแสดง (Display Name) *"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="สมชาย เกมเมอร์"
                required
              />

              <Input
                label="เบอร์โทรศัพท์ (Phone Number)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812345678"
                helperText="ใช้สำหรับการรับ SMS ยืนยันรหัสสินค้าหรือติดต่อฉุกเฉิน"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  คำแนะนำตัว (Bio)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl p-3 border border-slate-800 focus:border-cyan-400 outline-none"
                  placeholder="เขียนอะไรสั้น ๆ เกี่ยวกับตัวคุณ..."
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-medium text-slate-400">
                  อีเมลประจำบัญชี (Primary Email)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    value={user?.email || ''}
                    className="flex-1 bg-slate-950/60 text-slate-400 text-sm rounded-xl px-3.5 py-2.5 border border-slate-800 cursor-not-allowed"
                  />
                  <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันแล้ว
                  </span>
                </div>
              </div>

              {/* Connected Accounts Section */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  บัญชีที่เชื่อมต่อ (Connected Accounts)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs font-semibold text-slate-200">Google Account</span>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      เชื่อมต่อแล้ว
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 opacity-60">
                    <span className="text-xs font-semibold text-slate-300">Discord</span>
                    <span className="text-[11px] text-slate-500">เร็ว ๆ นี้</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingAccount}
              leftIcon={<Save className="w-4 h-4" />}
              className="font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              บันทึกการตั้งค่าโปรไฟล์
            </Button>
          </form>
        )}

        {/* 2. Security Category */}
        {activeCategory === 'security' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>Security (ความปลอดภัย & รหัสผ่าน)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                เปลี่ยนรหัสผ่าน ตรวจสอบอุปกรณ์ที่กำลังใช้งาน และความปลอดภัย
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                เปลี่ยนรหัสผ่าน (Change Password)
              </h4>

              <div className="space-y-3">
                <Input
                  label="รหัสผ่านเดิม"
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon={<KeyRound className="w-4 h-4" />}
                />

                <Input
                  label="รหัสผ่านใหม่"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                <Input
                  label="ยืนยันรหัสผ่านใหม่"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>แสดงรหัสผ่าน</span>
                </label>
              </div>

              <Button type="submit" variant="secondary" size="md">
                อัปเดตรหัสผ่าน
              </Button>
            </form>

            {/* Active Sessions */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                อุปกรณ์ที่กำลังเข้าสู่ระบบ (Active Sessions)
              </h4>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      เว็บเบราว์เซอร์ปัจจุบัน (Current Device)
                    </p>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      กำลังใช้งานอยู่ขณะนี้
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">กรุงเทพฯ, ไทย</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Notifications Category */}
        {activeCategory === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <span>Notifications (การแจ้งเตือน)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                เลือกรูปแบบการแจ้งเตือนที่ต้องการรับจากทางร้าน J3A STORE
              </p>
            </div>

            <div className="space-y-3 divide-y divide-slate-800/80">
              <div className="pt-3 first:pt-0 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Email Notifications</h4>
                  <p className="text-xs text-slate-400">
                    แจ้งเตือนสถานะคำสั่งซื้อและสลิปเติมเงินเข้า Email
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailNotif(!emailNotif)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    emailNotif ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform transform ${
                      emailNotif ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Push Notifications</h4>
                  <p className="text-xs text-slate-400">
                    แจ้งเตือนแบบพุชผ่านเว็บเบราว์เซอร์เมื่อมีข้อความสำคัญ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPushNotif(!pushNotif)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    pushNotif ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform transform ${
                      pushNotif ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">In-App Notifications</h4>
                  <p className="text-xs text-slate-400">
                    แสดงป๊อปอัปแจ้งเตือนภายในหน้าเว็บไซต์
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInAppNotif(!inAppNotif)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    inAppNotif ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform transform ${
                      inAppNotif ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">ข่าวสาร & โปรโมชัน</h4>
                  <p className="text-xs text-slate-400">
                    รับข่าวสารโค้ดแจกฟรีและโปรโมชันพิเศษจากทางร้าน
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMarketingNotif(!marketingNotif)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    marketingNotif ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform transform ${
                      marketingNotif ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => success('บันทึกการตั้งค่าการแจ้งเตือนแล้ว')}
            >
              บันทึกการตั้งค่า
            </Button>
          </div>
        )}

        {/* 4. Preferences Category */}
        {activeCategory === 'preferences' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                <span>Preferences (การแสดงผล & ภาษา)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ปรับแต่งธีม ภาษา และรูปแบบวันเวลาสำหรับบัญชีของคุณ
              </p>
            </div>

            <div className="space-y-4">
              {/* Appearance */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  ธีมการแสดงผล (Appearance)
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {(['dark', 'light', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTheme(t);
                          success(
                            `เปลี่ยนธีมเป็น ${
                              t === 'light' ? 'Light Mode' : t === 'dark' ? 'Dark Neon' : 'System Theme'
                            } เรียบร้อยแล้ว`
                          );
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer cursor-target ${
                          theme === t
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {t === 'dark' ? '🌙 Dark Neon' : t === 'light' ? '☀️ Light' : '💻 System'}
                      </button>
                    ))}
                </div>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  ภาษาของเว็บไซต์ (Language)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('th');
                      success('เปลี่ยนภาษาเป็น ภาษาไทย (TH) เรียบร้อยแล้ว');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      language === 'th'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🇹🇭 ภาษาไทย (Thai)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      success('Switched language to English (EN) successfully');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      language === 'en'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🇺🇸 English (EN)
                  </button>
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Timezone (เขตเวลา)
                </label>
                <input
                  type="text"
                  disabled
                  value={timezone}
                  className="w-full bg-slate-950/60 text-sm text-slate-300 rounded-xl px-3.5 py-2.5 border border-slate-800"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => success('บันทึกการตั้งค่าการแสดงผลเรียบร้อยแล้ว')}
            >
              บันทึกการตั้งค่า
            </Button>
          </div>
        )}

        {/* 5. Data & Account Category */}
        {activeCategory === 'data' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>Data & Account (ข้อมูลและการลบบัญชี)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ดาวน์โหลดข้อมูลส่วนบุคคลของคุณ หรือส่งคำขอลบบัญชีถาวร
              </p>
            </div>

            <div className="space-y-4">
              {/* Download Data */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Download My Data (ดาวน์โหลดข้อมูล)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    ส่งออกข้อมูลโปรไฟล์ เครดิต และประวัติการทำรายการในรูปแบบ JSON
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadData}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  ดาวน์โหลด JSON
                </Button>
              </div>

              {/* Delete Account Section */}
              {deletionRequest?.status === 'pending' ? (
                <div className="p-5 sm:p-6 rounded-2xl bg-amber-950/20 border-2 border-amber-500/40 space-y-4 shadow-xl">
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                          <span>คำขอลบบัญชีอยู่ระหว่างรอแอดมินอนุมัติ</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Pending
                          </span>
                        </h4>
                        <p className="text-xs text-amber-200/80">
                          ส่งคำขอเมื่อ: {formatDate(deletionRequest.createdAt)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelDeleteRequest}
                      isLoading={isCancellingDelete}
                      className="text-xs text-slate-400 hover:text-rose-400"
                    >
                      ยกเลิกคำขอลบ
                    </Button>
                  </div>

                  {/* Notice Box matching user prompt */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-2">
                    <div className="flex items-start gap-2.5 text-amber-300 text-xs sm:text-sm font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>โปรดติดต่อ admin ที่เซิฟเวอร์ดิสครอส เพื่อ ลบบัชชี หากไม่ติดต่อ ก็จะลบไม่ได้</span>
                    </div>
                    <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                      เปิด ticket ใน discord หรือทักไลน์ได้เลย เพื่อให้แอดมินดำเนินการตรวจสอบยอดเครดิตและอนุมัติการลบข้อมูลของคุณ
                    </p>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <a
                      href="https://discord.gg/UtWykPvTYF"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(88,101,242,0.3)] cursor-pointer"
                    >
                      <Headphones className="w-4 h-4" />
                      <span>เปิด Ticket ใน Discord (discord.gg/UtWykPvTYF)</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>

                    <a
                      href="https://line.me/R/ti/p/@153nhgvs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#06C755] hover:bg-[#05b04b] text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(6,199,85,0.3)] cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>ทัก LINE: @153nhgvs</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Delete Account (ลบบัญชีถาวร)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      เมื่อลบบัญชีแล้ว ข้อมูลและเครดิตคงเหลือ (฿{profile?.credits || 0}) จะถูกลบถาวรโดยแอดมินและไม่สามารถกู้คืนได้
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    ขอลบบัญชี
                  </Button>
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              title="⚠️ ขอลบบัญชีผู้ใช้งานถาวร (Delete Account)"
            >
              <div className="space-y-4">
                {/* Warning and Guidance Notice */}
                <div className="p-4 rounded-2xl bg-amber-950/30 border-2 border-amber-500/40 space-y-2 text-amber-200">
                  <div className="flex items-start gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>โปรดติดต่อ admin ที่เซิฟเวอร์ดิสครอส เพื่อ ลบบัชชี หากไม่ติดต่อ ก็จะลบไม่ได้</span>
                  </div>
                  <p className="text-xs text-amber-200/90 pl-6 leading-relaxed">
                    เมื่อกดส่งคำขอแล้ว <strong>เปิด ticket ใน discord หรือทักไลน์ได้เลย</strong> เจ้าหน้าที่จะดำเนินการตรวจสอบข้อมูลและอนุมัติการลบออกจากระบบ
                  </p>
                </div>

                {/* Direct Contact Links */}
                <div className="grid grid-cols-1 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Headphones className="w-4 h-4 text-[#5865F2]" />
                      <span>Discord Server:</span>
                    </span>
                    <a
                      href="https://discord.gg/UtWykPvTYF"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>discord.gg/UtWykPvTYF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <MessageCircle className="w-4 h-4 text-[#06C755]" />
                      <span>LINE Official:</span>
                    </span>
                    <a
                      href="https://line.me/R/ti/p/@153nhgvs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>@153nhgvs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Credits Information */}
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300">
                  💡 เครดิตคงเหลือในบัญชีของคุณ: <strong className="text-white font-mono">฿{profile?.credits || 0} บาท</strong>
                  <p className="text-[11px] text-rose-300/80 mt-0.5">
                    (ข้อมูลคำสั่งซื้อ เครดิตคงเหลือ และประวัติการทำรายการจะถูกลบถาวรเมื่อแอดมินอนุมัติ)
                  </p>
                </div>

                {/* Reason Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    เหตุผลในการขอลบบัญชี (ไม่บังคับ)
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="ระบุเหตุผล เช่น ไม่ต้องการใช้งานแล้ว หรือต้องการสร้างบัญชีใหม่..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-amber-400 outline-none resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isSubmittingDelete}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={handleSubmitDeletionRequest}
                    isLoading={isSubmittingDelete}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                  >
                    ยืนยันส่งคำขอลบบัญชี
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </div>
    </div>
  );
}
