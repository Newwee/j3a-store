import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';
import { OrderStatus } from '@/types/order';

const GOOGLE_APPS_SCRIPT_BASE_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbwq22hsYcYWJYuOaUkDy1Ysmut80NwQ5kdmQ-0ItJ8JhGjV2w2PRxEua9mi_3yGagh1/exec';

const ADMIN_ACTION_SECRET = process.env.ADMIN_ACTION_SECRET || 'J3A_SEC_ACTION_9921_X!';

/**
 * Extract all unique license keys associated with an order
 */
function extractKeysFromOrder(order: any): string[] {
  const keysSet = new Set<string>();

  // 1. Check transaction_ref (might be single key or comma-separated)
  if (order.transaction_ref && typeof order.transaction_ref === 'string') {
    order.transaction_ref
      .split(',')
      .map((k: string) => k.trim().toUpperCase())
      .filter((k: string) => k.length > 5 && !k.startsWith('TXN_') && !k.startsWith('PP_'))
      .forEach((k: string) => keysSet.add(k));
  }

  // 2. Check items array
  const items = Array.isArray(order.items)
    ? order.items
    : typeof order.items === 'string'
    ? JSON.parse(order.items || '[]')
    : [];

  for (const item of items) {
    if (item.licenseKey && typeof item.licenseKey === 'string' && item.licenseKey.trim()) {
      keysSet.add(item.licenseKey.trim().toUpperCase());
    }
    if (Array.isArray(item.licenseKeys)) {
      for (const k of item.licenseKeys) {
        if (typeof k === 'string' && k.trim()) {
          keysSet.add(k.trim().toUpperCase());
        }
      }
    }
  }

  return Array.from(keysSet);
}

/**
 * PATCH /api/admin/orders/status
 * Updates order status and automatically revokes/restores license keys
 */
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, status, reason } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 1. Fetch the target order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อนี้ในระบบ' }, { status: 404 });
    }

    const previousStatus = order.status;
    const targetStatus = status as OrderStatus;

    // 2. Extract all license keys attached to this order
    const attachedKeys = extractKeysFromOrder(order);

    // Also find any keys in Supabase licenses table that have order_id = order.id
    const { data: dbLicenses } = await supabaseAdmin
      .from('licenses')
      .select('key')
      .eq('order_id', order.id);

    if (dbLicenses && dbLicenses.length > 0) {
      dbLicenses.forEach((l) => {
        if (l.key) attachedKeys.push(l.key.trim().toUpperCase());
      });
    }

    const uniqueKeys = Array.from(new Set(attachedKeys));
    let revokedCount = 0;
    let restoredCount = 0;

    // 3. Handle License Keys based on new order status
    if (targetStatus === 'cancelled') {
      const orderRef = order.order_number || order.id;
      const revokeNote = `[REVOKED: Order #${orderRef} Cancelled by Admin${reason ? ` - ${reason}` : ''} on ${now}]`;

      if (uniqueKeys.length > 0) {
        // A. Update existing keys in Supabase licenses table
        const { data: existingLics } = await supabaseAdmin
          .from('licenses')
          .select('key')
          .in('key', uniqueKeys);

        const existingKeySet = new Set((existingLics || []).map((l) => l.key.toUpperCase()));

        // Update existing rows
        if (existingKeySet.size > 0) {
          const keysToUpdate = uniqueKeys.filter((k) => existingKeySet.has(k));
          await supabaseAdmin
            .from('licenses')
            .update({
              status: 'revoked',
              notes: revokeNote,
              updated_at: now,
            })
            .in('key', keysToUpdate);
          revokedCount += keysToUpdate.length;
        }

        // B. If any keys came from Google Sheets and aren't in Supabase yet, insert them as REVOKED
        // so that /api/license/verify will immediately block them
        const missingKeys = uniqueKeys.filter((k) => !existingKeySet.has(k));
        if (missingKeys.length > 0) {
          const newRevokedRows = missingKeys.map((k) => ({
            id: `lic_revoked_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            key: k,
            product_slug: k.startsWith('J3ADC')
              ? 'desk_cord'
              : k.startsWith('J3ADQ')
              ? 'discord_autoquest'
              : k.startsWith('J3ADM')
              ? 'discord_manager'
              : k.startsWith('J3ADP')
              ? 'discord_profile'
              : 'software_license',
            tier: 'legacy',
            duration_days: 0,
            status: 'revoked',
            order_id: order.id,
            notes: revokeNote,
            created_at: now,
            updated_at: now,
          }));

          await supabaseAdmin.from('licenses').insert(newRevokedRows);
          revokedCount += missingKeys.length;
        }

        // C. Sync Revoke to Google Apps Script / Google Sheets
        for (const k of uniqueKeys) {
          fetch(GOOGLE_APPS_SCRIPT_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'revoke',
              key: k,
              status: 'REVOKED',
              order_no: orderRef,
              token: ADMIN_ACTION_SECRET,
            }),
            signal: AbortSignal.timeout(6000),
          }).catch((err) => console.warn(`GAS revoke key non-fatal warning (${k}):`, err?.message));
        }
      }
    } else if (
      (targetStatus === 'completed' || targetStatus === 'paid') &&
      previousStatus === 'cancelled'
    ) {
      // Re-activating a previously cancelled order -> restore license keys to claimed
      if (uniqueKeys.length > 0) {
        const orderRef = order.order_number || order.id;
        await supabaseAdmin
          .from('licenses')
          .update({
            status: 'claimed',
            notes: `[RESTORED: Order #${orderRef} Re-activated by Admin on ${now}]`,
            updated_at: now,
          })
          .in('key', uniqueKeys);

        restoredCount = uniqueKeys.length;
      }
    }

    // 4. Update order status in orders table
    const { error: updateOrderErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: targetStatus,
        updated_at: now,
      })
      .eq('id', order.id);

    if (updateOrderErr) {
      return NextResponse.json({ error: updateOrderErr.message }, { status: 500 });
    }

    // 5. Send Discord audit notification if cancelled
    if (targetStatus === 'cancelled') {
      try {
        fetch(`${new URL(req.url).origin}/api/notifications/discord`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'admin_audit',
            data: {
              adminName: authResult.user?.email || 'Admin',
              action: `ยกเลิกคำสั่งซื้อ #${order.order_number || order.id} (Order Cancelled)`,
              details: `ลูกค้า: ${order.customer_name} (${order.customer_email}) | คีย์ที่ถูกระงับสิทธิ์: ${uniqueKeys.length > 0 ? uniqueKeys.join(', ') : 'ไม่มีคีย์'}`,
            },
          }),
        }).catch(() => {});
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      status: targetStatus,
      revokedKeys: targetStatus === 'cancelled' ? uniqueKeys : [],
      revokedCount,
      restoredCount,
      message:
        targetStatus === 'cancelled'
          ? `ยกเลิกคำสั่งซื้อ #${order.order_number || order.id} สำเร็จ! และระงับสิทธิ์ License Key ทั้งหมด (${uniqueKeys.length} คีย์) เรียบร้อยแล้ว`
          : `อัปเดตสถานะคำสั่งซื้อเป็น "${targetStatus}" เรียบร้อย`,
    });
  } catch (err: any) {
    console.error('Error updating order status & revoking licenses:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
