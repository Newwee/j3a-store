import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';

const STORE_DOC_ID = 'store';

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {
      id: STORE_DOC_ID,
      updated_at: new Date().toISOString(),
    };

    if (body.storeName !== undefined) updates.store_name = body.storeName;
    if (body.promptpay !== undefined) updates.promptpay = body.promptpay;
    if (body.lineContact !== undefined) updates.line_contact = body.lineContact;
    if (body.discordContact !== undefined) updates.discord_contact = body.discordContact;
    if (body.announcement !== undefined) updates.announcement = body.announcement;
    if (body.shippingFee !== undefined) updates.shipping_fee = Number(body.shippingFee);
    if (body.freeShippingThreshold !== undefined) updates.free_shipping_threshold = Number(body.freeShippingThreshold);

    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert([updates])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to update store settings via admin API:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      settings: data,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/settings:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
