'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  ArrowLeft,
  LogOut,
  PlusCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils/cn';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout, profile } = useAuth();

  const links = [
    {
      href: '/admin',
      label: 'ภาพรวมระบบ (Dashboard)',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/admin/products',
      label: 'จัดการสินค้า (Products)',
      icon: Package,
    },
    {
      href: '/admin/products/new',
      label: 'เพิ่มสินค้าใหม่ (Create)',
      icon: PlusCircle,
    },
    {
      href: '/admin/orders',
      label: 'รายการคำสั่งซื้อ (Orders)',
      icon: ShoppingBag,
    },
    {
      href: '/admin/customers',
      label: 'สมาชิกลูกค้า (Customers)',
      icon: Users,
    },
    {
      href: '/admin/settings',
      label: 'ตั้งค่าร้านค้า (Settings)',
      icon: Settings,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/80 p-5">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Image src="/logo.png" alt="J3A STORE" fill className="object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-white uppercase tracking-wider">
            J3A STORE
          </span>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
            <Shield className="w-3 h-3" /> Admin Control
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href) && (link.href !== '/admin' || pathname === '/admin');

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              )}
            >
              <Icon
                className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-400')}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Exit Store */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>กลับไปยังหน้าร้าน (Store)</span>
        </Link>

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
