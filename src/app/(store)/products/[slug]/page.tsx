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
  ExternalLink,
  Lock,
  ArrowRight,
  Play,
  Video,
  X,
} from 'lucide-react';
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/utils/youtube';
import { Product } from '@/types/product';
import { getProductBySlug } from '@/lib/firestore/products';
import { getBundleBySlug, getBundleById, bundleToProduct } from '@/lib/firestore/bundles';
import { formatCurrency } from '@/lib/utils/formatters';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
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
  const { user, loading: authLoading } = useAuth();
  const { addItem, setIsCartOpen } = useCart();
  const { success, error } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        let item = await getProductBySlug(slug);
        if (!item) {
          const cleanSlug = slug.replace(/^bundle_/, '');
          const bundle = (await getBundleBySlug(cleanSlug)) || (await getBundleById(cleanSlug));
          if (bundle) {
            item = bundleToProduct(bundle);
          }
        }
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

    const channelName = `product_detail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadProduct();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bundles' },
        () => {
          loadProduct();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (loading || authLoading) {
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

  // Gate: Non-authenticated visitors must login/register before viewing product details
  if (!authLoading && !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full bg-slate-900/80 border border-slate-800/90 rounded-3xl p-7 sm:p-10 backdrop-blur-xl shadow-2xl text-center space-y-6 relative overflow-hidden">
          {/* Ambient Cyber Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Lock Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)]">
            <Lock className="w-10 h-10 text-cyan-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-ping opacity-75" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[9px] font-black text-slate-950">!</div>
          </div>

          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              เฉพาะสมาชิก (Members Only)
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              เข้าสู่ระบบก่อนดูสินค้า
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              เพื่อความปลอดภัยและการเข้าถึงรายละเอียดสินค้า โปรโมชั่นพิเศษ และระบบการสั่งซื้ออัตโนมัติ กรุณาเข้าสู่ระบบบัญชีของคุณ หรือสมัครสมาชิกใหม่
            </p>
          </div>

          {/* Quick Perks */}
          <div className="grid grid-cols-2 gap-2.5 text-left py-1">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">จัดส่งอัตโนมัติ 24 ชม.</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">รับประกันสินค้าแท้</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Link
              href={`/login?redirect=${encodeURIComponent(`/products/${slug}`)}`}
              className="block w-full"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full text-sm font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>เข้าสู่ระบบ (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link
              href={`/register?redirect=${encodeURIComponent(`/products/${slug}`)}`}
              className="block w-full"
            >
              <Button
                variant="secondary"
                size="lg"
                className="w-full text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>สมัครสมาชิกใหม่ (Register)</span>
              </Button>
            </Link>

            <div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับสู่หน้าร้านค้า</span>
              </Link>
            </div>
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

  const isBundle =
    product.id.startsWith('bundle_') ||
    Boolean(product.tags && product.tags.includes('bundle'));
  const isBundleOutOfStock =
    isBundle && (isOutOfStock || Boolean(product.tags?.includes('bundle_item_out_of_stock')));

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
              showcaseUrl={product.showcaseUrl}
              onOpenShowcase={() => setIsShowcaseModalOpen(true)}
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

            {/* Out-of-stock Banner for Bundles */}
            {isBundleOutOfStock && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 flex items-start gap-3 text-xs text-rose-200 shadow-md">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-sm text-rose-300">ไม่สามารถสั่งซื้อแพ็กเกจนี้ได้</p>
                  <p className="text-slate-300 leading-relaxed">
                    เนื่องจากมีสินค้าใน Bundle หมด จึงไม่สามารถจัดส่งสินค้าได้ครบตามแพ็กเกจ กรุณารอสินค้าเติมสต็อก
                  </p>
                </div>
              </div>
            )}

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
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isBundleOutOfStock ? 'มีสินค้าใน Bundle หมด' : 'สินค้าหมดชั่วคราว'}
                </span>
              ) : (
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> มีสินค้าพร้อมส่ง ({product.stock} ชิ้น)
                </span>
              )}
            </div>

            {/* Product Showcase - Ultra Prominent Banner */}
            {product.showcaseUrl && (
              <div className="relative group">
                {/* Neon Ambient Pulsing Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 rounded-3xl blur-sm opacity-50 group-hover:opacity-85 transition duration-500 animate-pulse pointer-events-none" />

                {/* Card Container */}
                <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-rose-500/50 p-4 sm:p-5 shadow-2xl overflow-hidden space-y-3">
                  {/* Top shimmer accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]" />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left: Thumbnail / Play Icon & Descriptions */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Video Thumbnail or Glowing Play Button */}
                      {extractYouTubeVideoId(product.showcaseUrl) ? (
                        <div
                          onClick={() => setIsShowcaseModalOpen(true)}
                          className="relative w-28 sm:w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-rose-500/40 cursor-pointer group/thumb shadow-lg hover:scale-105 transition-transform"
                          title="คลิกเพื่อเปิดดูวิดีโอ"
                        >
                          <img
                            src={getYouTubeThumbnailUrl(product.showcaseUrl)!}
                            alt="วิดีโอตัวอย่างสินค้า"
                            className="w-full h-full object-cover opacity-85 group-hover/thumb:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-slate-950/25 group-hover/thumb:bg-transparent transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                              <span className="animate-ping absolute inset-0 rounded-full bg-rose-500 opacity-60"></span>
                              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover/thumb:bg-red-500 transition-colors">
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[8px] font-bold text-white font-mono leading-none">
                            HD
                          </span>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsShowcaseModalOpen(true)}
                          className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-600/40 shrink-0 cursor-pointer group/icon hover:scale-105 transition-transform"
                        >
                          <span className="animate-ping absolute inset-0 rounded-2xl bg-rose-500 opacity-40"></span>
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </div>
                      )}

                      {/* Text info */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            SHOWCASE
                          </span>
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> มีคลิปตัวอย่าง
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white tracking-tight truncate">
                          วิดีโอตัวอย่างสินค้าจริง (Demo)
                        </h4>
                        <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-2">
                          ดูการทำงานและฟังก์ชันจริงในคลิปก่อนสั่งซื้อ
                        </p>
                      </div>
                    </div>

                    {/* Right: Big CTA Button */}
                    <div className="w-full sm:w-auto flex sm:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsShowcaseModalOpen(true)}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(244,63,94,0.6)] hover:shadow-[0_0_30px_rgba(244,63,94,0.8)] flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>กดดูคลิปวิดีโอ</span>
                      </button>
                      <a
                        href={product.showcaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-1 transition-colors py-0.5 px-2"
                      >
                        <span>เปิดลิงก์แยก</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  leftIcon={
                    isBundleOutOfStock ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    ) : (
                      <ShoppingCart className="w-5 h-5 text-cyan-400" />
                    )
                  }
                  className={`w-full text-sm font-bold ${
                    isBundleOutOfStock ? 'border-rose-500/40 text-rose-400 opacity-80 cursor-not-allowed' : ''
                  }`}
                >
                  {isBundleOutOfStock ? 'มีสินค้าใน Bundle หมด' : 'เพิ่มลงตะกร้า'}
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  leftIcon={
                    isBundleOutOfStock ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )
                  }
                  className={`w-full text-sm font-bold ${
                    isBundleOutOfStock
                      ? 'bg-slate-900 border border-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                      : 'shadow-[0_0_25px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  {isBundleOutOfStock ? 'สินค้าหมด (ซื้อไม่ได้)' : 'ซื้อทันที (Buy Now)'}
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

      {/* Product Showcase Video Modal */}
      {isShowcaseModalOpen && product?.showcaseUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-slate-950 border border-rose-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_70px_rgba(244,63,94,0.35)] space-y-4 overflow-hidden">
            {/* Top neon glow bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 shadow-[0_0_15px_rgba(244,63,94,0.8)]" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Play className="w-4 h-4 fill-rose-400 ml-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      SHOWCASE
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white">{product.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400">คลิปตัวอย่างและสาธิตการทำงานจริงของสินค้า</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsShowcaseModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Area */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-inner">
              {extractYouTubeVideoId(product.showcaseUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(product.showcaseUrl, { autoplay: true }) || ''}
                  title={`วิดีโอตัวอย่าง ${product.name}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900">
                  <ExternalLink className="w-10 h-10 text-cyan-400" />
                  <p className="text-sm font-bold text-white">ลิงก์ตัวอย่างสินค้าภายนอก</p>
                  <a
                    href={product.showcaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
                  >
                    เปิดดูคลิป / ตัวอย่างในแท็บใหม่
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <a
                href={product.showcaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1.5"
              >
                <span>เปิดดูบน YouTube / แหล่งที่มาต้นฉบับ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShowcaseModalOpen(false)}
                  className="flex-1 sm:flex-none"
                >
                  ปิดหน้าต่าง
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsShowcaseModalOpen(false);
                    handleBuyNow();
                  }}
                  disabled={isOutOfStock}
                  className="flex-1 sm:flex-none shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  สั่งซื้อสินค้านี้ทันที
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
