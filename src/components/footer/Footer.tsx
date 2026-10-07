'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Zap, Headphones, Sparkles, Send, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface FooterProps {
  footerDescription?: string;
}

export function Footer({ footerDescription }: FooterProps = {}) {
  const { t, language } = useLanguage();
  const [desc, setDesc] = React.useState<string | undefined>(footerDescription);

  React.useEffect(() => {
    if (footerDescription !== undefined) {
      setDesc(footerDescription);
      return;
    }
    import('@/lib/firestore/settings').then(({ getStoreSettings }) => {
      getStoreSettings()
        .then((s) => {
          if (s?.footerDescription) setDesc(s.footerDescription);
        })
        .catch(() => {});
    });
  }, [footerDescription]);

  const defaultDescTh = 'แพลตฟอร์มศูนย์รวมสินค้าและบริการดิจิทัลชั้นนำ เติมเกม ไอดีเกม บัตรเติมเงิน และอุปกรณ์ระดับพรีเมียม ระบบอัตโนมัติ รวดเร็ว ปลอดภัย 100% พร้อมบริการตลอด 24 ชั่วโมง';
  const isCustomized = Boolean(desc && desc.trim() !== defaultDescTh.trim());
  const activeDesc = (language === 'en' && !isCustomized) ? t('footer_desc') : (desc || t('footer_desc'));

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group inline-flex">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Image
                  src="/logo.png"
                  alt="J3A STORE Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-wider text-white uppercase">
                  J3A STORE
                </span>
                <span className="text-[10px] tracking-widest text-cyan-400 font-bold -mt-1 uppercase">
                  Next-Gen Digital Store
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm whitespace-pre-line">
              {activeDesc}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> {t('footer_delivery_badge')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {t('footer_secure_badge')}
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('footer_menu_main')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  {language === 'th' ? 'หน้าแรก (Home)' : 'Home'}
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-cyan-400 transition-colors">
                  {language === 'th' ? 'ร้านค้าทั้งหมด (Shop)' : 'All Products / Shop'}
                </Link>
              </li>
              <li>
                <Link href="/shop?category=all" className="hover:text-cyan-400 transition-colors">
                  {language === 'th' ? 'หมวดหมู่สินค้า (Categories)' : 'Categories'}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-cyan-400 transition-colors">
                  {language === 'th' ? 'ตะกร้าสินค้า (Cart)' : 'Shopping Cart'}
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-cyan-400 transition-colors">
                  {language === 'th' ? 'ประวัติการสั่งซื้อ (Orders)' : 'Order History'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Policy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('footer_menu_help')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors">
                  {t('footer_about')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-cyan-400 transition-colors">
                  {t('footer_terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
                  {t('footer_privacy')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                  {t('footer_support')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Community & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('footer_menu_contact')}
            </h4>
            <p className="text-xs text-slate-400">
              {t('footer_contact_desc')}
            </p>
            <div className="flex flex-col gap-2 pt-1 text-xs">
              <a
                href="https://line.me/R/ti/p/@153nhgvs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:underline"
              >
                <MessageCircle className="w-4 h-4" /> LINE: @153nhgvs
              </a>
              <a
                href="https://discord.gg/UtWykPvTYF"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-indigo-400 hover:underline"
              >
                <Headphones className="w-4 h-4" /> Discord: J3A Community
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} J3A STORE. All rights reserved. Powered by Next.js & Supabase.</p>
          <div className="flex items-center gap-6">
            <span>Server Status: <span className="text-emerald-400 font-semibold">● {t('footer_server_online')}</span></span>
            <span>Version: 1.0.0 (Production)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
