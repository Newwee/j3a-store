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
  Percent,
  Tag,
  DollarSign,
  Filter,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  getAllRedeemCodes,
  createRedeemCode,
  updateRedeemCode,
  deleteRedeemCode,
  seedOpeningCodeIfNotExists,
  RedeemCode,
  CodeType,
} from '@/lib/firestore/redeem';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';

export default function AdminCodesPage() {
  const { success, error, toast } = useToast();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'discount'>('all');

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [codeName, setCodeName] = useState('');
  const [codeType, setCodeType] = useState<CodeType>('credit');
  const [amount, setAmount] = useState('20');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [minSpend, setMinSpend] = useState('0');
  const [maxUses, setMaxUses] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCodes = async () => {
    setIsLoading(true);
    try {
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

    let finalAmount = Number(amount);
    let finalPercent = Number(discountPercent);

    if (codeType === 'discount_percent') {
      if (isNaN(finalPercent) || finalPercent <= 0 || finalPercent > 100) {
        error('เปอร์เซ็นต์ส่วนลดต้องอยู่ระหว่าง 1 - 100%');
        return;
      }
      finalAmount = finalPercent;
    } else {
      if (isNaN(finalAmount) || finalAmount <= 0) {
        error('จำนวนเงิน/เครดิตต้องมากกว่า 0 บาท');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createRedeemCode({
        code: clean,
        codeType,
        amount: finalAmount,
        discountPercent: codeType === 'discount_percent' ? finalPercent : undefined,
        minSpend: Number(minSpend) || 0,
        maxUses: Number(maxUses) || 0,
        isActive,
      });

      const typeDesc =
        codeType === 'credit'
          ? `แจก ${finalAmount} เครดิต`
          : codeType === 'discount_percent'
          ? `ลด ${finalPercent}% ตอนชำระเงิน`
          : `ลด ฿${finalAmount} ตอนชำระเงิน`;

      success(`สร้างโค้ด "${clean}" (${typeDesc}) สำเร็จเรียบร้อย`);
      setIsModalOpen(false);
      setCodeName('');
      setCodeType('credit');
      setAmount('20');
      setDiscountPercent('10');
      setMinSpend('0');
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

  // Filter by category & search
  const filteredCodes = codes.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase().trim());
    if (!matchesSearch) return false;

    if (filterType === 'credit') return c.codeType === 'credit';
    if (filterType === 'discount') return c.codeType === 'discount_percent' || c.codeType === 'discount_fixed';
    return true;
  });

  const creditCodesCount = codes.filter((c) => c.codeType === 'credit').length;
  const discountCodesCount = codes.filter((c) => c.codeType === 'discount_percent' || c.codeType === 'discount_fixed').length;
  const totalUsesCount = codes.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  const hasOpeningCode = codes.some((c) => c.code === 'J3AOPENING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-cyan-400" />
            <span>จัดการโค้ดในระบบ (Code Management)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            แยกประเภทโค้ด 2 รูปแบบ: <strong>โค้ดของขวัญทั่วไป (แจกเครดิต)</strong> และ <strong>โค้ดส่วนลดตอนจ่ายเงิน (ลดราคาสินค้า)</strong>
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
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            สร้างโค้ดใหม่
          </Button>
        </div>
      </div>

      {/* 3 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              โค้ดทั้งหมดในระบบ
            </span>
            <strong className="text-xl font-black text-white">{codes.length} โค้ด</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              โค้ดของขวัญทั่วไป (แจกเครดิต)
            </span>
            <strong className="text-xl font-black text-amber-300">{creditCodesCount} โค้ด</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              โค้ดส่วนลดตอนชำระเงิน
            </span>
            <strong className="text-xl font-black text-emerald-300">{discountCodesCount} โค้ด</strong>
          </div>
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

      {/* Filter Tabs and Search Bar */}
      <div className="relative z-30 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            ทั้งหมด ({codes.length})
          </button>

          <button
            onClick={() => setFilterType('credit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'credit'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>โค้ดของขวัญทั่วไป ({creditCodesCount})</span>
          </button>

          <button
            onClick={() => setFilterType('discount')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'discount'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            <span>โค้ดลดตอนจ่ายเงิน ({discountCodesCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อโค้ด..."
            className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2 border border-slate-800 focus:border-cyan-400 outline-none"
          />
        </div>
      </div>

      {/* Codes Table */}
      {isLoading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-950 animate-pulse" />
          ))}
        </div>
      ) : filteredCodes.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Ticket className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">ไม่พบโค้ดในหมวดหมู่นี้</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            คุณสามารถกดสร้างโค้ดใหม่ด้านบนเพื่อแจกเครดิตหรือมอบส่วนลดให้ลูกค้า
          </p>
        </div>
      ) : (
        <div className="relative z-10 bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 sm:px-6">รหัสโค้ด (Code)</th>
                  <th className="py-4 px-4">ประเภทโค้ด (Type)</th>
                  <th className="py-4 px-4">มูลค่า (Value)</th>
                  <th className="py-4 px-4">ยอดสั่งซื้อขั้นต่ำ</th>
                  <th className="py-4 px-4">การใช้งาน (Used / Max)</th>
                  <th className="py-4 px-4">สถานะ</th>
                  <th className="py-4 px-4 sm:px-6 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCodes.map((item) => {
                  const isCredit = item.codeType === 'credit';
                  const isPercent = item.codeType === 'discount_percent';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Code with Copy */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-white px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                            {item.code}
                          </span>
                          <button
                            onClick={() => handleCopy(item.code)}
                            title="คัดลอกโค้ด"
                            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedCode === item.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isCredit ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 w-max">
                            <Coins className="w-3 h-3 text-amber-400" />
                            <span>โค้ดของขวัญ (เติม Wallet)</span>
                          </span>
                        ) : isPercent ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 w-max">
                            <Percent className="w-3 h-3 text-emerald-400" />
                            <span>ส่วนลดตอนจ่าย (% ลด)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold flex items-center gap-1.5 w-max">
                            <Tag className="w-3 h-3 text-cyan-400" />
                            <span>ส่วนลดตอนจ่าย (บาท ฿)</span>
                          </span>
                        )}
                      </td>

                      {/* Value */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isCredit ? (
                          <span className="font-bold text-amber-300 font-mono">
                            +{formatCurrency(item.amount)}
                          </span>
                        ) : isPercent ? (
                          <span className="font-bold text-emerald-300 font-mono">
                            ลด {item.discountPercent || item.amount}%
                          </span>
                        ) : (
                          <span className="font-bold text-cyan-300 font-mono">
                            ลด {formatCurrency(item.amount)}
                          </span>
                        )}
                      </td>

                      {/* Min Spend */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-400">
                        {item.minSpend && item.minSpend > 0 ? (
                          <span className="font-mono text-slate-200">
                            ขั้นต่ำ {formatCurrency(item.minSpend)}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">ไม่มีขั้นต่ำ</span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-200">
                          {item.usedCount}
                          <span className="text-slate-500">
                            {' '}
                            / {item.maxUses === 0 ? '∞ ไม่จำกัด' : `${item.maxUses} สิทธิ์`}
                          </span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            item.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {item.isActive ? '● ใช้งานอยู่' : '○ ปิดใช้งาน'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* Create Code Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="สร้างโค้ดใหม่">
        <form onSubmit={handleCreateCode} className="space-y-4">
          {/* Select Code Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">เลือกประเภทของโค้ด (Code Type)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1 cursor-pointer transition-all ${
                  codeType === 'credit'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="code_type"
                  checked={codeType === 'credit'}
                  onChange={() => setCodeType('credit')}
                  className="hidden"
                />
                <Coins className="w-5 h-5 text-amber-400 mb-0.5" />
                <strong className="text-xs">โค้ดของขวัญ</strong>
                <span className="text-[10px] text-slate-400">แจกเครดิตเข้า Wallet</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1 cursor-pointer transition-all ${
                  codeType === 'discount_percent'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="code_type"
                  checked={codeType === 'discount_percent'}
                  onChange={() => setCodeType('discount_percent')}
                  className="hidden"
                />
                <Percent className="w-5 h-5 text-emerald-400 mb-0.5" />
                <strong className="text-xs">ส่วนลด %</strong>
                <span className="text-[10px] text-slate-400">ลดเป็นเปอร์เซ็นต์ตอนจ่าย</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1 cursor-pointer transition-all ${
                  codeType === 'discount_fixed'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="code_type"
                  checked={codeType === 'discount_fixed'}
                  onChange={() => setCodeType('discount_fixed')}
                  className="hidden"
                />
                <Tag className="w-5 h-5 text-cyan-400 mb-0.5" />
                <strong className="text-xs">ส่วนลด บาท ฿</strong>
                <span className="text-[10px] text-slate-400">ลดเป็นเงินบาทตอนจ่าย</span>
              </label>
            </div>
          </div>

          {/* Code Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              รหัสโค้ด (เช่น WELCOME10, DISC50, J3AFREE) *
            </label>
            <Input
              type="text"
              required
              value={codeName}
              onChange={(e) => setCodeName(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="font-mono uppercase font-bold tracking-wider"
            />
          </div>

          {/* Value Input depends on type */}
          {codeType === 'credit' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                จำนวนเครดิตที่จะได้รับ (บาท) *
              </label>
              <Input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="20"
              />
              <span className="text-[11px] text-slate-400">
                เมื่อผู้ใช้แลกโค้ดนี้ จะได้รับเครดิตเข้ากระเป๋าเงินทันที
              </span>
            </div>
          )}

          {codeType === 'discount_percent' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                เปอร์เซ็นต์ส่วนลด (%) *
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                required
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="10"
              />
              <span className="text-[11px] text-slate-400">
                ลด {discountPercent || '0'}% จากยอดรวมของสินค้าในหน้าชำระเงิน
              </span>
            </div>
          )}

          {codeType === 'discount_fixed' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                จำนวนเงินที่ลด (บาท ฿) *
              </label>
              <Input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
              />
              <span className="text-[11px] text-slate-400">
                ลด ฿{amount || '0'} จากยอดรวมในหน้าชำระเงิน
              </span>
            </div>
          )}

          {/* Min Spend for discounts */}
          {(codeType === 'discount_percent' || codeType === 'discount_fixed') && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ยอดสั่งซื้อขั้นต่ำ (บาท) (0 = ไม่มีขั้นต่ำ)
              </label>
              <Input
                type="number"
                min="0"
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {/* Max Uses */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              จำนวนสิทธิ์สูงสุด (0 = ไม่จำกัดจำนวนสิทธิ์)
            </label>
            <Input
              type="number"
              min="0"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Is Active checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span>เปิดใช้งานทันทีหลังจากสร้าง</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-cyan-500 text-slate-950 font-bold"
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
        isLoading={isDeleting}
        title="ยืนยันการลบโค้ด"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบโค้ดนี้? ผู้ใช้งานจะไม่สามารถนำโค้ดนี้มาใช้ได้อีก"
      />
    </div>
  );
}
