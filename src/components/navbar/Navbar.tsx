'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ShieldAlert,
  Sparkles,
  Layers,
  Store,
  Home,
  Moon,
  Sun,
  Laptop,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme, Theme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { UserDropdown } from './UserDropdown';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function Navbar() {
  const { isAdmin } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: t('nav_home', 'หน้าแรก'), icon: Home, exact: true },
    { href: '/shop', label: t('nav_shop', 'ร้านค้า'), icon: Store, exact: false },
    { href: '/shop?category=all', label: t('nav_categories', 'หมวดหมู่'), icon: Layers, exact: false },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-4">
            {/* 1. Brand Logo */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
                <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-transform duration-300 group-hover:scale-105 shrink-0">
                  <Image
                    src="/logo.png"
                    alt="J3A STORE Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent uppercase leading-tight">
                    J3A STORE
                  </span>
                  <span className="hidden sm:block text-[10px] tracking-widest text-cyan-400/80 font-bold -mt-0.5 uppercase">
                    Discord Software & Services
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links with Smooth Transition */}
              <nav className="hidden lg:flex items-center gap-1.5 ml-4 text-sm font-medium p-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = link.exact
                    ? pathname === link.href
                    : pathname.startsWith('/shop') && link.href.startsWith('/shop');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative px-4 py-2 rounded-xl transition-all duration-300 ease-out flex items-center gap-2 ${
                        isActive
                          ? 'text-cyan-300 font-bold bg-cyan-500/15 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'
                        }`}
                      />
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_6px_#22d3ee] animate-pulse" />
                      )}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all duration-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)] ml-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* 2. Search Bar (Desktop) */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-md mx-4 relative"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('nav_search_placeholder', 'ค้นหาซอฟต์แวร์ / บอท / สินค้าดิจิทัล...')}
                  className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder:text-slate-500 rounded-full pl-10 pr-4 py-2 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </form>

            {/* 3. Actions (Theme, Language, Cart & User) */}
            <div className="flex items-center gap-2">
              {/* Language Toggle Button (Desktop & Mobile) */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-slate-200 hover:text-white cursor-pointer group shadow-sm active:scale-95 text-xs font-bold flex items-center gap-1.5 select-none"
                title={language === 'th' ? 'Switch to English (EN)' : 'เปลี่ยนเป็น ภาษาไทย (TH)'}
                aria-label="Toggle language"
              >
                <span>{language === 'th' ? '🇹🇭 TH' : '🇺🇸 EN'}</span>
              </button>

              {/* Theme Toggle Button (Desktop & Mobile - Always accessible without login) */}
              <button
                type="button"
                onClick={() => {
                  const next = resolvedTheme === 'dark' ? 'light' : 'dark';
                  toggleTheme();
                  toast(
                    next === 'light'
                      ? '☀️ ' + t('toast_theme_light', 'เปลี่ยนเป็นโหมดสว่าง (Light Theme) - ถนอมสายตาแล้ว')
                      : '🌙 ' + t('toast_theme_dark', 'เปลี่ยนเป็นโหมดมืด (Dark Theme) แล้ว'),
                    'info',
                    2500
                  );
                }}
                className="p-2 sm:p-2.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-slate-200 hover:text-white cursor-pointer group shadow-sm active:scale-95"
                title={`คลิกเพื่อสลับธีม: ${resolvedTheme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง (สบายตา)' : 'เปลี่ยนเป็นโหมดมืด'}`}
                aria-label="Toggle theme for eye comfort"
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-slate-200 hover:text-white cursor-pointer group"
                aria-label={`Open shopping cart with ${totalItems} items`}
              >
                <ShoppingCart className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-in zoom-in-75">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Quick Top-Up Button (Desktop & Tablet) */}
              <Link
                href="/profile?tab=topup"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 hover:border-amber-300 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-[0_0_14px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] group active:scale-95 cursor-pointer"
                title="เติมเครดิตเข้ากระเป๋าเงิน (Top-up)"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>{language === 'th' ? 'เติมเงิน' : 'Top-Up'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              </Link>

              {/* User Profile Dropdown */}
              <UserDropdown />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (Below Header on mobile) */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเกม / บัตรเติมเงิน / สินค้า..."
                className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder:text-slate-500 rounded-full pl-10 pr-4 py-2 border border-slate-700/80 focus:border-cyan-400 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </form>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>หน้าแรก</span>
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Store className="w-4 h-4 text-cyan-400" />
              <span>ร้านค้าทั้งหมด</span>
            </Link>
            <Link
              href="/shop?category=all"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>หมวดหมู่สินค้า</span>
            </Link>
            <Link
              href="/profile?tab=topup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/15 border border-amber-400/40 hover:bg-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>เติมเครดิตบัญชี (Top-up Wallet)</span>
              </div>
              <span className="text-[10px] uppercase font-extrabold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                AUTO
              </span>
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>แผงควบคุม Admin Dashboard</span>
              </Link>
            )}

            {/* Theme & Eye Comfort Selector for Mobile Drawer (Accessible without login) */}
            <div className="pt-3 mt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                🎨 ธีมหน้าจอ / ปรับโหมดถนอมสายตา (Theme)
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    toast('🌙 เปลี่ยนเป็น Dark Theme (โหมดมืด) แล้ว', 'info', 2000);
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                    theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark')
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-4 h-4 mb-0.5 text-cyan-400" />
                  <span>โหมดมืด</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    toast('☀️ เปลี่ยนเป็น Light Theme (โหมดสว่าง สบายตา) แล้ว', 'info', 2000);
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                    theme === 'light' || (theme === 'system' && resolvedTheme === 'light')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-4 h-4 mb-0.5 text-amber-400" />
                  <span>โหมดสว่าง</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('system');
                    toast('💻 ปรับธีมตามระบบอุปกรณ์ของคุณแล้ว', 'info', 2000);
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                    theme === 'system'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Laptop className="w-4 h-4 mb-0.5 text-slate-300" />
                  <span>ตามระบบ</span>
                </button>
              </div>

              {/* Language toggle row in mobile drawer */}
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-xs text-slate-400">ภาษา / Language:</span>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5"
                >
                  <span>{language === 'th' ? '🇹🇭 ภาษาไทย (TH)' : '🇺🇸 English (EN)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
