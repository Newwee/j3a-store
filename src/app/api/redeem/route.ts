import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนแลกโค้ด' }, { status: 401 });
    }

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }

    const body = await req.json();
    const cleanCode = (body.code || '').trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ error: 'กรุณากรอกโค้ดของขวัญ' }, { status: 400 });
    }

    // 1. Fetch code
    const { data: codeRow, error: codeErr } = await supabaseAdmin
      .from('redeem_codes')
      .select('*')
      .eq('code', cleanCode)
      .limit(1)
      .maybeSingle();

    if (codeErr || !codeRow) {
      return NextResponse.json({ error: 'ไม่พบโค้ดนี้ในระบบ หรือโค้ดไม่ถูกต้อง' }, { status: 404 });
    }

    if (!codeRow.is_active) {
      return NextResponse.json({ error: 'โค้ดนี้หมดอายุหรือปิดการใช้งานแล้ว' }, { status: 400 });
    }

    const usedBy: string[] = Array.isArray(codeRow.used_by)
      ? codeRow.used_by
      : typeof codeRow.used_by === 'string'
      ? JSON.parse(codeRow.used_by || '[]')
      : [];

    if (usedBy.includes(user.id)) {
      return NextResponse.json({ error: 'คุณเคยใช้โค้ดนี้ไปแล้ว (จำกัด 1 สิทธิ์ต่อบัญชี)' }, { status: 400 });
    }

    const maxUses = Number(codeRow.max_uses) || 0;
    const currentUsed = Number(codeRow.used_count) || 0;
    if (maxUses > 0 && currentUsed >= maxUses) {
      return NextResponse.json({ error: 'สิทธิ์การใช้งานโค้ดนี้เต็มแล้ว' }, { status: 400 });
    }

    // 2. Fetch user profile
    const { data: userProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .limit(1)
      .maybeSingle();

    if (profileErr || !userProfile) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' }, { status: 404 });
    }

    const rewardAmount = Number(codeRow.credits) || 0;
    const currentCredits = Number(userProfile.credits) || 0;
    const newCredits = currentCredits + rewardAmount;
    const newUsedCount = currentUsed + 1;
    const newUsedBy = [...usedBy, user.id];

    // 3. Update code and user credits atomically
    const { error: updateCodeErr } = await supabaseAdmin
      .from('redeem_codes')
      .update({
        used_count: newUsedCount,
        used_by: newUsedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', codeRow.id);

    if (updateCodeErr) {
      return NextResponse.json({ error: `ไม่สามารถอัปเดตโค้ด: ${updateCodeErr.message}` }, { status: 500 });
    }

    const { error: updateProfileErr } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateProfileErr) {
      return NextResponse.json({ error: `ไม่สามารถเพิ่มเครดิต: ${updateProfileErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      success: true,
      amount: rewardAmount,
      newCredits,
      usedCount: newUsedCount,
      message: `แลกโค้ดสำเร็จ! คุณได้รับเครดิต ${rewardAmount} บาท`,
    });
  } catch (err: any) {
    console.error('Error in /api/redeem:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
