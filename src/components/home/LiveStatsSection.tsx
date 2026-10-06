'use client';

import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Box, Star } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';
import { getStoreDashboardStats } from '@/lib/firestore/stats';

import { CountUp } from '@/components/ui/CountUp';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

export function LiveStatsSection() {
  const { t } = useLanguage();
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

    // Realtime channel subscription to live store_stats
    const channel = supabase
      .channel('realtime:store_stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_stats' },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const data = payload.new as any;
            if (isMounted) {
              setStats((prev) => ({
                ...prev,
                members: data.members !== undefined ? Number(data.members) : prev.members,
                orders: data.orders !== undefined ? Number(data.orders) : prev.orders,
                products: data.products !== undefined ? Number(data.products) : prev.products,
                rating: data.rating !== undefined ? Number(data.rating) : prev.rating,
                totalReviews: data.total_reviews !== undefined ? Number(data.total_reviews) : prev.totalReviews,
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
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
                {t('stats_title', 'สถิติการใช้งาน')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('stats_subtitle', 'ข้อมูลจริงจากระบบ J3A STORE')}
              </p>
            </div>

            {/* Live Indicator Pill matching user screenshot */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] sm:text-xs">{t('stats_live_badge', 'อัปเดตเรียลไทม์')}</span>
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
                    {t('stats_members', 'สมาชิกทั้งหมด')}
                  </p>
                  <p className="text-[11px] text-cyan-400/90 font-medium">{t('stats_members_sub', 'คนที่สมัครทั้งหมด')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  <CountUp to={stats.members} duration={1} separator="," />
                </span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">{t('stats_unit_people', 'คน')}</span>
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
                    {t('stats_orders', 'คำสั่งซื้อสะสม')}
                  </p>
                  <p className="text-[11px] text-slate-500">{t('stats_orders_sub', 'ทั้งหมด')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  <CountUp to={stats.orders} duration={1} separator="," />
                </span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">{t('stats_unit_orders', 'รายการ')}</span>
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
                    {t('stats_products', 'สินค้าในคลัง')}
                  </p>
                  <p className="text-[11px] text-slate-500">{t('stats_products_sub', 'พร้อมจำหน่าย')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  <CountUp to={stats.products} duration={1} separator="," />
                </span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">{t('stats_unit_orders', 'รายการ')}</span>
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
                    {t('stats_reviews', 'คะแนนรีวิวร้านค้า')}
                  </p>
                  <p className="text-[11px] text-amber-400">
                    {stats.totalReviews > 0 ? `${stats.totalReviews} ${t('stats_reviews_sub', 'รีวิวจากผู้ซื้อจริง')}` : t('stats_reviews_satisfied', 'พึงพอใจ 100%')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  <CountUp to={Number(stats.rating)} duration={1} separator="," />
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
