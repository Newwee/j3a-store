import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/client';
import { PublicUserProfile } from '@/types/user';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const client = supabaseAdmin || supabase;

    let profileQuery = client
      .from('profiles')
      .select('id, display_name, email, avatar_url, role, tier, bio, social_links, created_at');

    if (userId.includes('@')) {
      profileQuery = profileQuery.eq('email', userId);
    } else {
      profileQuery = profileQuery.eq('id', userId);
    }

    const { data: profileRow } = await profileQuery.limit(1).maybeSingle();

    const targetUserId = profileRow?.id || userId;
    const { data: reviewsData } = await client
      .from('reviews')
      .select('id, product_id, product_slug, product_name, rating, comment, created_at, user_name, user_avatar')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    const reviewsList = reviewsData || [];
    const totalReviews = reviewsList.length;
    const avgRating =
      totalReviews > 0
        ? Number(
            (
              reviewsList.reduce(
                (acc: number, r: any) =>
                  acc + (Number(r.rating) > 5 ? Number(r.rating) / 2 : Number(r.rating)),
                0
              ) / totalReviews
            ).toFixed(1)
          )
        : 5.0;

    const firstReview = reviewsList[0];
    const fallbackName = firstReview?.user_name || 'ลูกค้าผู้ใช้งานจริง';
    const fallbackAvatar = firstReview?.user_avatar || null;

    const rawDisplayName = profileRow?.display_name;
    const displayName =
      rawDisplayName && rawDisplayName.trim() && rawDisplayName !== 'Customer'
        ? rawDisplayName.trim()
        : profileRow?.email
        ? profileRow.email.split('@')[0]
        : fallbackName;

    const socialLinks =
      typeof profileRow?.social_links === 'object' && profileRow?.social_links !== null
        ? profileRow.social_links
        : typeof profileRow?.social_links === 'string'
        ? JSON.parse(profileRow.social_links || '{}')
        : {};

    const publicProfile: PublicUserProfile = {
      uid: userId,
      displayName,
      photoURL: profileRow?.avatar_url || fallbackAvatar,
      role: (profileRow?.role as any) || 'customer',
      tier: (profileRow?.tier as any) || 'Bronze',
      bio: profileRow?.bio || undefined,
      socialLinks,
      createdAt:
        profileRow?.created_at || (firstReview?.created_at || new Date().toISOString()),
      reviewCount: totalReviews,
      averageRating: avgRating,
      reviews: reviewsList.map((r: any) => ({
        id: r.id,
        productId: r.product_id || '',
        productName: r.product_name || '',
        productSlug: r.product_slug || undefined,
        rating: Number(r.rating) > 5 ? Number(r.rating) / 2 : Number(r.rating),
        comment: r.comment || '',
        createdAt: r.created_at || new Date().toISOString(),
      })),
    };

    return NextResponse.json({ ok: true, profile: publicProfile });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
