'use client';

import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { ShoppingCart, Eye, Sparkles, Star } from 'lucide-react';
import { Product } from '@/types/product';
import { formatCurrency } from '@/lib/utils/formatters';
import { useCart } from '@/context/CartContext';
import { ProductStatusBadge } from '@/components/ui/Badge';
import { GlareHover } from '@/components/ui/GlareHover';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <GlareHover className="group relative flex flex-col rb-card overflow-hidden transition-all duration-300">
      {/* Top Image Banner */}
      <div className="relative w-full aspect-square bg-slate-950/60 overflow-hidden flex items-center justify-center p-3">
        <SafeImage
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges on top of card */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              <Sparkles className="w-3 h-3 fill-current" /> แนะนำ
            </span>
          )}
          {discountPercent && (
            <span className="inline-flex items-center text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-rose-600 text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Category Pill on top right */}
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60 text-slate-300 backdrop-blur-sm">
            {product.category}
          </span>
        </div>

        {/* Quick action overlay on hover */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
          <Link
            href={`/products/${product.slug || product.id}`}
            className="p-3 rounded-full bg-slate-800/90 text-white hover:bg-cyan-500 hover:text-slate-950 border border-slate-600 hover:border-cyan-400 transition-all shadow-lg cursor-pointer transform -translate-y-2 group-hover:translate-y-0 duration-200"
            aria-label="View product details"
          >
            <Eye className="w-5 h-5" />
          </Link>
          {!isOutOfStock && (
            <button
              onClick={() => addItem(product, 1)}
              className="p-3 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 border border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transform translate-y-2 group-hover:translate-y-0 duration-200"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs text-slate-400 line-clamp-1">{product.category}</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                {(product.rating || 5.0).toFixed(1)}
              </span>
              <ProductStatusBadge status={product.status} />
            </div>
          </div>

          <Link href={`/products/${product.slug || product.id}`} className="block group-hover:text-cyan-400 transition-colors">
            <h3 className="font-bold text-sm text-slate-100 line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing and Cart Button */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-cyan-400">
                {formatCurrency(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-xs text-slate-500 line-through">
                  {formatCurrency(product.comparePrice)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              {isOutOfStock ? (
                <span className="text-rose-400">หมดชั่วคราว</span>
              ) : (
                <span>คงเหลือ {product.stock} ชิ้น</span>
              )}
            </span>
          </div>

          <button
            onClick={() => addItem(product, 1)}
            disabled={isOutOfStock}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-cyan-400 transition-all shadow-sm disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-200 cursor-pointer"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlareHover>
  );
}
