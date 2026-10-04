'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Package,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    shipping,
    total,
    totalItems,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  // Prevent background scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-slate-950/95 border-l border-cyan-500/20 backdrop-blur-2xl shadow-[-20px_0_60px_rgba(6,182,212,0.15)] flex flex-col z-10 animate-in slide-in-from-right duration-300 relative overflow-hidden">
          {/* Top Neon Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />

          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)] animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white tracking-tight">
                    ตะกร้าสินค้า
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                    {totalItems} รายการ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">J3A STORE • Digital Commerce</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  ล้างตะกร้า
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all cursor-pointer group"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* Cart Content Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar">
            {items.length === 0 ? (
              /* Elevated Cyber Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                <div className="relative">
                  {/* Outer Pulsing Glow Ring */}
                  <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
                  
                  {/* Glowing Box */}
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.25)]">
                    <ShoppingBag className="w-12 h-12" />
                    <Sparkles className="w-5 h-5 text-pink-400 absolute top-2 right-2 animate-bounce" />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-lg font-black text-white tracking-tight">
                    ตะกร้าสินค้ายังว่างอยู่
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    คุณยังไม่ได้เลือกสินค้าใดๆ เข้ามา เลือกชมโปรแกรม บอท หรือแพ็กเกจสุดคุ้มในราคาพิเศษได้เลย!
                  </p>
                </div>

                {/* Quick Action Navigation */}
                <div className="w-full space-y-2 pt-2">
                  <Link
                    href="/shop"
                    onClick={() => setIsCartOpen(false)}
                    className="block w-full"
                  >
                    <Button
                      variant="neon"
                      size="md"
                      className="w-full justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      เลือกชมสินค้าในร้านค้า (Shop)
                    </Button>
                  </Link>

                  <Link
                    href="/shop"
                    onClick={() => setIsCartOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition-all group"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      ดูแพ็กเกจรวมสุดคุ้ม (Bundles)
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-400 w-full">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>จัดส่งอัตโนมัติ 24 ชม.</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>รับประกันแท้ 100%</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Cart Items List */
              <div className="space-y-3">
                {items.map((item) => {
                  const isBundle =
                    item.product.name.toLowerCase().includes('bundle') ||
                    item.product.id.startsWith('bundle_') ||
                    (item.product.tags && item.product.tags.includes('bundle'));

                  return (
                    <div
                      key={item.product.id}
                      className="relative p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 flex gap-3.5 group shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 p-1.5 flex items-center justify-center">
                        <SafeImage
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                                {isBundle ? (
                                  <>
                                    <Layers className="w-3 h-3 text-pink-400" />
                                    <span className="text-pink-400">แพ็กเกจบันเดิล</span>
                                  </>
                                ) : (
                                  item.product.category
                                )}
                              </span>
                              <Link
                                href={`/products/${item.product.slug}`}
                                onClick={() => setIsCartOpen(false)}
                                className="text-xs sm:text-sm font-bold text-white hover:text-cyan-400 line-clamp-1 transition-colors mt-0.5 block"
                                title={item.product.name}
                              >
                                {item.product.name}
                              </Link>
                            </div>

                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-xs text-cyan-300 font-extrabold mt-1">
                            {formatCurrency(item.product.price)}
                            <span className="text-[10px] text-slate-500 font-normal ml-1">/ ชิ้น</span>
                          </p>
                        </div>

                        {/* Quantity Stepper & Subtotal */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center border border-slate-700/80 rounded-xl bg-slate-950/80 overflow-hidden shadow-inner">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1.5 hover:text-cyan-400 text-slate-400 hover:bg-slate-800 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-black text-white min-w-[24px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="p-1.5 hover:text-cyan-400 text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-900/60 backdrop-blur-xl space-y-3.5 shadow-2xl">
              {/* Pricing Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>ยอดรวมสินค้า ({totalItems} ชิ้น)</span>
                  <span className="text-slate-200 font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>การจัดส่ง</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px]">
                    ฟรี (จัดส่งอัตโนมัติ)
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-800 text-white font-bold">
                  <span className="text-sm">ยอดชำระสุทธิ</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="block w-full"
                >
                  <Button
                    variant="neon"
                    size="lg"
                    className="w-full justify-center font-black shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    ชำระเงินทันที (Checkout)
                  </Button>
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="block w-full"
                >
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full justify-center text-xs font-bold text-slate-300 hover:text-white"
                  >
                    ดูตะกร้าสินค้าฉบับเต็ม
                  </Button>
                </Link>
              </div>

              {/* Guarantees */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" /> ชำระเงินปลอดภัย 100%
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> ได้รับสินค้าทันที
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
