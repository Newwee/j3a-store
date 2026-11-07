import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';

/**
 * GET /api/admin/codes/users?code=CODE
 * Fetches the detailed usage history of a specific redeem/discount code.
 * Returns which users used it, when, and what orders or topups were generated.
 * Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const code = (searchParams.get('code') || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    // 1. Fetch code record
    const { data: codeData } = await supabaseAdmin
      .from('redeem_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    // 2. Fetch topup redemptions (Gift codes)
    const { data: topups } = await supabaseAdmin
      .from('topups')
      .select('id, topup_number, user_id, user_email, user_name, amount, created_at, status')
      .or(`voucher_hash.eq.${code},payment_slip_url.eq.REDEEM_CODE:${code}`)
      .order('created_at', { ascending: false });

    // 3. Fetch order discount usage
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, user_id, customer_name, customer_email, total, discount, created_at, status')
      .eq('discount_code', code)
      .order('created_at', { ascending: false });

    // 4. Resolve unique user profiles if used_by exists
    const usedByUserIds: string[] = Array.isArray(codeData?.used_by)
      ? codeData.used_by
      : typeof codeData?.used_by === 'string'
      ? JSON.parse(codeData.used_by || '[]')
      : [];

    let usersInfo: any[] = [];
    if (usedByUserIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, display_name, credits, role, created_at')
        .in('id', usedByUserIds);
      usersInfo = profiles || [];
    }

    return NextResponse.json({
      ok: true,
      code,
      codeData,
      totalCount: (topups?.length || 0) + (orders?.length || 0),
      topups: topups || [],
      orders: orders || [],
      users: usersInfo,
    });
  } catch (err: any) {
    console.error('Error fetching code users:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
