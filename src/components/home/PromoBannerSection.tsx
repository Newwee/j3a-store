'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight, Zap, ShieldAlert, Gift } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PromoBannerSection() {
  // ซ่อนไว้ก่อน ณ ตอนนี้ทางร้านยังไม่มีโปรโมชั่นนี้
  return null;

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/70 border border-cyan-500/30 p-8 sm:p-12 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
          {/* Background Decorative Rings */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Promo Content */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5" />
                <span>SPECIAL PROMOTION 2026</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                เติมเงินหรือสั่งซื้อครั้งแรก <br className="hidden sm:block" />
                รับโบนัสเครดิตเพิ่มทันที <span className="text-cyan-400">+5%</span>
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                เพียงสมัครสมาชิกใหม่และเลือกซื้อสินค้าในระบบ J3A STORE รับสิทธิ์สะสมคะแนนอัปเกรดระดับบัญชีสู่ Silver & Gold ทันที เพื่อรับส่วนลดพิเศษตลอดชีพ
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link href="/register">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    สมัครสมาชิกรับสิทธิ์
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button variant="outline" size="md">
                    ดูโปรโมชั่นทั้งหมด
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Logo / Emblem */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                <Image
                  src="/logo.png"
                  alt="J3A Promotion"
                  fill
                  className="object-contain filter drop-shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
