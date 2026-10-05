'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Settings, Save, Shield, Store, QrCode, MessageCircle, AlertCircle, CheckCircle2, Sparkles, Truck } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { getStoreSettings, updateStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/firestore/settings';

export default function AdminSettingsPage() {
  const { success, error } = useToast();
  const [storeName, setStoreName] = useState(DEFAULT_STORE_SETTINGS.storeName);
  const [promptpay, setPromptpay] = useState(DEFAULT_STORE_SETTINGS.promptpay);
  const [lineContact, setLineContact] = useState(DEFAULT_STORE_SETTINGS.lineContact);
  const [discordContact, setDiscordContact] = useState(DEFAULT_STORE_SETTINGS.discordContact);
  const [announcement, setAnnouncement] = useState(DEFAULT_STORE_SETTINGS.announcement);
  const [shippingFee, setShippingFee] = useState(String(DEFAULT_STORE_SETTINGS.shippingFee));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(String(DEFAULT_STORE_SETTINGS.freeShippingThreshold));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getStoreSettings();
        setStoreName(data.storeName);
        setPromptpay(data.promptpay);
        setLineContact(data.lineContact);
        setDiscordContact(data.discordContact);
        setAnnouncement(data.announcement);
        setShippingFee(String(data.shippingFee));
        setFreeShippingThreshold(String(data.freeShippingThreshold));
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
      await updateStoreSettings({
        storeName: storeName.trim(),
        promptpay: cleanPromptpay || promptpay.trim(),
        lineContact: lineContact.trim(),
        discordContact: discordContact.trim(),
        announcement: announcement.trim(),
        shippingFee: Math.max(0, Number(shippingFee) || 0),
        freeShippingThreshold: Math.max(0, Number(freeShippingThreshold) || 0),
      });
      success('บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว! เบอร์พร้อมเพย์และ QR Code อัปเดตไปยังหน้าลูกค้าทันที');
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
