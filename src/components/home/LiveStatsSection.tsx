'use client';

import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Box, Star } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';
import { getStoreDashboardStats } from '@/lib/firestore/stats';

import { CountUp } from '@/components/ui/CountUp';

export function LiveStatsSection() {
  const [stats, setStats] = useState({
    members: 1,
    orders: 0,
    products: 0,
    rating: 5.0,
    totalReviews: 0,
    satisfactionRate: '100%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const live = await getStoreDashboardStats();
        if (isMounted) {
          setStats({
            members: live.totalCustomers,
            orders: live.totalOrders,
            products: live.totalProducts,
            rating: live.averageRating || 5.0,
            totalReviews: live.totalReviews || 0,
            satisfactionRate: live.satisfactionRate || '100%',
          });
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error fetching live stats:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 sm:p-7 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Subtle glowing edge */}
          <div className="absolute -top-24 left-1/4 w-96 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                สถิติการใช้งาน
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ข้อมูลจริงจากระบบ J3A STORE
              </p>
            </div>

            {/* Live Indicator Pill matching user screenshot */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] sm:text-xs">อัปเดตเรียลไทม์</span>
            </div>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: สมาชิกทั้งหมด (คนที่สมัคร) */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 leading-tight">
                    สมาชิกทั้งหมด
                  </p>
                  <p className="text-[11px] text-cyan-400/90 font-medium">คนที่สมัครทั้งหมด</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  <CountUp to={stats.members} />
                </span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">คน</span>
              </div>
            </div>

            {/* Card 2: คำสั่งซื้อสะสม */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300 leading-tight">
                    คำสั่งซื้อสะสม
                  </p>
                  <p className="text-[11px] text-slate-500">ทั้งหมด</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  <CountUp to={stats.orders} />
                </span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">รายการ</span>
              </div>
            </div>

            {/* Card 3: สินค้าในระบบ */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300 leading-tight">
                    สินค้าในคลัง
                  </p>
                  <p className="text-[11px] text-slate-500">พร้อมจำหน่าย</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  <CountUp to={stats.products} />
                </span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">รายการ</span>
              </div>
            </div>

            {/* Card 4: คะแนนรีวิวร้านค้า (Real Ratings) */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300 leading-tight">
                    คะแนนรีวิวร้านค้า
                  </p>
                  <p className="text-[11px] text-amber-400">
                    {stats.totalReviews > 0 ? `${stats.totalReviews} รีวิวจากผู้ซื้อจริง` : 'พึงพอใจ 100%'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  {stats.rating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">/ 5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
