import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'อีเมลไม่ถูกต้อง' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Fast indexed lookup via profiles table first
    let targetUserId: string | null = null;
    let isAlreadyConfirmed = false;

    const { data: profileRow } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (profileRow?.id) {
      targetUserId = profileRow.id;
      const { data: userObj } = await supabaseAdmin.auth.admin.getUserById(profileRow.id);
      if (userObj?.user?.email_confirmed_at) {
        isAlreadyConfirmed = true;
      }
    } else {
      // Fallback: search via auth admin list
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      const targetUser = data.users.find((u) => u.email?.toLowerCase() === trimmedEmail);
      if (!targetUser) {
        return NextResponse.json({ error: 'ไม่พบผู้ใช้ในระบบ' }, { status: 404 });
      }
      targetUserId = targetUser.id;
      if (targetUser.email_confirmed_at) {
        isAlreadyConfirmed = true;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้ในระบบ' }, { status: 404 });
    }

    // If not confirmed, confirm immediately
    if (!isAlreadyConfirmed) {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        email_confirm: true,
      });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      confirmed: true,
      userId: targetUserId,
    });
  } catch (err: any) {
    console.error('Auto Confirm API Error:', err);
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
