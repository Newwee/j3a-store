'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Download,
  RotateCcw,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  CreditCard,
  Percent,
} from 'lucide-react';
import { StoreStats, getStoreDashboardStats } from '@/lib/firestore/stats';
import { StatCard } from '@/components/admin/StatCard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Order } from '@/types/order';
import { supabase } from '@/lib/supabase/client';

type PeriodKey = '3d' | '7d' | '14d' | '30d' | '90d' | '180d' | '365d' | 'all';

interface PeriodOption {
  key: PeriodKey;
  label: string;
  days: number;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: '3d', label: '3 วัน', days: 3 },
  { key: '7d', label: '7 วัน', days: 7 },
  { key: '14d', label: '2 สัปดาห์', days: 14 },
  { key: '30d', label: '1 เดือน', days: 30 },
  { key: '90d', label: '3 เดือน', days: 90 },
  { key: '180d', label: '6 เดือน', days: 180 },
  { key: '365d', label: '1 ปี', days: 365 },
  { key: 'all', label: 'ตลอดการใช้งาน', days: 0 },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('all');

  // Reset Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetMode, setResetMode] = useState<'stats_only' | 'test_orders' | 'all_orders'>('stats_only');
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getStoreDashboardStats(true);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Filter orders by the chosen period
  const filteredOrders = useMemo(() => {
    if (!stats || !stats.recentOrders) return [];
    if (selectedPeriod === 'all') return stats.recentOrders;

    const opt = PERIOD_OPTIONS.find((o) => o.key === selectedPeriod);
    if (!opt || opt.days === 0) return stats.recentOrders;

    const cutoff = Date.now() - opt.days * 24 * 60 * 60 * 1000;
    return stats.recentOrders.filter((ord) => {
      const ordTime = new Date(ord.createdAt).getTime();
      return ordTime >= cutoff;
    });
  }, [stats, selectedPeriod]);

  // Compute period metrics
  const periodMetrics = useMemo(() => {
    const validOrders = filteredOrders.filter((ord) => ord.status !== 'cancelled');
    const successfulOrders = validOrders.filter(
      (ord) => ord.status === 'paid' || ord.status === 'completed' || ord.status === 'processing'
    );

    const revenue = successfulOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);
    const count = filteredOrders.length;
    const successCount = successfulOrders.length;
    const aov = successCount > 0 ? revenue / successCount : 0;
    const completionRate = count > 0 ? Math.round((successCount / count) * 100) : 100;

    return {
      revenue,
      totalOrders: count,
      successCount,
      aov,
      completionRate,
    };
  }, [filteredOrders]);

  // Generate trend data buckets for visual mini-chart
  const trendBuckets = useMemo(() => {
    const opt = PERIOD_OPTIONS.find((o) => o.key === selectedPeriod);
    const days = opt && opt.days > 0 ? Math.min(opt.days, 14) : 7;
    const buckets: { dateLabel: string; revenue: number; ordersCount: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;

      const dayOrders = filteredOrders.filter((ord) => {
        const ordDate = new Date(ord.createdAt).toISOString().slice(0, 10);
        return (
          ordDate === dateStr &&
          (ord.status === 'paid' || ord.status === 'completed' || ord.status === 'processing')
        );
      });

      const dayRev = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      buckets.push({
        dateLabel: label,
        revenue: dayRev,
        ordersCount: dayOrders.length,
      });
    }

    const maxRev = Math.max(...buckets.map((b) => b.revenue), 100);
    return { buckets, maxRev };
  }, [filteredOrders, selectedPeriod]);

  // Export report as CSV with UTF-8 BOM
  const handleExportReport = () => {
    const opt = PERIOD_OPTIONS.find((o) => o.key === selectedPeriod);
    const periodName = opt?.label || 'ตลอดการใช้งาน';
    const nowStr = new Date().toISOString().slice(0, 10);

    const summaryHeader = [
      'รายงานสรุปผลประกอบการ J3A STORE',
      `ช่วงเวลา: ${periodName}`,
      `วันที่ส่งออก: ${nowStr}`,
      `รายได้รวม: ฿${periodMetrics.revenue.toLocaleString()}`,
      `จำนวนคำสั่งซื้อ: ${periodMetrics.totalOrders} รายการ`,
      `ค่าเฉลี่ยต่อคำสั่งซื้อ (AOV): ฿${Math.round(periodMetrics.aov).toLocaleString()}`,
      `อัตราสำเร็จ: ${periodMetrics.completionRate}%`,
      '',
      'รายการคำสั่งซื้อ (Order Details):',
    ].join('\n');

    const tableHeaders = [
      'เลขที่คำสั่งซื้อ',
      'ลูกค้า',
      'อีเมล',
      'วันที่สั่งซื้อ (UTC)',
      'ช่องทางชำระเงิน',
      'ยอดชำระ (บาท)',
      'สถานะ',
      'จำนวนรายการสินค้า',
    ];

    const rows = filteredOrders.map((ord) => [
      `"${ord.orderNumber}"`,
      `"${ord.customer.name}"`,
      `"${ord.customer.email}"`,
      `"${ord.createdAt}"`,
      `"${ord.paymentMethod}"`,
      `"${ord.total}"`,
      `"${ord.status}"`,
      `"${ord.items.length}"`,
    ]);

    const csvContent =
      '\uFEFF' + summaryHeader + '\n' + tableHeaders.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `J3A_Store_Report_${selectedPeriod}_${nowStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Reset Execution
  const handleExecuteReset = async () => {
    if (resetConfirmation !== 'RESET') {
      setResetError('กรุณาพิมพ์คำว่า RESET เพื่อยืนยัน');
      return;
    }

    setIsResetting(true);
    setResetError('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';

      const res = await fetch('/api/admin/dashboard/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: resetMode,
          confirmation: 'RESET',
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'การรีเซ็ตล้มเหลว');
      }

      setIsResetModalOpen(false);
      setResetConfirmation('');
      await loadStats();
      alert('รีเซ็ตข้อมูลและคำนวณสถิติเริ่มต้นใหม่สำเร็จเรียบร้อย');
    } catch (err: any) {
      setResetError(err.message || 'เกิดข้อผิดพลาดในการรีเซ็ต');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Page Header with Reset and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>แดชบอร์ดภาพรวม (Dashboard)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            สรุปผลการดำเนินงาน ยอดขาย คำสั่งซื้อ และสินค้าในระบบ J3A STORE
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Reset Store Data Button */}
          <button
            onClick={() => {
              setResetConfirmation('');
              setResetError('');
              setIsResetModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตเริ่มต้นใหม่</span>
          </button>

          {/* Export Report CSV Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportReport}
            leftIcon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
            className="text-xs"
          >
            ส่งออกรายงาน (Export CSV)
          </Button>

          {/* Create Product Link */}
          <Link href="/admin/products/new">
            <Button variant="neon" size="sm" leftIcon={<Plus className="w-4 h-4" />} className="text-xs">
              เพิ่มสินค้าใหม่
            </Button>
          </Link>
        </div>
      </div>

      {/* Period Selector Tabs Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-2.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 pl-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>ช่วงเวลาวิเคราะห์:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = selectedPeriod === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedPeriod(opt.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

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

      {/* 4 Overview Statistics Cards - Dynamically updated by period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`รายได้รวม (${PERIOD_OPTIONS.find((o) => o.key === selectedPeriod)?.label})`}
          value={formatCurrency(periodMetrics.revenue)}
          subtitle={`จากคำสั่งซื้อสำเร็จ ${periodMetrics.successCount} รายการ`}
          icon={Coins}
          color="cyan"
        />
        <StatCard
          title={`คำสั่งซื้อทั้งหมด (${PERIOD_OPTIONS.find((o) => o.key === selectedPeriod)?.label})`}
          value={formatNumber(periodMetrics.totalOrders)}
          subtitle={`อัตราสำเร็จ ${periodMetrics.completionRate}%`}
          icon={ShoppingBag}
          color="emerald"
        />
        <StatCard
          title="ค่าเฉลี่ยต่อออเดอร์ (AOV)"
          value={formatCurrency(Math.round(periodMetrics.aov))}
          subtitle="ยอดใช้จ่ายเฉลี่ยต่อบิล"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="ลูกค้าสมาชิก (Customers)"
          value={formatNumber(stats?.totalCustomers || 1)}
          subtitle="ผู้ใช้งานที่ลงทะเบียนในระบบ"
          icon={Users}
          color="amber"
        />
      </div>

      {/* Mini Trend Visualizer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>แนวโน้มยอดขายและคำสั่งซื้อ ({PERIOD_OPTIONS.find((o) => o.key === selectedPeriod)?.label})</span>
            </h2>
            <p className="text-xs text-slate-400">สถิติยอดขายตามวันและช่วงเวลาที่เลือก</p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">
            รวม: {formatCurrency(periodMetrics.revenue)}
          </span>
        </div>

        {/* Visual Bar Columns */}
        <div className="pt-2 flex items-end justify-between gap-2 h-32 sm:h-40 px-2 border-b border-slate-800">
          {trendBuckets.buckets.map((b, idx) => {
            const heightPercent = Math.max(8, Math.round((b.revenue / trendBuckets.maxRev) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  {formatCurrency(b.revenue)} ({b.ordersCount} ออเดอร์)
                </div>

                <div className="w-full max-w-[36px] bg-slate-950/80 rounded-t-lg overflow-hidden flex items-end justify-center h-24 sm:h-28">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg group-hover:brightness-125 transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-white">
                  {b.dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Columns Grid: Recent Orders & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recent Orders in selected period */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">คำสั่งซื้อล่าสุด (Recent Orders)</h2>
              <p className="text-xs text-slate-400">
                รายการสั่งซื้อในช่วง {PERIOD_OPTIONS.find((o) => o.key === selectedPeriod)?.label} ({filteredOrders.length} รายการ)
              </p>
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
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              ยังไม่มีรายการคำสั่งซื้อในช่วงเวลานี้
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredOrders.slice(0, 5).map((order) => (
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
                        <p className="text-[10px] text-slate-400">
                          {prod.category} • คงเหลือ {prod.stock}
                        </p>
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

      {/* Safety Reset Store Modal */}
      {isResetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(244,63,94,0.2)] space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  รีเซ็ตข้อมูลเริ่มต้น (Reset Store Data)
                </h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ฟังก์ชันนี้ใช้สำหรับรีเซ็ตหรือล้างข้อมูลการทดสอบ เพื่อให้คุณเริ่มต้นเปิดร้านใหม่ได้อย่างสะอาดตา
              โปรดเลือกตัวเลือกที่ต้องการด้านล่าง:
            </p>

            {/* Mode selection radio */}
            <div className="space-y-2.5">
              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  resetMode === 'stats_only'
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reset_mode"
                  checked={resetMode === 'stats_only'}
                  onChange={() => setResetMode('stats_only')}
                  className="mt-1 accent-cyan-500"
                />
                <div>
                  <strong className="text-xs text-white block">1. รีเซ็ตและคำนวณสถิติแดชบอร์ดใหม่</strong>
                  <span className="text-[11px] text-slate-400">
                    ล้างแคชยอดขายและซิงค์ตัวนับสินค้า/สมาชิกให้ตรงกับฐานข้อมูลจริง (ไม่ลบคำสั่งซื้อ)
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  resetMode === 'test_orders'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reset_mode"
                  checked={resetMode === 'test_orders'}
                  onChange={() => setResetMode('test_orders')}
                  className="mt-1 accent-amber-500"
                />
                <div>
                  <strong className="text-xs text-white block">2. ล้างคำสั่งซื้อรอชำระเงินและทดสอบ</strong>
                  <span className="text-[11px] text-slate-400">
                    ลบเฉพาะคำสั่งซื้อสถานะ Pending และ Cancelled ที่ใช้ทดสอบระบบ (เก็บคำสั่งซื้อที่จ่ายเงินแล้วไว้)
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  resetMode === 'all_orders'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reset_mode"
                  checked={resetMode === 'all_orders'}
                  onChange={() => setResetMode('all_orders')}
                  className="mt-1 accent-rose-500"
                />
                <div>
                  <strong className="text-xs text-rose-300 block">3. ล้างคำสั่งซื้อทั้งหมด (Fresh Launch)</strong>
                  <span className="text-[11px] text-slate-400">
                    ล้างคำสั่งซื้อทั้งหมดเพื่อเริ่มต้นร้านค้าใหม่ 0 บาท (สินค้าและสมาชิกจะไม่ถูกลบ)
                  </span>
                </div>
              </label>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-300">
                พิมพ์คำว่า <span className="text-rose-400 font-mono font-black">RESET</span> เพื่อยืนยัน:
              </label>
              <input
                type="text"
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="RESET"
                className="w-full bg-slate-950 text-sm font-mono text-center text-rose-400 rounded-xl px-4 py-2.5 border border-slate-800 focus:border-rose-500 outline-none uppercase font-bold tracking-widest"
              />
            </div>

            {resetError && (
              <p className="text-xs text-rose-400 font-medium bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {resetError}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsResetModalOpen(false)}
                className="text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleExecuteReset}
                isLoading={isResetting}
                disabled={resetConfirmation !== 'RESET' || isResetting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                ยืนยันการรีเซ็ต
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
