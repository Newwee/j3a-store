'use client';

import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    shipping,
    total,
    totalItems,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 sm:py-24 max-w-4xl mx-auto px-4 text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
          <div className="relative w-28 h-28 rounded-3xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.25)] mx-auto">
            <ShoppingBag className="w-14 h-14" />
            <Sparkles className="w-6 h-6 text-pink-400 absolute top-3 right-3 animate-bounce" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          ตะกร้าสินค้าของคุณยังว่างอยู่
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          คุณยังไม่ได้เลือกสินค้าใดๆ เข้ามาในตะกร้า เริ่มต้นสำรวจโปรแกรม บอท หรือแพ็กเกจสุดคุ้มจาก J3A STORE ได้เลย!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Link href="/shop" className="w-full sm:w-auto">
            <Button variant="neon" size="lg" className="w-full sm:w-auto shadow-[0_0_20px_rgba(6,182,212,0.35)]">
              <Sparkles className="w-4 h-4 mr-2" />
              ไปยังหน้าร้านค้า (Shop)
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              กลับหน้าแรก
            </Button>
          </Link>
        </div>

        {/* Guarantees */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 max-w-lg mx-auto grid grid-cols-3 gap-4 text-[11px] text-slate-400">
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>จัดส่งอัตโนมัติ 24 ชม.</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>รับประกันแท้ 100%</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>ราคาสุดคุ้ม</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    ตะกร้าสินค้า
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                    {totalItems} รายการ
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  ตรวจสอบและปรับเปลี่ยนจำนวนสินค้าก่อนดำเนินการชำระเงิน
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-xl hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
            >
              ล้างตะกร้าทั้งหมด
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-3">
              {items.map((item) => {
                const isBundle =
                  item.product.name.toLowerCase().includes('bundle') ||
                  item.product.id.startsWith('bundle_') ||
                  (item.product.tags && item.product.tags.includes('bundle'));

                return (
                  <div
                    key={item.product.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 backdrop-blur-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group shadow-sm hover:shadow-[0_0_25px_rgba(6,182,212,0.1)]"
                  >
                    {/* Item Image and Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 p-2 flex items-center justify-center">
                        <SafeImage
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                          {isBundle ? (
                            <>
                              <Layers className="w-3.5 h-3.5 text-pink-400" />
                              <span className="text-pink-400 font-extrabold">แพ็กเกจบันเดิลพิเศษ</span>
                            </>
                          ) : (
                            item.product.category
                          )}
                        </span>
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="text-sm sm:text-base font-bold text-white hover:text-cyan-400 transition-colors line-clamp-1 mt-0.5"
                          title={item.product.name}
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-cyan-400 font-bold mt-1">
                          {formatCurrency(item.product.price)}
                          <span className="text-[10px] text-slate-500 font-normal ml-1">/ ชิ้น</span>
                        </p>
                      </div>
                    </div>

                    {/* Quantity & Total Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="flex items-center border border-slate-700/80 rounded-xl bg-slate-950/80 overflow-hidden shadow-inner">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-black text-white min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <span className="text-base sm:text-lg font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="ลบออกจากตะกร้า"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-xl hover:bg-slate-900/60"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>เลือกซื้อสินค้าเพิ่มเติม</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-5 sticky top-28 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-black text-white tracking-tight">
                  สรุปคำสั่งซื้อ
                </h2>
                <span className="text-xs text-cyan-400 font-bold">
                  {totalItems} รายการ
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-400 border-b border-slate-800 pb-4">
                <div className="flex justify-between">
                  <span>ยอดรวมสินค้า</span>
                  <span className="text-slate-200 font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>การจัดส่ง</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px]">
                    ฟรี (จัดส่งอัตโนมัติ)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-white">ยอดสุทธิที่ต้องชำระ</span>
                <span className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  {formatCurrency(total)}
                </span>
              </div>

              <Link href="/checkout" className="block w-full">
                <Button
                  variant="neon"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="w-full font-black shadow-[0_0_25px_rgba(6,182,212,0.4)] justify-center"
                >
                  ดำเนินการชำระเงินทันที
                </Button>
              </Link>

              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ชำระเงินปลอดภัย รองรับ PromptPay & Wallet</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>ระบบส่งมอบไฟล์ / รหัสอัตโนมัติทันที</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
