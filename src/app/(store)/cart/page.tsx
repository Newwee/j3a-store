'use client';

import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

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
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12 text-cyan-400" />}
          title="ตะกร้าสินค้าของคุณยังว่างเปล่า"
          description="คุณยังไม่ได้เลือกสินค้าใดๆ เข้ามาในตะกร้า เริ่มค้นหาสินค้าและบริการที่ต้องการได้เลย"
          actionText="ไปยังหน้าร้านค้า"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-cyan-400" />
              <span>ตะกร้าสินค้า ({totalItems})</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ตรวจสอบรายการสินค้าของคุณก่อนดำเนินการชำระเงิน
            </p>
          </div>

          <button
            onClick={clearCart}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors"
          >
            ล้างตะกร้าทั้งหมด
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md divide-y divide-slate-800/80">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Item Image and Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/60 shrink-0">
                      <SafeImage
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">
                        {item.product.category}
                      </span>
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="text-sm sm:text-base font-bold text-white hover:text-cyan-400 transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-cyan-400 font-bold mt-1">
                        {formatCurrency(item.product.price)} / ชิ้น
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Total Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="flex items-center border border-slate-700 rounded-xl bg-slate-950/80">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <span className="text-sm sm:text-base font-extrabold text-white">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="ลบออกจากตะกร้า"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>เลือกซื้อสินค้าเพิ่มเติม</span>
            </Link>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5 sticky top-28">
              <h2 className="text-base font-bold text-white">สรุปคำสั่งซื้อ</h2>

              <div className="space-y-3 text-xs text-slate-400 border-b border-slate-800 pb-4">
                <div className="flex justify-between">
                  <span>ยอดรวมสินค้า ({totalItems} ชิ้น)</span>
                  <span className="text-slate-200 font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าจัดส่ง / ค่าบริการ</span>
                  <span className="text-slate-200 font-semibold">
                    {shipping === 0 ? (
                      <span className="text-emerald-400">ฟรี (โปรโมชั่น)</span>
                    ) : (
                      formatCurrency(shipping)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-white">ยอดสุทธิที่ต้องชำระ</span>
                <span className="text-2xl font-black text-cyan-400">
                  {formatCurrency(total)}
                </span>
              </div>

              <Link href="/checkout" className="block w-full">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="w-full font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                >
                  ดำเนินการชำระเงิน
                </Button>
              </Link>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ชำระเงินปลอดภัยด้วยระบบเข้ารหัส SSL 256-bit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
