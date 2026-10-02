'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  menuWidth?: string;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  icon,
  placeholder = 'เลือกตัวเลือก',
  className = '',
  menuWidth = 'w-56',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none border ${
          isOpen
            ? 'bg-slate-900 border-cyan-400/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400/20'
            : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-cyan-400 shrink-0">{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-2 ${menuWidth} max-h-72 overflow-y-auto rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20 z-50 animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && (
                    <span className={isSelected ? 'text-cyan-400' : 'text-slate-400'}>
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-1.5" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
