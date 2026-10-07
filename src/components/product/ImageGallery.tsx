'use client';

import React, { useState } from 'react';
import { SafeImage } from '@/components/ui/SafeImage';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  mainImage: string;
  images?: string[];
  productName: string;
  featured?: boolean;
}

export function ImageGallery({
  mainImage,
  images = [],
  productName,
  featured,
}: ImageGalleryProps) {
  // Deduplicate and filter out empty images
  const validImages = Array.from(
    new Set(
      [mainImage, ...(images || [])].filter(
        (img): img is string => typeof img === 'string' && img.trim().length > 0
      )
    )
  );
  const allImages = validImages.length > 0 ? validImages : ['/logo.png'];

  const [currentIndex, setCurrentIndex] = useState(0);
  const safeIndex = currentIndex >= allImages.length ? 0 : currentIndex;
  const currentImage = allImages[safeIndex] || '/logo.png';

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div className="relative w-full aspect-square rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden flex items-center justify-center p-6 shadow-2xl group select-none">
        <div className="relative w-full h-full">
          <SafeImage
            key={currentImage}
            src={currentImage}
            alt={`${productName} - ภาพที่ ${safeIndex + 1}`}
            fill
            priority
            className="object-contain transition-all duration-300 group-hover:scale-105"
          />
        </div>

        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> สินค้าแนะนำ
            </span>
          </div>
        )}

        {/* Navigation Arrows & Counter: Render ONLY IF there is more than 1 image */}
        {allImages.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="ดูรูปภาพก่อนหน้า"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-cyan-400 text-slate-200 hover:text-cyan-400 backdrop-blur-md shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer opacity-90 hover:opacity-100 group/btn"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover/btn:-translate-x-0.5" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="ดูรูปภาพถัดไป"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-cyan-400 text-slate-200 hover:text-cyan-400 backdrop-blur-md shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer opacity-90 hover:opacity-100 group/btn"
            >
              <ChevronRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-0.5" />
            </button>

            {/* Counter Badge */}
            <div className="absolute bottom-3.5 right-3.5 z-20">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-950/85 border border-slate-700/70 text-slate-200 text-xs font-mono font-medium backdrop-blur-md shadow-lg">
                {safeIndex + 1} / {allImages.length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Thumbnails row: Render ONLY IF there is more than 1 image */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {allImages.map((img, index) => (
            <button
              key={`${img}-${index}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`relative w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border-2 transition-all shrink-0 cursor-pointer ${
                safeIndex === index
                  ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] scale-105 ring-2 ring-cyan-500/30'
                  : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
              }`}
            >
              <SafeImage
                src={img}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
