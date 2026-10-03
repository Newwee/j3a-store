'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Store, Layers, Sparkles, Filter, Loader2, Flame } from 'lucide-react';
import { Product } from '@/types/product';
import { BundlePackage } from '@/types/bundle';
import { getProducts, getDistinctCategories, subscribeProducts } from '@/lib/firestore/products';
import { getBundles, subscribeBundles } from '@/lib/firestore/bundles';
import { ProductCard } from '@/components/product/ProductCard';
import { BundleCard } from '@/components/bundle/BundleCard';
import { ProductFilter } from '@/components/product/ProductFilter';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialSort = searchParams.get('sortBy') || 'newest';

  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<BundlePackage[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Load distinct categories and active bundles on mount with real-time sync
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getDistinctCategories();
        if (cats.length > 0) {
          setCategories(cats);
        } else {
          setCategories([
            'เกมยอดนิยม',
            'บัตรเติมเงิน',
            'บริการดิจิทัล',
            'ไอดีเกม & สกิน',
            'ซอฟต์แวร์ & คีย์',
          ]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    loadCategories();

    // Real-time bundles subscription
    const unsubBundles = subscribeBundles((bList) => {
      setBundles(bList);
      if (bList.length > 0) {
        setCategories((prev) => [
          'แพ็กเกจสุดคุ้ม (Bundle)',
          ...prev.filter((c) => c !== 'แพ็กเกจสุดคุ้ม (Bundle)'),
        ]);
      }
    }, { status: 'active' });

    return () => unsubBundles();
  }, []);

  // Fetch products with active filters & real-time updates
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeProducts((prods) => {
      let filtered = prods;
      if (category !== 'all') {
        filtered = filtered.filter((p) => p.category === category);
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
        );
      }
      if (sortBy === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      setProducts(filtered);
      setIsLoading(false);
    }, { status: 'active', category: category !== 'all' ? category : undefined });

    return () => unsubscribe();
  }, [category, search, sortBy]);

  // Client filter for inStockOnly
  const displayedProducts = useMemo(() => {
    if (!inStockOnly) return products;
    return products.filter((p) => p.stock > 0 && p.status === 'active');
  }, [products, inStockOnly]);

  const handleReset = () => {
    setSearch('');
    setCategory('all');
    setSortBy('newest');
    setInStockOnly(false);
    router.push('/shop');
  };

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-semibold">
            <Store className="w-3.5 h-3.5" />
            <span>J3A STORE CATALOG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ร้านค้าสินค้าทั้งหมด
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            เลือกช้อปสินค้าดิจิทัล ไอเทม และบริการเกมราคาพิเศษ พร้อมส่งทันใจ
          </p>
        </div>

        {/* Filter Controls */}
        <ProductFilter
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          inStockOnly={inStockOnly}
          onInStockOnlyChange={setInStockOnly}
          onReset={handleReset}
        />

        {/* Bundle Deals Section */}
        {bundles.length > 0 && (category === 'all' || category === 'แพ็กเกจสุดคุ้ม (Bundle)') && !search && (
          <div className="mb-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span>แพ็กเกจสุดคุ้ม (Bundle Deals)</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      โปรพิเศษ
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    รวมสินค้ายอดนิยมในราคาพิเศษ ประหยัดกว่าซื้อแยกชิ้น
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          </div>
        )}

        {/* Results Counter */}
        {category !== 'แพ็กเกจสุดคุ้ม (Bundle)' && (
          <>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
              <span>
                พบทั้งหมด <strong className="text-white">{displayedProducts.length}</strong> รายการ
              </span>
              {category !== 'all' && (
                <span className="text-cyan-400 font-medium">หมวดหมู่: {category}</span>
              )}
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              <EmptyState
                title="ไม่พบสินค้าตามเงื่อนไขที่เลือก"
                description="ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูสินค้าทั้งหมดที่มีในระบบ"
                actionText="รีเซ็ตตัวกรองทั้งหมด"
                onAction={handleReset}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
