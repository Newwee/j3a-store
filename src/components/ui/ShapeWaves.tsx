'use client';

import React, { useEffect, useRef, useState } from 'react';

export type ShapeWavesShapes = 'mixed' | 'squares' | 'circles' | 'triangles';

export interface ShapeWavesProps {
  shapes?: ShapeWavesShapes;
  cellSize?: number;
  dotSize?: number;
  color?: string;
  hoverColor?: string;
  backgroundColor?: string;
  speed?: number;
  className?: string;
}

export function ShapeWaves({
  shapes = 'mixed',
  cellSize = 28,
  dotSize = 0.55,
  color = '#06b6d4',
  hoverColor = '#a855f7',
  backgroundColor = 'transparent',
  speed = 1,
  className = '',
}: ShapeWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    let startTime = performance.now();

    const drawTriangle = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const h = size * Math.sqrt(3);
      c.beginPath();
      c.moveTo(x, y - (h * 2) / 3);
      c.lineTo(x - size, y + h / 3);
      c.lineTo(x + size, y + h / 3);
      c.closePath();
    };

    const render = (time: number) => {
      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;

      const elapsed = (time - startTime) * 0.001 * speed;

      ctx.clearRect(0, 0, width, height);

      const spacing = Math.max(16, cellSize);
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * spacing;
          const y = r * spacing;

          // Wave physics equation
          const wave1 = Math.sin(c * 0.15 + elapsed * 1.8 + Math.cos(r * 0.1));
          const wave2 = Math.cos(r * 0.18 - elapsed * 1.4 + Math.sin(c * 0.08));
          const combined = (wave1 + wave2) * 0.5; // [-1, 1]

          // Distance to interactive mouse cursor
          const distToMouse = Math.hypot(x - mouseX, y - mouseY);
          const mouseFactor = Math.max(0, 1 - distToMouse / 180);

          // Dynamic scale and opacity
          const baseScale = 0.35 + (combined + 1) * 0.35 * dotSize;
          const scale = baseScale + mouseFactor * 0.8;
          const size = (spacing * 0.28) * scale;

          if (size <= 0.5) continue;

          // Determine shape type
          let shapeType: number;
          if (shapes === 'squares') shapeType = 0;
          else if (shapes === 'circles') shapeType = 1;
          else if (shapes === 'triangles') shapeType = 2;
          else {
            // Mixed mode alternating by position
            shapeType = (r + c) % 3;
          }

          // Cyberpunk color blending: Cyan -> Purple -> White
          const alpha = Math.min(0.85, Math.max(0.08, 0.18 + (combined + 1) * 0.25 + mouseFactor * 0.45));
          
          if (mouseFactor > 0.2) {
            ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`; // purple glow
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          } else if (combined > 0.2) {
            ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`; // neon cyan
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.7})`;
          } else {
            ctx.fillStyle = `rgba(71, 85, 105, ${alpha * 0.7})`; // slate
            ctx.strokeStyle = `rgba(100, 116, 139, ${alpha * 0.5})`;
          }

          // Draw shape
          if (shapeType === 0) {
            // Square
            ctx.beginPath();
            ctx.rect(x - size, y - size, size * 2, size * 2);
            ctx.fill();
            if (mouseFactor > 0.3) ctx.stroke();
          } else if (shapeType === 1) {
            // Circle
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            if (mouseFactor > 0.3) ctx.stroke();
          } else {
            // Triangle
            drawTriangle(ctx, x, y, size);
            ctx.fill();
            if (mouseFactor > 0.3) ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mounted, shapes, cellSize, dotSize, color, hoverColor, speed]);

  return (
    <div
      className={`pointer-events-none relative isolate h-full w-full overflow-hidden ${className}`}
      style={{ backgroundColor }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full opacity-60 transition-opacity duration-700"
      />
    </div>
  );
}

export default ShapeWaves;
