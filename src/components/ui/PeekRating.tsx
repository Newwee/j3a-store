'use client';

import React, { useState } from 'react';

export interface PeekRatingProps {
  value?: number;
  onChange?: (val: number) => void;
  count?: number;
  activeColor?: string;
  inactiveColor?: string;
  tipTextColor?: string;
  size?: number;
  riseDuration?: number;
  magnify?: number;
  showLabels?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function PeekRating({
  value = 0,
  onChange,
  count = 10,
  activeColor = '#779bff',
  inactiveColor = 'rgba(255, 255, 255, 0.18)',
  tipTextColor = '#7C3AED',
  size = 42,
  riseDuration = 310,
  magnify = 1.17,
  showLabels = false,
  disabled = false,
  className = '',
}: PeekRatingProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const displayValue = hoverIndex !== null ? hoverIndex + 1 : value;
  const normalizedActiveColor = activeColor.startsWith('#') ? activeColor : `#${activeColor}`;
  const normalizedTipColor = tipTextColor.startsWith('#') ? tipTextColor : `#${tipTextColor}`;

  return (
    <div className={`flex flex-col items-center gap-2 select-none ${className}`}>
      {showLabels && (
        <div
          className="text-sm font-semibold tracking-wide transition-all"
          style={{ color: normalizedTipColor }}
        >
          {displayValue > 0 ? `${displayValue} / ${count}` : 'เลือกคะแนนความพึงพอใจ'}
        </div>
      )}

      <div
        className="flex items-center gap-1.5 p-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm"
        onMouseLeave={() => !disabled && setHoverIndex(null)}
      >
        {Array.from({ length: count }, (_, i) => {
          const isSelected = i < displayValue;
          const isCurrentHover = hoverIndex === i;
          const distance = hoverIndex !== null ? Math.abs(hoverIndex - i) : 999;

          // Peek wave effect
          let translateY = 0;
          let scale = 1;
          if (hoverIndex !== null && !disabled) {
            if (isCurrentHover) {
              translateY = -8;
              scale = magnify;
            } else if (distance === 1) {
              translateY = -4;
              scale = 1 + (magnify - 1) * 0.5;
            }
          }

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange && onChange(i + 1)}
              onMouseEnter={() => !disabled && setHoverIndex(i)}
              className="relative p-1 rounded-lg focus:outline-none transition-transform cursor-pointer disabled:cursor-not-allowed group cursor-target"
              style={{
                transform: `translateY(${translateY}px) scale(${scale})`,
                transitionDuration: `${riseDuration}ms`,
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              title={`${i + 1} / ${count}`}
            >
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={isSelected ? normalizedActiveColor : 'none'}
                stroke={isSelected ? normalizedActiveColor : inactiveColor}
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-colors duration-200"
                style={{
                  filter: isSelected
                    ? `drop-shadow(0 0 8px ${normalizedActiveColor}66)`
                    : 'none',
                }}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>

              {/* Number indicator on hover */}
              {isCurrentHover && !showLabels && (
                <div
                  className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap"
                  style={{
                    backgroundColor: '#111827',
                    border: `1px solid ${normalizedTipColor}55`,
                    color: normalizedTipColor,
                  }}
                >
                  {i + 1}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
