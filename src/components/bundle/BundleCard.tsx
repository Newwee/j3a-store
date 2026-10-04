'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  ShoppingCart,
  Sparkles,
  Flame,
  CheckCircle2,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { BundlePackage } from '@/types/bundle';
import { bundleToProduct } from '@/lib/firestore/bundles';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { SafeImage } from '@/components/ui/SafeImage';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { GlareHover } from '@/components/ui/GlareHover';

interface BundleCardProps {
  bundle: BundlePackage;
}

export function BundleCard({ bundle }: BundleCardProps) {
  const { addItem, setIsCartOpen } = useCart();
  const { success, toast } = useToast();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);

  const isOutOfStock = bundle.stock <= 0 || bundle.status === 'out_of_stock';

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isOutOfStock) {
      toast('แพ็กเกจนี้สินค้าหมดชั่วคราว', 'error');
      return;
    }
    const productRepresentation = bundleToProduct(bundle);
    addItem(productRepresentation, 1);
    success(`เพิ่มแพ็กเกจ "${bundle.name}" ลงในตะกร้าแล้ว`);
    setIsCartOpen(true);
  };

  return (
    <>
      <GlareHover className="group relative flex flex-col rb-card overflow-hidden transition-all duration-300 border-cyan-500/20 hover:border-cyan-500/50 shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]">
        {/* Top Image Banner */}
        <div className="relative w-full aspect-video bg-slate-950/80 overflow-hidden flex items-center justify-center p-3">
          <SafeImage
            src={bundle.image}
            alt={bundle.name}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges on top left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.5)]">
              <Flame className="w-3.5 h-3.5 fill-current" />
              ลด {bundle.discountPercent || 0}%
            </span>
            {(bundle.savings ?? 0) > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 shadow-sm">
                ประหยัด ฿{(bundle.savings ?? 0).toLocaleString()}
              </span>
            )}
          </div>

          {/* Bundle Tag on top right */}
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-900/90 border border-cyan-500/40 text-cyan-300 backdrop-blur-sm shadow-md">
              <Layers className="w-3 h-3 text-cyan-400" />
              {bundle.items?.length || 0} ชิ้นในชุด
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> แนะนำพิเศษ
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {isOutOfStock ? (
                  <span className="text-rose-400 font-bold">สินค้าหมด</span>
                ) : (
                  <span>คงเหลือ {bundle.stock} ชุด</span>
                )}
              </span>
            </div>

            <Link href={`/products/${bundle.slug || bundle.id}`} className="block group/link">
              <h3 className="font-black text-sm sm:text-base text-white group-hover/link:text-cyan-400 transition-colors line-clamp-1 leading-snug">
                {bundle.name}
              </h3>
            </Link>

            {/* Bundle Rating & Review Link */}
            <div className="flex items-center gap-2 mt-1.5">
              <Link
                href={`/products/${bundle.slug || bundle.id}?openReview=true`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors group/rate"
                title="กดเพื่อให้คะแนนหรือดูรีวิวแพ็กเกจนี้"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{((bundle as any).rating || 5.0).toFixed(1)}</span>
                <span className="text-[10px] text-slate-400 font-normal group-hover/rate:text-cyan-400 underline ml-0.5">
                  ({(bundle as any).reviewCount || 0} รีวิว • ให้คะแนน ⭐)
                </span>
              </Link>
            </div>

            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {bundle.description || 'แพ็กเกจรวมสินค้าสุดคุ้มในราคาพิเศษ'}
            </p>
          </div>

          {/* Included Products Mini Accordion / Preview */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowItemsDropdown(!showItemsDropdown)}
              className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-cyan-300 font-medium py-1 transition-colors cursor-pointer"
            >
              <span>ดูรายการในแพ็กเกจ ({bundle.items?.length} ชิ้น)</span>
              {showItemsDropdown ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showItemsDropdown && (
              <div className="mt-2 space-y-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs animate-in fade-in duration-200">
                {bundle.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span className="text-slate-300 truncate">{item?.name || 'สินค้า'}</span>
                    </div>
                    <span className="text-slate-500 font-mono shrink-0">
                      ฿{(item?.price ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Add to Cart */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-slate-500 line-through">
                ฿{(bundle.originalPrice ?? 0).toLocaleString()}
              </div>
              <div className="text-lg sm:text-xl font-black text-cyan-400 leading-tight">
                ฿{(bundle.price ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="ดูรายละเอียดแพ็กเกจ"
              >
                <Eye className="w-4 h-4" />
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                leftIcon={<ShoppingCart className="w-4 h-4" />}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                ใส่ตะกร้า
              </Button>
            </div>
          </div>
        </div>
      </GlareHover>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={bundle.name}
      >
        <div className="space-y-4 pt-2">
          <div className="relative aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden border border-slate-800">
            <SafeImage src={bundle.image} alt={bundle.name} fill className="object-contain p-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-lg bg-rose-600 text-white">
                ลด {bundle.discountPercent || 0}%
              </span>
              {(bundle.savings ?? 0) > 0 && (
                <span className="text-xs font-bold text-cyan-400">
                  ประหยัด ฿{(bundle.savings ?? 0).toLocaleString()} บาท
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {bundle.description || 'แพ็กเกจสุดคุ้มรวมสินค้าหลายรายการ'}
            </p>
          </div>

          {/* Included Items Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              สินค้าที่รวมอยู่ในแพ็กเกจนี้:
            </h4>
            <div className="space-y-2">
              {bundle.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                      <SafeImage src={item?.image || '/images/default-avatar.png'} alt={item?.name || 'สินค้า'} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate">{item?.name || 'สินค้า'}</p>
                      <p className="text-[10px] text-slate-400">{item?.category || 'สินค้าทั่วไป'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-300 font-mono shrink-0">
                    ฿{(item?.price ?? 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total & Action */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">
                ราคาปกติ ฿{(bundle.originalPrice ?? 0).toLocaleString()}
              </span>
              <span className="text-xl font-black text-cyan-400">
                พิเศษเพียง ฿{(bundle.price ?? 0).toLocaleString()}
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                handleAddToCart();
                setShowDetailModal(false);
              }}
              disabled={isOutOfStock}
              leftIcon={<ShoppingCart className="w-4 h-4" />}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              สั่งซื้อแพ็กเกจนี้
            </Button>
          </div>

          {/* Action to Go to Detail & Review Page */}
          <div className="pt-2 border-t border-slate-800/60">
            <Link
              href={`/products/${bundle.slug || bundle.id}?openReview=true`}
              onClick={() => setShowDetailModal(false)}
              className="block"
            >
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                className="w-full text-xs font-bold border-amber-500/30 text-amber-300 hover:bg-amber-500/10 justify-center cursor-pointer"
              >
                ⭐ ดูหน้ารายละเอียด & ให้คะแนนแพ็กเกจนี้
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
