'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

    const variants = {
      primary:
        'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold shadow-[0_0_25px_rgba(6,182,212,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] border border-cyan-300/40 hover:scale-[1.01]',
      secondary:
        'bg-slate-900/80 hover:bg-slate-800/90 text-slate-100 border border-white/10 hover:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md',
      outline:
        'bg-transparent hover:bg-white/[0.04] text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40',
      ghost: 'bg-transparent hover:bg-white/[0.04] text-slate-300 hover:text-white',
      danger:
        'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold shadow-[0_0_20px_rgba(225,29,72,0.35),inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-rose-500/30',
      neon:
        'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 hover:border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25),inset_0_1px_0_0_rgba(6,182,212,0.2)]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5',
      icon: 'p-2.5 text-sm aspect-square',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
