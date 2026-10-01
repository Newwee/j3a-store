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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { UserDropdown } from './UserDropdown';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function Navbar() {
  const { isAdmin } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'หน้าแรก', icon: Home, exact: true },
    { href: '/shop', label: 'ร้านค้า', icon: Store, exact: false },
    { href: '/shop?category=all', label: 'หมวดหมู่', icon: Layers, exact: false },
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
          <div className="flex items-center justify-between h-20 gap-4">
            {/* 1. Brand Logo */}
            <div className="flex items-center gap-6 shrink-0">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/logo.png"
                    alt="J3A STORE Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent uppercase">
                    J3A STORE
                  </span>
                  <span className="text-[10px] tracking-widest text-cyan-400/80 font-bold -mt-1 uppercase">
                    Digital Commerce
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
                  placeholder="ค้นหาเกม / บัตรเติมเงิน / สินค้า..."
                  className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder:text-slate-500 rounded-full pl-10 pr-4 py-2 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </form>

            {/* 3. Actions (Cart & User) */}
            <div className="flex items-center gap-3">
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
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
