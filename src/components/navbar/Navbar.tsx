'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { UserDropdown } from './UserDropdown';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function Navbar() {
  const { isAdmin } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Listen for Ctrl+K or Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close language dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(e.target as Node)
      ) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { href: '/', label: t('nav_home', 'หน้าแรก'), icon: Home, exact: true },
    { href: '/shop', label: t('nav_shop', 'ร้านค้า'), icon: Store, exact: false },
    {
      href: '/shop?category=all',
      label: t('nav_categories', 'หมวดหมู่'),
      icon: Layers,
      exact: false,
    },
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
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 lg:gap-4">
            {/* ======================================================== */}
            {/* ZONE 1: BRAND LOGO (LEFT)                                */}
            {/* ======================================================== */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group select-none">
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-transform duration-300 group-hover:scale-105 shrink-0 border border-cyan-500/30">
                  <Image
                    src="/logo.png"
                    alt="J3A STORE Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-xl font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent uppercase leading-tight">
                    J3A STORE
                  </span>
                  <span className="hidden sm:block text-[9px] sm:text-[10px] tracking-widest text-cyan-400/80 font-bold uppercase -mt-0.5">
                    Discord Software & Services
                  </span>
                </div>
              </Link>
            </div>

            {/* ======================================================== */}
            {/* ZONE 2: MAIN NAVIGATION MENU (CENTER)                    */}
            {/* ======================================================== */}
            <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.exact
                  ? pathname === link.href
                  : pathname.startsWith('/shop') && link.href.startsWith('/shop');

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isActive
                        ? 'text-cyan-300 font-bold bg-cyan-500/15 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 ${
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
            </nav>

            {/* ======================================================== */}
            {/* ZONE 3: SEARCH + UTILITY + CTA + ACCOUNT (RIGHT)         */}
            {/* ======================================================== */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Search Bar (Expanded with Ctrl+K shortcut) */}
              <form
                onSubmit={handleSearch}
                className="hidden md:flex relative w-48 lg:w-60 xl:w-72"
              >
                <div className="relative w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('nav_search_placeholder', 'ค้นหาสินค้า, ซอฟต์แวร์, บริการ...')}
                    className="w-full h-10 bg-slate-900/90 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-9 pr-14 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all shadow-inner"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden xl:flex items-center pointer-events-none select-none">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-400 rounded border border-slate-700 shadow-sm">
                      Ctrl K
                    </kbd>
                  </div>
                </div>
              </form>

              {/* Language Selector Dropdown (Height: 40px) */}
              <div className="relative hidden sm:block" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="h-10 px-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 select-none"
                  title="เลือกภาษา / Select Language"
                  aria-label="Select Language"
                >
                  <span className="tracking-wide">
                    {language === 'th' ? '🇹🇭 TH' : '🇺🇸 EN'}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                      isLangDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                {isLangDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('th');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        language === 'th'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🇹🇭</span>
                        <span>ภาษาไทย</span>
                      </span>
                      {language === 'th' && <span className="text-cyan-400 font-bold">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        language === 'en'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span>English</span>
                      </span>
                      {language === 'en' && <span className="text-cyan-400 font-bold">✓</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* Theme Toggle Button (Height: 40px) */}
              <button
                type="button"
                onClick={() => {
                  const next = resolvedTheme === 'dark' ? 'light' : 'dark';
                  toggleTheme();
                  toast(
                    next === 'light'
                      ? '☀️ ' + t('toast_theme_light', 'เปลี่ยนเป็นโหมดสว่าง (Light Theme) แล้ว')
                      : '🌙 ' + t('toast_theme_dark', 'เปลี่ยนเป็นโหมดมืด (Dark Theme) แล้ว'),
                    'info',
                    2000
                  );
                }}
                className="h-10 w-10 hidden sm:flex items-center justify-center rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-200 hover:text-white transition-all cursor-pointer group shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 select-none"
                title={`สลับธีม (${resolvedTheme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'})`}
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* Shopping Cart Button (Height: 40px) */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="h-10 w-10 relative flex items-center justify-center rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-200 hover:text-white transition-all cursor-pointer group shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 select-none"
                aria-label={`Open shopping cart with ${totalItems} items`}
                title={`ตะกร้าสินค้า (${totalItems} ชิ้น)`}
              >
                <ShoppingCart className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center border-2 border-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-in zoom-in-75">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Admin Panel Link (Subtle outline, won't overshadow topup button) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="h-10 px-3 hidden xl:inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-amber-300 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition-all select-none"
                  title="แผงควบคุมผู้ดูแลระบบ (Admin Panel)"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Primary CTA: ปุ่ม "เติมเงิน" (Prominent Gold Gradient, 1 Line, Height 40px) */}
              <Link
                href="/profile?tab=topup"
                className="h-10 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm whitespace-nowrap shadow-[0_0_18px_rgba(251,191,36,0.45)] hover:shadow-[0_0_26px_rgba(251,191,36,0.65)] flex items-center gap-1.5 sm:gap-2 transition-all hover:scale-[1.03] active:scale-95 border border-yellow-300/80 shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                title="เติมเงินเข้ากระเป๋าเงิน (Wallet Top-Up)"
              >
                <div className="w-5 h-5 rounded-lg bg-slate-950/20 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                </div>
                <span className="tracking-tight">{language === 'th' ? 'เติมเงิน' : 'Top-Up'}</span>
              </Link>

              {/* Balance + User Profile Card (Height: 40px) */}
              <UserDropdown />

              {/* Mobile Drawer Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (Directly below navbar on mobile) */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาซอฟต์แวร์ / บอท / สินค้า..."
                className="w-full h-10 bg-slate-900/90 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 border border-slate-700/80 focus:border-cyan-400 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Menu (Extra Options) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200 shadow-2xl">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span>หน้าแรก</span>
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80"
            >
              <Store className="w-4 h-4 text-indigo-400" />
              <span>ร้านค้าทั้งหมด</span>
            </Link>
            <Link
              href="/shop?category=all"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>หมวดหมู่สินค้า</span>
            </Link>
            <Link
              href="/profile?tab=topup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>เติมเงินเข้ากระเป๋า (Wallet Top-Up)</span>
              </div>
              <span className="text-[10px] uppercase font-black bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full">
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

            {/* Language & Theme for Mobile */}
            <div className="pt-3 mt-2 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-400">ภาษา / Language:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLanguage('th')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      language === 'th'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇹🇭 TH
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      language === 'en'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇺🇸 EN
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-400">ธีมหน้าจอ / Theme:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      resolvedTheme === 'dark'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🌙 มืด
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      resolvedTheme === 'light'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ☀️ สว่าง
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer with smooth slide animation */}
      <CartDrawer />
    </>
  );
}
