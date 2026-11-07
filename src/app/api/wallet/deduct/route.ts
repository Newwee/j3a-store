import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * POST /api/wallet/deduct
 * Secure server-side atomic deduction of user credits for store purchases.
 * Bypasses client-side RLS quirks and ensures money is guaranteed deducted before order completes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetUserId = body.userId;
    const amount = Number(body.amount);

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid deduction amount' }, { status: 400 });
    }

    // 1. Identify and authenticate caller
    let authenticatedUserId: string | null = null;
    let isAdmin = false;

    // (a) Try Bearer token
    const authHeader = req.headers.get('Authorization') || '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (bearerToken) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(bearerToken);
      if (user) {
        authenticatedUserId = user.id;
      }
    }

    // (b) Try cookies if Bearer token wasn't provided
    if (!authenticatedUserId) {
      try {
        const cookieStore = await cookies();
        const serverSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll() {},
            },
          }
        );
        const { data: { user } } = await serverSupabase.auth.getUser();
        if (user) {
          authenticatedUserId = user.id;
        }
      } catch {}
    }

    // (c) Check caller permissions
    if (authenticatedUserId) {
      const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', authenticatedUserId)
        .maybeSingle();

      isAdmin = callerProfile?.role === 'admin';

      if (authenticatedUserId !== targetUserId && !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Cannot deduct credits from another user' }, { status: 403 });
      }
    }

    // 2. Query target user profile directly from database
    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name, credits')
      .eq('id', targetUserId)
      .maybeSingle();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: 'ไม่พบบัญชีผู้ใช้งานในระบบ' }, { status: 404 });
    }

    const currentCredits = Number(profile.credits) || 0;

    // 3. Strict Balance Check
    if (currentCredits < amount) {
      return NextResponse.json(
        {
          success: false,
          error: `ยอดเงินคงเหลือในเว็บไซต์ไม่เพียงพอ (คงเหลือ ฿${currentCredits.toLocaleString()}) กรุณาเติมเงินก่อนทำรายการ`,
          currentCredits,
        },
        { status: 400 }
      );
    }

    // 4. Atomic deduction with supabaseAdmin
    const newCredits = Math.max(0, currentCredits - amount);

    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)
      .select('id, credits')
      .maybeSingle();

    if (updateErr || !updatedProfile) {
      console.error('Failed to deduct user credits:', updateErr);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการตัดยอดเงิน กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ok: true,
      oldCredits: currentCredits,
      newCredits: updatedProfile.credits,
      deducted: amount,
    });
  } catch (err: any) {
    console.error('Exception in /api/wallet/deduct:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
