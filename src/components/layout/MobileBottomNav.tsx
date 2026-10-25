'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Store, CreditCard, ShoppingCart, User, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { t } = useLanguage();

  const isHome = pathname === '/';
  const isShop = pathname.startsWith('/shop') || pathname.startsWith('/products');
  const isProfile = pathname.startsWith('/profile');
  const isLoginOrRegister = pathname === '/login' || pathname === '/register';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/92 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] select-none"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        contain: 'paint layout',
      }}
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around px-2 pt-2">
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 ${
            isHome ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Home className="w-5 h-5 transition-transform duration-200" />
            {isHome && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 font-bold tracking-tight ${isHome ? 'text-cyan-400' : 'text-slate-400'}`}>
            {t('nav_home', 'หน้าแรก')}
          </span>
        </Link>

        {/* 2. Shop */}
        <Link
          href="/shop"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 ${
            isShop ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Store className="w-5 h-5 transition-transform duration-200" />
            {isShop && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 font-bold tracking-tight ${isShop ? 'text-cyan-400' : 'text-slate-400'}`}>
            {t('nav_shop', 'ร้านค้า')}
          </span>
        </Link>

        {/* 3. Top-Up (Center Feature Pill) */}
        <Link
          href="/profile?tab=topup"
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 text-amber-400 hover:text-amber-300"
        >
          <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-amber-500/20 to-yellow-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-ping" />
          </div>
          <span className="text-[10px] mt-1 font-black text-amber-300 tracking-tight">
            เติมเงิน
          </span>
        </Link>

        {/* 4. Cart Button */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 text-slate-400 hover:text-slate-200 relative cursor-pointer"
          aria-label={`เปิดตะกร้าสินค้า มีสินค้า ${totalItems} ชิ้น`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[9px] font-black flex items-center justify-center border border-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-bold tracking-tight text-slate-400">
            {t('nav_cart', 'ตะกร้า')}
          </span>
        </button>

        {/* 5. Account / Profile */}
        {user ? (
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 ${
              isProfile ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative w-5 h-5 rounded-full overflow-hidden border border-slate-700">
              {profile?.photoURL || user.photoURL ? (
                <Image
                  src={profile?.photoURL || user.photoURL || ''}
                  alt="User Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-cyan-950 flex items-center justify-center text-[10px] font-black text-cyan-300">
                  {(profile?.displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {isProfile && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
            <span className={`text-[10px] mt-1 font-bold tracking-tight truncate max-w-[56px] ${isProfile ? 'text-cyan-400' : 'text-slate-400'}`}>
              โปรไฟล์
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 ${
              isLoginOrRegister ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <LogIn className="w-5 h-5" />
              {isLoginOrRegister && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
            <span className={`text-[10px] mt-1 font-bold tracking-tight ${isLoginOrRegister ? 'text-cyan-400' : 'text-slate-400'}`}>
              {t('nav_login', 'เข้าสู่ระบบ')}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
