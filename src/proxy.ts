import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired IP records every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredRecords() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }
}

// Suspicious bot & scanner User-Agents
const MALICIOUS_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'masscan',
  'wpscan',
  'acunetix',
  'nmap',
  'zgrab',
  'dirbuster',
  'gobuster',
  'havij',
  'hydra',
  'medusa',
  'fimap',
  'netsparker',
];

// Dangerous attack paths (Vulnerability scanners / Probes)
const BLOCKED_PATHS = [
  '/.env',
  '/.git',
  '/wp-admin',
  '/wp-login.php',
  '/xmlrpc.php',
  '/phpmyadmin',
  '/pma',
  '/.aws',
  '/vendor/phpunit',
  '/cgi-bin',
  '/.ds_store',
  '/config.json',
  '/database.sqlite',
];

function checkRateLimit(
  ip: string,
  prefix: string,
  limit: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupExpiredRecords();
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return { allowed: true, remaining: limit - 1, resetIn: windowSeconds };
  }

  record.count += 1;
  const resetIn = Math.ceil((record.resetAt - now) / 1000);

  if (record.count > limit) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining: limit - record.count, resetIn };
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

  // 1. Block Malicious Vulnerability Scanners & Probes
  const isMaliciousPath = BLOCKED_PATHS.some((p) => path.toLowerCase().startsWith(p));
  const isMaliciousUA = MALICIOUS_USER_AGENTS.some((ua) => userAgent.includes(ua));

  if (isMaliciousPath || isMaliciousUA) {
    return new NextResponse('Access Denied: Malicious probe detected by J3A Shield.', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Shield-Blocked': 'true',
      },
    });
  }

  // 2. Extract Client IP
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  // 3. Define Rate Limits based on endpoint sensitivity
  let limit = 120; // 120 req / minute for normal pages
  let windowSeconds = 60;
  let tierPrefix = 'general';

  if (path.startsWith('/api/license/claim') || path === '/login' || path === '/register') {
    // Sensitive Auth & Claim endpoints: Max 20 requests per minute
    limit = 20;
    tierPrefix = 'sensitive';
  } else if (path.startsWith('/api/')) {
    // General API endpoints: Max 60 requests per minute
    limit = 60;
    tierPrefix = 'api';
  }

  const { allowed, remaining, resetIn } = checkRateLimit(clientIp, tierPrefix, limit, windowSeconds);

  if (!allowed) {
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'คำขอถี่เกินไป ระบบป้องกันความปลอดภัย (DDoS & Rate Limit) ได้ระงับการเข้าถึงชั่วคราว กรุณารอ 1 นาที',
          retryAfter: resetIn,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(resetIn),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetIn),
            'X-Shield-Action': 'rate-limited',
          },
        }
      );
    }

    // HTML response for browser requests
    const html = `
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>429 Too Many Requests - J3A STORE Shield</title>
          <style>
            body {
              background: #020617;
              color: #f8fafc;
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background: rgba(15, 23, 42, 0.9);
              border: 1px solid rgba(6, 182, 212, 0.3);
              border-radius: 24px;
              padding: 40px;
              max-width: 480px;
              width: 100%;
              text-align: center;
              box-shadow: 0 0 50px rgba(6, 182, 212, 0.2);
            }
            .icon { font-size: 48px; margin-bottom: 16px; }
            h1 { font-size: 24px; font-weight: 900; color: #38bdf8; margin: 0 0 12px 0; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px 0; }
            .timer {
              font-family: monospace;
              font-size: 16px;
              color: #f43f5e;
              background: rgba(244, 63, 94, 0.1);
              border: 1px solid rgba(244, 63, 94, 0.2);
              padding: 10px 16px;
              border-radius: 12px;
              display: inline-block;
              margin-bottom: 24px;
            }
            .btn {
              display: inline-block;
              background: #06b6d4;
              color: #020617;
              font-weight: 800;
              text-decoration: none;
              padding: 12px 28px;
              border-radius: 14px;
              cursor: pointer;
              transition: all 0.2s;
            }
            .btn:hover { background: #22d3ee; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">🛡️</div>
            <h1>J3A STORE DDoS Defense</h1>
            <p>ระบบตรวจพบการส่งคำขอถี่ผิดปกติจากอุปกรณ์ของคุณ เพื่อความปลอดภัยของระบบจึงทำการระงับชั่วคราว</p>
            <div class="timer">กรุณารอประมาณ ${resetIn} วินาทีก่อนลองใหม่อีกครั้ง</div>
            <br />
            <a href="/" class="btn" onclick="location.reload(); return false;">โหลดหน้านี้ใหม่</a>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 429,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': String(resetIn),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetIn),
        'X-Shield-Action': 'rate-limited',
      },
    });
  }

  // Request allowed - continue with security headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(resetIn));
  response.headers.set('X-Shield-Protected', 'J3A-DDoS-Guard');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets like images (.png, .jpg, .svg, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
