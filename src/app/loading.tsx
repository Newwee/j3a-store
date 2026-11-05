import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <div className="absolute inset-0 rounded-full blur-md bg-cyan-400/20 animate-pulse" />
      </div>
      <p className="text-xs font-semibold text-slate-400 animate-pulse">
        กำลังโหลดข้อมูล...
      </p>
    </div>
  );
}
