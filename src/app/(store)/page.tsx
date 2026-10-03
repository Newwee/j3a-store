'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Flame, Clock } from 'lucide-react';
import { Product } from '@/types/product';
import { getProducts, subscribeProducts } from '@/lib/firestore/products';
import { HeroSection } from '@/components/home/HeroSection';
import { LiveStatsSection } from '@/components/home/LiveStatsSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { CategoryPills } from '@/components/home/CategoryPills';
import { PromoBannerSection } from '@/components/home/PromoBannerSection';
import { WhyUsSection } from '@/components/home/WhyUsSection';
import { StoreReviewsSection } from '@/components/review/StoreReviewsSection';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);

  useEffect(() => {
    setLoadingFeatured(true);
    setLoadingNew(true);

    const unsubscribe = subscribeProducts((prods) => {
      const active = prods.filter((p) => p.status === 'active');
      const featured = active.filter((p) => p.featured);
      setFeaturedProducts(featured.length > 0 ? featured.slice(0, 8) : active.slice(0, 8));
      setLoadingFeatured(false);

      const sortedNew = [...active].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNewArrivals(sortedNew.slice(0, 8));
      setLoadingNew(false);
    }, { status: 'active' });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Live Stats Counter Section (Inspired by user screenshot) */}
      <LiveStatsSection />

      {/* 3. Featured Products Section (Inspired by user screenshot) */}
      <FeaturedProductsSection
        products={featuredProducts}
        isLoading={loadingFeatured}
      />

      {/* 4. Category Selector Navigation */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              หมวดหมู่ยอดนิยม
            </h3>
            <Link
              href="/shop?category=all"
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <CategoryPills />
        </div>
      </section>

      {/* 5. New Arrivals Section */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  สินค้ามาใหม่ล่าสุด (New Arrivals)
                </h2>
                <p className="text-xs text-slate-400">อัปเดตไอเทมและบริการใหม่ล่าสุดทุกวัน</p>
              </div>
            </div>

            <Link
              href="/shop?sortBy=newest"
              className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <span>ดูสินค้าทั้งหมด</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingNew ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : newArrivals.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm">
              <p>ยังไม่มีรายการสินค้าในขณะนี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. Promotional Banner Section */}
      <PromoBannerSection />

      {/* 7. Store Reviews Section with Gating and PeekRating */}
      <StoreReviewsSection />

      {/* 8. Why J3A STORE Section */}
      <WhyUsSection />
    </div>
  );
}
