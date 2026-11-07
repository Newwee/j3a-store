import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';
import { generateBatchKeys } from '@/lib/utils/licenseGenerator';
import { LicenseItem, LicenseStats } from '@/types/license';

const GOOGLE_APPS_SCRIPT_BASE_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbwq22hsYcYWJYuOaUkDy1Ysmut80NwQ5kdmQ-0ItJ8JhGjV2w2PRxEua9mi_3yGagh1/exec';

const ADMIN_ACTION_SECRET = process.env.ADMIN_ACTION_SECRET || 'J3A_SEC_ACTION_9921_X!';

/**
 * GET: Fetch licenses with filters and statistics
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const product = searchParams.get('product') || 'all';
    const status = searchParams.get('status') || 'all';
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit')) || 100));
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0);

    let query = supabaseAdmin
      .from('licenses')
      .select('*', { count: 'exact' });

    if (product !== 'all') {
      // Support matching desk_cord, discord_autoquest, etc.
      query = query.ilike('product_slug', `%${product}%`);
    }

    if (status !== 'all') {
      if (status === 'UNUSED' || status === 'available') {
        query = query.in('status', ['available', 'UNUSED']);
      } else if (status === 'ACTIVE' || status === 'active') {
        query = query.in('status', ['active', 'ACTIVE', 'claimed']);
      } else if (status === 'EXPIRED' || status === 'expired') {
        query = query.in('status', ['expired', 'EXPIRED']);
      } else if (status === 'REVOKED' || status === 'revoked') {
        query = query.in('status', ['revoked', 'REVOKED']);
      }
    }

    if (search) {
      query = query.or(`key.ilike.%${search}%,notes.ilike.%${search}%,hwid.ilike.%${search}%,product_slug.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: rows, count, error: fetchErr } = await query;

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    // Compute stats
    const { data: allStatsRows } = await supabaseAdmin
      .from('licenses')
      .select('status, duration_days, tier');

    const stats: LicenseStats = {
      total: allStatsRows?.length || 0,
      active: 0,
      unused: 0,
      expired: 0,
      revoked: 0,
      lifetime: 0,
    };

    allStatsRows?.forEach((row) => {
      const s = (row.status || '').toLowerCase();
      if (s === 'active' || s === 'claimed') stats.active++;
      else if (s === 'available' || s === 'unused') stats.unused++;
      else if (s === 'expired') stats.expired++;
      else if (s === 'revoked') stats.revoked++;

      if (row.duration_days === 0 || row.tier === 'lifetime') {
        stats.lifetime++;
      }
    });

    const licenses: LicenseItem[] = (rows || []).map((r) => ({
      ...r,
      duration_type: r.duration_days === 0 || r.tier === 'lifetime' ? 'lifetime' : 'timed',
      status: r.status,
    }));

    return NextResponse.json({
      ok: true,
      licenses,
      totalCount: count || licenses.length,
      stats,
    });
  } catch (err: any) {
    console.error('Error fetching admin licenses:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST: Batch Generate License Keys
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      productId,
      customProductId,
      customProductName,
      keyPrefix,
      durationType = 'timed',
      durationDays = 7,
      batchCount = 1,
      note = '',
      syncGoogleSheets = true,
    } = body;

    const count = Math.max(1, Math.min(200, Math.floor(Number(batchCount) || 1)));
    const effectiveProduct = productId === 'custom' ? (customProductId || 'custom_product').toLowerCase().trim() : productId;
    const effectivePrefix = (keyPrefix || 'J3A').trim().toUpperCase();
    const effectiveDays = durationType === 'lifetime' ? 0 : Math.max(1, Math.floor(Number(durationDays) || 7));
    const effectiveTier = durationType === 'lifetime' ? 'lifetime' : `${effectiveDays}d`;

    // 1. Generate unique keys
    const generatedKeys = generateBatchKeys(count, { prefix: effectivePrefix });

    const now = new Date().toISOString();
    const rowsToInsert = generatedKeys.map((k) => ({
      id: `lic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key: k,
      product_slug: effectiveProduct,
      tier: effectiveTier,
      duration_days: effectiveDays,
      status: 'available', // available = UNUSED
      notes: note?.trim() || `Admin Generated (${effectiveProduct})`,
      created_at: now,
      updated_at: now,
    }));

    // 2. Insert into Supabase
    const { error: insertErr } = await supabaseAdmin.from('licenses').insert(rowsToInsert);
    if (insertErr) {
      console.error('Failed to insert licenses in Supabase:', insertErr);
      return NextResponse.json({ error: `Supabase insert failed: ${insertErr.message}` }, { status: 500 });
    }

    // 3. Optional: Sync to Google Sheets via GAS Web App
    let sheetSyncResult: any = { synced: false };
    if (syncGoogleSheets && GOOGLE_APPS_SCRIPT_BASE_URL) {
      try {
        const gasPayload = {
          action: 'generate',
          token: ADMIN_ACTION_SECRET,
          product: effectiveProduct,
          product_name: customProductName || effectiveProduct,
          keys: rowsToInsert.map((r) => ({
            key: r.key,
            product: r.product_slug,
            duration_type: durationType,
            duration_days: r.duration_days,
            status: 'UNUSED',
            hwid: '',
            created_at: r.created_at,
            activated_at: '',
            expires_at: durationType === 'lifetime' ? 'NEVER' : '',
            note: r.notes || '',
          })),
        };

        const gasRes = await fetch(GOOGLE_APPS_SCRIPT_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gasPayload),
          signal: AbortSignal.timeout(10000),
        });

        if (gasRes.ok) {
          const gasData = await gasRes.json().catch(() => null);
          sheetSyncResult = { synced: true, data: gasData };
        } else {
          sheetSyncResult = { synced: false, status: gasRes.status };
        }
      } catch (gasErr: any) {
        console.warn('Google Sheet sync non-fatal warning:', gasErr.message);
        sheetSyncResult = { synced: false, warning: gasErr.message };
      }
    }

    // 4. Dispatch Discord Audit notification
    try {
      fetch(`${new URL(req.url).origin}/api/notifications/discord`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'admin_audit',
          data: {
            adminName: authResult.user?.email || 'Admin',
            action: `Generated ${count} License Keys for ${effectiveProduct}`,
            details: `Prefix: ${effectivePrefix} | Duration: ${durationType === 'lifetime' ? 'Lifetime' : `${effectiveDays} Days`} | Keys: ${generatedKeys.slice(0, 3).join(', ')}${generatedKeys.length > 3 ? '...' : ''}`,
          },
        }),
      }).catch(() => {});
    } catch {}

    return NextResponse.json({
      ok: true,
      success: true,
      keys: generatedKeys,
      count: generatedKeys.length,
      product: effectiveProduct,
      durationDays: effectiveDays,
      durationType,
      sheetSync: sheetSyncResult,
      message: `สร้าง License Key สำเร็จทั้งหมด ${generatedKeys.length} คีย์`,
    });
  } catch (err: any) {
    console.error('Error generating licenses:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

/**
 * PATCH: Update license status (Revoke, Reactivate, or Update Notes)
 */
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { key, id, action, note } = body;

    if (!key && !id) {
      return NextResponse.json({ error: 'License Key or ID is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let updates: Record<string, any> = { updated_at: now };

    if (action === 'revoke') {
      updates.status = 'revoked';
      updates.notes = note ? `[REVOKED: ${note}]` : '[REVOKED BY ADMIN]';
    } else if (action === 'reactivate') {
      updates.status = 'available';
      updates.hwid = null;
      updates.activated_at = null;
      updates.expires_at = null;
    } else if (action === 'update_note') {
      updates.notes = note || '';
    } else if (action === 'reset_hwid') {
      updates.hwid = null;
      updates.notes = `[HWID RESET ON ${now}] ${note || ''}`;
    }

    let query = supabaseAdmin.from('licenses').update(updates);
    if (id) {
      query = query.eq('id', id);
    } else if (key) {
      query = query.eq('key', key.trim().toUpperCase());
    }

    const { error: updateErr } = await query;
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: `อัปเดตสถานะคีย์สำเร็จ (${action})` });
  } catch (err: any) {
    console.error('Error updating license:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE: Delete a license key permanently
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const key = searchParams.get('key')?.trim().toUpperCase();

    if (!id && !key) {
      return NextResponse.json({ error: 'Key or ID is required for deletion' }, { status: 400 });
    }

    let query = supabaseAdmin.from('licenses').delete();
    if (id) {
      query = query.eq('id', id);
    } else if (key) {
      query = query.eq('key', key);
    }

    const { error: delErr } = await query;
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'ลบคีย์ออกจากระบบเรียบร้อยแล้ว' });
  } catch (err: any) {
    console.error('Error deleting license:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
