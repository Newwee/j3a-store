'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Zap, Sparkles, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ShapeWaves } from '@/components/ui/ShapeWaves';
import ParticleText from '@/components/ui/ParticleText';
import ElectricLogo from '@/components/ui/ElectricLogo';

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

            {/* Main Headline with ParticleText */}
            <div className="w-full h-24 sm:h-28 lg:h-32 relative flex items-center justify-center lg:justify-start">
              <ParticleText
                text="J3A STUDIO"
                fontSize="clamp(2.4rem, 5.5vw, 4.2rem)"
                color="#06b6d4"
                highlightColor="#a855f7"
                particleSize={2.4}
                density={3}
                glow={true}
              />
            </div>

            {/* Sub-headline badge */}
            <div className="flex items-center justify-center lg:justify-start gap-2 -mt-2">
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                Next-Gen E-Commerce & Digital Store
              </span>
            </div>

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
                  className="px-8 shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-target"
                >
                  เลือกซื้อสินค้า (Shop Now)
                </Button>
              </Link>
              <Link href="/profile?tab=topup">
                <Button variant="secondary" size="lg" className="px-6 cursor-target">
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

          {/* Right Column: ElectricLogo with Logo2.png */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div
              style={{ width: '100%', height: '480px', position: 'relative' }}
              className="rounded-3xl overflow-hidden border border-cyan-500/30 bg-slate-950/70 shadow-[0_0_50px_rgba(255,82,96,0.25)] flex items-center justify-center"
            >
              <ElectricLogo
                src="/Logo2.png"
                color="#ffcdd2"
                glowColor="#ff5260"
                scale={0.7}
                strands={4}
                bend={0.6}
                crackle={1.5}
                arcs={0.4}
                speed={2.5}
                interactive
                intensity={1}
                glow={1}
                thickness={1.5}
                flicker={0.6}
                fill={0}
                cursorIntensity={0.75}
                cursorRadius={100}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
