import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Admin secret for Discord 1-click action links
const ADMIN_ACTION_SECRET = process.env.ADMIN_ACTION_SECRET || 'J3A_SEC_ACTION_9921_X!';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'revoke';
  const key = searchParams.get('key')?.trim().toUpperCase();
  const hwid = searchParams.get('hwid')?.trim().toLowerCase();
  const token = searchParams.get('token');

  // Validate security token
  if (!token || token !== ADMIN_ACTION_SECRET) {
    return new NextResponse(renderHtmlResult(false, 'ไม่ได้รับอนุญาต (Invalid Security Token)', 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันควบคุมนี้'), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (!key && !hwid) {
    return new NextResponse(renderHtmlResult(false, 'ข้อมูลไม่ครบถ้วน', 'ต้องระบุ License Key หรือ HWID'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  try {
    const now = new Date().toISOString();

    if (action === 'revoke' || action === 'ban' || action === 'blacklist') {
      let updatedCount = 0;

      // 1. Revoke by Key if provided
      if (key) {
        const { error, count } = await supabaseAdmin
          .from('licenses')
          .update({
            status: 'revoked',
            notes: `[REVOKED BY ADMIN VIA DISCORD ACTION] Reason: Anti-Tamper / Security Breach on ${now}`,
            updated_at: now
          })
          .eq('key', key);

        if (error) console.error('Error revoking key:', error);
        else updatedCount += (count || 1);
      }

      // 2. Blacklist by HWID if provided
      if (hwid) {
        // Also revoke all keys associated with this HWID
        await supabaseAdmin
          .from('licenses')
          .update({
            status: 'revoked',
            notes: `[REVOKED HWID BLACKLIST] Target HWID: ${hwid}`,
            updated_at: now
          })
          .eq('hwid', hwid);

        // Record into hwid_trials as permanently banned
        await supabaseAdmin
          .from('hwid_trials')
          .upsert({
            hwid,
            key: key || 'BLACKLISTED_TAMPER',
            notes: `PERMANENTLY BLACKLISTED due to code modification / reverse engineering attempt on ${now}`
          });
      }

      const msg = `ระงับสิทธิ์ License Key: ${key || '-'} และขึ้นบัญชีดำ HWID: ${hwid || '-'} เรียบร้อยแล้ว ผู้ใช้เครื่องนี้จะไม่สามารถเข้าใช้งานหรือเปิดระบบบอทได้อีกต่อไป`;
      return new NextResponse(renderHtmlResult(true, 'ระงับสิทธิ์และแบนผู้ใช้สำเร็จ (Revoked Successfully)', msg, { key, hwid, action }), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (action === 'unban' || action === 'restore') {
      if (key) {
        await supabaseAdmin
          .from('licenses')
          .update({
            status: 'active',
            notes: `Restored by Admin on ${now}`,
            updated_at: now
          })
          .eq('key', key);
      }
      return new NextResponse(renderHtmlResult(true, 'ปลดบล็อกสำเร็จ (Restored)', `ปลดระงับ License Key ${key} เรียบร้อยแล้ว`), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    return new NextResponse(renderHtmlResult(false, 'คำสั่งไม่ถูกต้อง', `Unknown action: ${action}`), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (err: any) {
    return new NextResponse(renderHtmlResult(false, 'เกิดข้อผิดพลาดของระบบ', err.message || 'Internal server error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

function renderHtmlResult(success: boolean, title: string, message: string, details?: any) {
  const color = success ? '#10b981' : '#ef4444';
  const icon = success ? '🛡️' : '⚠️';
  const statusBadge = success ? 'ACTION EXECUTED' : 'ACTION FAILED';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>J3A Security Admin Control</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0b0f19;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-top: 4px solid ${color};
      border-radius: 16px;
      padding: 32px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      text-align: center;
    }
    .icon { font-size: 54px; margin-bottom: 16px; }
    .badge {
      display: inline-block;
      background: ${success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      color: ${color};
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 6px 14px;
      border-radius: 999px;
      margin-bottom: 14px;
      border: 1px solid ${color}40;
    }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #fff; }
    p { font-size: 14px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px; }
    .details {
      background: #1f2937;
      border-radius: 8px;
      padding: 14px;
      text-align: left;
      font-family: monospace;
      font-size: 13px;
      color: #e5e7eb;
      margin-bottom: 24px;
      word-break: break-all;
    }
    .btn {
      display: inline-block;
      background: #3b82f6;
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 10px;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <div class="badge">${statusBadge}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${details ? `
      <div class="details">
        <div><strong>Key:</strong> ${details.key || '-'}</div>
        <div><strong>HWID:</strong> ${details.hwid || '-'}</div>
        <div><strong>Action:</strong> ${details.action}</div>
      </div>
    ` : ''}
    <a href="/admin/customers" class="btn">ไปยังหน้า Admin Dashboard</a>
  </div>
</body>
</html>`;
}
