'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Plus, Bell, Shield, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface AdminHeaderProps {
  title: string;
  description?: string;
  onOpenMobileSidebar?: () => void;
  actionText?: string;
  actionHref?: string;
}

export function AdminHeader({
  title,
  description,
  onOpenMobileSidebar,
  actionText = 'เพิ่มสินค้าใหม่',
  actionHref = '/admin/products/new',
}: AdminHeaderProps) {
  const { user, profile } = useAuth();
  const displayName = profile?.displayName || user?.displayName || 'Admin';

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Page Title */}
        <div className="flex items-center gap-3">
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle admin menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-slate-400 hidden sm:block">{description}</p>
            )}
          </div>
        </div>

        {/* Right: Actions and Admin Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors">
            <span>ดูหน้าร้านจริง</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {actionText && actionHref && (
            <Link href={actionHref}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                className="shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                {actionText}
              </Button>
            </Link>
          )}

          {/* Admin profile pill */}
          <div suppressHydrationWarning className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div suppressHydrationWarning className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-400/50 bg-slate-800 flex items-center justify-center">
              {profile?.photoURL || user?.photoURL ? (
                <Image
                  src={profile?.photoURL || user?.photoURL || ''}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <span suppressHydrationWarning className="text-xs font-bold text-amber-400">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div suppressHydrationWarning className="hidden xl:flex flex-col text-left leading-tight">
              <span suppressHydrationWarning className="text-xs font-bold text-white max-w-[110px] truncate">
                {displayName}
              </span>
              <span className="text-[10px] font-semibold text-amber-400">
                Administrator
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
