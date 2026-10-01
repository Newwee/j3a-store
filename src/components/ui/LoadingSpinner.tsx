'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse ring */}
        <div
          className={cn(
            'rounded-full animate-ping opacity-25 bg-cyan-400 absolute',
            size === 'sm' && 'w-5 h-5',
            size === 'md' && 'w-8 h-8',
            size === 'lg' && 'w-12 h-12',
            size === 'xl' && 'w-16 h-16'
          )}
        />
        {/* Core spinning neon gradient circle */}
        <div
          className={cn(
            'rounded-full border-slate-800 border-t-cyan-400 border-r-cyan-500 animate-spin transition-all',
            sizeClasses[size]
          )}
          style={{
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.45)',
          }}
        />
      </div>
      {label && (
        <span className="text-xs sm:text-sm font-semibold text-slate-300 tracking-wide animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

export function PageLoading({ label = 'กำลังโหลดข้อมูล...' }: { label?: string }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center py-16">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
