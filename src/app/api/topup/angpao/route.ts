import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { extractVoucherHash, redeemTrueMoneyVoucher } from '@/lib/utils/angpao';

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from Bearer token
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนทำรายการเติมเงิน' }, { status: 401 });
    }

    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (userErr || !user) {
      return NextResponse.json({ error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }

    // 2. Validate input
    const body = await req.json();
    const rawVoucherInput = (body.voucherLink || body.voucherCode || '').trim();

    if (!rawVoucherInput) {
      return NextResponse.json(
        { error: 'กรุณากรอกหรือวางลิงก์ซองของขวัญ TrueMoney Wallet' },
        { status: 400 }
      );
    }

    const voucherHash = extractVoucherHash(rawVoucherInput);
    if (!voucherHash) {
      return NextResponse.json(
        {
          error:
            'รูปแบบลิงก์ซองของขวัญไม่ถูกต้อง (ตัวอย่างลิงก์ที่ถูกต้อง: https://gift.truemoney.com/campaign/?v=xxxxxxx)',
        },
        { status: 400 }
      );
    }

    // 3. Check if this voucher has already been used in our system (Idempotency)
    const { data: existingTopup } = await supabaseAdmin
      .from('topups')
      .select('id, topup_number, amount, created_at')
      .eq('voucher_hash', voucherHash)
      .limit(1)
      .maybeSingle();

    if (existingTopup) {
      return NextResponse.json(
        {
          error: `ซองของขวัญนี้ถูกแลกรับไปเรียบร้อยแล้วในระบบ (คำขอ #${existingTopup.topup_number})`,
        },
        { status: 400 }
      );
    }

    // 4. Retrieve shop owner's TrueMoney receiver phone number
    const { data: storeSetting } = await supabaseAdmin
      .from('settings')
      .select('truemoney_phone, promptpay')
      .eq('id', 'store')
      .limit(1)
      .maybeSingle();

    const receiverPhone =
      storeSetting?.truemoney_phone?.trim() ||
      storeSetting?.promptpay?.trim() ||
      process.env.TRUEMONEY_PHONE ||
      '0983892996';

    // 5. Call TrueMoney official API to redeem voucher
    console.log(`[Angpao Topup] Redeeming voucher ${voucherHash} to shop phone: ${receiverPhone}`);
    const redeemResult = await redeemTrueMoneyVoucher(voucherHash, receiverPhone);

    if (!redeemResult.success || !redeemResult.amount) {
      return NextResponse.json(
        {
          error: redeemResult.error || 'ไม่สามารถรับซองของขวัญได้ กรุณาตรวจสอบลิงก์อีกครั้ง',
          code: redeemResult.code,
        },
        { status: 400 }
      );
    }

    const rewardAmount = Number(redeemResult.amount);

    // 6. Fetch user profile
    const { data: userProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('credits, display_name')
      .eq('id', user.id)
      .limit(1)
      .maybeSingle();

    if (profileErr || !userProfile) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลบัญชีผู้ใช้งาน' }, { status: 404 });
    }

    const currentCredits = Number(userProfile.credits) || 0;
    const newCredits = currentCredits + rewardAmount;
    const topupId = `topup_ap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const topupNumber = `TOP-AP-${Date.now().toString().slice(-6)}`;

    // 7. Insert topup record (approved status immediately)
    const topupRow = {
      id: topupId,
      topup_number: topupNumber,
      user_id: user.id,
      user_email: user.email || null,
      user_name: userProfile.display_name || user.user_metadata?.full_name || 'ลูกค้า',
      amount: rewardAmount,
      payment_slip_url: `https://gift.truemoney.com/campaign/?v=${voucherHash}`,
      payment_method: 'truemoney_angpao',
      voucher_hash: voucherHash,
      status: 'approved',
      admin_note: `TrueMoney Angpao Voucher (ระบบออโต้เข้าเบอร์ ${receiverPhone}) - ผู้ส่ง: ${redeemResult.ownerName || 'ลูกค้า'}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertTopupErr } = await supabaseAdmin.from('topups').insert([topupRow]);
    if (insertTopupErr) {
      console.error('Failed to log topup row:', insertTopupErr);
      // Even if logging has a duplicate error, we still proceed carefully
    }

    // 8. Update user credits
    const { error: updateProfileErr } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateProfileErr) {
      console.error('Failed to update user credits:', updateProfileErr);
      return NextResponse.json(
        {
          error: `เงินเข้า TrueMoney ร้านค้าแล้ว (${rewardAmount} บาท) แต่เกิดข้อผิดพลาดในการอัปเดตเครดิตในเว็บ กรุณาติดต่อแอดมินพร้อมแจ้งรหัส ${topupNumber}`,
        },
        { status: 500 }
      );
    }

    // 9. Recalculate store stats in background
    Promise.resolve(supabaseAdmin.rpc('recalculate_store_stats')).catch(() => {});

    console.log(`[Angpao Topup] User ${user.id} credited with +${rewardAmount} THB (New: ${newCredits})`);

    return NextResponse.json({
      ok: true,
      success: true,
      amount: rewardAmount,
      newCredits,
      topupNumber,
      ownerName: redeemResult.ownerName,
      message: `เติมเงินสำเร็จ! ได้รับเครดิต ${rewardAmount.toLocaleString()} บาท เข้าบัญชีทันที`,
    });
  } catch (err: any) {
    console.error('Unhandled error in /api/topup/angpao:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
