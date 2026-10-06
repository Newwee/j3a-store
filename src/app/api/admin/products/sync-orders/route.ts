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
    const { productId, slug, name, downloadUrl, deliveryNote } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId parameter' }, { status: 400 });
    }

    if (!downloadUrl && !deliveryNote) {
      return NextResponse.json({ ok: true, updatedCount: 0 });
    }

    const { data: orders, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('id, items');

    if (fetchErr) {
      console.error('Failed to fetch orders for sync:', fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const cleanPid = productId.toLowerCase();
    const cleanSlug = (slug || '').toLowerCase();
    const cleanName = (name || '').toLowerCase();

    let updatedCount = 0;
    for (const ord of (orders || [])) {
      if (!Array.isArray(ord.items)) continue;

      let changed = false;
      const updatedItems = ord.items.map((it: any) => {
        const itemPid = (it.productId || it.id || '').toString().toLowerCase();
        const itemSlug = (it.slug || '').toString().toLowerCase();
        const itemName = (it.name || '').toString().toLowerCase();

        const isMatch =
          itemPid === cleanPid ||
          (cleanSlug && itemSlug === cleanSlug) ||
          (cleanName && itemName === cleanName) ||
          (cleanPid && itemPid.includes(cleanPid));

        if (isMatch) {
          changed = true;
          return {
            ...it,
            ...(downloadUrl !== undefined ? { downloadUrl } : {}),
            ...(deliveryNote !== undefined ? { deliveryNote } : {}),
          };
        }
        return it;
      });

      if (changed) {
        await supabaseAdmin
          .from('orders')
          .update({ items: updatedItems, updated_at: new Date().toISOString() })
          .eq('id', ord.id);
        updatedCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      success: true,
      updatedCount,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/products/sync-orders:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
