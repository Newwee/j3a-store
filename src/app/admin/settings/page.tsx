'use client';

import React, { useState } from 'react';
import { Settings, Save, Shield, Store, QrCode, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';

export default function AdminSettingsPage() {
  const { success } = useToast();
  const [storeName, setStoreName] = useState('J3A STORE');
  const [promptpay, setPromptpay] = useState('0812345678');
  const [lineContact, setLineContact] = useState('@j3astore');
  const [discordContact, setDiscordContact] = useState('https://discord.gg/j3astore');
  const [announcement, setAnnouncement] = useState('ยินดีต้อนรับสู่ J3A STORE ระบบเติมเกมและบริการดิจิทัลอัตโนมัติ 24 ชม.');
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success('บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="ตั้งค่าระบบร้านค้า (Store Settings)"
        description="ปรับแต่งข้อมูลร้านค้า ช่องทางการติดต่อ และข้อความประกาศ"
        actionText=""
        actionHref=""
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
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

          <Input
            label="เบอร์โทรศัพท์ / เลขพร้อมเพย์รับเงิน (PromptPay)"
            value={promptpay}
            onChange={(e) => setPromptpay(e.target.value)}
            placeholder="0812345678 หรือ 13 หลัก"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="LINE Official ID"
              value={lineContact}
              onChange={(e) => setLineContact(e.target.value)}
            />
            <Input
              label="ลิงก์ Discord Server"
              value={discordContact}
              onChange={(e) => setDiscordContact(e.target.value)}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={saving}
          leftIcon={<Save className="w-5 h-5" />}
          className="shadow-[0_0_20px_rgba(6,182,212,0.35)]"
        >
          บันทึกการตั้งค่า
        </Button>
      </form>
    </div>
  );
}
