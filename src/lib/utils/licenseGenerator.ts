/**
 * Standard J3A License Key Generator
 * Safe alphanumeric character set excluding ambiguous characters (0, O, 1, I, L)
 */
export const LICENSE_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export interface GenerateKeyOptions {
  prefix: string;
  segments?: number; // default: 3
  segmentLength?: number; // default: 4
}

/**
 * Generate a single cryptographically secure license key
 * Example: J3ADC-7RYX-3SDM-F4MV
 */
export function generateSingleKey(options: GenerateKeyOptions): string {
  const { prefix, segments = 3, segmentLength = 4 } = options;
  const cleanPrefix = (prefix || 'J3A').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const segmentParts: string[] = [];

  for (let s = 0; s < segments; s++) {
    let seg = '';
    const randomBuffer = new Uint8Array(segmentLength);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBuffer);
    } else {
      // Node fallback
      for (let i = 0; i < segmentLength; i++) {
        randomBuffer[i] = Math.floor(Math.random() * 256);
      }
    }

    for (let i = 0; i < segmentLength; i++) {
      seg += LICENSE_CHARSET[randomBuffer[i] % LICENSE_CHARSET.length];
    }
    segmentParts.push(seg);
  }

  return `${cleanPrefix}-${segmentParts.join('-')}`;
}

/**
 * Generate a batch of unique license keys
 */
export function generateBatchKeys(count: number, options: GenerateKeyOptions): string[] {
  const safeCount = Math.max(1, Math.min(200, Math.floor(count || 1)));
  const uniqueKeys = new Set<string>();
  let attempts = 0;
  const maxAttempts = safeCount * 5;

  while (uniqueKeys.size < safeCount && attempts < maxAttempts) {
    attempts++;
    const key = generateSingleKey(options);
    uniqueKeys.add(key);
  }

  return Array.from(uniqueKeys);
}
