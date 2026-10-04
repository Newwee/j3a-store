'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Tag,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  getBundles,
  updateBundle,
  deleteBundle,
  createBundle,
} from '@/lib/firestore/bundles';
import { BundlePackage, BundleFormData } from '@/types/bundle';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { formatCurrency } from '@/lib/utils/formatters';

export default function AdminBundlesPage() {
  const { success, error, toast } = useToast();
  const [bundles, setBundles] = useState<BundlePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBundles = async () => {
    setIsLoading(true);
    try {
      const data = await getBundles({ status: 'all' });
      setBundles(data);
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการโหลดบันเดิล: ${err.message || 'ไม่สามารถโหลดข้อมูลได้'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBundles();
  }, []);

  const handleToggleStatus = async (item: BundlePackage) => {
    const newStatus = item.status === 'active' ? 'draft' : 'active';
    try {
      await updateBundle(item.id, { status: newStatus });
      toast(
        newStatus === 'active' ? `เปิดใช้งานบันเดิล "${item.name}" แล้ว` : `บันทึกเป็นแบบร่างแล้ว`,
        'success'
      );
      await loadBundles();
    } catch (err: any) {
      error(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteBundle(deleteId);
      success('ลบแพ็กเกจบันเดิลเรียบร้อยแล้ว');
      setDeleteId(null);
      await loadBundles();
    } catch (err: any) {
      error(`ไม่สามารถลบแพ็กเกจ: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedBundle = async () => {
    setIsSeeding(true);
    try {
      await createBundle({
        name: 'J3A Discord Ultimate Bundle (2-in-1)',
        slug: 'j3a-discord-ultimate-bundle',
        description: 'แพ็กเกจรวมสุดคุ้ม 2 ซอฟต์แวร์ระดับท็อปสำหรับ Discord: J3A Discord Profile (Rich Presence Status) + J3ADiscordManager (Server Architecture & Roles Studio) ซื้อคู่กันในราคาพิเศษเพียง 75 บาท (จากปกติ 80 บาท ลดทันที 5 บาท)',
        image: '/products/j3a-discord-bundle.jpg',
        images: ['/products/j3a-discord-bundle.jpg'],
        items: [
          {
            productId: 'j3a-discord-profile',
            name: 'J3A Discord Profile',
            price: 30,
            image: '/products/j3a-discord-profile.jpg',
          },
          {
            productId: 'j3a-discord-manager',
            name: 'J3ADiscordManager',
            price: 50,
            image: '/products/j3a-discord-manager.jpg',
          },
        ],
        price: 75,
        stock: 999,
        status: 'active',
        featured: true,
        tags: ['bundle', 'discord', 'software', 'discount'],
      });
      success('สร้างแพ็กเกจ J3A Discord Ultimate Bundle สำเร็จแล้ว!');
      await loadBundles();
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการสร้างบันเดิล: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredBundles = bundles.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-cyan-400" />
            <span>จัดการแพ็กเกจบันเดิล (Bundle Packages)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            จัดเซ็ตสินค้าหลายรายการในราคาพิเศษเพื่อกระตุ้นยอดขาย
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadBundles}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            รีเฟรช
          </Button>

          <Link href="/admin/bundles/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              สร้างแพ็กเกจ Bundle ใหม่
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาแพ็กเกจ..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 outline-none"
          />
        </div>

        <div className="text-xs text-slate-400">
          ทั้งหมด <strong className="text-white font-bold">{bundles.length}</strong> แพ็กเกจ
        </div>
      </div>

      {/* Bundles Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-slate-900/60 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
          กำลังโหลดข้อมูลแพ็กเกจบันเดิล...
        </div>
      ) : filteredBundles.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-slate-900/60 border border-slate-800 rounded-2xl">
          <Layers className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="font-bold text-slate-300 mb-1">ยังไม่มีแพ็กเกจ Bundle ในระบบ</p>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            คุณสามารถเลือกสินค้าอย่างน้อย 2 รายการในร้าน มาจัดโปรโมชันลดราคาพิเศษเป็นชุดได้
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/admin/bundles/new">
              <Button variant="primary" size="md">
                สร้าง Bundle แรกเลย
              </Button>
            </Link>
            {bundles.length === 0 && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleSeedBundle}
                isLoading={isSeeding}
                leftIcon={<Sparkles className="w-4 h-4 text-cyan-400" />}
                className="text-xs font-bold border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 cursor-pointer"
              >
                🚀 นำเข้า J3A Discord Ultimate Bundle (75฿)
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.map((bundle) => {
            const isActive = bundle.status === 'active';
            return (
              <div
                key={bundle.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between backdrop-blur-md hover:border-cyan-500/40 transition-all duration-300 shadow-xl group"
              >
                <div>
                  {/* Image & Discount Header */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center p-3">
                    <SafeImage
                      src={bundle.image}
                      alt={bundle.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Discount Badge */}
                    {(bundle.discountPercent ?? 0) > 0 && (
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-rose-600 text-white shadow-lg">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          ลด {bundle.discountPercent || 0}%
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/90 text-slate-950 shadow-sm">
                          ประหยัด ฿{(bundle.savings ?? 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleToggleStatus(bundle)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isActive ? '● กำลังวางจำหน่าย' : '○ แบบร่าง (Draft)'}
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {bundle.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {bundle.description || 'ไม่มีคำอธิบาย'}
                      </p>
                    </div>

                    {/* Included Products List */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span>สินค้าในชุด ({bundle.items?.length || 0} ชิ้น):</span>
                        <span className="text-slate-500">
                          คงเหลือ {bundle.stock} ชุด
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {bundle.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative w-6 h-6 rounded overflow-hidden shrink-0 bg-slate-900">
                                <SafeImage src={item?.image || '/images/default-avatar.png'} alt={item?.name || 'สินค้า'} fill className="object-cover" />
                              </div>
                              <span className="text-slate-300 truncate text-[11px] font-medium">
                                {item?.name || 'สินค้า'}
                              </span>
                            </div>
                            <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                              ฿{(item?.price ?? 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Comparison */}
                    <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
                      <div className="text-xs text-slate-500">
                        จากราคาปกติ{' '}
                        <span className="line-through">฿{(bundle.originalPrice ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-cyan-400">
                          ฿{(bundle.price ?? 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/bundles/${bundle.id}/edit`}
                    className="flex-1"
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Edit className="w-3.5 h-3.5" />}
                      className="w-full text-xs"
                    >
                      แก้ไข
                    </Button>
                  </Link>

                  <button
                    onClick={() => setDeleteId(bundle.id)}
                    className="p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                    title="ลบแพ็กเกจนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบแพ็กเกจ Bundle"
        itemName={bundles.find((b) => b.id === deleteId)?.name || 'แพ็กเกจนี้'}
        isLoading={isDeleting}
      />
    </div>
  );
}
