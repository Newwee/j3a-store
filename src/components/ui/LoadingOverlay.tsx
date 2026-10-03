'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  subMessage?: string;
}

export function LoadingOverlay({
  isOpen,
  message = 'กำลังประมวลผล กรุณารอสักครู่...',
  subMessage = '💡 ระบบกำลังเชื่อมต่อและอัปเดตข้อมูล กรุณาอย่าปิดหรือรีเฟรชหน้านี้',
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none"
      role="status"
      aria-live="polite"
    >
      {/* Ambient background glow behind spinner */}
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-[90px] pointer-events-none animate-pulse" />
      <div className="absolute w-56 h-56 rounded-full bg-[#7c5cff]/15 blur-[80px] pointer-events-none animate-pulse delay-300" />

      {/* Main Spinner Card */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-6 py-8 rounded-3xl bg-[#0c0d16]/90 border border-slate-700/60 shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-6">
        {/* Multi-Ring Glowing Circular Spinner */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer Ring - Clockwise Fast */}
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 border-r-cyan-400 animate-spin shadow-[0_0_25px_rgba(6,182,212,0.6)]" />

          {/* Middle Ring - Counter-Clockwise */}
          <div className="absolute w-16 h-16 rounded-full border-4 border-[#7c5cff]/20 border-b-[#7c5cff] border-l-[#7c5cff] animate-[spin_1.4s_linear_infinite_reverse] shadow-[0_0_20px_rgba(124,92,255,0.6)]" />

          {/* Inner Accent Ring */}
          <div className="absolute w-10 h-10 rounded-full border-3 border-emerald-500/20 border-t-emerald-400 animate-[spin_0.8s_linear_infinite] shadow-[0_0_15px_rgba(34,197,94,0.5)]" />

          {/* Center Glowing Dot */}
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_#ffffff] animate-ping" />
        </div>

        {/* Loading Message */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center justify-center gap-1.5 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            <span>{message}</span>
          </h3>
          {subMessage && (
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {subMessage}
            </p>
          )}
        </div>

        {/* Futuristic glowing progress bar effect */}
        <div className="w-48 h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default LoadingOverlay;
