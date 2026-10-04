import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Review, ReviewEligibility } from '@/types/review';
import { Order } from '@/types/order';

function mapRowToReview(row: any): Review {
  return {
    id: row.id,
    productId: row.product_id || '',
    productSlug: row.product_slug || '',
    productName: row.product_name || '',
    orderId: row.order_id || '',
    userId: row.user_id || '',
    userName: row.user_name || 'ผู้ซื้อที่ผ่านการยืนยัน',
    userPhoto: row.user_avatar || undefined,
    rating: Number(row.rating) || 5,
    comment: row.comment || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Get all reviews for a specific product
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
  if (!productId) return [];

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching product reviews:', error.message);
      return [];
    }

    return (data || []).map(mapRowToReview);
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return [];
  }
}

/**
 * Check if a user is eligible to review a product
 */
export async function checkReviewEligibility(
  productId: string,
  userId?: string | null,
  userEmail?: string | null,
  productSlug?: string | null
): Promise<ReviewEligibility> {
  if (!userId) {
    return {
      canReview: false,
      reason: 'not_logged_in',
      message: 'กรุณาเข้าสู่ระบบก่อนเพื่อตรวจสอบสิทธิ์การให้คะแนนสินค้า',
    };
  }

  try {
    // 1. Fetch user orders
    const { data: userOrders, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    if (orderErr || !userOrders) {
      return {
        canReview: false,
        reason: 'no_purchase',
        message: 'ไม่พบรายการสั่งซื้อของคุณ',
      };
    }

    const cleanId = productId ? productId.replace(/^bundle_/, '').toLowerCase() : '';
    const cleanSlug = productSlug ? productSlug.replace(/^bundle_/, '').toLowerCase() : '';
    const targetSlug = (productSlug || productId).toLowerCase();

    // Check if user is Admin
    const ADMIN_EMAILS = [
      'pongpataradanai@gmail.com',
      'admin@j3astore.com',
      'mynameisyee0@gmail.com',
      'ratchadejchaisomvit@gmail.com',
    ];
    const isAdmin = Boolean(userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase()));

    if (isAdmin) {
      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId);

      const existingMatch = (existingReviews || []).find((r: any) => {
        const rPid = (r.product_id || '').toLowerCase();
        const rSlug = (r.product_slug || '').toLowerCase();
        return (
          rPid === productId.toLowerCase() ||
          rSlug === targetSlug ||
          (cleanId && rPid.replace(/^bundle_/, '') === cleanId) ||
          (cleanSlug && rSlug === cleanSlug)
        );
      });

      if (existingMatch) {
        return {
          canReview: false,
          reason: 'already_reviewed',
          message: 'คุณได้ให้คะแนนสินค้านี้เรียบร้อยแล้ว ขอบคุณสำหรับรีวิวของคุณ!',
          orderId: 'admin_verified',
          existingReview: mapRowToReview(existingMatch),
        };
      }

      return {
        canReview: true,
        reason: 'eligible',
        message: 'สิทธิ์ผู้ดูแลระบบ (Admin Verified): คุณสามารถให้คะแนนและรีวิวสินค้านี้ได้ทันที',
        orderId: 'admin_verified',
      };
    }

    // Match orders containing this product or bundle
    const candidateOrders: any[] = [];
    userOrders.forEach((ord: any) => {
      const items = Array.isArray(ord.items) ? ord.items : [];
      const hasProduct = items.some((it: any) => {
        const itemPid = (it.productId || it.id || '').toString().toLowerCase();
        const itemCleanPid = itemPid.replace(/^bundle_/, '');
        const itemSlug = (it.slug || '').toString().toLowerCase();
        const itemName = (it.name || '').toString().toLowerCase();

        return (
          itemPid === productId.toLowerCase() ||
          itemPid === targetSlug ||
          (cleanId && itemCleanPid === cleanId) ||
          (cleanSlug && itemCleanPid === cleanSlug) ||
          itemSlug === productId.toLowerCase() ||
          itemSlug === targetSlug ||
          (cleanSlug && itemSlug === cleanSlug) ||
          (cleanId && itemSlug === cleanId) ||
          (cleanId && itemName.includes(cleanId)) ||
          (itemName.includes('bundle') && (itemName.includes(cleanId) || itemName.includes(cleanSlug)))
        );
      });
      if (hasProduct) {
        candidateOrders.push(ord);
      }
    });

    if (candidateOrders.length === 0) {
      return {
        canReview: false,
        reason: 'no_purchase',
        message: 'เฉพาะผู้ใช้งานที่สั่งซื้อสินค้านี้เท่านั้น จึงจะมีสิทธิ์ให้คะแนนและรีวิว',
      };
    }

    // 2. Check if any order is approved / completed
    const completedOrders = candidateOrders.filter((ord) => ord.status === 'completed');

    if (completedOrders.length === 0) {
      return {
        canReview: false,
        reason: 'order_pending_admin',
        message: 'คำสั่งซื้อของคุณยังอยู่ระหว่างการตรวจสอบ เมื่อแอดมินยืนยันคำสั่งซื้อเรียบร้อยแล้ว คุณจะได้รับสิทธิ์ให้คะแนนทันที',
      };
    }

    // 3. Check if user already reviewed for this product
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId);

    const existingMatch = (existingReviews || []).find((r: any) => {
      const rPid = (r.product_id || '').toLowerCase();
      const rSlug = (r.product_slug || '').toLowerCase();
      return (
        rPid === productId.toLowerCase() ||
        rSlug === targetSlug ||
        (cleanId && rPid.replace(/^bundle_/, '') === cleanId) ||
        (cleanSlug && rSlug === cleanSlug)
      );
    });

    if (existingMatch) {
      return {
        canReview: false,
        reason: 'already_reviewed',
        message: 'คุณได้ให้คะแนนสินค้านี้เรียบร้อยแล้ว ขอบคุณสำหรับรีวิวของคุณ!',
        orderId: completedOrders[0].id,
        existingReview: mapRowToReview(existingMatch),
      };
    }

    return {
      canReview: true,
      reason: 'eligible',
      message: 'คุณได้รับสิทธิ์ให้คะแนนสินค้านี้ เนื่องจากคำสั่งซื้อของคุณได้รับการยืนยันจากแอดมินแล้ว',
      orderId: completedOrders[0].id,
    };
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return {
      canReview: false,
      reason: 'no_purchase',
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาลองใหม่อีกครั้ง',
    };
  }
}

