import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const ADMIN_EMAILS = [
  'pongpataradanai@gmail.com',
  'admin@j3astore.com',
  'mynameisyee0@gmail.com',
  'ratchadejchaisomvit@gmail.com',
];

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนให้คะแนนและรีวิว' }, { status: 401 });
    }

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'เซสชันการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }

    const body = await req.json();
    const {
      productId,
      productSlug,
      productName,
      orderId,
      rating,
      comment,
      userName,
      userPhoto,
    } = body;

    if (!productId || !comment?.trim()) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน กรุณากรอกข้อความรีวิว' }, { status: 400 });
    }

    // Clamp rating between 1 and 5 (Max 5 stars)
    const star = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const cleanComment = comment.trim();

    const isMasterAdmin = Boolean(
      user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
    );

    // 1. Verify eligibility: Check if user purchased this product (unless admin)
    if (!isMasterAdmin && productId !== 'store_overall') {
      let orderQuery = supabaseAdmin
        .from('orders')
        .select('*')
        .in('status', ['completed', 'paid']);

      if (user.email) {
        orderQuery = orderQuery.or(`user_id.eq.${user.id},customer_email.eq.${user.email}`);
      } else {
        orderQuery = orderQuery.eq('user_id', user.id);
      }

      const { data: orders } = await orderQuery;
      const cleanPid = productId.replace(/^bundle_/, '').toLowerCase();
      const cleanSlug = (productSlug || '').toLowerCase();

      const hasPurchased = (orders || []).some((ord: any) => {
        const items = Array.isArray(ord.items) ? ord.items : [];
        return items.some((it: any) => {
          const itemPid = (it.productId || it.id || '').toString().toLowerCase();
          const itemSlug = (it.slug || '').toString().toLowerCase();
          return (
            itemPid === productId.toLowerCase() ||
            itemPid === cleanPid ||
            itemSlug === productId.toLowerCase() ||
            itemSlug === cleanSlug ||
            (cleanPid && itemPid.includes(cleanPid))
          );
        });
      });

      if (!hasPurchased) {
        return NextResponse.json(
          { error: 'เฉพาะผู้ที่สั่งซื้อสินค้านี้เท่านั้น จึงจะมีสิทธิ์ให้คะแนนและรีวิว' },
          { status: 403 }
        );
      }
    }

    // 2. Check if user already reviewed this product
    if (productId !== 'store_overall') {
      const { data: existing } = await supabaseAdmin
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'คุณได้ให้คะแนนสินค้านี้เรียบร้อยแล้ว ขอบคุณสำหรับรีวิวของคุณ!' },
          { status: 400 }
        );
      }
    } else {
      const { data: existingStoreRev } = await supabaseAdmin
        .from('reviews')
        .select('id')
        .eq('product_id', 'store_overall')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (existingStoreRev) {
        return NextResponse.json(
          { error: 'คุณได้ให้คะแนนร้านค้าเรียบร้อยแล้ว ขอบคุณสำหรับรีวิวของคุณ!' },
          { status: 400 }
        );
      }
    }

    // 3. Prepare review row
    const id = productId === 'store_overall'
      ? `rev_store_${Date.now()}`
      : `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const displayName =
      userName ||
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'ผู้ซื้อที่ผ่านการยืนยัน';

    const avatarUrl =
      userPhoto ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;

    const row = {
      id,
      product_id: productId,
      product_slug: productSlug || '',
      product_name: productName || (productId === 'store_overall' ? 'J3A STORE (ร้านค้าโดยรวม)' : 'สินค้า'),
      order_id: orderId || 'verified_purchase',
      user_id: user.id,
      user_name: displayName,
      user_avatar: avatarUrl,
      rating: star,
      comment: cleanComment,
      is_verified_purchase: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabaseAdmin.from('reviews').insert([row]);
    if (insertErr) {
      console.error('Failed to insert review in Supabase:', insertErr);
      return NextResponse.json({ error: `ไม่สามารถบันทึกรีวิวได้: ${insertErr.message}` }, { status: 500 });
    }

    // 4. Recalculate and update product / bundle rating (1 - 5 scale)
    let avg = star;
    let totalCount = 1;

    if (productId !== 'store_overall') {
      try {
        const { data: allReviews } = await supabaseAdmin
          .from('reviews')
          .select('rating')
          .eq('product_id', productId);

        if (allReviews && allReviews.length > 0) {
          totalCount = allReviews.length;
          const sum = allReviews.reduce((acc, curr) => {
            const r = Number(curr.rating) || 5;
            return acc + (r > 5 ? r / 2 : r);
          }, 0);
          avg = Number((sum / totalCount).toFixed(1));
        }

        if (productId.startsWith('bundle_')) {
          const cleanBundleId = productId.replace(/^bundle_/, '');
          await supabaseAdmin
            .from('bundles')
            .update({ rating: avg, review_count: totalCount, updated_at: new Date().toISOString() })
            .eq('id', cleanBundleId);
        } else {
          await supabaseAdmin
            .from('products')
            .update({ rating: avg, review_count: totalCount, updated_at: new Date().toISOString() })
            .eq('id', productId);
        }
      } catch (calcErr) {
        console.warn('Could not update average rating on product document:', calcErr);
      }
    }

    return NextResponse.json({
      ok: true,
      success: true,
      review: row,
      averageRating: avg,
      reviewCount: totalCount,
    });
  } catch (err: any) {
    console.error('Error in /api/reviews/submit:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
