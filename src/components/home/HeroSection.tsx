'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Zap, Sparkles, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import dynamic from 'next/dynamic';
import CardSwap, { Card } from '@/components/ui/CardSwap';
import { ShowcaseVideoCard } from '@/components/home/ShowcaseVideoCard';
import { getStoreSettings } from '@/lib/firestore/settings';
import { StoreSettings } from '@/types/settings';

const ASCIIText = dynamic(() => import('@/components/ui/ASCIIText'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center lg:justify-start">
      <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 tracking-wider">
        J3A STORE
      </span>
    </div>
  ),
});

const ElectricLogo = dynamic(() => import('@/components/ui/ElectricLogo'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Image
        src="/Logo2.png"
        alt="J3A STORE Logo"
        width={320}
        height={320}
        className="w-56 sm:w-64 object-contain opacity-80"
        priority
      />
    </div>
  ),
});

export function HeroSection() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    let isMounted = true;
    getStoreSettings()
      .then((res) => {
        if (isMounted) setSettings(res);
      })
      .catch((err) => {
        console.warn('Failed to load store settings for showcase:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Soft ambient atmospheric glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

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
              <span>{t('hero_new_version', 'เวอร์ชันใหม่เปิดให้บริการแล้ว! ระบบอัตโนมัติ 24 ชม.')}</span>
            </div>

            {/* Main Headline with ASCIIText */}
            <div className="w-full h-36 sm:h-44 lg:h-52 relative flex items-center justify-center lg:justify-start -my-2 overflow-hidden">
              <ASCIIText
                text="J3A STORE"
                enableWaves={false}
                asciiFontSize={6}
              />
            </div>

            {/* Sub-headline badge */}
            <div className="flex items-center justify-center lg:justify-start gap-2 -mt-2">
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                {t('hero_title_tag', 'Next-Gen E-Commerce & Digital Store')}
              </span>
            </div>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t('hero_description', 'สัมผัสประสบการณ์ช้อปปิ้งยุคใหม่ที่ J3A STORE ศูนย์รวมไอเทมเกม บัตรเติมเงิน และบริการดิจิทัลระดับพรีเมียม ทำรายการรวดเร็ว ปลอดภัย ด้วยระบบตรวจสอบอัตโนมัติ')}
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
                  {t('hero_shop_now', 'เลือกซื้อสินค้า (Shop Now)')}
                </Button>
              </Link>
              <Link href="/profile?tab=topup">
                <Button variant="secondary" size="lg" className="px-6 cursor-target">
                  {t('hero_topup_wallet', 'เติมเครดิตบัญชี')}
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

          {/* Right Column: 3D CardSwap (YouTube Showcase & Electric Logo) */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[500px]">
            <CardSwap
              width={460}
              height={460}
              cardDistance={35}
              verticalDistance={30}
              delay={5000}
              pauseOnHover={true}
              skewAmount={4}
              easing="elastic"
            >
              {/* Card 1: YouTube Showcase (Shown FIRST when entering website) */}
              <Card customClass="w-full h-full">
                <ShowcaseVideoCard
                  youtubeUrl={settings?.showcaseYoutubeUrl}
                  title={settings?.showcaseTitle}
                  subtitle={settings?.showcaseSubtitle}
                />
              </Card>

              {/* Card 2: Electric Logo */}
              <Card customClass="w-full h-full rounded-3xl overflow-hidden border border-cyan-500/40 bg-slate-950/85 shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col items-center justify-between relative p-4 select-none">
                {/* Header Tag */}
                <div className="w-full flex items-center justify-between z-10">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-extrabold text-[10px] tracking-wider uppercase shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                    J3A STORE • OFFICIAL
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Next-Gen Store
                  </span>
                </div>

                {/* Electric Logo Animation */}
                <div className="w-full flex-1 flex items-center justify-center my-auto scale-90 sm:scale-100">
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

                {/* Footer Tag */}
                <div className="w-full text-center z-10 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
                    Automated Digital Delivery • 24/7
                  </span>
                </div>
              </Card>
            </CardSwap>
          </div>
        </div>
      </div>
    </section>
  );
}
