'use client';

import confetti from 'canvas-confetti';

/**
 * Spectacular Money Shower & Celebration Effect
 * Spawns falling banknotes (💵, 💸), gold coins (🪙), and money bags (💰)
 * alongside golden glitter bursts when wallet top-up completes.
 */
export function triggerMoneyCelebration(options?: { durationMs?: number }) {
  if (typeof window === 'undefined') return;

  const duration = options?.durationMs || 3500;
  const animationEnd = Date.now() + duration;

  // 1. Try creating custom emoji shapes from canvas-confetti
  let moneyShapes: any[] = [];
  try {
    if (typeof confetti.shapeFromText === 'function') {
      const bill = confetti.shapeFromText({ text: '💵', scalar: 2.8 });
      const flyMoney = confetti.shapeFromText({ text: '💸', scalar: 2.8 });
      const coin = confetti.shapeFromText({ text: '🪙', scalar: 2.4 });
      const bag = confetti.shapeFromText({ text: '💰', scalar: 2.8 });
      moneyShapes = [bill, flyMoney, coin, bag];
    }
  } catch (err) {
    console.warn('Canvas-confetti text shapes fallback:', err);
  }

  // 2. Play money shower canon intervals
  const frame = () => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return;

    const particleCount = 25 * (timeLeft / duration);

    // Left cannon (bursting banknotes & gold)
    confetti({
      particleCount: Math.floor(particleCount * 0.7),
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      shapes: moneyShapes.length > 0 ? moneyShapes : undefined,
      scalar: 2.2,
      drift: 0.1,
      gravity: 0.8,
      ticks: 300,
      colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#38bdf8', '#ffffff'],
      disableForReducedMotion: true,
    });

    // Right cannon (bursting banknotes & gold)
    confetti({
      particleCount: Math.floor(particleCount * 0.7),
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      shapes: moneyShapes.length > 0 ? moneyShapes : undefined,
      scalar: 2.2,
      drift: -0.1,
      gravity: 0.8,
      ticks: 300,
      colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#38bdf8', '#ffffff'],
      disableForReducedMotion: true,
    });

    // Center ceiling drop (gentle money rain)
    confetti({
      particleCount: Math.floor(particleCount * 0.5),
      angle: 270,
      spread: 120,
      origin: { x: 0.5, y: -0.1 },
      shapes: moneyShapes.length > 0 ? moneyShapes : undefined,
      scalar: 2.5,
      gravity: 0.6,
      drift: (Math.random() - 0.5) * 0.4,
      ticks: 350,
      colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24'],
      disableForReducedMotion: true,
    });

    requestAnimationFrame(frame);
  };

  // Immediate initial blast from center
  confetti({
    particleCount: 50,
    spread: 100,
    origin: { y: 0.6 },
    shapes: moneyShapes.length > 0 ? moneyShapes : undefined,
    scalar: 2.6,
    gravity: 0.7,
    ticks: 250,
    colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#06b6d4'],
  });

  // Start continuous cascade
  requestAnimationFrame(frame);

  // 3. Complementary floating cash DOM overlay for extra visual pop
  try {
    spawnFloatingCashDOM(duration);
  } catch (err) {
    // Non-blocking fallback
  }
}

/**
 * Spawns floating 3D money bills & shiny coins floating down the screen
 */
function spawnFloatingCashDOM(durationMs: number) {
  if (typeof document === 'undefined') return;

  const container = document.createElement('div');
  container.className = 'fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none';
  document.body.appendChild(container);

  const emojis = ['💸', '💵', '🪙', '💰', '✨', '💵', '💸'];
  const count = 28;

  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const startX = Math.random() * 100; // % across screen
    const delay = Math.random() * 1.5; // seconds
    const duration = 2.2 + Math.random() * 2.2; // seconds
    const size = 26 + Math.floor(Math.random() * 32); // font size px
    const rotation = (Math.random() - 0.5) * 720; // total spin

    item.innerText = emoji;
    item.style.position = 'absolute';
    item.style.left = `${startX}%`;
    item.style.top = '-60px';
    item.style.fontSize = `${size}px`;
    item.style.filter = 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.4))';
    item.style.opacity = '0';
    item.style.transition = `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease`;
    item.style.transform = `translateY(0px) rotate(0deg) scale(0.6)`;

    container.appendChild(item);

    // Trigger animation
    setTimeout(() => {
      item.style.opacity = '1';
      const endY = window.innerHeight + 120;
      const swayX = (Math.random() - 0.5) * 200;
      item.style.transform = `translate(${swayX}px, ${endY}px) rotate(${rotation}deg) scale(1.1)`;
    }, delay * 1000);
  }

  // Auto clean-up DOM container
  setTimeout(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, durationMs + 2000);
}
