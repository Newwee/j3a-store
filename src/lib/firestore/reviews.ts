import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Review, ReviewEligibility } from '@/types/review';
import { Order } from '@/types/order';

const REVIEWS_COLLECTION = 'reviews';
const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';

function mapDocToReview(docSnap: { id: string; data: () => Record<string, unknown> }): Review {
  const data = docSnap.data();

  let createdAt = new Date().toISOString();
  if (data.createdAt instanceof Timestamp) {
    createdAt = data.createdAt.toDate().toISOString();
  } else if (typeof data.createdAt === 'string') {
    createdAt = data.createdAt;
  }

  let updatedAt = new Date().toISOString();
  if (data.updatedAt instanceof Timestamp) {
    updatedAt = data.updatedAt.toDate().toISOString();
  } else if (typeof data.updatedAt === 'string') {
    updatedAt = data.updatedAt;
  }

  return {
    id: docSnap.id,
    productId: (data.productId as string) || '',
    productSlug: (data.productSlug as string) || '',
    productName: (data.productName as string) || '',
    orderId: (data.orderId as string) || '',
    userId: (data.userId as string) || '',
    userName: (data.userName as string) || 'ผู้ซื้อที่ผ่านการยืนยัน',
    userPhoto: (data.userPhoto as string) || undefined,
    rating: Number(data.rating) || 5,
    comment: (data.comment as string) || '',
    createdAt,
    updatedAt,
  };
}

/**
 * Get all reviews for a specific product
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
  if (!db || !productId) return [];

  try {
    const colRef = collection(db, REVIEWS_COLLECTION);
    const q = query(
      colRef,
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(mapDocToReview);

    // Sort client-side by date descending
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reviews;
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return [];
  }
}

/**
 * Check if a user is eligible to review a product
 * Conditions:
 * 1. Must be logged in
 * 2. Must have bought this product in an Order
 * 3. The Order status must be 'completed' (Approved/completed by admin)
 * 4. Must not have already reviewed this product for this order
 */
export async function checkReviewEligibility(
  productId: string,
  userId?: string | null,
  userEmail?: string | null
): Promise<ReviewEligibility> {
  if (!userId) {
    return {
      canReview: false,
      reason: 'not_logged_in',
      message: 'กรุณาเข้าสู่ระบบก่อนเพื่อตรวจสอบสิทธิ์การให้คะแนนสินค้า',
    };
  }

  if (!db) {
    return {
      canReview: false,
      reason: 'no_purchase',
      message: 'ระบบฐานข้อมูลยังไม่พร้อมใช้งาน',
    };
  }

  try {
    // 1. Fetch user orders
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const q = query(ordersCol, where('userId', '==', userId));
    const snap = await getDocs(q);

    // Match orders containing this product
    const candidateOrders: Order[] = [];
    snap.forEach((d) => {
      const ordData = d.data();
      const items = Array.isArray(ordData.items) ? ordData.items : [];
      const hasProduct = items.some(
        (it: any) => it.productId === productId || it.slug === productId
      );
      if (hasProduct) {
        candidateOrders.push({ id: d.id, ...ordData } as Order);
      }
    });

    if (candidateOrders.length === 0) {
      return {
        canReview: false,
        reason: 'no_purchase',
        message: 'เฉพาะผู้ใช้งานที่สั่งซื้อสินค้านี้เท่านั้น จึงจะมีสิทธิ์ให้คะแนนและรีวิว',
      };
    }

    // 2. Check if any order is approved / completed by admin
    const completedOrders = candidateOrders.filter((ord) => ord.status === 'completed');

    if (completedOrders.length === 0) {
      return {
        canReview: false,
        reason: 'order_pending_admin',
        message: 'คำสั่งซื้อของคุณยังอยู่ระหว่างการตรวจสอบ เมื่อแอดมินยืนยันคำสั่งซื้อเรียบร้อยแล้ว คุณจะได้รับสิทธิ์ให้คะแนนทันที',
      };
    }

    // 3. Check if user already reviewed for any of these completed orders
    const completedOrder = completedOrders[0];
    const reviewsCol = collection(db, REVIEWS_COLLECTION);
    const revQuery = query(
      reviewsCol,
      where('productId', '==', productId),
      where('userId', '==', userId)
    );
    const revSnap = await getDocs(revQuery);

    if (!revSnap.empty) {
      const existing = mapDocToReview(revSnap.docs[0]);
      return {
        canReview: false,
        reason: 'already_reviewed',
        message: 'คุณได้ให้คะแนนสินค้านี้เรียบร้อยแล้ว ขอบคุณสำหรับรีวิวของคุณ!',
        orderId: completedOrder.id,
        existingReview: existing,
      };
    }

    // 4. Eligible to review!
    return {
      canReview: true,
      reason: 'eligible',
      message: 'คุณได้รับสิทธิ์ให้คะแนนสินค้านี้ เนื่องจากคำสั่งซื้อของคุณได้รับการยืนยันจากแอดมินแล้ว',
      orderId: completedOrder.id,
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
  if (!db) throw new Error('Firestore is not initialized.');

  // Validate rating boundary
  const star = Math.max(1, Math.min(5, Math.round(data.rating)));

  const reviewDoc = {
    productId: data.productId,
    productSlug: data.productSlug || '',
    productName: data.productName,
    orderId: data.orderId,
    userId: data.userId,
    userName: data.userName || 'ผู้ซื้อที่ผ่านการยืนยัน',
    userPhoto: data.userPhoto || null,
    rating: star,
    comment: data.comment.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, REVIEWS_COLLECTION);
  const docRef = await addDoc(colRef, reviewDoc);

  // Recalculate average rating for this product
  try {
    const allReviews = await getProductReviews(data.productId);
    const totalCount = allReviews.length;
    const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : star;

    const prodDocRef = doc(db, PRODUCTS_COLLECTION, data.productId);
    await updateDoc(prodDocRef, {
      rating: avg,
      reviewCount: totalCount,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not update product average rating:', err);
  }

  return {
    id: docRef.id,
    productId: data.productId,
    productSlug: data.productSlug,
    productName: data.productName,
    orderId: data.orderId,
    userId: data.userId,
    userName: data.userName,
    userPhoto: data.userPhoto,
    rating: star,
    comment: data.comment.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Global store review statistics for live stats
 */
export async function getStoreReviewStats(): Promise<{
  averageRating: number;
  totalReviews: number;
  satisfactionRate: string;
}> {
  if (!db) {
    return { averageRating: 5.0, totalReviews: 0, satisfactionRate: '100%' };
  }

  try {
    const colRef = collection(db, REVIEWS_COLLECTION);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      return { averageRating: 5.0, totalReviews: 0, satisfactionRate: '100%' };
    }

    let sum = 0;
    let highRatings = 0; // 4 or 5 stars

    snap.forEach((d) => {
      const r = Number(d.data().rating) || 5;
      sum += r;
      if (r >= 4) highRatings++;
    });

    const total = snap.size;
    const avg = Number((sum / total).toFixed(1));
    const satisfaction = Math.round((highRatings / total) * 100) + '%';

    return {
      averageRating: avg,
      totalReviews: total,
      satisfactionRate: satisfaction,
    };
  } catch (error) {
    console.error('Error fetching global review stats:', error);
    return { averageRating: 5.0, totalReviews: 0, satisfactionRate: '100%' };
  }
}
