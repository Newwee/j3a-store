'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Download,
  Trash2,
  Ban,
  RotateCcw,
  Laptop,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  Database,
  Cpu,
  Info,
  Calendar,
  X,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';
import {
  PRESET_PRODUCTS,
  DURATION_PRESETS,
  LicenseItem,
  LicenseStats,
  LicenseDurationType,
} from '@/types/license';
import {
  fetchAdminLicenses,
  generateAdminLicenses,
  revokeAdminLicense,
  reactivateAdminLicense,
  resetAdminLicenseHWID,
  deleteAdminLicense,
} from '@/lib/firestore/licenses';
import { formatDate } from '@/lib/utils/formatters';

export default function AdminLicensesPage() {
  const { success, error, toast } = useToast();
  const { showLoading, hideLoading } = useLoading();

  // License data state
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [stats, setStats] = useState<LicenseStats>({
    total: 0,
    active: 0,
    unused: 0,
    expired: 0,
    revoked: 0,
    lifetime: 0,
  });
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Generator Modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('desk_cord');
  const [customProductId, setCustomProductId] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [customKeyPrefix, setCustomKeyPrefix] = useState('');

  const [durationType, setDurationType] = useState<LicenseDurationType>('timed');
  const [selectedDurationPreset, setSelectedDurationPreset] = useState<number>(30);
  const [customDurationDays, setCustomDurationDays] = useState<string>('30');
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  const [batchCount, setBatchCount] = useState<number>(1);
  const [customBatchCount, setCustomBatchCount] = useState<string>('1');
  const [isCustomBatch, setIsCustomBatch] = useState(false);

  const [note, setNote] = useState('');
  const [syncGoogleSheets, setSyncGoogleSheets] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Results Modal state
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [newlyGeneratedKeys, setNewlyGeneratedKeys] = useState<string[]>([]);
  const [generatedProductLabel, setGeneratedProductLabel] = useState('');
  const [generatedDurationLabel, setGeneratedDurationLabel] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hasCopiedAll, setHasCopiedAll] = useState(false);

  // Revoke/Delete Modal state
  const [targetLicense, setTargetLicense] = useState<LicenseItem | null>(null);
  const [actionType, setActionType] = useState<'revoke' | 'delete' | 'reset_hwid' | 'reactivate' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load licenses
  const loadLicensesData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminLicenses({
        search: search.trim(),
        product: productFilter,
        status: statusFilter,
        limit: 150,
      });
      setLicenses(data.licenses);
      setStats(data.stats);
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการโหลดรายการคีย์: ${err.message || 'ไม่สามารถโหลดข้อมูลได้'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicensesData();
  }, [productFilter, statusFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLicensesData();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Product metadata helper
  const currentProductInfo = useMemo(() => {
    if (selectedProduct === 'custom') {
      return {
        id: customProductId.trim().toLowerCase() || 'custom',
        name: customProductName.trim() || 'Custom Software',
        prefix: customKeyPrefix.trim().toUpperCase() || 'J3A',
      };
    }
    const preset = PRESET_PRODUCTS.find((p) => p.id === selectedProduct);
    return preset || { id: 'custom', name: 'Custom Software', prefix: 'J3A' };
  }, [selectedProduct, customProductId, customProductName, customKeyPrefix]);

  // Handle Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProduct === 'custom') {
      if (!customProductId.trim()) {
        error('กรุณาระบุ Product ID (เช่น desk_cord_pro)');
        return;
      }
      if (!customKeyPrefix.trim()) {
        error('กรุณาระบุ Key Prefix (เช่น J3APRO)');
        return;
      }
    }

    const effectiveDays = durationType === 'lifetime'
      ? 0
      : isCustomDuration
      ? Math.max(1, parseInt(customDurationDays) || 7)
      : selectedDurationPreset;

    const effectiveCount = isCustomBatch
      ? Math.max(1, Math.min(200, parseInt(customBatchCount) || 1))
      : batchCount;

    setIsGenerating(true);
    showLoading(`กำลังสร้าง License Key ${effectiveCount} คีย์ และบันทึกข้อมูล...`);

    try {
      const result = await generateAdminLicenses({
        productId: selectedProduct,
        customProductId: customProductId.trim().toLowerCase(),
        customProductName: customProductName.trim(),
        keyPrefix: currentProductInfo.prefix,
        durationType,
        durationDays: effectiveDays,
        batchCount: effectiveCount,
        note: note.trim(),
        syncGoogleSheets,
      });

      setNewlyGeneratedKeys(result.keys);
      setGeneratedProductLabel(currentProductInfo.name);
      setGeneratedDurationLabel(
        durationType === 'lifetime' ? 'Lifetime (ถาวรตลอดชีพ)' : `${effectiveDays} วัน`
      );

      setIsGeneratorOpen(false);
      setIsResultOpen(true);
      success(`สร้างคีย์สำเร็จ ${result.keys.length} รายการ!`);
      loadLicensesData();
    } catch (err: any) {
      error(`ไม่สามารถสร้างคีย์ได้: ${err.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setIsGenerating(false);
      hideLoading();
    }
  };

  // Copy helper
  const handleCopySingle = (k: string) => {
    navigator.clipboard.writeText(k);
    setCopiedKey(k);
    toast(`✓ คัดลอกคีย์ "${k}" สำเร็จ!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(newlyGeneratedKeys.join('\n'));
    setHasCopiedAll(true);
    toast(`✓ คัดลอก License Keys ทั้งหมด (${newlyGeneratedKeys.length} คีย์) สำเร็จ!`, 'success');
    setTimeout(() => setHasCopiedAll(false), 2500);
  };

  const handleDownloadTxt = () => {
    const content = [
      `════════════════════════════════════════════════════════════════════`,
      `  J3A STORE - BATCH GENERATED LICENSE KEYS`,
      `  โปรแกรม: ${generatedProductLabel}`,
      `  ระยะเวลา: ${generatedDurationLabel}`,
      `  จำนวน: ${newlyGeneratedKeys.length} คีย์`,
      `  สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`,
      `  โน้ต: ${note || '-'}`,
      `════════════════════════════════════════════════════════════════════`,
      '',
      ...newlyGeneratedKeys,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `j3a-keys-${currentProductInfo.prefix.toLowerCase()}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('ดาวน์โหลดไฟล์รายการคีย์ .txt เรียบร้อย', 'info');
  };

  // Action execution
  const handleExecuteAction = async () => {
    if (!targetLicense || !actionType) return;
    setIsActionLoading(true);
    try {
      if (actionType === 'revoke') {
        await revokeAdminLicense(targetLicense.key, actionNote);
        success(`ระงับสิทธิ์ License Key "${targetLicense.key}" เรียบร้อยแล้ว`);
      } else if (actionType === 'reactivate') {
        await reactivateAdminLicense(targetLicense.key);
        success(`เปิดสิทธิ์ใหม่ให้ License Key "${targetLicense.key}" เรียบร้อย`);
      } else if (actionType === 'reset_hwid') {
        await resetAdminLicenseHWID(targetLicense.key, actionNote);
        success(`รีเซ็ต HWID ของ License Key "${targetLicense.key}" สำเร็จ ลูกค้าสามารถนำไปใช้เครื่องใหม่ได้`);
      } else if (actionType === 'delete') {
        await deleteAdminLicense({ key: targetLicense.key, id: targetLicense.id });
        success(`ลบ License Key "${targetLicense.key}" ออกจากระบบแล้ว`);
      }
      setTargetLicense(null);
      setActionType(null);
      setActionNote('');
      loadLicensesData();
    } catch (err: any) {
      error(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถดำเนินการได้'}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <AdminHeader
        title="ระบบสร้าง & จัดการ License Key (License Generator)"
        description="สร้าง License Key อัตโนมัติ เลือกระยะเวลาถาวร/จำกัดวัน ผูก HWID เครื่อง และซิงค์ Google Sheets / Supabase แบบเรียลไทม์"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLicensesData}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            รีเฟรช
          </Button>
          <Button
            variant="neon"
            size="md"
            onClick={() => setIsGeneratorOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            + สร้างคีย์ใหม่ (Generate Key)
          </Button>
        </div>
      </AdminHeader>

      {/* 2. Top Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">คีย์ทั้งหมด</span>
            <Key className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{stats.total}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">ในฐานข้อมูล</span>
          </div>
        </div>

        {/* Unused / Available */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold">พร้อมแจก (UNUSED)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-300">{stats.unused}</span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">ยังไม่เปิดใช้งาน</span>
          </div>
        </div>

        {/* Active */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-semibold">กำลังใช้งาน (ACTIVE)</span>
            <Laptop className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-cyan-300">{stats.active}</span>
            <span className="text-[10px] text-cyan-400/80 block mt-0.5">ผูก HWID แล้ว</span>
          </div>
        </div>

        {/* Lifetime */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/20 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-semibold">คีย์ถาวร (Lifetime)</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-300">{stats.lifetime}</span>
            <span className="text-[10px] text-purple-400/80 block mt-0.5">ไม่มีวันหมดอายุ</span>
          </div>
        </div>

        {/* Expired */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold">หมดอายุ (EXPIRED)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-300">{stats.expired}</span>
            <span className="text-[10px] text-amber-400/80 block mt-0.5">ครบกำหนดเวลา</span>
          </div>
        </div>

        {/* Revoked */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/20 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold">ระงับสิทธิ์ (REVOKED)</span>
            <Ban className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-400">{stats.revoked}</span>
            <span className="text-[10px] text-rose-400/80 block mt-0.5">ถูกแบน / บล็อค</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหา License Key, HWID, หรือชื่อลูกค้า/โน้ต..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Product Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">ทุกโปรแกรม (All Products)</option>
              <option value="desk_cord">J3A DeskCord (J3ADC)</option>
              <option value="discord_autoquest">Discord AutoQuest (J3ADQ)</option>
              <option value="discord_manager">Discord Manager (J3ADM)</option>
              <option value="discord_profile">Discord Profile (J3ADP)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">ทุกสถานะ (All Status)</option>
              <option value="available">🟢 พร้อมใช้งาน (UNUSED)</option>
              <option value="active">🔵 กำลังใช้งาน (ACTIVE)</option>
              <option value="expired">🟡 หมดอายุ (EXPIRED)</option>
              <option value="revoked">🔴 ถูกระงับ (REVOKED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. License Management Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-4">License Key</th>
                <th className="py-3 px-4">โปรแกรม (Product)</th>
                <th className="py-3 px-4">แพ็กเกจ (Duration)</th>
                <th className="py-3 px-4">สถานะ (Status)</th>
                <th className="py-3 px-4">HWID ประจำเครื่อง</th>
                <th className="py-3 px-4">วันหมดอายุ (Expires At)</th>
                <th className="py-3 px-4">โน้ต / อ้างอิง</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>กำลังโหลดข้อมูล License Key...</span>
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Key className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <span>ไม่พบคีย์ที่ตรงตามเงื่อนไขการค้นหา</span>
                  </td>
                </tr>
              ) : (
                licenses.map((lic) => {
                  const isLifetime = lic.duration_days === 0 || lic.tier === 'lifetime';
                  const s = (lic.status || '').toLowerCase();
                  const isUnused = s === 'available' || s === 'unused';
                  const isActive = s === 'active' || s === 'claimed';
                  const isExpired = s === 'expired';
                  const isRevoked = s === 'revoked';

                  return (
                    <tr
                      key={lic.id || lic.key}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Key Column */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="tracking-wider text-cyan-300">{lic.key}</span>
                          <button
                            type="button"
                            onClick={() => handleCopySingle(lic.key)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="คัดลอกคีย์"
                          >
                            {copiedKey === lic.key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Product Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200">
                          {lic.product_slug}
                        </span>
                      </td>

                      {/* Duration Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isLifetime ? (
                          <span className="inline-flex items-center gap-1 text-purple-400 font-bold bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-500/30 text-[11px]">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>ถาวร (Lifetime)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-300 font-semibold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-[11px]">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>{lic.duration_days} วัน ({lic.tier})</span>
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isUnused && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>UNUSED (ว่าง)</span>
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span>ACTIVE (ใช้งาน)</span>
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-bold">
                            <span>EXPIRED (หมดอายุ)</span>
                          </span>
                        )}
                        {isRevoked && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 text-[10px] font-bold">
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span>REVOKED (ระงับ)</span>
                          </span>
                        )}
                      </td>

                      {/* HWID Column */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {lic.hwid ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300">
                              {lic.hwid.slice(0, 14)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetLicense(lic);
                                setActionType('reset_hwid');
                              }}
                              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-cyan-300 border border-cyan-500/30 cursor-pointer"
                              title="ปลดล็อคเครื่องเพื่อให้ลูกค้าไปใช้เครื่องใหม่"
                            >
                              รีเซ็ต HWID
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600">- ยังไม่ผูกเครื่อง -</span>
                        )}
                      </td>

                      {/* Expiration Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                        {isLifetime ? (
                          <span className="text-purple-400/90 font-bold">ไม่มีวันหมดอายุ (NEVER)</span>
                        ) : lic.expires_at ? (
                          <span className={isExpired ? 'text-rose-400' : 'text-slate-300'}>
                            {formatDate(lic.expires_at)}
                          </span>
                        ) : (
                          <span className="text-slate-500">นับ {lic.duration_days} วัน เมื่อเปิดใช้</span>
                        )}
                      </td>

                      {/* Note Column */}
                      <td className="py-3.5 px-4 max-w-[160px] truncate text-slate-400 text-[11px]">
                        {lic.notes || '-'}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isRevoked ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetLicense(lic);
                                setActionType('reactivate');
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              ปลดระงับ
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetLicense(lic);
                                setActionType('revoke');
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                              title="ระงับการใช้งานคีย์นี้"
                            >
                              ระงับสิทธิ์
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setTargetLicense(lic);
                              setActionType('delete');
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="ลบคีย์ถาวร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Generator Modal */}
      <Modal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        title="⚡ สร้าง License Key อัตโนมัติ (License Key Generator)"
        description="สร้างคีย์แบบเดี่ยว หรือ Batch พร้อมระบุระยะเวลาถาวร/มีเวลา และซิงค์ Google Sheets"
      >
        <form onSubmit={handleGenerate} className="space-y-5 pt-1">
          {/* Step 1: Product Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. เลือกโปรแกรมที่ต้องการออกคีย์ (Product)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PRODUCTS.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => setSelectedProduct(prod.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedProduct === prod.id
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{prod.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                      {prod.prefix}-
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {prod.description}
                  </span>
                </button>
              ))}

              {/* Custom Program Button */}
              <button
                type="button"
                onClick={() => setSelectedProduct('custom')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedProduct === 'custom'
                    ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)] text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-300">+ โปรแกรมใหม่ (Custom)</span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">กำหนดเอง</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  กำหนด Product ID & Prefix ใหม่เอง
                </span>
              </button>
            </div>

            {/* Custom Input Fields if selected */}
            {selectedProduct === 'custom' && (
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3 mt-2 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-purple-200 block mb-1">
                      Product ID (เช่น desk_cord_pro):
                    </label>
                    <input
                      type="text"
                      placeholder="desk_cord_pro"
                      value={customProductId}
                      onChange={(e) => setCustomProductId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-purple-500/40 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-purple-200 block mb-1">
                      Key Prefix (เช่น J3APRO):
                    </label>
                    <input
                      type="text"
                      placeholder="J3APRO"
                      value={customKeyPrefix}
                      onChange={(e) => setCustomKeyPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-purple-500/40 text-xs text-white uppercase font-mono font-bold"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-purple-200 block mb-1">
                    ชื่อแสดงโปรแกรม (เช่น J3A DeskCord Pro):
                  </label>
                  <input
                    type="text"
                    placeholder="J3A DeskCord Pro"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-purple-500/40 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Duration Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              2. เลือกระยะเวลาการใช้งาน (License Duration)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDurationType('timed')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                  durationType === 'timed'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ⏱️ คีย์แบบมีเวลา (Timed Duration)
              </button>

              <button
                type="button"
                onClick={() => setDurationType('lifetime')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                  durationType === 'lifetime'
                    ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                👑 คีย์ถาวรตลอดชีพ (Lifetime)
              </button>
            </div>

            {/* Presets if Timed */}
            {durationType === 'timed' && (
              <div className="pt-2 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedDurationPreset(preset.days);
                        setIsCustomDuration(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        !isCustomDuration && selectedDurationPreset === preset.days
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomDuration(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isCustomDuration
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    ระบุจำนวนวันเอง...
                  </button>
                </div>

                {isCustomDuration && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-200">
                    <span className="text-xs text-slate-400">ระบุจำนวนวัน:</span>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={customDurationDays}
                      onChange={(e) => setCustomDurationDays(e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/50 text-xs text-white font-mono font-bold"
                    />
                    <span className="text-xs text-slate-400">วัน</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Batch Count */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              3. จำนวนคีย์ที่ต้องการเจนพร้อมกัน (Batch Count)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 5, 10, 25, 50].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setBatchCount(c);
                    setIsCustomBatch(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    !isCustomBatch && batchCount === c
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {c} คีย์
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomBatch(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isCustomBatch
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                ระบุจำนวน...
              </button>

              {isCustomBatch && (
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={customBatchCount}
                  onChange={(e) => setCustomBatchCount(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-cyan-500 text-xs text-white font-mono font-bold text-center"
                />
              )}
            </div>
          </div>

          {/* Step 4: Customer Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              4. บันทึกโน้ตลูกค้า หรือเลขออเดอร์ (Customer / Order Note)
            </label>
            <input
              type="text"
              placeholder="เช่น Discord: john#1234 / ออเดอร์ #J3A-1029 / โปรโมชันกิจกรรม"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Step 5: Sync Options */}
          <div className="pt-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              5. ตัวเลือกการบันทึกข้อมูล (Storage & Sync)
            </span>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
              />
              <span>บันทึกลงฐานข้อมูลหลัก Supabase (เปิดใช้งานเสมอ)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={syncGoogleSheets}
                onChange={(e) => setSyncGoogleSheets(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
              />
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>ซิงค์ข้อมูลเข้า Google Sheets อัตโนมัติ (Google Apps Script)</span>
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsGeneratorOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="neon"
              size="md"
              isLoading={isGenerating}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              ⚡ สร้าง License Key เดี๋ยวนี้
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Results Modal */}
      <Modal
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        title="🎉 สร้าง License Key สำเร็จแล้ว!"
        description={`โปรแกรม: ${generatedProductLabel} | ระยะเวลา: ${generatedDurationLabel} (${newlyGeneratedKeys.length} คีย์)`}
      >
        <div className="space-y-4 pt-2">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>พร้อมใช้งานทันที</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold cursor-pointer transition-colors"
              >
                {hasCopiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>คัดลอกหมดแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกทั้งหมด</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด .txt</span>
              </button>
            </div>
          </div>

          {/* Keys Box */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
            {newlyGeneratedKeys.map((k, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition-colors"
              >
                <span className="text-cyan-300 font-bold tracking-wider">{k}</span>
                <button
                  type="button"
                  onClick={() => handleCopySingle(k)}
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="คัดลอกคีย์นี้"
                >
                  {copiedKey === k ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="neon"
              size="md"
              onClick={() => setIsResultOpen(false)}
            >
              เสร็จสิ้น
            </Button>
          </div>
        </div>
      </Modal>

      {/* 7. Action Confirm Modal (Revoke, Delete, Reset HWID) */}
      <Modal
        isOpen={Boolean(targetLicense && actionType)}
        onClose={() => {
          setTargetLicense(null);
          setActionType(null);
          setActionNote('');
        }}
        title={
          actionType === 'revoke'
            ? '⚠️ ยืนยันการระงับสิทธิ์ (Revoke License)'
            : actionType === 'delete'
            ? '🗑️ ยืนยันการลบคีย์ถาวร'
            : actionType === 'reset_hwid'
            ? '🔄 รีเซ็ต HWID ประจำเครื่อง'
            : '✅ ยืนยันการเปิดสิทธิ์ใหม่'
        }
        description={`รหัสคีย์: ${targetLicense?.key}`}
      >
        <div className="space-y-4 pt-2">
          {actionType === 'revoke' && (
            <p className="text-xs text-rose-300 leading-relaxed bg-rose-950/20 p-3 rounded-xl border border-rose-500/30">
              เมื่อระงับสิทธิ์ คีย์นี้จะไม่สามารถนำไป Activate หรือเปิดใช้งานโปรแกรมได้อีกจนกว่าแอดมินจะปลดระงับ
            </p>
          )}

          {actionType === 'reset_hwid' && (
            <p className="text-xs text-cyan-300 leading-relaxed bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/30">
              การรีเซ็ต HWID จะปลดล็อคเครื่องปัจจุบันออก ทำให้ลูกค้าสามารถนำคีย์นี้ไปล็อกอินในคอมพิวเตอร์เครื่องใหม่ได้ 1:1
            </p>
          )}

          {actionType === 'delete' && (
            <p className="text-xs text-rose-300 leading-relaxed bg-rose-950/20 p-3 rounded-xl border border-rose-500/30">
              คำเตือน: การลบคีย์นี้จะลบออกจากฐานข้อมูลถาวร ไม่สามารถกู้คืนได้
            </p>
          )}

          {(actionType === 'revoke' || actionType === 'reset_hwid') && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                เหตุผล หรือหมายเหตุ:
              </label>
              <input
                type="text"
                placeholder="เช่น พบการละเมิด, ย้ายเครื่องตามคำขอ..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setTargetLicense(null);
                setActionType(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant={actionType === 'revoke' || actionType === 'delete' ? 'danger' : 'neon'}
              size="md"
              onClick={handleExecuteAction}
              isLoading={isActionLoading}
            >
              {actionType === 'revoke'
                ? 'ยืนยันระงับสิทธิ์'
                : actionType === 'delete'
                ? 'ยืนยันการลบ'
                : actionType === 'reset_hwid'
                ? 'ยืนยันรีเซ็ต HWID'
                : 'ยืนยันเปิดสิทธิ์'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
