'use client';

import React, { useState } from 'react';
import { SafeImage } from '@/components/ui/SafeImage';
import { Sparkles } from 'lucide-react';

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
  const allImages = [mainImage, ...images.filter((img) => img && img !== mainImage)];
  const [selectedImage, setSelectedImage] = useState(allImages[0] || '/logo.png');

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div className="relative w-full aspect-square rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden flex items-center justify-center p-6 shadow-2xl group">
        <div className="relative w-full h-full">
          <SafeImage
            src={selectedImage}
            alt={productName}
            fill
            priority
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {featured && (
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> สินค้าแนะนำ
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails row if multiple images exist */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {allImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(img)}
              className={`relative w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border-2 transition-all shrink-0 cursor-pointer ${
                selectedImage === img
                  ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] scale-105'
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