/**
 * Submit a verified buyer review
 */
export async function submitProductReview(data: {
  productId: string;
  productSlug?: string;
  productName: string;
  orderId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  const star = Math.max(1, Math.min(10, Math.round(data.rating)));
  const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.userId || '');
  const userId = isUuid ? data.userId : null;

  const row = {
    id,
    product_id: data.productId,
    product_slug: data.productSlug || '',
    product_name: data.productName,
    order_id: data.orderId,
    user_id: userId,
    user_name: data.userName || 'ผู้ซื้อที่ผ่านการยืนยัน',
    user_avatar: data.userPhoto || null,
    rating: star,
    comment: data.comment.trim(),
    is_verified_purchase: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('reviews').insert([row]);
  if (error) {
    throw new Error(`Failed to submit review: ${error.message}`);
  }

  // Recalculate average rating
  try {
    const allReviews = await getProductReviews(data.productId);
    const totalCount = allReviews.length;
    const sum = allReviews.reduce((acc, curr) => {
      const r = curr.rating > 5 ? curr.rating / 2 : curr.rating;
      return acc + r;
    }, 0);
    const avg = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : (star > 5 ? Number((star / 2).toFixed(1)) : star);

    if (data.productId.startsWith('bundle_')) {
      const cleanBundleId = data.productId.replace(/^bundle_/, '');
      await supabase
        .from('bundles')
        .update({ rating: avg, review_count: totalCount, updated_at: new Date().toISOString() })
        .eq('id', cleanBundleId);
    } else {
      await supabase
        .from('products')
        .update({ rating: avg, review_count: totalCount, updated_at: new Date().toISOString() })
        .eq('id', data.productId);
    }
  } catch (err) {
    console.warn('Could not update average rating:', err);
  }

  return mapRowToReview(row);
}

/**
 * Check if user is eligible to write an overall store review
 */
export async function checkStoreReviewEligibility(userId?: string | null): Promise<ReviewEligibility> {
  if (!userId) {
    return {
      canReview: false,
      reason: 'not_logged_in',
      message: 'ไม่สามารถรีวิวได้เนื่องจากยังไม่ซื้อสินค้า',
    };
  }

  try {
    const { data: userOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    const completed = (userOrders || []).filter((o: any) => o.status === 'completed' || o.status === 'paid');

    if (completed.length === 0) {
      return {
        canReview: false,
        reason: 'no_purchase',
        message: 'ไม่สามารถรีวิวได้เนื่องจากยังไม่ซื้อสินค้า',
      };
    }

    const { data: storeRev } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', 'store_overall')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (storeRev) {
      return {
        canReview: false,
        reason: 'already_reviewed',
        message: 'คุณได้ส่งรีวิวร้านค้าเรียบร้อยแล้ว ขอบคุณสำหรับคะแนนและความเห็น!',
        orderId: completed[0].id,
        existingReview: mapRowToReview(storeRev),
      };
    }

    return {
      canReview: true,
      reason: 'eligible',
      message: 'คุณมีสิทธิ์รีวิวร้านค้าเนื่องจากเป็นลูกค้าที่มียอดสั่งซื้อสำเร็จในระบบแล้ว',
      orderId: completed[0].id,
    };
  } catch (err) {
    console.error('Error checking store review eligibility:', err);
    return {
      canReview: false,
      reason: 'no_purchase',
      message: 'ไม่สามารถรีวิวได้เนื่องจากยังไม่ซื้อสินค้า',
    };
  }
}

/**
 * Get all overall store reviews
 */
export async function getStoreReviews(): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', 'store_overall')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(mapRowToReview);
  } catch (error) {
    console.error('Error fetching store reviews:', error);
    return [];
  }
}

