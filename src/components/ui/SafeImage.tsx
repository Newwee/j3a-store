'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { ShoppingBag } from 'lucide-react';

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  fallbackSrc = '/logo.png',
  alt = 'Product image',
  className = '',
  ...props
}: SafeImageProps) {
  // Allow valid src including blob: (for local file previews) and data: (for base64 compressed images)
  const isValidSrc = (s?: string | null) => {
    if (!s) return false;
    const trimmed = s.trim();
    if (!trimmed) return false;
    return true;
  };

  const initialSrc = isValidSrc(src) ? (src as string) : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  useEffect(() => {
    if (isValidSrc(src)) {
      setCurrentSrc(src as string);
      setHasFailed(false);
    } else {
      setCurrentSrc(fallbackSrc);
      setHasFailed(false);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasFailed(true);
    }
  };

  if (hasFailed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 p-4 border border-slate-800 ${className}`}>
        <ShoppingBag className="w-8 h-8 text-cyan-400/50 mb-1" />
        <span className="text-[11px] text-slate-400 font-medium tracking-wide">J3A STORE</span>
      </div>
    );
  }

  const isGif =
    typeof currentSrc === 'string' &&
    (currentSrc.includes('.gif') || currentSrc.startsWith('data:image/gif'));

  if (isGif) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentSrc}
        alt={alt}
        className={`${props.fill ? 'absolute inset-0 w-full h-full object-contain' : ''} ${className}`}
        style={props.fill ? { position: 'absolute', height: '100%', width: '100%', inset: 0 } : undefined}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      className={className}
      unoptimized
      onError={handleError}
    />
  );
}
