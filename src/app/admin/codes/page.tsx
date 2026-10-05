'use client';

import React, { useEffect, useState } from 'react';
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Users,
  Coins,
  ShieldCheck,
  RefreshCw,
  Search,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  getAllRedeemCodes,
  createRedeemCode,
  updateRedeemCode,
  deleteRedeemCode,
  seedOpeningCodeIfNotExists,
  RedeemCode,
} from '@/lib/firestore/redeem';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

export default function AdminCodesPage() {
  const { success, error, toast } = useToast();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [codeName, setCodeName] = useState('');
  const [amount, setAmount] = useState('20');
  const [maxUses, setMaxUses] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCodes = async () => {
    setIsLoading(true);
    try {
      // Auto seed J3AOPENING if first time
      await seedOpeningCodeIfNotExists();
      const data = await getAllRedeemCodes();
      setCodes(data);
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการโหลดโค้ด: ${err.message || 'ไม่สามารถโหลดข้อมูลได้'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast(`คัดลอกโค้ด "${code}" แล้ว`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = codeName.trim().toUpperCase();
    if (!clean) {
      error('กรุณาระบุรหัสโค้ด');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      error('จำนวนเครดิตต้องมากกว่า 0 บาท');
      return;
    }

    setIsSubmitting(true);
    try {
      await createRedeemCode({
        code: clean,
        amount: numAmount,
        maxUses: Number(maxUses) || 0,
        isActive,
      });
      success(`สร้างโค้ด "${clean}" สำหรับแจก ${numAmount} เครดิตสำเร็จ`);
      setIsModalOpen(false);
      setCodeName('');
      setAmount('20');
      setMaxUses('0');
      setIsActive(true);
      await loadCodes();
    } catch (err: any) {
      error(`ไม่สามารถสร้างโค้ด: ${err.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: RedeemCode) => {
    try {
      await updateRedeemCode(item.id, { isActive: !item.isActive });
      toast(
        item.isActive ? `ปิดการใช้งานโค้ด ${item.code} แล้ว` : `เปิดใช้งานโค้ด ${item.code} แล้ว`,
        'success'
      );
      await loadCodes();
    } catch (err: any) {
      error(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteRedeemCode(deleteId);
      success('ลบโค้ดเรียบร้อยแล้ว');
      setDeleteId(null);
      await loadCodes();
    } catch (err: any) {
      error(`ไม่สามารถลบโค้ด: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCodes = codes.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase().trim())
  );

  const hasOpeningCode = codes.some((c) => c.code === 'J3AOPENING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-amber-400" />
            <span>จัดการโค้ดของขวัญ & เครดิต (Redeem Codes)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            สร้างและจัดการโค้ดแจกเครดิตฟรีให้ลูกค้าใช้แลกรับเครดิตเข้ากระเป๋าในเว็บไซต์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadCodes}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            รีเฟรช
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-[0_0_15px_rgba(251,191,36,0.3)]"
          >
            เพิ่มโค้ดใหม่
          </Button>
        </div>
      </div>

      {/* Opening Banner recommendation */}
      {!hasOpeningCode && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">โค้ดเปิดร้าน J3AOPENING</h4>
              <p className="text-xs text-amber-300/80">
                ยังไม่มีโค้ด J3AOPENING ในระบบ กดเพื่อสร้างโค้ดแจกฟรี 20 เครดิตทันที
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              await seedOpeningCodeIfNotExists();
              await loadCodes();
              success('สร้างโค้ด J3AOPENING (20 เครดิต) เรียบร้อยแล้ว');
            }}
            className="bg-amber-400 text-slate-950 font-bold"
          >
            สร้างโค้ด J3AOPENING
          </Button>
        </div>
      )}

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อโค้ด..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 outline-none"
          />
        </div>

        <div className="text-xs text-slate-400">
          ทั้งหมด <strong className="text-white font-bold">{codes.length}</strong> โค้ด
        </div>
      </div>

      {/* Codes Table / Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            กำลังโหลดข้อมูลโค้ด...
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Ticket className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            ไม่พบโค้ดของขวัญในระบบ คลิก "เพิ่มโค้ดใหม่" ด้านบนเพื่อสร้างโค้ด
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">รหัสโค้ด (Code)</th>
                  <th className="py-3.5 px-4">มูลค่าเครดิต</th>
                  <th className="py-3.5 px-4">การใช้งาน (Used / Max)</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4">สร้างเมื่อ</th>
                  <th className="py-3.5 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCodes.map((item) => {
                  const isOpening = item.code === 'J3AOPENING';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white text-base tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-sm flex items-center gap-1.5">
                            {item.code}
                            {isOpening && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                HOT
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => handleCopy(item.code)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                            title="คัดลอกโค้ด"
                          >
                            {copiedCode === item.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-amber-400">
                          <Coins className="w-4 h-4" />
                          <span>+{item.amount.toLocaleString()} ฿</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-200">
                            {item.usedCount} ครั้ง
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.maxUses > 0
                              ? `จำกัดสูงสุด ${item.maxUses} สิทธิ์`
                              : 'ไม่จำกัดสิทธิ์ (1 คน / 1 ครั้ง)'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            item.isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                          {item.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </button>
                      </td>

                      <td suppressHydrationWarning className="py-3.5 px-4 text-xs text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('th-TH') : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="ลบโค้ด"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Code Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="เพิ่มโค้ดของขวัญ / เครดิตฟรี"
      >
        <form onSubmit={handleCreateCode} className="space-y-4 pt-2">
          <Input
            label="รหัสโค้ด (Code) *"
            value={codeName}
            onChange={(e) => setCodeName(e.target.value.toUpperCase())}
            placeholder="เช่น J3AOPENING, PROMO50, GIFT2026"
            required
            helperText="ตัวอักษรภาษาอังกฤษพิมพ์ใหญ่และตัวเลข"
          />

          <Input
            label="จำนวนเครดิตที่ได้รับ (฿) *"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="20"
            required
            min="1"
            helperText="เครดิตจะถูกโอนเข้าบัญชีผู้ใช้งานทันทีที่แลกโค้ดสำเร็จ"
          />

          <Input
            label="จำกัดจำนวนสิทธิ์ทั้งหมด (คน)"
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="0 = ไม่จำกัดจำนวนสิทธิ์"
            min="0"
            helperText="กรอก 0 เพื่อให้ใช้งานได้ไม่จำกัด (แต่ละคนจะแลกได้ 1 ครั้ง)"
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="isActiveToggle" className="text-xs sm:text-sm text-slate-300 cursor-pointer">
              เปิดให้ใช้งานโค้ดนี้ทันทีหลังสร้าง
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
            >
              บันทึกโค้ด
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบโค้ดของขวัญ"
        itemName={deleteId || 'โค้ดนี้'}
        isLoading={isDeleting}
      />
    </div>
  );
}
