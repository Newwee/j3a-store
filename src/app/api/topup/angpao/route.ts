import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { extractVoucherHash, redeemTrueMoneyVoucher, warmAngpaoProviders } from '@/lib/utils/angpao';

export async function GET() {
  warmAngpaoProviders().catch(() => {});
  return NextResponse.json({ ok: true, status: 'ready' });
}

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

    // 4. Check if this is an Admin Test Voucher (Simulation Mode)
    const isTestVoucher = voucherHash.toUpperCase().startsWith('TEST');
    let rewardAmount = 0;
    let senderOwnerName = 'ลูกค้า';
    let isTestMode = false;
    let receiverPhone = 'TEST_RECEIVER';

    if (isTestVoucher) {
      // Find the test voucher registered in database
      const { data: testVoucher, error: testErr } = await supabaseAdmin
        .from('redeem_codes')
        .select('*')
        .eq('code', voucherHash.toUpperCase())
        .eq('code_type', 'angpao_test')
        .limit(1)
        .maybeSingle();

      if (testErr || !testVoucher) {
        return NextResponse.json(
          {
            error: 'ไม่พบซองของขวัญทดสอบนี้ในระบบ หรือลิงก์ทดสอบไม่ถูกต้อง',
          },
          { status: 400 }
        );
      }

      const usedCount = Number(testVoucher.used_count) || 0;
      const maxUses = Number(testVoucher.max_uses) || 1;

      if (!testVoucher.is_active || usedCount >= maxUses) {
        return NextResponse.json(
          {
            error: 'ซองของขวัญทดสอบนี้ถูกแลกรับไปเรียบร้อยแล้วในระบบ',
          },
          { status: 400 }
        );
      }

      rewardAmount = Number(testVoucher.credits) || 50;
      senderOwnerName = 'Admin Test (ระบบจำลอง)';
      isTestMode = true;

      // Mark the test voucher as used
      const usedByArray = Array.isArray(testVoucher.used_by)
        ? testVoucher.used_by
        : typeof testVoucher.used_by === 'string'
        ? JSON.parse(testVoucher.used_by || '[]')
        : [];

      await supabaseAdmin
        .from('redeem_codes')
        .update({
          used_count: usedCount + 1,
          used_by: [...usedByArray, user.id],
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testVoucher.id);

      console.log(`[Angpao Topup] Redeemed TEST voucher ${voucherHash} for user ${user.id} (+${rewardAmount} THB)`);
    } else {
      // 5. Retrieve shop owner's TrueMoney receiver phone number
      const { data: storeSetting } = await supabaseAdmin
        .from('settings')
        .select('truemoney_phone, promptpay')
        .eq('id', 'store')
        .limit(1)
        .maybeSingle();

      receiverPhone =
        storeSetting?.truemoney_phone?.trim() ||
        storeSetting?.promptpay?.trim() ||
        process.env.TRUEMONEY_PHONE ||
        '0983892996';

      // 6. Call TrueMoney official API to redeem real voucher
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

      rewardAmount = Number(redeemResult.amount);
      senderOwnerName = redeemResult.ownerName || 'ลูกค้า';
    }

    // 7. Fetch user profile
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
    const topupId = isTestMode
      ? `topup_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      : `topup_ap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const topupNumber = isTestMode
      ? `TOP-TEST-${Date.now().toString().slice(-6)}`
      : `TOP-AP-${Date.now().toString().slice(-6)}`;

    // 8. Insert topup record (status = 'test' if test mode, does not count in Dashboard)
    const topupRow = {
      id: topupId,
      topup_number: topupNumber,
      user_id: user.id,
      user_email: user.email || null,
      user_name: userProfile.display_name || user.user_metadata?.full_name || 'ลูกค้า',
      amount: rewardAmount,
      payment_slip_url: `https://gift.truemoney.com/campaign/?v=${voucherHash}`,
      payment_method: isTestMode ? 'truemoney_angpao_test' : 'truemoney_angpao',
      voucher_hash: voucherHash,
      status: isTestMode ? 'test' : 'approved',
      admin_note: isTestMode
        ? `[TEST] ซองของขวัญ TrueMoney ทดสอบระบบ (จำลองโดย Admin - ไม่นับเข้า Dashboard)`
        : `TrueMoney Angpao Voucher (ระบบออโต้เข้าเบอร์ ${receiverPhone}) - ผู้ส่ง: ${senderOwnerName}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertTopupErr } = await supabaseAdmin.from('topups').insert([topupRow]);
    if (insertTopupErr) {
      console.error('Failed to log topup row:', insertTopupErr);
    }

    // 9. Update user credits
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
          error: `เกิดข้อผิดพลาดในการอัปเดตเครดิตในเว็บ กรุณาติดต่อแอดมินพร้อมแจ้งรหัส ${topupNumber}`,
        },
        { status: 500 }
      );
    }

    // 10. Recalculate store stats ONLY for real transactions (test transactions DO NOT affect dashboard)
    if (!isTestMode) {
      Promise.resolve(supabaseAdmin.rpc('recalculate_store_stats')).catch(() => {});
    }

    console.log(`[Angpao Topup] User ${user.id} credited with +${rewardAmount} THB (New: ${newCredits}) [TestMode: ${isTestMode}]`);

    return NextResponse.json({
      ok: true,
      success: true,
      amount: rewardAmount,
      newCredits,
      topupNumber,
      isTest: isTestMode,
      ownerName: senderOwnerName,
      message: isTestMode
        ? `เติมเงินสำเร็จ! [โหมดทดสอบ TEST] ได้รับเครดิต ${rewardAmount.toLocaleString()} บาท เข้าบัญชีทันที (บันทึกสถานะ TEST ไม่นับเข้า Dashboard)`
        : `เติมเงินสำเร็จ! ได้รับเครดิต ${rewardAmount.toLocaleString()} บาท เข้าบัญชีทันที`,
    });
  } catch (err: any) {
    console.error('Unhandled error in /api/topup/angpao:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
