'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingCart,
  Zap,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Star,
} from 'lucide-react';
import { Product } from '@/types/product';
import { getProductBySlug } from '@/lib/firestore/products';
import { formatCurrency } from '@/lib/utils/formatters';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { ImageGallery } from '@/components/product/ImageGallery';
import { ProductStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductReviewsSection } from '@/components/review/ProductReviewsSection';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem, setIsCartOpen } = useCart();
  const { success, error } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        const item = await getProductBySlug(slug);
        if (isMounted) {
          setProduct(item);
        }
      } catch (err) {
        console.error('Error loading product detail:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
          <div className="lg:col-span-6 aspect-square bg-slate-900 rounded-3xl" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-6 w-32 bg-slate-900 rounded" />
            <div className="h-10 w-3/4 bg-slate-900 rounded" />
            <div className="h-8 w-40 bg-slate-900 rounded" />
            <div className="h-24 w-full bg-slate-900 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="ไม่พบสินค้าที่คุณต้องการ"
          description={`ไม่พบสินค้าที่มีรหัสหรือ URL: "${slug}" ในระบบ J3A STORE สินค้านี้อาจถูกลบหรือย้ายหมวดหมู่`}
          actionText="กลับไปยังหน้าร้านค้า"
          actionHref="/shop"
        />
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back button */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            หน้าแรก
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-cyan-400 transition-colors">
            ร้านค้า
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-medium truncate max-w-xs">{product.name}</span>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6">
            <ImageGallery
              mainImage={product.image}
              images={product.images}
              productName={product.name}
              featured={product.featured}
            />
          </div>

          {/* Right Column: Information, Pricing, Quantity & CTA */}
          <div className="lg:col-span-6 space-y-6">
            {/* Category & Status */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                {product.category}
              </span>
              <ProductStatusBadge status={product.status} />
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars Summary */}
            <div className="flex items-center gap-2.5 text-xs">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(product.rating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-amber-400">
                {(product.rating || 5.0).toFixed(1)}
              </span>
              <span className="text-slate-500">
                ({product.reviewCount || 0} รีวิวจากผู้ซื้อจริง)
              </span>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">ราคาพิเศษ</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-cyan-400">
                    {formatCurrency(product.price)}
                  </span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-base text-slate-500 line-through">
                      {formatCurrency(product.comparePrice)}
                    </span>
                  )}
                </div>
              </div>

              {discountPercent && (
                <span className="text-xs font-black uppercase px-3 py-1.5 rounded-xl bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                  ประหยัด {discountPercent}%
                </span>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                รายละเอียดสินค้า
              </h3>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/30 p-4 rounded-xl border border-slate-800/80">
                {product.description || 'ไม่มีข้อมูลรายละเอียดเพิ่มเติม'}
              </div>
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">สถานะสต็อก:</span>
              {isOutOfStock ? (
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> สินค้าหมดชั่วคราว
                </span>
              ) : (
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> มีสินค้าพร้อมส่ง ({product.stock} ชิ้น)
                </span>
              )}
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-300">จำนวน:</span>
                <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900/80">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-white min-w-[40px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="p-2.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  leftIcon={<ShoppingCart className="w-5 h-5 text-cyan-400" />}
                  className="w-full text-sm font-bold"
                >
                  เพิ่มลงตะกร้า
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  leftIcon={<Zap className="w-5 h-5" />}
                  className="w-full text-sm font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                >
                  ซื้อทันที (Buy Now)
                </Button>
              </div>
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>จัดส่งรวดเร็วผ่านระบบอัตโนมัติ</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>การันตีสินค้าแท้ 100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Product Reviews & Ratings Section */}
        <div className="mt-12">
          <ProductReviewsSection
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            autoOpenReview={searchParams.get('openReview') === 'true'}
          />
        </div>
      </div>
    </div>
  );
}
