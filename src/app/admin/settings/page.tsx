'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Settings, Save, Shield, Store, QrCode, MessageCircle, AlertCircle, CheckCircle2, Sparkles, Truck, Video, Play, ExternalLink, FileText, AlignLeft, Bell, Send, Loader2, Share2, Globe, Palette } from 'lucide-react';
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
  const [discordWebhookSlip, setDiscordWebhookSlip] = useState(DEFAULT_STORE_SETTINGS.discordWebhookSlip || '');
  const [discordWebhookCredits, setDiscordWebhookCredits] = useState(DEFAULT_STORE_SETTINGS.discordWebhookCredits || '');
  const [discordWebhookOrder, setDiscordWebhookOrder] = useState(DEFAULT_STORE_SETTINGS.discordWebhookOrder || '');
  const [discordWebhookWelcome, setDiscordWebhookWelcome] = useState(DEFAULT_STORE_SETTINGS.discordWebhookWelcome || '');
  const [discordRoleOwner, setDiscordRoleOwner] = useState(DEFAULT_STORE_SETTINGS.discordRoleOwner || '1555520737975205919');
  const [discordRoleAdmin, setDiscordRoleAdmin] = useState(DEFAULT_STORE_SETTINGS.discordRoleAdmin || '1555520740558897205');
  const [metaTitle, setMetaTitle] = useState(DEFAULT_STORE_SETTINGS.metaTitle || 'J3A STORE — ซอฟต์แวร์ Discord & บริการดิจิทัลอัตโนมัติ 24 ชม.');
  const [metaDescription, setMetaDescription] = useState(DEFAULT_STORE_SETTINGS.metaDescription || 'ศูนย์รวมโปรแกรม Discord AutoQuest, เครื่องมือจัดการโปรไฟล์ และบอท Discord ระดับพรีเมียม ส่งมอบ License Key ทันที ปลอดภัย 100%');
  const [metaImage, setMetaImage] = useState(DEFAULT_STORE_SETTINGS.metaImage || 'https://j3a-store.vercel.app/logo.png');
  const [themeColor, setThemeColor] = useState(DEFAULT_STORE_SETTINGS.themeColor || '#06b6d4');
  const [testingChannel, setTestingChannel] = useState<'slip' | 'credits' | 'order' | 'welcome' | null>(null);
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
        setDiscordWebhookSlip(data.discordWebhookSlip || DEFAULT_STORE_SETTINGS.discordWebhookSlip || '');
        setDiscordWebhookCredits(data.discordWebhookCredits || DEFAULT_STORE_SETTINGS.discordWebhookCredits || '');
        setDiscordWebhookOrder(data.discordWebhookOrder || DEFAULT_STORE_SETTINGS.discordWebhookOrder || '');
        setDiscordWebhookWelcome(data.discordWebhookWelcome || DEFAULT_STORE_SETTINGS.discordWebhookWelcome || '');
        setDiscordRoleOwner(data.discordRoleOwner || DEFAULT_STORE_SETTINGS.discordRoleOwner || '1555520737975205919');
        setDiscordRoleAdmin(data.discordRoleAdmin || DEFAULT_STORE_SETTINGS.discordRoleAdmin || '1555520740558897205');
        setMetaTitle(data.metaTitle || DEFAULT_STORE_SETTINGS.metaTitle || 'J3A STORE — ซอฟต์แวร์ Discord & บริการดิจิทัลอัตโนมัติ 24 ชม.');
        setMetaDescription(data.metaDescription || DEFAULT_STORE_SETTINGS.metaDescription || 'ศูนย์รวมโปรแกรม Discord AutoQuest, เครื่องมือจัดการโปรไฟล์ และบอท Discord ระดับพรีเมียม ส่งมอบ License Key ทันที ปลอดภัย 100%');
        setMetaImage(data.metaImage || DEFAULT_STORE_SETTINGS.metaImage || 'https://j3a-store.vercel.app/logo.png');
        setThemeColor(data.themeColor || DEFAULT_STORE_SETTINGS.themeColor || '#06b6d4');
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
        discordWebhookSlip: discordWebhookSlip.trim(),
        discordWebhookCredits: discordWebhookCredits.trim(),
        discordWebhookOrder: discordWebhookOrder.trim(),
        discordWebhookWelcome: discordWebhookWelcome.trim(),
        discordRoleOwner: discordRoleOwner.trim(),
        discordRoleAdmin: discordRoleAdmin.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        metaImage: metaImage.trim(),
        themeColor: themeColor.trim(),
      });
      success('บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว! ข้อมูลหน้าแรก, นโยบาย และคำอธิบายร้านค้าอัปเดตทันที');
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการบันทึก: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestDiscord = async (channelType: 'slip' | 'credits' | 'order' | 'welcome') => {
    setTestingChannel(channelType);
    try {
      const res = await fetch('/api/notifications/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test_channel',
          data: { channelType },
        }),
      });
      const data = await res.json();
      if (res.ok && data.sent) {
        success(`ส่งข้อความทดสอบไปยังห้อง Discord (${channelType}) สำเร็จแล้ว! ตรวจสอบในดิสคอร์ดได้เลย`);
      } else {
        error(`ไม่สามารถส่งการแจ้งเตือนได้: ${data.error || 'ตรวจสอบ Webhook URL'}`);
      }
    } catch (e: any) {
      error(`เกิดข้อผิดพลาด: ${e.message}`);
    } finally {
      setTestingChannel(null);
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

            {/* Discord Webhooks & Logs Notification Card */}
            <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-md space-y-5 shadow-[0_0_25px_rgba(99,102,241,0.08)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-400" />
                    <span>ระบบแจ้งเตือน Discord Webhook & Logs</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    ส่งข้อความแจ้งเตือนอัตโนมัติเข้า Discord Server (Server ID: 1555516426599665736) ทันทีที่มีกิจกรรม
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                    BOT: J3ABOT (Connected)
                  </span>
                </div>
              </div>

              {/* 1. Slip Approval Alert */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        1. สลิปโอนเงินรอการอนุมัติ (Slip Approval Alerts)
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ห้องส่วนตัว: <span className="text-amber-300 font-mono font-semibold">୨-💳-୧-⁺-˖-สลิปรออนุมัติ</span> (แท็ก Owner & Admin • แนบภาพสลิปเต็ม & ลิงก์อนุมัติทันที)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={testingChannel === 'slip'}
                    onClick={() => handleTestDiscord('slip')}
                    className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 shrink-0 cursor-pointer"
                  >
                    {testingChannel === 'slip' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span>ทดสอบส่งสลิป</span>
                  </Button>
                </div>
                <Input
                  label="Webhook URL (สลิปรออนุมัติ)"
                  value={discordWebhookSlip}
                  onChange={(e) => setDiscordWebhookSlip(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="font-mono text-xs"
                />
              </div>

              {/* 2. Topup Logs */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        2. ประวัติการเติมเงินสำเร็จ (Topup Logs)
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ห้องส่วนตัว: <span className="text-emerald-300 font-mono font-semibold">୨-💰-୧-⁺-˖-ประวัติเติมเงิน</span> (แจ้งเตือนเมื่อแอดมินอนุมัติสลิป หรือลูกค้าเติมซองอั่งเปาสำเร็จ)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={testingChannel === 'credits'}
                    onClick={() => handleTestDiscord('credits')}
                    className="text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 shrink-0 cursor-pointer"
                  >
                    {testingChannel === 'credits' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span>ทดสอบส่งห้องนี้</span>
                  </Button>
                </div>
                <Input
                  label="Webhook URL (ประวัติเติมเงิน)"
                  value={discordWebhookCredits}
                  onChange={(e) => setDiscordWebhookCredits(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="font-mono text-xs"
                />
              </div>

              {/* 3. Order Logs */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        3. รายการคำสั่งซื้อสินค้า (Order Logs)
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ห้องส่วนตัว: <span className="text-indigo-300 font-mono font-semibold">୨-🛒-୧-⁺-˖-คำสั่งซื้อ</span> (แจ้งเตือนรายการสินค้าที่ลูกค้าสั่งซื้อ, หมายเลขคำสั่งซื้อ, ยอดเงิน)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={testingChannel === 'order'}
                    onClick={() => handleTestDiscord('order')}
                    className="text-xs border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 shrink-0 cursor-pointer"
                  >
                    {testingChannel === 'order' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span>ทดสอบส่งห้องนี้</span>
                  </Button>
                </div>
                <Input
                  label="Webhook URL (รายการคำสั่งซื้อสินค้า)"
                  value={discordWebhookOrder}
                  onChange={(e) => setDiscordWebhookOrder(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="font-mono text-xs"
                />
              </div>

              {/* 4. Member Logs */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        4. สมาชิกใหม่ลงทะเบียน (Member Logs)
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ห้องส่วนตัว: <span className="text-sky-300 font-mono font-semibold">୨-👤-୧-⁺-˖-สมาชิกใหม่</span> (แจ้งเตือนเมื่อมีผู้ใช้ใหม่สมัครสมาชิกบนเว็บไซต์)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={testingChannel === 'welcome'}
                    onClick={() => handleTestDiscord('welcome')}
                    className="text-xs border-sky-500/40 text-sky-300 hover:bg-sky-500/10 shrink-0 cursor-pointer"
                  >
                    {testingChannel === 'welcome' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span>ทดสอบส่งห้องนี้</span>
                  </Button>
                </div>
                <Input
                  label="Webhook URL (สมาชิกใหม่ลงทะเบียน)"
                  value={discordWebhookWelcome}
                  onChange={(e) => setDiscordWebhookWelcome(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="font-mono text-xs"
                />
              </div>

              {/* 5. Role Mentions for Pending Slips */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      ยศที่จะได้รับการแท็กเตือนเมื่อมีสลิปใหม่ (Role Mentions for Slips)
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    บอทจะแท็กเฉพาะยศที่ระบุด้านล่างนี้ในห้อง <span className="text-amber-300 font-mono font-semibold">୨-💳-୧-⁺-˖-สลิปรออนุมัติ</span> (แทนการแท็ก @everyone)
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Discord Role ID: Owner"
                    value={discordRoleOwner}
                    onChange={(e) => setDiscordRoleOwner(e.target.value)}
                    placeholder="1555520737975205919"
                    className="font-mono text-xs"
                  />
                  <Input
                    label="Discord Role ID: Admin"
                    value={discordRoleAdmin}
                    onChange={(e) => setDiscordRoleAdmin(e.target.value)}
                    placeholder="1555520740558897205"
                    className="font-mono text-xs"
                  />
                </div>
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

            {/* Social Share & Discord Link Preview Settings */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-400" />
                  <span>การแสดงผลเมื่อแชร์ลิงก์ใน Discord & โซเชียล (Social Share / Embed)</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                  Discord Link Preview
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                กำหนดข้อความ หัวข้อ และรูปภาพที่จะแสดงในกล่องพรีวิวเมื่อนำลิงก์ร้านค้า (<span className="text-cyan-400 font-mono">https://j3a-store.vercel.app</span>) ไปแปะใน Discord หรือโซเชียลมีเดียต่างๆ
              </p>

              <div className="space-y-4 pt-2">
                <Input
                  label="หัวข้อแสดงตอนแชร์ลิงก์ (Meta Title / Embed Title)"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="J3A STORE — ซอฟต์แวร์ Discord & บริการดิจิทัลอัตโนมัติ 24 ชม."
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    คำอธิบายร้านค้าในกรอบแชร์ลิงก์ (Meta Description / Embed Description)
                  </label>
                  <textarea
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="ศูนย์รวมโปรแกรม Discord AutoQuest, เครื่องมือจัดการโปรไฟล์ และบอท Discord ระดับพรีเมียม ส่งมอบ License Key ทันที ปลอดภัย 100%"
                    className="w-full bg-slate-950/70 text-sm text-slate-100 placeholder:text-slate-600 rounded-xl px-4 py-3 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    * ข้อความที่จะแสดงใต้ชื่อเรื่องในกล่อง Discord Embed
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="ลิงก์รูปภาพในกล่องแชร์ (Meta Image URL)"
                    value={metaImage}
                    onChange={(e) => setMetaImage(e.target.value)}
                    placeholder="https://j3a-store.vercel.app/logo.png"
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      สีแถบข้าง Discord Embed (Theme Color Hex)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColor.startsWith('#') && themeColor.length === 7 ? themeColor : '#06b6d4'}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700 p-0.5"
                      />
                      <input
                        type="text"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        placeholder="#06b6d4"
                        className="flex-1 bg-slate-950/70 text-sm text-slate-100 font-mono rounded-xl px-3 py-2 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    วิธีทดสอบใน Discord หลังกดบันทึก:
                  </p>
                  <p className="text-slate-300">
                    เนื่องจาก Discord ทำการจำแคช (Cache) ลิงก์ที่เคยส่งไปแล้ว หากกดบันทึกแล้วลองส่งลิงก์เดิมในห้องแชทแล้วไม่เปลี่ยน ให้ลองส่งโดยเติมพารามิเตอร์ต่อท้าย เช่น <code className="bg-black/50 px-1.5 py-0.5 rounded text-cyan-300 font-mono">https://j3a-store.vercel.app/?v=2</code> เพื่อบังคับให้ Discord ดึงข้อมูลพรีวิวชุดใหม่ทันที!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Previews */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live PromptPay QR Preview */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4 text-center">
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

            {/* Live Discord Link Preview */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  ตัวอย่างการแสดงผลใน Discord
                </h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Live Preview
                </span>
              </div>

              <div className="bg-[#1e1f22] p-3.5 rounded-xl border border-slate-800/80 text-left space-y-2.5 font-sans">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow">
                    JA
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-xs font-semibold">J3A Admin</span>
                      <span className="text-[10px] text-slate-400">วันนี้ เวลา 12:00</span>
                    </div>
                    <p className="text-xs text-[#00a8fc] hover:underline break-all">
                      https://j3a-store.vercel.app
                    </p>
                  </div>
                </div>

                {/* Discord Embed Box */}
                <div
                  className="rounded-lg p-3 bg-[#2b2d31] border-l-4 space-y-1.5 transition-all"
                  style={{ borderLeftColor: themeColor || '#06b6d4' }}
                >
                  <div className="text-[10px] text-[#b5bac1] font-medium uppercase tracking-wider">
                    {storeName || 'J3A STORE'}
                  </div>
                  <div className="text-xs font-bold text-[#00a8fc] leading-snug line-clamp-2">
                    {metaTitle || 'J3A STORE — ซอฟต์แวร์ Discord & บริการดิจิทัลอัตโนมัติ 24 ชม.'}
                  </div>
                  <p className="text-[11px] text-[#dbdee1] leading-relaxed line-clamp-3">
                    {metaDescription || 'ศูนย์รวมโปรแกรม Discord AutoQuest, เครื่องมือจัดการโปรไฟล์ และบอท Discord ระดับพรีเมียม ส่งมอบ License Key ทันที ปลอดภัย 100%'}
                  </p>

                  {metaImage && (
                    <div className="pt-2">
                      <div className="relative w-full h-28 rounded-md overflow-hidden bg-black/40 border border-slate-700/60 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={metaImage}
                          alt="Discord Embed Preview"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-normal">
                จำลองกล่องข้อความเมื่อมีคนแชร์ลิงก์ร้านค้าในเซิร์ฟเวอร์ Discord
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
