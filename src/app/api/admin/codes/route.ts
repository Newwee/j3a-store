import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('redeem_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      codes: data || [],
    });
  } catch (err: any) {
    console.error('Error in GET /api/admin/codes:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const cleanCode = (body.code || '').trim().toUpperCase();
      if (!cleanCode) {
        return NextResponse.json({ error: 'กรุณากรอกรหัสโค้ด' }, { status: 400 });
      }
      const amount = Number(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ error: 'จำนวนเครดิตต้องมากกว่า 0' }, { status: 400 });
      }

      const id = `code_${Date.now()}`;
      const row = {
        id,
        code: cleanCode,
        credits: Math.round(amount),
        max_uses: Number(body.maxUses) || 0,
        used_count: 0,
        used_by: [],
        is_active: body.isActive ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('redeem_codes')
        .insert([row])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Failed to create redeem code via admin API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        code: data || row,
      });
    }

    if (action === 'update') {
      const { codeId, data: updatesData } = body;
      if (!codeId) {
        return NextResponse.json({ error: 'Missing codeId' }, { status: 400 });
      }

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updatesData?.amount !== undefined) updates.credits = Math.round(Number(updatesData.amount));
      if (updatesData?.maxUses !== undefined) updates.max_uses = Number(updatesData.maxUses);
      if (updatesData?.isActive !== undefined) updates.is_active = Boolean(updatesData.isActive);

      const { data, error } = await supabaseAdmin
        .from('redeem_codes')
        .update(updates)
        .or(`id.eq.${codeId},code.eq.${codeId.toUpperCase()}`)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        code: data,
      });
    }

    if (action === 'delete') {
      const { codeId } = body;
      if (!codeId) {
        return NextResponse.json({ error: 'Missing codeId' }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('redeem_codes')
        .delete()
        .or(`id.eq.${codeId},code.eq.${codeId.toUpperCase()}`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        success: true,
      });
    }

    if (action === 'seed') {
      const { data } = await supabaseAdmin
        .from('redeem_codes')
        .select('id')
        .eq('code', 'J3AOPENING')
        .limit(1)
        .maybeSingle();

      if (!data) {
        await supabaseAdmin.from('redeem_codes').insert([
          {
            id: 'code_j3a_opening',
            code: 'J3AOPENING',
            credits: 20,
            max_uses: 0,
            used_count: 0,
            used_by: [],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in POST /api/admin/codes:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
