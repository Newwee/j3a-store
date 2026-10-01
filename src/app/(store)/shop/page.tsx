'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Store, Layers, Sparkles, Filter, Loader2 } from 'lucide-react';
import { Product } from '@/types/product';
import { getProducts, getDistinctCategories } from '@/lib/firestore/products';
import { ProductCard } from '@/components/product/ProductCard';
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
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Load distinct categories on mount
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
  }, []);

  // Fetch products with active filters
  useEffect(() => {
    let isMounted = true;
    async function fetchFiltered() {
      setIsLoading(true);
      try {
        const result = await getProducts({
          status: 'active',
          category: category !== 'all' ? category : undefined,
          search: search.trim() || undefined,
          sortBy: sortBy as any,
        });

        if (isMounted) {
          setProducts(result);
        }
      } catch (err) {
        console.error('Failed to load shop products:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchFiltered();

    return () => {
      isMounted = false;
    };
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

        {/* Results Counter */}
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
