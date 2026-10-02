'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Zap, Sparkles, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ShapeWaves } from '@/components/ui/ShapeWaves';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* ShapeWaves background banner */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
        <ShapeWaves cellSize={26} dotSize={0.65} speed={1.1} />
      </div>

      {/* Ambient background glow and grid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline and Call-to-actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Live Notification Pill */}
            <div className="rb-pill border-cyan-500/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>เวอร์ชันใหม่เปิดให้บริการแล้ว! ระบบอัตโนมัติ 24 ชม.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              NEXT-GEN{' '}
              <span className="text-shimmer">
                E-COMMERCE
              </span>{' '}
              & DIGITAL STORE
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              สัมผัสประสบการณ์ช้อปปิ้งยุคใหม่ที่ <strong className="text-cyan-400">J3A STORE</strong> ศูนย์รวมไอเทมเกม บัตรเติมเงิน และบริการดิจิทัลระดับพรีเมียม ทำรายการรวดเร็ว ปลอดภัย ด้วยระบบตรวจสอบอัตโนมัติ
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/shop">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="px-8 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                >
                  เลือกซื้อสินค้า (Shop Now)
                </Button>
              </Link>
              <Link href="/profile?tab=topup">
                <Button variant="secondary" size="lg" className="px-6">
                  เติมเครดิตบัญชี
                </Button>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-base">
                  <Zap className="w-4 h-4 text-cyan-400" /> &lt; 1 นาที
                </div>
                <span className="text-xs text-slate-400">จัดส่งระบบออโต้</span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-base">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% ปลอดภัย
                </div>
                <span className="text-xs text-slate-400">การันตีทุกคำสั่งซื้อ</span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-base">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.9 / 5.0
                </div>
                <span className="text-xs text-slate-400">รีวิวจากผู้ใช้จริง</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual with Official Logo and 3D Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Holographic Ring */}
            <div className="relative w-72 sm:w-80 lg:w-96 aspect-square rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/10 to-transparent p-1 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex items-center justify-center group">
              <div className="absolute inset-0 bg-slate-950/80 rounded-3xl backdrop-blur-xl" />

              {/* Central Logo */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 p-4 transition-transform duration-500 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="J3A STORE Emblem"
                  fill
                  className="object-contain filter drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]"
                  priority
                />
              </div>

              {/* Floating Badge 1 */}
              <div className="absolute -bottom-4 -left-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3 animate-bounce [animation-duration:4s]">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">ความเร็วจัดส่ง</p>
                  <p className="text-xs font-bold text-white">ทันที Real-time</p>
                </div>
              </div>

              {/* Floating Badge 2 */}
              <div className="absolute -top-4 -right-4 bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">ความปลอดภัย</p>
                  <p className="text-xs font-bold text-emerald-400">ยืนยันแท้ 100%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
