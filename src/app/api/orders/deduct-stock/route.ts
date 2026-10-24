import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface DeductItemInput {
  productId?: string;
  id?: string;
  slug?: string;
  name?: string;
  quantity?: number;
}

/**
 * Server-side API handler to securely deduct product and bundle stock upon order creation.
 * Automatically switches product status to 'out_of_stock' when stock reaches 0.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: DeductItemInput[] = Array.isArray(body.items) ? body.items : [];
    const orderId: string | undefined = body.orderId;

    if (items.length === 0) {
      return NextResponse.json({ ok: true, message: 'No items to deduct' });
    }

    const updatedProducts: Array<{
      id: string;
      name: string;
      oldStock: number;
      newStock: number;
      newStatus: string;
    }> = [];

    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const targetId = item.productId || item.id || '';
      const targetSlug = item.slug || '';
      const targetName = item.name || '';

      // 1. Handle Bundle Packages
      if (targetId.startsWith('bundle_') || targetSlug.startsWith('bundle_')) {
        const bundleId = targetId || targetSlug;
        const { data: bundleData } = await supabaseAdmin
          .from('bundles')
          .select('*')
          .eq('id', bundleId)
          .maybeSingle();

        if (bundleData) {
          const currentBStock = typeof bundleData.stock === 'number' ? bundleData.stock : 999;
          const newBStock = Math.max(0, currentBStock - qty);
          const newBStatus = newBStock <= 0 ? 'out_of_stock' : bundleData.status;

          await supabaseAdmin
            .from('bundles')
            .update({
              stock: newBStock,
              status: newBStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', bundleData.id);

          // Decrement component products inside bundle
          const bItems = Array.isArray(bundleData.items) ? bundleData.items : [];
          for (const bIt of bItems) {
            const subId = typeof bIt === 'string' ? bIt : (bIt.productId || bIt.id);
            if (!subId) continue;

            const { data: subProd } = await supabaseAdmin
              .from('products')
              .select('*')
              .or(`id.eq.${subId},slug.eq.${subId}`)
              .maybeSingle();

            if (subProd) {
              const curSubStock = typeof subProd.stock === 'number' ? subProd.stock : 0;
              const newSubStock = Math.max(0, curSubStock - qty);
              const newSubStatus = newSubStock <= 0 ? 'out_of_stock' : subProd.status;

              await supabaseAdmin
                .from('products')
                .update({
                  stock: newSubStock,
                  status: newSubStatus,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', subProd.id);

              updatedProducts.push({
                id: subProd.id,
                name: subProd.name,
                oldStock: curSubStock,
                newStock: newSubStock,
                newStatus: newSubStatus,
              });
            }
          }
        }
        continue;
      }

      // 2. Handle Regular Products
      let query = supabaseAdmin.from('products').select('*');
      if (targetId) {
        query = query.or(`id.eq.${targetId},slug.eq.${targetSlug || targetId}`);
      } else if (targetSlug) {
        query = query.eq('slug', targetSlug);
      } else if (targetName) {
        query = query.eq('name', targetName);
      }

      const { data: foundList } = await query.limit(1);
      const prod = foundList?.[0];

      if (prod) {
        const curStock = typeof prod.stock === 'number' ? prod.stock : 0;
        const newStock = Math.max(0, curStock - qty);
        const newStatus = newStock <= 0 ? 'out_of_stock' : prod.status;

        await supabaseAdmin
          .from('products')
          .update({
            stock: newStock,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prod.id);

        updatedProducts.push({
          id: prod.id,
          name: prod.name,
          oldStock: curStock,
          newStock,
          newStatus,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Stock deducted successfully',
      orderId,
      updatedProducts,
    });
  } catch (err: any) {
    console.error('Error deducting stock:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
