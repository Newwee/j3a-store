'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const TargetCursor = dynamic(() => import('@/components/ui/TargetCursor'), {
  ssr: false,
});

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Disable completely on mobile / touchscreens to prevent CPU/memory lag
    const checkPointer = () => {
      const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const isDesktop = window.innerWidth >= 1024;
      setEnabled(hasFinePointer && isDesktop);
    };

    checkPointer();
    window.addEventListener('resize', checkPointer);
    return () => window.removeEventListener('resize', checkPointer);
  }, []);

  if (!enabled) return null;

  return (
    <TargetCursor
      spinDuration={5}
      hideDefaultCursor={false}
      parallaxOn
      hoverDuration={0.25}
      cursorColor="#ffffff"
      cursorColorOnTarget="#B497CF"
      targetSelector=".cursor-target, button, a, [role='button']"
    />
  );
}
