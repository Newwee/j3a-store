'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error caught by error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md mx-auto text-center space-y-6 p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            เกิดข้อผิดพลาดในการโหลดหน้านี้
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            ระบบพบปัญหาชั่วคราวในการประมวลผลข้อมูล กรุณากดลองใหม่อีกครั้ง หรือกลับสู่หน้าแรก
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-slate-500 pt-1">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="neon"
            size="md"
            onClick={() => reset()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            โหลดใหม่อีกครั้ง
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Home className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              กลับหน้าแรก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
