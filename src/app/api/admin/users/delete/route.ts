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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // 1. Fetch all reviews written by this user to know which products need rating recalculation
    const { data: userReviews, error: reviewsFetchErr } = await supabaseAdmin
      .from('reviews')
      .select('id, product_id, rating')
      .eq('user_id', userId);

    if (reviewsFetchErr) {
      console.warn('Could not fetch user reviews before deletion:', reviewsFetchErr.message);
    }

    const productIdsToRecalc = Array.from(
      new Set((userReviews || []).map((r) => r.product_id).filter(Boolean))
    );

    // 2. Delete all reviews written by this user
    const { error: deleteReviewsErr } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('user_id', userId);

    if (deleteReviewsErr) {
      console.warn('Could not delete user reviews:', deleteReviewsErr.message);
    }

    // 3. Recalculate rating & review count for each affected product or bundle
    for (const prodId of productIdsToRecalc) {
      if (!prodId || prodId === 'store_overall') continue;
      try {
        const { data: remainingReviews } = await supabaseAdmin
          .from('reviews')
          .select('rating')
          .eq('product_id', prodId);

        let avg = 5.0;
        let totalCount = 0;
        if (remainingReviews && remainingReviews.length > 0) {
          totalCount = remainingReviews.length;
          const sum = remainingReviews.reduce((acc, curr) => {
            const r = Number(curr.rating) || 5;
            return acc + (r > 5 ? r / 2 : r);
          }, 0);
          avg = Number((sum / totalCount).toFixed(1));
        }

        if (prodId.startsWith('bundle_')) {
          const cleanBundleId = prodId.replace(/^bundle_/, '');
          await supabaseAdmin
            .from('bundles')
            .update({ rating: avg, review_count: totalCount, updated_at: new Date().toISOString() })
            .eq('id', cleanBundleId);
        } else {
          await supabaseAdmin
            .from('products')
            .update({ rating: avg, review_count: totalCount, updated_at: new Date().toISOString() })
            .eq('id', prodId);
        }
      } catch (calcErr) {
        console.warn(`Could not update average rating for product ${prodId}:`, calcErr);
      }
    }

    // 4. Trigger recalculate store stats in case store-wide stats exist
    try {
      await supabaseAdmin.rpc('recalculate_store_stats');
    } catch {
      // RPC might not exist or fail silently
    }

    // 5. Clean up any account deletion requests for this user
    await supabaseAdmin
      .from('deletion_requests')
      .delete()
      .or(`user_id.eq.${userId},id.eq.${userId}`);

    // 6. Delete user profile from profiles table
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // 7. Delete user from Supabase Auth admin so they cannot log in again
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (authErr: any) {
      console.warn('Could not delete auth user from Supabase Auth:', authErr?.message);
    }

    return NextResponse.json({
      ok: true,
      success: true,
      deletedReviewsCount: userReviews?.length || 0,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/users/delete:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
