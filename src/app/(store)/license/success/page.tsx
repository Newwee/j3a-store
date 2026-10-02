'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { LicenseKeyDelivery } from '@/components/license/LicenseKeyDelivery';

function LicenseSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || undefined;
  const initialKey = searchParams.get('key') || undefined;

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปยังหน้าหลักร้านค้า</span>
        </Link>

        <LicenseKeyDelivery
          orderId={orderId}
          initialKey={initialKey}
          autoClaim={!initialKey}
        />
      </div>
    </div>
  );
}

export default function LicenseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#7c5cff]" />
        </div>
      }
    >
      <LicenseSuccessContent />
    </Suspense>
  );
}