/**
 * Submit overall store review
 */
export async function submitStoreReview(data: {
  userId: string;
  userName: string;
  userPhoto?: string;
  orderId: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  const star = Math.max(1, Math.min(10, Math.round(data.rating)));
  const id = `rev_store_${Date.now()}`;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.userId || '');
  const userId = isUuid ? data.userId : null;

  const row = {
    id,
    product_id: 'store_overall',
    product_slug: 'store',
    product_name: 'J3A STORE (ร้านค้าโดยรวม)',
    order_id: data.orderId,
    user_id: userId,
    user_name: data.userName || 'ลูกค้าผู้ใช้งานจริง',
    user_avatar: data.userPhoto || null,
    rating: star,
    comment: data.comment.trim(),
    is_verified_purchase: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('reviews').insert([row]);
  if (error) throw new Error(error.message);

  return mapRowToReview(row);
}

/**
 * Global store review statistics for live stats
 */
export async function getStoreReviewStats(): Promise<{
  averageRating: number;
  totalReviews: number;
  satisfactionRate: string;
}> {
  try {
    const { data, error } = await supabase.from('reviews').select('rating');
    if (error || !data || data.length === 0) {
      return { averageRating: 5.0, totalReviews: 0, satisfactionRate: '100%' };
    }

    let sum = 0;
    let highRatings = 0;
    data.forEach((r) => {
      const raw = Number(r.rating) || 10;
      const val = raw > 5 ? raw / 2 : raw;
      sum += val;
      if (val >= 4) highRatings++;
    });

    const total = data.length;
    const avg = Number((sum / total).toFixed(1));
    const satisfaction = Math.round((highRatings / total) * 100) + '%';

    return {
      averageRating: avg,
      totalReviews: total,
      satisfactionRate: satisfaction,
    };
  } catch (error) {
    return { averageRating: 5.0, totalReviews: 0, satisfactionRate: '100%' };
  }
}

/**
 * Fetch all customer reviews for Admin moderation
 */
export async function getAllReviews(limitCount = 100): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) return [];
    return (data || []).map(mapRowToReview);
  } catch (error) {
    return [];
  }
}

/**
 * Delete a review (Admin moderation)
 */
export async function deleteReview(reviewId: string, productId?: string): Promise<void> {
  if (!reviewId) return;

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw new Error(error.message);

  if (productId && productId !== 'store_overall') {
    try {
      const remaining = await getProductReviews(productId);
      const totalCount = remaining.length;
      const sum = remaining.reduce((acc, curr) => {
        const r = curr.rating > 5 ? curr.rating / 2 : curr.rating;
        return acc + r;
      }, 0);
      const avg = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 5.0;

      await supabase
        .from('products')
        .update({ rating: avg, review_count: totalCount, updated_at: new Date().toISOString() })
        .eq('id', productId);
    } catch {}
  }
}
