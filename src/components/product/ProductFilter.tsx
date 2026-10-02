'use client';

import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X, Tag } from 'lucide-react';
import { CustomDropdown, DropdownOption } from '@/components/ui/CustomDropdown';

interface ProductFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  sortBy: string;
  onSortByChange: (value: string) => void;
  inStockOnly: boolean;
  onInStockOnlyChange: (value: boolean) => void;
  onReset: () => void;
}

export function ProductFilter({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  sortBy,
  onSortByChange,
  inStockOnly,
  onInStockOnlyChange,
  onReset,
}: ProductFilterProps) {
  const isFiltered = search || (category && category !== 'all' && category !== 'ทั้งหมด') || inStockOnly || sortBy !== 'newest';

  const categoryOptions: DropdownOption[] = [
    { value: 'all', label: 'ทุกหมวดหมู่ (All)' },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  const sortOptions: DropdownOption[] = [
    { value: 'newest', label: 'ใหม่ล่าสุด (Newest)' },
    { value: 'price-asc', label: 'ราคา: ต่ำไปสูง' },
    { value: 'price-desc', label: 'ราคา: สูงไปต่ำ' },
    { value: 'name-asc', label: 'ชื่อสินค้า A-Z' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md mb-8 space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หมวดหมู่ หรือแท็ก..."
            className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-10 py-2.5 border border-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <CustomDropdown
            value={category || 'all'}
            onChange={onCategoryChange}
            options={categoryOptions}
            icon={<SlidersHorizontal className="w-4 h-4" />}
            placeholder="เลือกหมวดหมู่"
            menuWidth="w-56"
          />

          {/* Sort Selector */}
          <CustomDropdown
            value={sortBy}
            onChange={onSortByChange}
            options={sortOptions}
            icon={<ArrowUpDown className="w-4 h-4" />}
            placeholder="จัดเรียงตาม"
            menuWidth="w-52"
          />

          {/* In Stock Only Checkbox */}
          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 bg-slate-950/80 px-3.5 py-2.5 rounded-xl border border-slate-800 cursor-pointer select-none hover:border-slate-700">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onInStockOnlyChange(e.target.checked)}
              className="rounded accent-cyan-500 cursor-pointer"
            />
            <span>มีของพร้อมส่ง</span>
          </label>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              onClick={onReset}
              className="text-xs text-rose-400 hover:text-rose-300 px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
