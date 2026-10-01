'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User,
  Wallet,
  LayoutDashboard,
  ShoppingBag,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Moon,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { TierBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatters';

export function UserDropdown() {
  const { user, profile, isAdmin, logout } = useAuth();
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      success('ออกจากระบบสำเร็จแล้ว');
      router.push('/');
    } catch {
      error('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800/60 transition-all"
        >
          เข้าสู่ระบบ
        </Link>
        <Link
          href="/register"
          className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3.5 py-2 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
        >
          สมัครสมาชิก
        </Link>
      </div>
    );
  }

  const displayName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User';
  const displayUid = user.uid.slice(0, 10) + '...';
  const credits = profile?.credits || 0;
  const avatarUrl = profile?.photoURL || user.photoURL;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Pill Trigger matching reference design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/40 rounded-full pl-3 pr-2 py-1.5 transition-all shadow-md group cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col text-left leading-tight hidden sm:flex">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            BALANCE
          </span>
          <span className="text-xs font-bold text-cyan-400">
            {formatCurrency(credits)}
          </span>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200 group-hover:text-white max-w-[100px] truncate">
            {displayName}
          </span>
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-cyan-400/50 bg-slate-800 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            ) : (
              <span className="text-xs font-bold text-cyan-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu inspired by user screenshot */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Profile Info */}
          <div className="flex items-center gap-3 p-2 border-b border-slate-800/80 pb-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] bg-slate-800 flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
              ) : (
                <span className="text-base font-bold text-cyan-400">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{displayName}</h4>
              <p className="text-[11px] text-slate-400 truncate">ID: {displayUid}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <TierBadge tier={profile?.tier || 'Bronze'} />
                {isAdmin && (
                  <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Credits Balance Card */}
          <div className="my-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium">เครดิตคงเหลือ</span>
            </div>
            <span className="text-sm font-extrabold text-cyan-400">
              {formatCurrency(credits)}
            </span>
          </div>

          {/* Nav Items */}
          <div className="space-y-0.5 text-xs font-medium text-slate-300">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>ภาพรวมบัญชี</span>
            </Link>

            <Link
              href="/profile?tab=topup"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>เติมเงิน</span>
            </Link>

            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span>ประวัติการทำรายการ</span>
            </Link>

            <Link
              href="/profile?tab=settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>ตั้งค่าบัญชี</span>
            </Link>

            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>ช่วยเหลือ</span>
            </Link>
          </div>

          {/* Quick preference badges */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-slate-800/50">
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dark Theme</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-slate-800/50">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Thai (TH)</span>
            </div>
          </div>

          {/* Logout button */}
          <div className="mt-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
