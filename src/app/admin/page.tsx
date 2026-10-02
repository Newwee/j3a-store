'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  ShoppingBag,
  Users,
  Coins,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { StoreStats, getStoreDashboardStats } from '@/lib/firestore/stats';
import { StatCard } from '@/components/admin/StatCard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { OrderStatusBadge, ProductStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const data = await getStoreDashboardStats(true);
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Admin Page Header */}
      <AdminHeader
        title="แดชบอร์ดภาพรวม (Dashboard)"
        description="สรุปผลการดำเนินงาน ยอดขาย คำสั่งซื้อ และสินค้าในระบบ J3A STORE"
        actionText="เพิ่มสินค้าใหม่"
        actionHref="/admin/products/new"
      />

      {/* Pending Top-ups Notification Banner */}
      {Boolean(stats?.pendingTopupsCount && stats.pendingTopupsCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              มีรายการแจ้งเติมเงินรอการตรวจสอบและอนุมัติ <strong>{stats?.pendingTopupsCount} รายการ</strong>
            </span>
          </div>
          <Link
            href="/admin/topups"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <span>ไปที่หน้าอนุมัติเงิน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4 Overview Statistics Cards - 100% Real Live Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="รายได้รวม (Total Revenue)"
          value={formatCurrency(stats?.totalRevenue || 0)}
          subtitle="จากคำสั่งซื้อที่ชำระเงินสำเร็จ"
          icon={Coins}
          color="cyan"
        />
        <StatCard
          title="คำสั่งซื้อทั้งหมด (Orders)"
          value={formatNumber(stats?.totalOrders || 0)}
          subtitle="รายการคำสั่งซื้อสะสม"
          icon={ShoppingBag}
          color="emerald"
        />
        <StatCard
          title="สินค้าในระบบ (Products)"
          value={formatNumber(stats?.totalProducts || 0)}
          subtitle="สินค้าพร้อมขาย & ฉบับร่าง"
          icon={Package}
          color="purple"
        />
        <StatCard
          title="ลูกค้าสมาชิก (Customers)"
          value={formatNumber(stats?.totalCustomers || 0)}
          subtitle="ผู้ใช้งานที่ลงทะเบียนในระบบ"
          icon={Users}
          color="amber"
        />
      </div>

      {/* 2-Columns Grid: Recent Orders & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recent Orders */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">คำสั่งซื้อล่าสุด (Recent Orders)</h2>
              <p className="text-xs text-slate-400">รายการสั่งซื้อที่ส่งเข้ามาในระบบ</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>ดูคำสั่งซื้อทั้งหมด</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-950/60 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : !stats || stats.recentOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              ยังไม่มีรายการคำสั่งซื้อใหม่ในระบบ
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {stats.recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">#{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {order.customer.name} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-cyan-400">
                      {formatCurrency(order.total)}
                    </span>
                    <Link
                      href="/admin/orders"
                      className="block text-[11px] text-slate-400 hover:text-white"
                    >
                      จัดการ &gt;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Products & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">สินค้าล่าสุด (Recent Products)</h2>
                <p className="text-xs text-slate-400">สินค้าที่อัปเดตล่าสุดในร้าน</p>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>จัดการสินค้า</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-950/60 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : !stats || stats.recentProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                ยังไม่มีรายการสินค้าในระบบ
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {stats.recentProducts.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 shrink-0 overflow-hidden">
                        <Image
                          src={prod.image || '/logo.png'}
                          alt={prod.name}
                          fill
                          unoptimized={Boolean(prod.image?.startsWith('data:'))}
                          className="object-contain p-0.5"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                        <p className="text-[10px] text-slate-400">{prod.category} • คงเหลือ {prod.stock}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 shrink-0">
                      {formatCurrency(prod.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800">
              <Link href="/admin/products/new">
                <Button variant="neon" size="sm" className="w-full" leftIcon={<Plus className="w-4 h-4" />}>
                  สร้างสินค้าใหม่ทันที
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
