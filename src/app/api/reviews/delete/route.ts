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
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }, { status: 401 });
    }

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'เซสชันการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }

    const body = await req.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json({ error: 'ไม่พบรหัสรีวิวที่ต้องการลบ' }, { status: 400 });
    }

    // 1. Fetch existing review to verify ownership
    const { data: review, error: fetchErr } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .maybeSingle();

    if (fetchErr || !review) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรีวิวนี้ในระบบ หรืออาจถูกลบไปแล้ว' }, { status: 404 });
    }

    const isMasterAdmin = Boolean(
      user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
    );

    // Only owner of the review or master admin can delete
    if (review.user_id !== user.id && !isMasterAdmin) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ลบรีวิวของผู้ใช้อื่น' }, { status: 403 });
    }

    // 2. Delete review from database
    const { error: deleteErr } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteErr) {
      console.error('Error deleting review:', deleteErr);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // 3. Recalculate and update product / bundle rating
    const productId = review.product_id;
    let avg = 5.0;
    let totalCount = 0;

    if (productId && productId !== 'store_overall') {
      try {
        const { data: remainingReviews } = await supabaseAdmin
          .from('reviews')
          .select('rating')
          .eq('product_id', productId);

        if (remainingReviews && remainingReviews.length > 0) {
          totalCount = remainingReviews.length;
          const sum = remainingReviews.reduce((acc, curr) => {
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
        console.warn('Could not update average rating after review deletion:', calcErr);
      }
    }

    return NextResponse.json({
      ok: true,
      success: true,
      message: 'ลบรีวิวเรียบร้อยแล้ว คุณสามารถเขียนรีวิวใหม่ได้ทุกเมื่อ',
      deletedReviewId: reviewId,
      productId,
      averageRating: avg,
      reviewCount: totalCount,
    });
  } catch (err: any) {
    console.error('Error in /api/reviews/delete:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
