'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Info,
  X,
  Loader2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue?: string) => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  requireInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  defaultValue?: string;
  itemDetails?: {
    label: string;
    value: string | React.ReactNode;
  }[];
}

export function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'ยืนยันทำรายการ',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  requireInput = false,
  inputLabel = 'ระบุเหตุผล / ข้อมูลเพิ่มเติม',
  inputPlaceholder = 'กรอกเหตุผลที่นี่...',
  defaultValue = '',
  itemDetails,
}: AdminConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isSubmitting) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !mounted) return null;

  const handleConfirmClick = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(requireInput ? inputValue : undefined);
      onClose();
    } catch (err) {
      console.error('Confirm modal action failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const variantStyles = {
    danger: {
      glow: 'shadow-[0_0_60px_rgba(244,63,94,0.2)] border-rose-500/40',
      iconBg: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
      icon: <Trash2 className="w-6 h-6 text-rose-400" />,
      btnBg: 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-rose-600/30 shadow-lg',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      badgeText: 'การดำเนินการสำคัญ',
    },
    warning: {
      glow: 'shadow-[0_0_60px_rgba(245,158,11,0.2)] border-amber-500/40',
      iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
      icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
      btnBg: 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black shadow-amber-600/30 shadow-lg',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      badgeText: 'โปรดตรวจสอบข้อมูล',
    },
    success: {
      glow: 'shadow-[0_0_60px_rgba(16,185,129,0.2)] border-emerald-500/40',
      iconBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 shadow-lg',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      badgeText: 'การอนุมัติรายการ',
    },
    info: {
      glow: 'shadow-[0_0_60px_rgba(6,182,212,0.2)] border-cyan-500/40',
      iconBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
      icon: <Info className="w-6 h-6 text-cyan-400" />,
      btnBg: 'bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-slate-950 font-black shadow-cyan-600/30 shadow-lg',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      badgeText: 'ยืนยันคำสั่ง',
    },
  }[variant];

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-slate-900/95 border rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all shadow-2xl z-10 space-y-6',
          variantStyles.glow
        )}
      >
        {/* Top Header Bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                'relative w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner',
                variantStyles.iconBg
              )}
            >
              <span className="absolute inset-0 rounded-2xl animate-ping opacity-25 bg-current" />
              {variantStyles.icon}
            </div>
            <div className="space-y-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
                  variantStyles.badge
                )}
              >
                <ShieldAlert className="w-3 h-3" />
                {variantStyles.badgeText}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description Body */}
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
          <p>{description}</p>

          {/* Optional item details list */}
          {itemDetails && itemDetails.length > 0 && (
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3.5 space-y-2 text-xs">
              {itemDetails.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">{it.label}</span>
                  <span className="font-semibold text-slate-200 text-right">{it.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Optional input field (e.g. rejection note) */}
          {requireInput && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-200">{inputLabel}</label>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition-colors resize-none placeholder:text-slate-600"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isSubmitting}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
              variantStyles.btnBg
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              <>
                <span>{confirmText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
