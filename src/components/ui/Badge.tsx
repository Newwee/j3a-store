import React from 'react';
import { cn } from '@/lib/utils/cn';
import { ProductStatus } from '@/types/product';
import { OrderStatus } from '@/types/order';
import { UserRole, UserTier } from '@/types/user';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neon' | 'purple';
  size?: 'sm' | 'md';
}

export function Badge({
  variant = 'default',
  size = 'sm',
  className,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    neon: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          พร้อมขาย
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          ฉบับร่าง
        </Badge>
      );
    case 'out_of_stock':
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          สินค้าหมด
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          รอชำระเงิน
        </Badge>
      );
    case 'paid':
      return (
        <Badge variant="info">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          ชำระแล้ว
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="neon">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-spin" />
          กำลังดำเนินการ
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          สำเร็จ
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          ยกเลิกแล้ว
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

export function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'admin') {
    return (
      <Badge variant="neon" className="border-amber-400/50 bg-amber-500/10 text-amber-300">
        ADMIN
      </Badge>
    );
  }
  return <Badge variant="default">CUSTOMER</Badge>;
}

export function TierBadge({ tier = 'Bronze' }: { tier?: UserTier }) {
  const colors = {
    Bronze: 'bg-amber-900/30 text-amber-400 border-amber-700/40',
    Silver: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
    Gold: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    VIP: 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 border-cyan-400/50',
  };

  return (
    <span
      className={cn(
        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border inline-flex items-center gap-1',
        colors[tier] || colors.Bronze
      )}
    >
      ★ {tier}
    </span>
  );
}
