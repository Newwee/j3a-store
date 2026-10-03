'use client';

import React, { memo } from 'react';

export interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = memo(function AuroraBackground({
  className = '',
  children,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#09080e] ${className}`}
      aria-hidden="true"
    >
      {/* Aurora Ambient Glow Blobs (GPU-accelerated, soft & non-distracting) */}
      <div className="absolute inset-0 opacity-40 dark:opacity-35 transition-opacity duration-1000">
        {/* Blob 1: Cyan Ambient Top-Left */}
        <div
          className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-500/15 to-transparent blur-[120px] will-change-transform animate-[aurora-drift-1_22s_ease-in-out_infinite_alternate]"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        />

        {/* Blob 2: Violet/Purple Ambient Center-Right */}
        <div
          className="absolute top-[20%] -right-[15%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-bl from-purple-600/18 via-indigo-600/12 to-transparent blur-[130px] will-change-transform animate-[aurora-drift-2_26s_ease-in-out_infinite_alternate]"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        />

        {/* Blob 3: Deep Indigo/Cyan Bottom-Center */}
        <div
          className="absolute -bottom-[20%] left-[20%] w-[65vw] h-[65vw] max-w-[850px] max-h-[850px] rounded-full bg-gradient-to-t from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] will-change-transform animate-[aurora-drift-3_28s_ease-in-out_infinite_alternate]"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        />

        {/* Soft Center Vignette */}
        {showRadialGradient && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(9,8,14,0.65)_70%,rgba(9,8,14,0.95)_100%)]" />
        )}
      </div>

      {children}
    </div>
  );
});

export default AuroraBackground;
