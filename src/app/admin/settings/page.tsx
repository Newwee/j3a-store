'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Settings, Save, Shield, Store, QrCode, MessageCircle, AlertCircle, CheckCircle2, Sparkles, Truck, Video, Play, ExternalLink, FileText, AlignLeft } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { getStoreSettings, updateStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/firestore/settings';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/utils/youtube';

export default function AdminSettingsPage() {
  const { success, error } = useToast();
  const [storeName, setStoreName] = useState(DEFAULT_STORE_SETTINGS.storeName);
  const [promptpay, setPromptpay] = useState(DEFAULT_STORE_SETTINGS.promptpay);
  const [truemoneyPhone, setTruemoneyPhone] = useState(DEFAULT_STORE_SETTINGS.truemoneyPhone || '0983892996');
  const [lineContact, setLineContact] = useState(DEFAULT_STORE_SETTINGS.lineContact);
  const [discordContact, setDiscordContact] = useState(DEFAULT_STORE_SETTINGS.discordContact);
  const [announcement, setAnnouncement] = useState(DEFAULT_STORE_SETTINGS.announcement);
  const [shippingFee, setShippingFee] = useState(String(DEFAULT_STORE_SETTINGS.shippingFee));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(String(DEFAULT_STORE_SETTINGS.freeShippingThreshold));
  const [showcaseYoutubeUrl, setShowcaseYoutubeUrl] = useState(DEFAULT_STORE_SETTINGS.showcaseYoutubeUrl || '');
  const [showcaseTitle, setShowcaseTitle] = useState(DEFAULT_STORE_SETTINGS.showcaseTitle || 'วิธีใช้งานร้านค้า J3A STORE');
  const [showcaseSubtitle, setShowcaseSubtitle] = useState(DEFAULT_STORE_SETTINGS.showcaseSubtitle || 'ชมวิดีโอแนะนำขั้นตอนการสั่งซื้อ เติมเงิน และรับสินค้าแบบอัตโนมัติ');
  const [heroTagline, setHeroTagline] = useState(DEFAULT_STORE_SETTINGS.heroTagline || 'Next-Gen E-Commerce & Digital Store');
  const [heroDescription, setHeroDescription] = useState(DEFAULT_STORE_SETTINGS.heroDescription || 'สัมผัสประสบการณ์ช้อปปิ้งยุคใหม่ที่ J3A STORE ศูนย์รวมไอเทมเกม บัตรเติมเงิน และบริการดิจิทัลระดับพรีเมียม ทำรายการรวดเร็ว ปลอดภัย ด้วยระบบตรวจสอบอัตโนมัติ');
  const [privacyPolicy, setPrivacyPolicy] = useState(DEFAULT_STORE_SETTINGS.privacyPolicy || '');
  const [footerDescription, setFooterDescription] = useState(DEFAULT_STORE_SETTINGS.footerDescription || 'แพลตฟอร์มศูนย์รวมสินค้าและบริการดิจิทัลชั้นนำ เติมเกม ไอดีเกม บัตรเติมเงิน และอุปกรณ์ระดับพรีเมียม ระบบอัตโนมัติ รวดเร็ว ปลอดภัย 100% พร้อมบริการตลอด 24 ชั่วโมง');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getStoreSettings();
        setStoreName(data.storeName);
        setPromptpay(data.promptpay);
        setTruemoneyPhone(data.truemoneyPhone || data.promptpay || '0983892996');
        setLineContact(data.lineContact);
        setDiscordContact(data.discordContact);
        setAnnouncement(data.announcement);
        setShippingFee(String(data.shippingFee));
        setFreeShippingThreshold(String(data.freeShippingThreshold));
        setShowcaseYoutubeUrl(data.showcaseYoutubeUrl || '');
        setShowcaseTitle(data.showcaseTitle || 'วิธีใช้งานร้านค้า J3A STORE');
        setShowcaseSubtitle(data.showcaseSubtitle || 'ชมวิดีโอแนะนำขั้นตอนการสั่งซื้อ เติมเงิน และรับสินค้าแบบอัตโนมัติ');
        setHeroTagline(data.heroTagline || DEFAULT_STORE_SETTINGS.heroTagline || 'Next-Gen E-Commerce & Digital Store');
        setHeroDescription(data.heroDescription || DEFAULT_STORE_SETTINGS.heroDescription || '');
        setPrivacyPolicy(data.privacyPolicy || DEFAULT_STORE_SETTINGS.privacyPolicy || '');
        setFooterDescription(data.footerDescription || DEFAULT_STORE_SETTINGS.footerDescription || '');
      } catch (err: any) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanPromptpay = promptpay.trim().replace(/[^0-9]/g, '');
      const cleanTruemoneyPhone = truemoneyPhone.trim().replace(/[^0-9]/g, '');
      await updateStoreSettings({
        storeName: storeName.trim(),
        promptpay: cleanPromptpay || promptpay.trim(),
        truemoneyPhone: cleanTruemoneyPhone || cleanPromptpay || '0983892996',
        lineContact: lineContact.trim(),
        discordContact: discordContact.trim(),
        announcement: announcement.trim(),
        shippingFee: Math.max(0, Number(shippingFee) || 0),
        freeShippingThreshold: Math.max(0, Number(freeShippingThreshold) || 0),
        showcaseYoutubeUrl: showcaseYoutubeUrl.trim(),
        showcaseTitle: showcaseTitle.trim(),
        showcaseSubtitle: showcaseSubtitle.trim(),
        heroTagline: heroTagline.trim(),
        heroDescription: heroDescription.trim(),
        privacyPolicy: privacyPolicy.trim(),
        footerDescription: footerDescription.trim(),
      });
      success('บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว! ข้อมูลหน้าแรก, นโยบาย และคำอธิบายร้านค้าอัปเดตทันที');
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการบันทึก: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setSaving(false);
    }
  };

  const cleanNumber = promptpay.trim().replace(/[^0-9]/g, '');
  const previewQrUrl = cleanNumber
    ? `https://promptpay.io/${cleanNumber}/100.png`
    : `https://promptpay.io/0812345678/100.png`;

  const detectedVideoId = extractYouTubeVideoId(showcaseYoutubeUrl);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="ตั้งค่าระบบร้านค้า (Store Settings)"
        description="ปรับแต่งข้อมูลร้านค้า เลขพร้อมเพย์รับเงิน และ QR Code สำหรับหน้าลูกค้า"
        actionText=""
        actionHref=""
      />

      {/* Info notice */}
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm flex items-center gap-3">
        <Sparkles className="w-5 h-5 shrink-0 text-cyan-400" />
        <span>
          <strong>ระบบเชื่อมต่อแบบ Real-time:</strong> เมื่อคุณแก้ไขเบอร์พร้อมเพย์หรือชื่อร้านที่นี่ แล้วกด <strong>"บันทึกการตั้งค่า"</strong> ระบบจะอัปเดตลงฐานข้อมูลระบบ และหน้าเติมเงินของลูกค้า (`/profile`) รวมถึงหน้าชำระเงิน (`/checkout`) จะเปลี่ยน QR Code เป็นเบอร์ใหม่ทันที
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Input Form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Store Brand Settings */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-cyan-400" />
                <span>ข้อมูลร้านค้า (General Store Info)</span>
              </h2>

              <Input
                label="ชื่อร้านค้า (Store Name)"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="J3A STORE"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  ข้อความประกาศหัวเว็บ (Announcement Banner)
                </label>
                <textarea
                  rows={2}
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full bg-slate-950/80 text-sm text-slate-100 rounded-xl p-3 border border-slate-700/80 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Payment & Contact Info */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <span>ช่องทางการชำระเงิน & การติดต่อ</span>
              </h2>

              <div className="space-y-1">
                <Input
                  label="เบอร์โทรศัพท์ / เลขพร้อมเพย์รับเงิน (PromptPay Number)"
                  value={promptpay}
                  onChange={(e) => setPromptpay(e.target.value)}
                  placeholder="0812345678 หรือ เลขประจำตัวประชาชน 13 หลัก"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  * เลขนี้จะถูกนำไปสร้าง PromptPay QR Code อัตโนมัติในหน้าเติมเงินของลูกค้า
                </p>
              </div>

              <div className="space-y-1">
                <Input
                  label="เบอร์ TrueMoney Wallet สำหรับรับเงินซองของขวัญ (Angpao Receiver Phone)"
                  value={truemoneyPhone}
                  onChange={(e) => setTruemoneyPhone(e.target.value)}
                  placeholder="08xxxxxxxx หรือ 09xxxxxxxx"
                  required
                />
                <p className="text-[11px] text-rose-400/90">
                  * เมื่อลูกค้าส่งลิงก์ซองของขวัญ TrueMoney ในหน้าเติมเงิน ระบบจะตัดยอดเงินเข้าเบอร์นี้ทันทีอัตโนมัติ 24 ชม. (ฟรี 0% ไม่มีค่าธรรมเนียม)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="LINE Official ID"
                  value={lineContact}
                  onChange={(e) => setLineContact(e.target.value)}
                  placeholder="@153nhgvs"
                />
                <Input
                  label="ลิงก์ Discord Server"
                  value={discordContact}
                  onChange={(e) => setDiscordContact(e.target.value)}
                  placeholder="https://discord.gg/UtWykPvTYF"
                />
              </div>
            </div>

            {/* Shipping Fee Settings */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                <span>ค่าจัดส่ง / ค่าบริการ (Shipping Fee)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    label="ค่าจัดส่งมาตรฐาน (บาท)"
                    type="number"
                    min="0"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400">
                    * ตั้ง <strong className="text-white">0</strong> = ฟรีค่าจัดส่งเสมอ (แนะนำสำหรับสินค้าดิจิทัล)
                  </p>
                </div>
                <div className="space-y-1">
                  <Input
                    label="ยอดซื้อขั้นต่ำสำหรับฟรีค่าจัดส่ง (บาท)"
                    type="number"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400">
                    * ตั้ง <strong className="text-white">0</strong> = ฟรีเสมอโดยไม่ต้องถึงยอดขั้นต่ำ
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>📦 ตัวอย่างการตั้งค่า:</p>
                <p>• <strong className="text-white">ฟรีเสมอ</strong>: ค่าจัดส่ง = 0, ขั้นต่ำ = 0</p>
                <p>• <strong className="text-white">ค่าจัดส่ง 50฿ ฟรีถ้าซื้อเกิน 500฿</strong>: ค่าจัดส่ง = 50, ขั้นต่ำ = 500</p>
              </div>
            </div>

            {/* YouTube Showcase Settings */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-rose-400" />
                  <span>วิดีโอแนะนำร้านค้าหน้าแรก (Hero YouTube Showcase)</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  CardSwap • Loop 5s
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                วิดีโอนี้จะแสดงในการ์ดหน้าแรกที่สลับกับโลโก้ J3A STORE อัตโนมัติทุก 5 วินาที เพื่อแนะนำวิธีการสั่งซื้อและการใช้งานให้แก่ลูกค้า
              </p>

              <div className="space-y-4">
                <Input
                  label="ชื่อหัวข้อวิดีโอ (Showcase Title)"
                  value={showcaseTitle}
                  onChange={(e) => setShowcaseTitle(e.target.value)}
                  placeholder="วิธีใช้งานร้านค้า J3A STORE"
                  required
                />

                <Input
                  label="คำอธิบายย่อย (Showcase Subtitle)"
                  value={showcaseSubtitle}
                  onChange={(e) => setShowcaseSubtitle(e.target.value)}
                  placeholder="ชมวิดีโอแนะนำขั้นตอนการสั่งซื้อ เติมเงิน และรับสินค้าแบบอัตโนมัติ 24 ชม."
                />

                <div className="space-y-1.5">
                  <Input
                    label="ลิงก์ YouTube (YouTube Video URL)"
                    value={showcaseYoutubeUrl}
                    onChange={(e) => setShowcaseYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                  />
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-1">
                    <span className="text-slate-400">
                      รองรับ: youtube.com/watch?v=..., youtu.be/..., shorts/... หรือใส่ Video ID 11 หลัก
                    </span>
                    {detectedVideoId ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ตรวจพบ Video ID: <code>{detectedVideoId}</code>
                      </span>
                    ) : showcaseYoutubeUrl.trim() ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> ไม่พบ Video ID ที่ถูกต้อง
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        (หากเว้นว่างไว้ จะใช้วิดีโอแนะนำตัวอย่างเริ่มต้น)
                      </span>
                    )}
                  </div>
                </div>

                {/* Live YouTube Preview inside Settings */}
                {detectedVideoId && (
                  <div className="pt-2 space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      ตัวอย่างวิดีโอที่จะแสดงบนหน้าแรก (Live Preview):
                    </label>
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-rose-500/30 bg-black shadow-[0_0_25px_rgba(244,63,94,0.15)]">
                      <iframe
                        src={getYouTubeEmbedUrl(detectedVideoId) || ''}
                        title="YouTube Showcase Preview"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Homepage & Footer Content Settings (รูป 1 และ รูป 3) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <AlignLeft className="w-5 h-5 text-cyan-400" />
                  <span>ข้อความหน้าแรกและคำอธิบายท้ายเว็บ (Homepage & Footer)</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  รูป 1 & รูป 3
                </span>
              </div>

              <div className="space-y-4">
                <Input
                  label="แท็กหัวข้อ Hero Section (รูป 1 - Tagline Badge)"
                  value={heroTagline}
                  onChange={(e) => setHeroTagline(e.target.value)}
                  placeholder="NEXT-GEN E-COMMERCE & DIGITAL STORE"
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    คำอธิบายร้านค้าใน Hero Section (รูป 1 - Hero Description)
                  </label>
                  <textarea
                    rows={3}
                    value={heroDescription}
                    onChange={(e) => setHeroDescription(e.target.value)}
                    placeholder="สัมผัสประสบการณ์ช้อปปิ้งยุคใหม่ที่ J3A STORE ศูนย์รวมไอเทมเกม บัตรเติมเงิน และบริการดิจิทัลระดับพรีเมียม ทำรายการรวดเร็ว ปลอดภัย ด้วยระบบตรวจสอบอัตโนมัติ"
                    className="w-full bg-slate-950/70 text-sm text-slate-100 placeholder:text-slate-600 rounded-xl px-4 py-3 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    * ข้อความนี้จะแสดงอยู่ใต้หัวข้อ J3A STORE ในหน้าแรก
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    คำอธิบายร้านค้าท้ายเว็บ (รูป 3 - Footer Description)
                  </label>
                  <textarea
                    rows={3}
                    value={footerDescription}
                    onChange={(e) => setFooterDescription(e.target.value)}
                    placeholder="แพลตฟอร์มศูนย์รวมสินค้าและบริการดิจิทัลชั้นนำ เติมเกม ไอดีเกม บัตรเติมเงิน และอุปกรณ์ระดับพรีเมียม ระบบอัตโนมัติ รวดเร็ว ปลอดภัย 100% พร้อมบริการตลอด 24 ชั่วโมง"
                    className="w-full bg-slate-950/70 text-sm text-slate-100 placeholder:text-slate-600 rounded-xl px-4 py-3 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    * ข้อความนี้จะแสดงในส่วนล่างสุดของทุกหน้า (Footer)
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Policy Content Settings (รูป 2) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>เนื้อหานโยบายความเป็นส่วนตัว (Privacy Policy)</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  รูป 2
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  เนื้อหาในหน้า นโยบายความเป็นส่วนตัว (/privacy)
                </label>
                <textarea
                  rows={8}
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                  placeholder="1. ข้อมูลที่เราเก็บรวบรวม..."
                  className="w-full bg-slate-950/70 text-sm text-slate-100 placeholder:text-slate-600 rounded-xl px-4 py-3 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400">
                  * ข้อความนี้จะนำไปแสดงในหน้า <code>/privacy</code> ลูกค้าสามารถเข้าอ่านได้ตลอดเวลา
                </p>
              </div>
            </div>
          </div>

          {/* Right: Live PromptPay QR Preview */}
          <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4 text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              ตัวอย่าง QR Code ที่ลูกค้าจะเห็น
            </h3>

            <div className="bg-white p-3 rounded-2xl inline-block shadow-xl mx-auto border-2 border-slate-700">
              <div className="relative w-44 h-44 mx-auto">
                <Image
                  src={previewQrUrl}
                  alt="PromptPay QR Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-left text-xs space-y-1.5">
              <p className="text-slate-400">
                ชื่อบัญชี: <strong className="text-white">{storeName || 'J3A STORE'}</strong>
              </p>
              <p className="text-slate-400">
                เลขพร้อมเพย์: <strong className="text-cyan-300 font-mono">{cleanNumber || '0812345678'}</strong>
              </p>
              <p className="text-[10px] text-slate-500">
                (ตัวอย่างจำลองยอด 100 บาท)
              </p>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={saving}
          disabled={loading || saving}
          leftIcon={<Save className="w-5 h-5" />}
          className="shadow-[0_0_20px_rgba(6,182,212,0.35)]"
        >
          บันทึกการตั้งค่า
        </Button>
      </form>
    </div>
  );
}
