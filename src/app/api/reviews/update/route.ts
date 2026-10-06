import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkProfanity } from '@/lib/utils/profanityFilter';

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
    const { reviewId, rating, comment } = body;

    if (!reviewId || !comment?.trim()) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน กรุณากรอกข้อความรีวิว' }, { status: 400 });
    }

    // 0. Check if user is currently banned from reviewing
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('review_banned_until, review_ban_reason')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.review_banned_until) {
      const bannedUntilTime = new Date(profile.review_banned_until).getTime();
      const now = Date.now();
      if (bannedUntilTime > now) {
        const remainingMinutes = Math.ceil((bannedUntilTime - now) / (60 * 1000));
        const untilStr = new Date(bannedUntilTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        return NextResponse.json(
          {
            error: `คุณถูกระงับสิทธิ์การเขียนรีวิวชั่วคราวเนื่องจากใช้คำไม่สุภาพ กรุณารออีก ${remainingMinutes} นาที (จนถึง ${untilStr}) หรือติดต่อผู้ดูแลระบบ`,
            isBanned: true,
            remainingMinutes,
            bannedUntil: profile.review_banned_until,
          },
          { status: 403 }
        );
      }
    }

    const cleanComment = comment.trim();

    // 0.1 Check Profanity & moderate content
    const profanityResult = checkProfanity(cleanComment);
    if (profanityResult.hasProfanity) {
      const banUntil = new Date(Date.now() + 30 * 60 * 1000);
      const untilStr = banUntil.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const matchedTerm = profanityResult.matchedWord || 'คำไม่สุภาพ';
      const banReason = `พบคำไม่สุภาพในการแก้ไขรีวิว: ${matchedTerm}`;

      await supabaseAdmin
        .from('profiles')
        .update({
          review_banned_until: banUntil.toISOString(),
          review_ban_reason: banReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      return NextResponse.json(
        {
          error: `ระบบตรวจพบข้อความหรือคำไม่สุภาพในรีวิว ("${matchedTerm}") จึงไม่อนุญาตให้แก้ไข และบัญชีของคุณถูกจำกัดสิทธิ์การเขียนรีวิวเป็นเวลา 30 นาที (จนถึง ${untilStr})`,
          isBanned: true,
          remainingMinutes: 30,
          bannedUntil: banUntil.toISOString(),
        },
        { status: 403 }
      );
    }

    // 1. Fetch review to verify ownership
    const { data: review, error: fetchErr } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .maybeSingle();

    if (fetchErr || !review) {
      return NextResponse.json({ error: 'ไม่พบรีวิวที่ต้องการแก้ไข' }, { status: 404 });
    }

    const isMasterAdmin = Boolean(
      user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
    );

    if (review.user_id !== user.id && !isMasterAdmin) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไขรีวิวของผู้ใช้อื่น' }, { status: 403 });
    }

    const star = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));

    // 2. Update review
    const { error: updateErr } = await supabaseAdmin
      .from('reviews')
      .update({
        rating: star,
        comment: cleanComment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (updateErr) {
      console.error('Error updating review:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 3. Recalculate and update product / bundle rating
    const productId = review.product_id;
    let avg = star;
    let totalCount = 1;

    if (productId && productId !== 'store_overall') {
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
        console.warn('Could not update average rating after review edit:', calcErr);
      }
    }

    return NextResponse.json({
      ok: true,
      success: true,
      message: 'แก้ไขรีวิวเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็นของคุณ',
      review: {
        ...review,
        rating: star,
        comment: cleanComment,
        updated_at: new Date().toISOString(),
      },
      averageRating: avg,
      reviewCount: totalCount,
    });
  } catch (err: any) {
    console.error('Error in /api/reviews/update:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
