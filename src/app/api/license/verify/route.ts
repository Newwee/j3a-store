import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// CORS response helper
function corsJson(data: any, init?: { status?: number }) {
  const response = NextResponse.json(data, init);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

interface LicenseVerifyPayload {
  key?: string;
  hwid?: string;
  app_name?: string;
  app_version?: string;
  action?: 'verify' | 'activate';
}

const TIER_NAMES: Record<string, string> = {
  '3d': '3 Days Trial (ทดลองใช้งาน 3 วัน)',
  '1w': '1 Week (7 วัน)',
  '4w': '4 Weeks (28 วัน)',
  '6m': '6 Months (180 วัน)',
  'lifetime': 'Lifetime (ตลอดชีพ / ลูกค้าเดิม)',
  'legacy': 'Legacy (ชดเชยลูกค้าเดิม)',
};

export async function POST(req: NextRequest) {
  try {
    let body: LicenseVerifyPayload = {};
    try {
      body = await req.json();
    } catch {
      return corsJson(
        { valid: false, error: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    const rawKey = body.key;
    const rawHwid = body.hwid;

    if (!rawKey || typeof rawKey !== 'string') {
      return corsJson(
        { valid: false, error: 'กรุณาระบุ License Key (key parameter is required)' },
        { status: 400 }
      );
    }

    if (!rawHwid || typeof rawHwid !== 'string' || rawHwid.trim().length < 6) {
      return corsJson(
        { valid: false, error: 'กรุณาระบุ Hardware ID (hwid parameter is required)' },
        { status: 400 }
      );
    }

    const key = rawKey.trim().toUpperCase();
    const hwid = rawHwid.trim().toLowerCase();
    const now = new Date();

    // 1. Fetch license from Supabase
    const { data: license, error: fetchErr } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (fetchErr) {
      console.error('Database query error checking license:', fetchErr);
      return corsJson(
        { valid: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      );
    }

    if (!license) {
      return corsJson(
        { valid: false, error: 'ไม่พบคีย์นี้ในระบบ กรุณาตรวจสอบความถูกต้องของ License Key' },
        { status: 404 }
      );
    }

    // 2. Check revoked status
    if (license.status === 'revoked') {
      return corsJson(
        {
          valid: false,
          status: 'revoked',
          error: 'License Key นี้ถูกระงับการใช้งานโดยผู้ดูแลระบบ (Revoked)',
        },
        { status: 403 }
      );
    }

    // 3. First-time activation flow (status = 'available' or 'claimed')
    if (license.status === 'available' || license.status === 'claimed') {
      // 3.1 Anti-trial abuse: If key is 3-day trial, verify HWID hasn't used trial before
      if (license.tier === '3d') {
        const { data: existingTrial } = await supabaseAdmin
          .from('hwid_trials')
          .select('hwid, first_activated_at')
          .eq('hwid', hwid)
          .maybeSingle();

        if (existingTrial) {
          return corsJson(
            {
              valid: false,
              tier: '3d',
              error:
                'อุปกรณ์เครื่องนี้เคยใช้สิทธิ์ทดลองใช้งาน 3 วันไปแล้ว (จำกัด 1 เครื่องต่อ 1 สิทธิ์ทดลองเท่านั้น กรุณาสั่งซื้อแพ็กเกจปกติ)',
            },
            { status: 403 }
          );
        }
      }

      // Calculate expiration timestamp
      const durationDays = Number(license.duration_days) || 7;
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Activate key & bind HWID
      const { error: updateErr } = await supabaseAdmin
        .from('licenses')
        .update({
          status: 'active',
          hwid,
          activated_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          last_verified_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', license.id);

      if (updateErr) {
        console.error('Failed to activate license:', updateErr);
        return corsJson(
          { valid: false, error: 'ไม่สามารถเปิดใช้งานคีย์ได้ กรุณาลองใหม่อีกครั้ง' },
          { status: 500 }
        );
      }

      // If trial, log HWID into hwid_trials
      if (license.tier === '3d') {
        await supabaseAdmin.from('hwid_trials').insert({
          hwid,
          key: license.key,
          first_activated_at: now.toISOString(),
          notes: `Activated via key ${license.key}`,
        });
      }

      const remainingSeconds = durationDays * 86400;

      return corsJson({
        valid: true,
        action: 'activated',
        status: 'active',
        key: license.key,
        tier: license.tier,
        tierName: TIER_NAMES[license.tier] || license.tier,
        durationDays,
        activatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        remainingDays: durationDays,
        remainingSeconds,
        serverTime: now.toISOString(),
        message: 'เปิดใช้งานและผูกคีย์กับอุปกรณ์นี้สำเร็จ!',
      });
    }

    // 4. Verification flow for already 'active' licenses
    if (license.status === 'active') {
      // 4.1 HWID Binding check
      if (license.hwid && license.hwid !== hwid) {
        return corsJson(
          {
            valid: false,
            error:
              'License Key นี้ถูกเปิดใช้งานและผูกกับเครื่องอื่นแล้ว (HWID Mismatch ไม่อนุญาตให้ใช้ข้ามเครื่อง)',
          },
          { status: 403 }
        );
      }

      // If active key somehow has no HWID bound, bind it now
      if (!license.hwid) {
        await supabaseAdmin
          .from('licenses')
          .update({ hwid, updated_at: now.toISOString() })
          .eq('id', license.id);
      }

      // 4.2 Expiration check
      const expiresAt = license.expires_at ? new Date(license.expires_at) : null;
      if (expiresAt && now.getTime() >= expiresAt.getTime()) {
        // Mark as expired in DB
        await supabaseAdmin
          .from('licenses')
          .update({ status: 'expired', updated_at: now.toISOString() })
          .eq('id', license.id);

        return corsJson(
          {
            valid: false,
            status: 'expired',
            error: `License Key หมดอายุแล้วเมื่อ ${expiresAt.toLocaleString('th-TH')}`,
            expiresAt: expiresAt.toISOString(),
            serverTime: now.toISOString(),
          },
          { status: 403 }
        );
      }

      const remainingMs = expiresAt ? Math.max(0, expiresAt.getTime() - now.getTime()) : 0;
      const remainingSeconds = Math.floor(remainingMs / 1000);
      const remainingDays = +(remainingMs / (1000 * 60 * 60 * 24)).toFixed(2);

      // Update heartbeat
      await supabaseAdmin
        .from('licenses')
        .update({
          last_verified_at: now.toISOString(),
        })
        .eq('id', license.id);

      return corsJson({
        valid: true,
        action: 'verified',
        status: 'active',
        key: license.key,
        tier: license.tier,
        tierName: TIER_NAMES[license.tier] || license.tier,
        durationDays: license.duration_days,
        activatedAt: license.activated_at,
        expiresAt: license.expires_at,
        remainingDays,
        remainingSeconds,
        serverTime: now.toISOString(),
        message: 'License Key ถูกต้องและพร้อมใช้งาน',
      });
    }

    // 5. Expired state
    if (license.status === 'expired') {
      return corsJson(
        {
          valid: false,
          status: 'expired',
          error: 'License Key นี้หมดอายุการใช้งานแล้ว กรุณาสั่งซื้อใหม่',
          expiresAt: license.expires_at,
          serverTime: now.toISOString(),
        },
        { status: 403 }
      );
    }

    return corsJson(
      {
        valid: false,
        error: `สถานะของ License Key ไม่ถูกต้อง (${license.status}) กรุณาติดต่อแอดมิน`,
      },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Unhandled error in /api/license/verify:', err);
    return corsJson(
      { valid: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const hwid = searchParams.get('hwid');

  if (!key || !hwid) {
    return corsJson(
      { valid: false, error: 'Query parameters key and hwid are required' },
      { status: 400 }
    );
  }

  // Forward to POST handler
  const mockReq = new NextRequest(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, hwid }),
  });
  return POST(mockReq);
}
