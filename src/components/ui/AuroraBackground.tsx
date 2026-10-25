'use client';

import React, { memo } from 'react';
import dynamic from 'next/dynamic';

const Particles = dynamic(() => import('@/components/ui/Particles'), {
  ssr: false,
});

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
      className={`aurora-bg fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#09080e] transition-colors duration-500 ${className}`}
      style={{ contain: 'strict' }}
      aria-hidden="true"
    >
      {/* 3D WebGL Particles Background (Optimized to 50 particles for zero GPU strain) */}
      <div className="particles-layer absolute inset-0 pointer-events-none overflow-hidden -z-50 opacity-60">
        <Particles
          particleColors={['#6187ff', '#38bdf8', '#818cf8']}
          particleCount={50}
          particleSpread={15}
          speed={0.14}
          particleBaseSize={80}
          moveParticlesOnHover={false}
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>

      {/* Aurora Ambient Glow Blobs (High-Performance GPU Radial Gradients - Zero Gaussian Blur passes) */}
      <div className="aurora-blobs-layer absolute inset-0 opacity-40 dark:opacity-35 transition-opacity duration-1000 pointer-events-none will-change-transform">
        {/* Blob 1: Cyan Ambient Top-Left */}
        <div
          className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[800px] max-h-[800px] rounded-full will-change-transform animate-[aurora-drift-1_24s_ease-in-out_infinite_alternate]"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(56,189,248,0.10) 35%, transparent 70%)',
            transform: 'translate3d(0, 0, 0)',
          }}
        />

        {/* Blob 2: Violet/Purple Ambient Center-Right */}
        <div
          className="absolute top-[20%] -right-[15%] w-[70vw] h-[70vw] max-w-[850px] max-h-[850px] rounded-full will-change-transform animate-[aurora-drift-2_28s_ease-in-out_infinite_alternate]"
          style={{
            background: 'radial-gradient(circle, rgba(147,51,234,0.16) 0%, rgba(99,102,241,0.09) 35%, transparent 70%)',
            transform: 'translate3d(0, 0, 0)',
          }}
        />

        {/* Blob 3: Deep Indigo/Cyan Bottom-Center */}
        <div
          className="absolute -bottom-[20%] left-[15%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full will-change-transform animate-[aurora-drift-3_30s_ease-in-out_infinite_alternate]"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, rgba(37,99,235,0.08) 40%, transparent 70%)',
            transform: 'translate3d(0, 0, 0)',
          }}
        />

        {/* Blob 4: Hero Center Ambient Glow */}
        <div
          className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] max-w-[1000px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.12) 0%, rgba(99,102,241,0.06) 45%, transparent 70%)',
          }}
        />
      </div>

      {/* Soft Center Vignette */}
      {showRadialGradient && (
        <div
          className="aurora-vignette absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 35%, transparent 0%, rgba(9,8,14,0.3) 75%, rgba(9,8,14,0.7) 100%)',
          }}
        />
      )}

      {children}
    </div>
  );
});

export default AuroraBackground;
