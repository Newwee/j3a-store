import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { topupId, action, adminNote } = body;

    if (!topupId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    // 1. Fetch topup request
    const { data: topupRow, error: topupErr } = await supabaseAdmin
      .from('topups')
      .select('*')
      .eq('id', topupId)
      .limit(1)
      .maybeSingle();

    if (topupErr || !topupRow) {
      return NextResponse.json({ error: 'ไม่พบคำขอเติมเงินนี้ในระบบ' }, { status: 404 });
    }

    if (action === 'approve') {
      if (topupRow.status === 'approved') {
        return NextResponse.json({ error: 'คำขอนี้ได้รับการอนุมัติเงินเข้าบัญชีไปแล้ว' }, { status: 400 });
      }

      const userId = topupRow.user_id;
      const amount = Number(topupRow.amount) || 0;

      if (!userId) {
        return NextResponse.json({ error: 'ไม่พบ User ID ของคำขอเติมเงินนี้' }, { status: 400 });
      }

      // 2. Fetch target user's current profile
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) {
        return NextResponse.json({ error: `ไม่สามารถดึงข้อมูลผู้ใช้: ${profileErr.message}` }, { status: 500 });
      }

      const currentCredits = Number(profile?.credits) || 0;
      const newCredits = currentCredits + amount;

      // 3. Update user's credits
      const { error: creditErr } = await supabaseAdmin
        .from('profiles')
        .update({
          credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (creditErr) {
        return NextResponse.json({ error: `ไม่สามารถเพิ่มเครดิตให้ลูกค้าได้: ${creditErr.message}` }, { status: 500 });
      }

      // 4. Update topup status to approved
      const { error: updateErr } = await supabaseAdmin
        .from('topups')
        .update({
          status: 'approved',
          admin_note: adminNote || 'อนุมัติการเติมเงินเรียบร้อยแล้ว',
          updated_at: new Date().toISOString(),
        })
        .eq('id', topupId);

      if (updateErr) {
        return NextResponse.json({ error: `ไม่สามารถอัปเดตสถานะคำขอ: ${updateErr.message}` }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        success: true,
        newCredits,
        status: 'approved',
      });
    } else {
      // action === 'reject'
      const { error: rejectErr } = await supabaseAdmin
        .from('topups')
        .update({
          status: 'rejected',
          admin_note: adminNote || 'สลิปไม่ถูกต้อง หรือไม่พบยอดเงินเข้าบัญชี',
          updated_at: new Date().toISOString(),
        })
        .eq('id', topupId);

      if (rejectErr) {
        return NextResponse.json({ error: `ไม่สามารถปฏิเสธคำขอ: ${rejectErr.message}` }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        success: true,
        status: 'rejected',
      });
    }
  } catch (err: any) {
    console.error('Error in /api/admin/topups/action:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
