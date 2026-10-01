'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, Gift, CreditCard, Sparkles, Server, Shield, Layers } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CategoryPillsProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'ทั้งหมด (All)', icon: Layers },
  { id: 'เกมยอดนิยม', name: 'เกมยอดนิยม', icon: Gamepad2 },
  { id: 'บัตรเติมเงิน', name: 'บัตรเติมเงิน', icon: Gift },
  { id: 'บริการดิจิทัล', name: 'บริการดิจิทัล', icon: Server },
  { id: 'ไอดีเกม & สกิน', name: 'ไอดีเกม & สกิน', icon: Sparkles },
  { id: 'ซอฟต์แวร์ & คีย์', name: 'ซอฟต์แวร์ & คีย์', icon: Shield },
  { id: 'อื่นๆ', name: 'อื่นๆ', icon: CreditCard },
];

export function CategoryPills({
  activeCategory = 'all',
  onSelectCategory,
}: CategoryPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id || (activeCategory === 'ทั้งหมด' && cat.id === 'all');

        if (onSelectCategory) {
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id === 'all' ? 'ทั้งหมด' : cat.name)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer',
                isActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        }

        return (
          <Link
            key={cat.id}
            href={`/shop?category=${encodeURIComponent(cat.id === 'all' ? 'all' : cat.name)}`}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border',
              isActive
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850 hover:text-white'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
