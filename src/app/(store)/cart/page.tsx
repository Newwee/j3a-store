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
  CheckCircle2,
  Lock,
  Flame,
  CreditCard,
  Gift,
  HelpCircle,
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
        {/* Glow ambient background */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-900/90 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.3)] mx-auto">
            <ShoppingBag className="w-14 h-14 sm:w-16 sm:h-16" />
            <Sparkles className="w-6 h-6 text-pink-400 absolute top-3 right-3 animate-bounce" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
          ตะกร้าสินค้าของคุณยังว่างอยู่
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          คุณยังไม่ได้เลือกสินค้าใดๆ เข้ามาในตะกร้า เริ่มต้นสำรวจโปรแกรม บอท หรือแพ็กเกจสุดคุ้มจาก J3A STORE ได้เลย!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Link href="/shop" className="w-full sm:w-auto">
            <Button
              variant="neon"
              size="lg"
              className="w-full sm:w-auto shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              ไปยังหน้าร้านค้า (Shop)
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto cursor-pointer">
              กลับหน้าแรก
            </Button>
          </Link>
        </div>

        {/* Guarantees */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="flex items-center sm:flex-col sm:text-center gap-2.5 p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">จัดส่งอัตโนมัติ</p>
              <p className="text-[11px] text-slate-400">รับสินค้าทันที 24 ชม.</p>
            </div>
          </div>
          <div className="flex items-center sm:flex-col sm:text-center gap-2.5 p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">รับประกันแท้ 100%</p>
              <p className="text-[11px] text-slate-400">ดูแลตลอดอายุการใช้งาน</p>
            </div>
          </div>
          <div className="flex items-center sm:flex-col sm:text-center gap-2.5 p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">ราคาสุดคุ้ม</p>
              <p className="text-[11px] text-slate-400">โปรโมชั่นและ Bundle พิเศษ</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1: Active */}
            <div className="flex items-center gap-2 sm:gap-3 text-cyan-400">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                1
              </div>
              <span className="font-bold text-xs sm:text-sm">ตะกร้าสินค้า</span>
            </div>

            <div className="flex-1 h-[2px] mx-3 sm:mx-6 bg-slate-800 relative">
              <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-cyan-500 to-transparent" />
            </div>

            {/* Step 2: Next */}
            <div className="flex items-center gap-2 sm:gap-3 text-slate-500">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                2
              </div>
              <span className="font-medium text-xs sm:text-sm hidden xs:inline">ชำระเงิน</span>
            </div>

            <div className="flex-1 h-[2px] mx-3 sm:mx-6 bg-slate-800" />

            {/* Step 3: Done */}
            <div className="flex items-center gap-2 sm:gap-3 text-slate-500">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                3
              </div>
              <span className="font-medium text-xs sm:text-sm hidden xs:inline">รับสินค้าอัตโนมัติ</span>
            </div>
          </div>
        </div>

        {/* Page Header */}
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
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm">
                    {totalItems} รายการ
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  ตรวจสอบและปรับเปลี่ยนจำนวนสินค้าก่อนดำเนินการชำระเงิน
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3.5 py-2 rounded-xl hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างตะกร้าทั้งหมด</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-3.5">
              {items.map((item) => {
                const isBundle =
                  item.product.name.toLowerCase().includes('bundle') ||
                  item.product.id.startsWith('bundle_') ||
                  (item.product.tags && item.product.tags.includes('bundle'));

                return (
                  <div
                    key={item.product.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 backdrop-blur-md transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group shadow-md hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden"
                  >
                    {/* Left Accent indicator for bundle */}
                    {isBundle && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 via-rose-500 to-indigo-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                    )}

                    {/* Item Image and Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 p-2 flex items-center justify-center shadow-inner">
                        <SafeImage
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isBundle ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                              <Flame className="w-3 h-3 fill-current" />
                              แพ็กเกจบันเดิลพิเศษ
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                              {item.product.category || 'สินค้าทั่วไป'}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <Zap className="w-2.5 h-2.5" /> ส่งมอบอัตโนมัติ
                          </span>
                        </div>

                        <Link
                          href={`/products/${item.product.slug}`}
                          className="text-sm sm:text-base font-black text-white hover:text-cyan-400 transition-colors line-clamp-1 mt-1 block"
                          title={item.product.name}
                        >
                          {item.product.name}
                        </Link>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-cyan-400 font-bold">
                            {formatCurrency(item.product.price)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">/ ชิ้น</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Total Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      {/* Counter */}
                      <div className="flex items-center border border-slate-700/80 rounded-xl bg-slate-950/90 overflow-hidden shadow-inner">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-black text-white min-w-[28px] text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right min-w-[100px]">
                        <span className="text-base sm:text-lg font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.35)] font-mono">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                        title="ลบออกจากตะกร้า"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 flex items-center justify-between">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors px-3 py-2 rounded-xl hover:bg-slate-900/60 border border-transparent hover:border-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>เลือกซื้อสินค้าเพิ่มเติม</span>
              </Link>

              <span className="text-xs text-slate-500">
                รวมทั้งหมด <strong className="text-white">{totalItems}</strong> ชิ้น
              </span>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-2xl space-y-5 sticky top-28 shadow-2xl relative overflow-hidden">
              {/* Neon top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]" />

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-black text-white tracking-tight">
                  สรุปคำสั่งซื้อ
                </h2>
                <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  {totalItems} รายการ
                </span>
              </div>

              {/* Price Details */}
              <div className="space-y-3 text-xs text-slate-400 border-b border-slate-800 pb-4">
                <div className="flex justify-between">
                  <span>ยอดรวมสินค้า</span>
                  <span className="text-slate-200 font-semibold font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ค่าบริการจัดส่ง</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px]">
                    ฟรี (จัดส่งอัตโนมัติ)
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-pink-400" />
                    โค้ดส่วนลด / Redeem
                  </span>
                  <span className="text-slate-400">ใส่ได้ในหน้าชำระเงิน</span>
                </div>
              </div>

              {/* Total Row */}
              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <span className="text-sm font-black text-white block">ยอดสุทธิที่ต้องชำระ</span>
                  <span className="text-[10px] text-slate-500">รวมภาษีและค่าบริการแล้ว</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.45)] font-mono">
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Checkout CTA */}
              <Link href="/checkout" className="block w-full">
                <Button
                  variant="neon"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="w-full font-black text-base shadow-[0_0_30px_rgba(6,182,212,0.45)] justify-center cursor-pointer py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                >
                  ดำเนินการชำระเงินทันที
                </Button>
              </Link>

              {/* Trust Badges */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ชำระเงินปลอดภัย รองรับ PromptPay & Wallet</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>ระบบส่งมอบไฟล์ / รหัสอัตโนมัติ 24 ชม.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>ความปลอดภัยระดับสูงด้วย Supabase Database</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
