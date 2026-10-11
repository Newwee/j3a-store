'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Sparkles,
  Ticket,
  Check,
  Copy,
  ArrowRight,
  AlertTriangle,
  Megaphone,
} from 'lucide-react';
import { SitePopup } from '@/types/marketing';
import { getPopups } from '@/lib/firestore/marketing';

interface SitePopupModalProps {
  forcePopup?: SitePopup | null; // For admin preview mode
  onClosePreview?: () => void;
}

export function SitePopupModal({ forcePopup, onClosePreview }: SitePopupModalProps) {
  const [activePopup, setActivePopup] = useState<SitePopup | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (forcePopup) {
      setActivePopup(forcePopup);
      return;
    }

    if (!mounted) return;

    async function checkPopups() {
      try {
        const list = await getPopups();
        const activeList = list.filter((p) => p.isActive);
        if (activeList.length === 0) return;

        // Sort by priority: urgent > high > normal
        const sorted = [...activeList].sort((a, b) => {
          const priorityScore = (p: SitePopup) =>
            p.priority === 'urgent' ? 3 : p.priority === 'high' ? 2 : 1;
          return priorityScore(b) - priorityScore(a);
        });

        const today = new Date().toISOString().slice(0, 10);

        for (const p of sorted) {
          if (p.frequency === 'once') {
            const hasSeen = localStorage.getItem(`j3a_popup_seen_${p.id}`);
            if (!hasSeen) {
              setActivePopup(p);
              break;
            }
          } else if (p.frequency === 'daily') {
            const seenDate = localStorage.getItem(`j3a_popup_daily_${p.id}`);
            if (seenDate !== today) {
              setActivePopup(p);
              break;
            }
          } else {
            // always or urgent
            const sessionSeen = sessionStorage.getItem(`j3a_popup_session_${p.id}`);
            if (!sessionSeen) {
              setActivePopup(p);
              break;
            }
          }
        }
      } catch (e) {
        console.warn('Error reading popups:', e);
      }
    }

    // Small delay after page mount for smooth appearance
    const timer = setTimeout(checkPopups, 800);
    return () => clearTimeout(timer);
  }, [mounted, forcePopup]);

  const handleDismiss = () => {
    if (activePopup && !forcePopup) {
      const today = new Date().toISOString().slice(0, 10);
      if (activePopup.frequency === 'once') {
        localStorage.setItem(`j3a_popup_seen_${activePopup.id}`, 'true');
      } else if (activePopup.frequency === 'daily') {
        localStorage.setItem(`j3a_popup_daily_${activePopup.id}`, today);
      } else {
        sessionStorage.setItem(`j3a_popup_session_${activePopup.id}`, 'true');
      }
    }
    setActivePopup(null);
    onClosePreview?.();
  };

  const handleCopyCode = () => {
    if (!activePopup?.discountCode) return;
    navigator.clipboard.writeText(activePopup.discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activePopup) return null;

  const isUrgent = activePopup.priority === 'urgent';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      <div
        className={`relative w-full max-w-lg bg-slate-900 border rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200 ${
          isUrgent
            ? 'border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
            : 'border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.2)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          aria-label="ปิดป๊อปอัป"
          className="absolute right-4 top-4 z-20 p-2 rounded-full bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Banner Image (Optional) */}
        {activePopup.imageUrl && (
          <div className="relative w-full h-44 sm:h-52 bg-slate-950 overflow-hidden border-b border-slate-800">
            <Image
              src={activePopup.imageUrl}
              alt={activePopup.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Tag & Type */}
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>ประกาศสำคัญ (Urgent)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {activePopup.type === 'welcome'
                    ? 'ยินดีต้อนรับ (Welcome)'
                    : activePopup.type === 'promo'
                    ? 'โปรโมชันพิเศษ (Promo)'
                    : 'ข่าวสารร้านค้า (News)'}
                </span>
              </span>
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {activePopup.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {activePopup.description}
            </p>
          </div>

          {/* Discount Code Box (if specified) */}
          {activePopup.discountCode && (
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-dashed border-cyan-500/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    โค้ดส่วนลดพิเศษ
                  </span>
                  <span className="font-mono font-black text-base text-cyan-300 tracking-wider">
                    {activePopup.discountCode}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกโค้ด</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch gap-3">
            {activePopup.ctaText && (
              <Link
                href={activePopup.ctaLink || '/shop'}
                onClick={handleDismiss}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm text-center shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{activePopup.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <button
              onClick={handleDismiss}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              รับทราบ / ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
