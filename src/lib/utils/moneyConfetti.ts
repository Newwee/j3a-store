'use client';

import confetti from 'canvas-confetti';

export interface MoneyCelebrationOptions {
  amount?: number;
  durationMs?: number;
}

/**
 * Injects CSS keyframe for realistic screen rumble / shake effect
 */
function ensureScreenShakeStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('money-shake-style')) return;

  const style = document.createElement('style');
  style.id = 'money-shake-style';
  style.innerHTML = `
    @keyframes moneyScreenRumble {
      0% { transform: translate(0, 0) rotate(0deg); }
      12% { transform: translate(-6px, 4px) rotate(-0.5deg); }
      25% { transform: translate(6px, -4px) rotate(0.5deg); }
      38% { transform: translate(-5px, -3px) rotate(-0.3deg); }
      50% { transform: translate(5px, 3px) rotate(0.4deg); }
      65% { transform: translate(-3px, 2px) rotate(-0.2deg); }
      80% { transform: translate(3px, -2px) rotate(0.1deg); }
      92% { transform: translate(-1px, 1px) rotate(0deg); }
      100% { transform: translate(0, 0) rotate(0deg); }
    }
    .money-screen-shake {
      animation: moneyScreenRumble 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both !important;
      will-change: transform;
    }
    @keyframes moneyPopBadgeAnim {
      0% { opacity: 0; transform: translate(-50%, -40%) scale(0.6); }
      20% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
      30% { transform: translate(-50%, -50%) scale(1); }
      75% { opacity: 1; transform: translate(-50%, -70%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -90%) scale(0.9); }
    }
    .money-pop-badge {
      animation: moneyPopBadgeAnim 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Triggers screen shake for high impact celebrations (500+ THB)
 */
function triggerScreenShake() {
  if (typeof document === 'undefined') return;
  ensureScreenShakeStyle();

  const body = document.body;
  body.classList.remove('money-screen-shake');
  // Trigger reflow to restart animation
  void body.offsetWidth;
  body.classList.add('money-screen-shake');

  // Haptic feedback on mobile if supported
  if (typeof window !== 'undefined' && 'navigator' in window && window.navigator.vibrate) {
    try {
      window.navigator.vibrate([50, 40, 80]);
    } catch {}
  }

  setTimeout(() => {
    body.classList.remove('money-screen-shake');
  }, 600);
}

/**
 * Spawns a lightweight floating money badge pop-up in the center
 */
function spawnPopBadge(amount: number, isLarge: boolean) {
  if (typeof document === 'undefined') return;
  ensureScreenShakeStyle();

  const badge = document.createElement('div');
  badge.className = 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] money-pop-badge';

  if (isLarge) {
    badge.innerHTML = `
      <div class="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-lg sm:text-2xl shadow-[0_0_40px_rgba(245,158,11,0.8),0_10px_25px_rgba(0,0,0,0.5)] border-2 border-yellow-200 flex items-center gap-2.5">
        <span class="text-2xl sm:text-3xl animate-bounce">💰</span>
        <span>+฿${amount.toLocaleString()}</span>
        <span class="text-xs bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">SUPER TOP-UP</span>
      </div>
    `;
  } else {
    badge.innerHTML = `
      <div class="px-4 py-2 rounded-xl bg-slate-900/90 text-cyan-300 font-black text-sm sm:text-base shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-400/50 flex items-center gap-2 backdrop-blur-md">
        <span class="text-base sm:text-lg">🪙</span>
        <span>+฿${amount > 0 ? amount.toLocaleString() : '50'}</span>
        <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded">SUCCESS</span>
      </div>
    `;
  }

  document.body.appendChild(badge);
  setTimeout(() => {
    if (badge.parentNode) {
      badge.parentNode.removeChild(badge);
    }
  }, 1500);
}

/**
 * Cache text shapes to avoid re-rendering canvases repeatedly
 */
let cachedShapes: any[] | null = null;
function getMoneyShapes() {
  if (cachedShapes) return cachedShapes;
  if (typeof confetti.shapeFromText === 'function') {
    try {
      const bill = confetti.shapeFromText({ text: '💵', scalar: 2.2 });
      const coin = confetti.shapeFromText({ text: '🪙', scalar: 2.0 });
      const bag = confetti.shapeFromText({ text: '💰', scalar: 2.2 });
      cachedShapes = [bill, coin, bag];
      return cachedShapes;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Smart Celebration Effect:
 * - Small amounts (< 500 THB): Single clean pop burst from center, disappears in ~1s (0 lag).
 * - Large amounts (>= 500 THB): Screen shake + dual side cannons + high impact golden explosion.
 */
export function triggerMoneyCelebration(
  amountOrOptions?: number | MoneyCelebrationOptions
) {
  if (typeof window === 'undefined') return;

  const rawAmount =
    typeof amountOrOptions === 'number'
      ? amountOrOptions
      : typeof amountOrOptions === 'object' && amountOrOptions !== null
      ? amountOrOptions.amount
      : 50;

  const amount = Number(rawAmount) || 50;
  const isLarge = amount >= 500;
  const shapes = getMoneyShapes();

  // Show center pop badge
  spawnPopBadge(amount, isLarge);

  // -------------------------------------------------------------
  // 1. SMALL AMOUNT (< 500 THB): Clean single pop, vanishes quickly
  // -------------------------------------------------------------
  if (!isLarge) {
    // Single burst from center, low particle count, fast drop (ticks: 80)
    confetti({
      particleCount: 24,
      spread: 60,
      origin: { x: 0.5, y: 0.55 },
      shapes: shapes,
      scalar: 1.8,
      gravity: 1.3,
      drift: 0,
      ticks: 85, // Disappears in < 1 second!
      colors: ['#10b981', '#f59e0b', '#fbbf24', '#06b6d4'],
      disableForReducedMotion: true,
    });
    return;
  }

  // -------------------------------------------------------------
  // 2. LARGE AMOUNT (>= 500 THB): Screen shake + Grand explosion
  // -------------------------------------------------------------
  triggerScreenShake();

  // Central explosive burst
  confetti({
    particleCount: 55,
    spread: 100,
    origin: { x: 0.5, y: 0.55 },
    shapes: shapes,
    scalar: 2.2,
    gravity: 0.9,
    ticks: 140,
    colors: ['#f59e0b', '#fbbf24', '#10b981', '#34d399', '#f43f5e', '#ffffff'],
    disableForReducedMotion: true,
  });

  // Left cannon (150ms delay for punchy sequential feel)
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 60,
      origin: { x: 0.08, y: 0.7 },
      shapes: shapes,
      scalar: 2.0,
      gravity: 0.9,
      ticks: 140,
      colors: ['#fbbf24', '#f59e0b', '#10b981'],
      disableForReducedMotion: true,
    });
  }, 120);

  // Right cannon
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 60,
      origin: { x: 0.92, y: 0.7 },
      shapes: shapes,
      scalar: 2.0,
      gravity: 0.9,
      ticks: 140,
      colors: ['#fbbf24', '#f59e0b', '#10b981'],
      disableForReducedMotion: true,
    });
  }, 220);
}
