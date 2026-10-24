'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  Megaphone,
  Plus,
  Eye,
  Trash2,
  Edit2,
  CheckCircle2,
  Upload,
  Ticket,
  Link as LinkIcon,
  Clock,
  Sparkles,
  AlertTriangle,
  Layers,
  Save,
  X,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { SitePopup, SiteAnnouncement } from '@/types/marketing';
import {
  getPopups,
  savePopup,
  deletePopup,
  getAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
} from '@/lib/firestore/marketing';
import { SitePopupModal } from '@/components/marketing/SitePopupModal';
import { uploadProductImage } from '@/lib/storage/upload';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';

export default function AdminAnnouncementsPage() {
  const [activeTab, setActiveTab] = useState<'popups' | 'announcements' | 'campaigns'>('popups');
  const [popups, setPopups] = useState<SitePopup[]>([]);
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'popup' | 'announcement';
    id: string;
    title?: string;
  } | null>(null);

  // Popup Form State
  const [isEditingPopup, setIsEditingPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<Partial<SitePopup>>({
    title: '',
    description: '',
    type: 'welcome',
    imageUrl: '',
    ctaText: 'เลือกซื้อสินค้า',
    ctaLink: '/shop',
    discountCode: '',
    frequency: 'once',
    audience: 'all',
    priority: 'normal',
    isActive: true,
  });
  const [previewPopup, setPreviewPopup] = useState<SitePopup | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Announcement Form State
  const [isEditingAnn, setIsEditingAnn] = useState(false);
  const [currentAnn, setCurrentAnn] = useState<Partial<SiteAnnouncement>>({
    title: '',
    content: '',
    category: 'news',
    isPinned: false,
    active: true,
  });

  const loadData = async () => {
    try {
      const [pList, aList] = await Promise.all([getPopups(), getAnnouncements()]);
      setPopups(pList);
      setAnnouncements(aList);
    } catch (e) {
      console.error('Failed to load marketing data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Image Upload for Popup
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingImage(true);
      try {
        const res = await uploadProductImage(file, 'popups');
        setCurrentPopup((prev) => ({ ...prev, imageUrl: res.downloadUrl }));
      } catch (err) {
        console.warn('Storage upload fallback to base64 data URL:', err);
        const reader = new FileReader();
        reader.onload = () => {
          setCurrentPopup((prev) => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleSavePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPopup.title?.trim() || !currentPopup.description?.trim()) {
      alert('กรุณากรอกหัวข้อและรายละเอียดป๊อปอัปให้ครบถ้วน');
      return;
    }

    const payload: SitePopup = {
      id: currentPopup.id || `popup_${Date.now()}`,
      title: currentPopup.title.trim(),
      description: currentPopup.description.trim(),
      type: currentPopup.type || 'welcome',
      imageUrl: currentPopup.imageUrl || undefined,
      ctaText: currentPopup.ctaText || undefined,
      ctaLink: currentPopup.ctaLink || undefined,
      discountCode: currentPopup.discountCode || undefined,
      frequency: currentPopup.frequency || 'once',
      audience: currentPopup.audience || 'all',
      priority: currentPopup.priority || 'normal',
      isActive: currentPopup.isActive ?? true,
      createdAt: currentPopup.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await savePopup(payload);
    setIsEditingPopup(false);
    loadData();
  };

  const handleDeletePopup = (id: string, title?: string) => {
    setDeleteTarget({ type: 'popup', id, title });
  };

  const handleTogglePopupActive = async (p: SitePopup) => {
    await savePopup({ ...p, isActive: !p.isActive });
    loadData();
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnn.title?.trim() || !currentAnn.content?.trim()) {
      alert('กรุณากรอกหัวข้อและเนื้อหาประกาศ');
      return;
    }

    const payload: SiteAnnouncement = {
      id: currentAnn.id || `ann_${Date.now()}`,
      title: currentAnn.title.trim(),
      content: currentAnn.content.trim(),
      category: currentAnn.category || 'news',
      isPinned: currentAnn.isPinned || false,
      publishedAt: new Date().toISOString(),
      active: currentAnn.active ?? true,
    };

    await saveAnnouncement(payload);
    setIsEditingAnn(false);
    loadData();
  };

  const handleDeleteAnn = (id: string, title?: string) => {
    setDeleteTarget({ type: 'announcement', id, title });
  };

  const executeDeleteTarget = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'popup') {
      await deletePopup(deleteTarget.id);
    } else {
      await deleteAnnouncement(deleteTarget.id);
    }
    setDeleteTarget(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="จัดการประกาศ & แคมเปญ (Announcements & Pop-ups)"
        description="สร้างป๊อปอัปต้อนรับ แนะนำโค้ดส่วนลด ข่าวสารประจำวัน และแจ้งเตือนปิดปรับปรุงระบบ"
      />

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('popups')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'popups'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Pop-up Manager (จัดการป๊อปอัป)</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'announcements'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcements (ข่าวสาร & ประกาศ)</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'campaigns'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Campaigns (แคมเปญโปรโมชัน)</span>
        </button>
      </div>

      {/* ==================== TAB 1: POP-UP MANAGER ==================== */}
      {activeTab === 'popups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>รายการป๊อปอัปทั้งหมด ({popups.length})</span>
            </h2>

            {!isEditingPopup && (
              <Button
                variant="neon"
                size="sm"
                onClick={() => {
                  setCurrentPopup({
                    title: '',
                    description: '',
                    type: 'welcome',
                    imageUrl: '',
                    ctaText: 'เลือกซื้อสินค้าเลย',
                    ctaLink: '/shop',
                    discountCode: '',
                    frequency: 'once',
                    audience: 'all',
                    priority: 'normal',
                    isActive: true,
                  });
                  setIsEditingPopup(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
                className="text-xs"
              >
                สร้างป๊อปอัปใหม่
              </Button>
            )}
          </div>

          {/* Edit/Create Popup Form Modal/Inline */}
          {isEditingPopup && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{currentPopup.id ? 'แก้ไขป๊อปอัป' : 'สร้างป๊อปอัปใหม่'}</span>
                </h3>
                <button
                  onClick={() => setIsEditingPopup(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePopup} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Title */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-300">หัวข้อป๊อปอัป (Title) *</label>
                    <input
                      type="text"
                      required
                      value={currentPopup.title || ''}
                      onChange={(e) => setCurrentPopup({ ...currentPopup, title: e.target.value })}
                      placeholder="เช่น ยินดีต้อนรับสู่ J3A STORE รับส่วนลดทันที!"
                      className="w-full bg-slate-950 text-sm text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-300">เนื้อหา / คำอธิบาย (Description) *</label>
                    <textarea
                      required
                      rows={3}
                      value={currentPopup.description || ''}
                      onChange={(e) => setCurrentPopup({ ...currentPopup, description: e.target.value })}
                      placeholder="ระบุข้อความต้อนรับหรือรายละเอียดกิจกรรมโปรโมชัน..."
                      className="w-full bg-slate-950 text-sm text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none resize-none"
                    />
                  </div>

                  {/* Image / Banner URL & File Upload */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <span>ภาพแบนเนอร์ป๊อปอัป (Image / Banner)</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        (อัปโหลดไฟล์หรือวาง URL ภาพ)
                      </span>
                    </label>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="url"
                        value={currentPopup.imageUrl || ''}
                        onChange={(e) => setCurrentPopup({ ...currentPopup, imageUrl: e.target.value })}
                        placeholder="https://... หรืออัปโหลดไฟล์จากเครื่อง"
                        className="flex-1 bg-slate-950 text-xs text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                      />

                      <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer flex items-center justify-center gap-2 transition-colors shrink-0">
                        <Upload className="w-4 h-4 text-cyan-400" />
                        <span>{isUploadingImage ? 'กำลังอัปโหลด...' : 'เลือกรูปจากเครื่อง'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {currentPopup.imageUrl && (
                      <div className="relative w-full max-w-sm h-32 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden mt-2">
                        <SafeImage
                          src={currentPopup.imageUrl}
                          fallbackSrc="/welcome-banner.png"
                          alt="Banner Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ประเภทป๊อปอัป (Type)</label>
                    <select
                      value={currentPopup.type || 'welcome'}
                      onChange={(e) => setCurrentPopup({ ...currentPopup, type: e.target.value as any })}
                      className="w-full bg-slate-950 text-xs text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                    >
                      <option value="welcome">ต้อนรับสมาชิกใหม่ (Welcome)</option>
                      <option value="promo">โปรโมชันพิเศษ (Promo)</option>
                      <option value="news">ข่าวสารประจำวัน (Daily News)</option>
                      <option value="maintenance">แจ้งปิดปรับปรุง (Maintenance)</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ลำดับความสำคัญ (Priority)</label>
                    <select
                      value={currentPopup.priority || 'normal'}
                      onChange={(e) => setCurrentPopup({ ...currentPopup, priority: e.target.value as any })}
                      className="w-full bg-slate-950 text-xs text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                    >
                      <option value="normal">ปกติ (Normal)</option>
                      <option value="high">สูง (High)</option>
                      <option value="urgent">ฉุกเฉิน / สำคัญมาก (Urgent)</option>
                    </select>
                  </div>

                  {/* Frequency Cap */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ความถี่ในการแสดง (Frequency)</label>
                    <select
                      value={currentPopup.frequency || 'once'}
                      onChange={(e) => setCurrentPopup({ ...currentPopup, frequency: e.target.value as any })}
                      className="w-full bg-slate-950 text-xs text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                    >
                      <option value="once">แสดงครั้งแรกเท่านั้น (Once per User)</option>
                      <option value="daily">แสดงวันละ 1 ครั้ง (Once per Day)</option>
                      <option value="always">แสดงทุกเซสชัน (Every Session)</option>
                    </select>
                  </div>

                  {/* Discount Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">โค้ดส่วนลดที่แจก (Discount Code)</label>
                    <input
                      type="text"
                      value={currentPopup.discountCode || ''}
                      onChange={(e) => setCurrentPopup({ ...currentPopup, discountCode: e.target.value.toUpperCase() })}
                      placeholder="เช่น WELCOME10 (เว้นว่างได้)"
                      className="w-full bg-slate-950 text-xs font-mono text-cyan-300 rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none uppercase"
                    />
                  </div>

                  {/* CTA Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ข้อความบนปุ่ม (CTA Text)</label>
                    <input
                      type="text"
                      value={currentPopup.ctaText || ''}
                      onChange={(e) => setCurrentPopup({ ...currentPopup, ctaText: e.target.value })}
                      placeholder="เช่น เลือกซื้อสินค้า, รับโค้ดเลย"
                      className="w-full bg-slate-950 text-xs text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                    />
                  </div>

                  {/* CTA Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ลิ้งค์ปลายทางของปุ่ม (CTA Link)</label>
                    <input
                      type="text"
                      value={currentPopup.ctaLink || ''}
                      onChange={(e) => setCurrentPopup({ ...currentPopup, ctaLink: e.target.value })}
                      placeholder="/shop หรือ /cart"
                      className="w-full bg-slate-950 text-xs text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewPopup(currentPopup as SitePopup)}
                    leftIcon={<Eye className="w-4 h-4 text-cyan-400" />}
                    className="text-xs"
                  >
                    ดูตัวอย่างป๊อปอัปจริง (Live Preview)
                  </Button>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingPopup(false)}
                      className="text-xs"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      variant="neon"
                      size="sm"
                      leftIcon={<Save className="w-4 h-4" />}
                      className="text-xs"
                    >
                      บันทึกป๊อปอัป
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Popups List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {popups.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  {/* Status & Priority Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        p.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {p.isActive ? '● กำลังแสดง (Active)' : '○ ปิดการแสดง (Inactive)'}
                    </span>

                    <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase">
                      {p.type}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  {p.imageUrl && (
                    <div className="relative w-full h-32 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                      <SafeImage src={p.imageUrl} fallbackSrc="/welcome-banner.png" alt={p.title} fill className="object-cover" unoptimized />
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-white line-clamp-2">{p.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{p.description}</p>

                  {p.discountCode && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{p.discountCode}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewPopup(p)}
                      title="ดูตัวอย่าง"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 font-semibold px-2 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูตัวอย่าง</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPopup(p);
                        setIsEditingPopup(true);
                      }}
                      title="แก้ไข"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePopupActive(p)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        p.isActive
                          ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      {p.isActive ? 'ปิด' : 'เปิดใช้งาน'}
                    </button>

                    <button
                      onClick={() => handleDeletePopup(p.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: ANNOUNCEMENTS ==================== */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              ข่าวสารและประกาศประจำวัน ({announcements.length})
            </h2>

            {!isEditingAnn && (
              <Button
                variant="neon"
                size="sm"
                onClick={() => {
                  setCurrentAnn({
                    title: '',
                    content: '',
                    category: 'news',
                    isPinned: false,
                    active: true,
                  });
                  setIsEditingAnn(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
                className="text-xs"
              >
                เพิ่มประกาศใหม่
              </Button>
            )}
          </div>

          {/* Form */}
          {isEditingAnn && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-white">สร้างประกาศใหม่</h3>
              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="หัวข้อข่าวสารหรือประกาศ..."
                  value={currentAnn.title || ''}
                  onChange={(e) => setCurrentAnn({ ...currentAnn, title: e.target.value })}
                  className="w-full bg-slate-950 text-sm text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
                />

                <textarea
                  required
                  rows={3}
                  placeholder="เนื้อหาข่าวสาร / รายละเอียด..."
                  value={currentAnn.content || ''}
                  onChange={(e) => setCurrentAnn({ ...currentAnn, content: e.target.value })}
                  className="w-full bg-slate-950 text-sm text-white rounded-xl px-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none resize-none"
                />

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentAnn.isPinned || false}
                      onChange={(e) => setCurrentAnn({ ...currentAnn, isPinned: e.target.checked })}
                      className="accent-cyan-500 rounded"
                    />
                    <span>ปักหมุดข่าวเด่น (Pinned)</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingAnn(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" variant="neon" size="sm">
                    บันทึกประกาศ
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Announcements List */}
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        📌 PINNED
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white">{ann.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300">{ann.content}</p>
                </div>

                <button
                  onClick={() => handleDeleteAnn(ann.id)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: CAMPAIGNS ==================== */}
      {activeTab === 'campaigns' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">แคมเปญโปรโมชัน & โค้ดส่วนลด</h3>
              <p className="text-xs text-slate-400">
                คุณสามารถจัดการโค้ดของขวัญและโปรโมชันแคมเปญได้ที่เมนูโค้ดของขวัญหลัก
              </p>
            </div>
          </div>
          <div className="pt-2">
            <a href="/admin/codes">
              <Button variant="neon" size="sm">
                ไปยังหน้าจัดการโค้ดของขวัญ (Redeem Codes)
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewPopup && (
        <SitePopupModal forcePopup={previewPopup} onClosePreview={() => setPreviewPopup(null)} />
      )}

      {/* Modern Cyberpunk Confirmation Panel for Marketing Deletions */}
      <AdminConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDeleteTarget}
        title={deleteTarget?.type === 'popup' ? 'ยืนยันการลบป๊อปอัปแจ้งเตือน' : 'ยืนยันการลบประกาศ'}
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบ${deleteTarget?.type === 'popup' ? 'ป๊อปอัป' : 'ประกาศ'} "${deleteTarget?.title || deleteTarget?.id}" ออกจากระบบ?`}
        confirmText="ยืนยันลบรายการ"
        cancelText="ยกเลิก"
        variant="danger"
      />
    </div>
  );
}
