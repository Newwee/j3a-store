'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home,
  Store,
  CreditCard,
  ShoppingCart,
  ShoppingBag,
  User,
  ShieldCheck,
  LogOut,
  Gift,
  Wallet,
} from 'lucide-react';
import Dock, { DockItemData } from '@/components/ui/Dock';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils/formatters';

export function MobileDockNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isAdmin, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const isHome = pathname === '/';
  const isShop = pathname.startsWith('/shop') || pathname.startsWith('/products');
  const isOrders = pathname.startsWith('/orders');
  const isProfile = pathname.startsWith('/profile');

  const items: DockItemData[] = [
    {
      icon: <Home className="w-5 h-5 text-cyan-400" />,
      label: 'หน้าแรก',
      active: isHome,
      onClick: () => router.push('/'),
    },
    {
      icon: <Store className="w-5 h-5 text-indigo-400" />,
      label: 'ร้านค้า',
      active: isShop,
      onClick: () => router.push('/shop'),
      menu: [
        { label: '🛍️ สินค้าทั้งหมด', onClick: () => router.push('/shop') },
        { separator: true },
        { label: '⚡ Discord AutoQuest', onClick: () => router.push('/products/j3adiscordautoquest') },
        { label: '🖥️ J3A DeskCord', onClick: () => router.push('/products/j3a-deskcord') },
        { label: '🤖 Discord Manager', onClick: () => router.push('/products/j3a-discord-manager') },
        { label: '🎨 Discord Profile', onClick: () => router.push('/products/j3a-discord-profile') },
      ],
    },
    {
      icon: <CreditCard className="w-5 h-5 text-amber-400" />,
      label: 'เติมเงิน',
      badge: '★',
      onClick: () => router.push('/profile?tab=topup'),
    },
    {
      icon: <ShoppingCart className="w-5 h-5 text-sky-400" />,
      label: 'ตะกร้า',
      badge: totalItems > 0 ? (totalItems > 99 ? '99+' : totalItems) : undefined,
      onClick: () => setIsCartOpen(true),
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-purple-400" />,
      label: 'คำสั่งซื้อ',
      active: isOrders,
      onClick: () => router.push(user ? '/orders' : '/login'),
    },
    {
      icon: user ? (
        profile?.photoURL ? (
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-cyan-400">
            <Image src={profile.photoURL} alt="User" fill className="object-cover" />
          </div>
        ) : (
          <User className="w-5 h-5 text-emerald-400" />
        )
      ) : (
        <User className="w-5 h-5 text-slate-300" />
      ),
      label: user ? (profile?.displayName || 'โปรไฟล์') : 'เข้าสู่ระบบ',
      active: isProfile,
      onClick: () => router.push(user ? '/profile' : '/login'),
      menu: user
        ? [
            {
              label: `💰 ยอดเงิน: ${formatCurrency(profile?.credits || 0)}`,
              onClick: () => router.push('/profile?tab=wallet'),
            },
            { label: '👤 บัญชีของฉัน', onClick: () => router.push('/profile') },
            { label: '🎁 โค้ดของขวัญ', onClick: () => router.push('/profile?tab=redeem') },
            ...(isAdmin
              ? [
                  { separator: true },
                  { label: '🛡️ Admin Panel', onClick: () => router.push('/admin') },
                ]
              : []),
            { separator: true },
            {
              label: '🚪 ออกจากระบบ',
              onClick: async () => {
                await logout();
                router.push('/');
              },
            },
          ]
        : [
            { label: '🔑 เข้าสู่ระบบ', onClick: () => router.push('/login') },
            { label: '📝 สมัครสมาชิก', onClick: () => router.push('/register') },
          ],
    },
  ];

  return (
    <div
      className="md:hidden fixed bottom-3 inset-x-0 z-40 flex justify-center pointer-events-none px-3"
      aria-label="Mobile Navigation Dock"
    >
      <div className="pointer-events-auto">
        <Dock
          items={items}
          position="bottom"
          theme="dark"
          baseItemSize={44}
          magnification={62}
          distance={140}
          panelHeight={58}
          gap={8}
          roundness={0.7}
          spring={{ mass: 0.1, stiffness: 180, damping: 14 }}
          bounce={true}
          tiles={true}
          showLabels={true}
          showIndicators={true}
          showBadges={true}
          badgeColor="#06b6d4"
          accentColor="#06b6d4"
        />
      </div>
    </div>
  );
}
