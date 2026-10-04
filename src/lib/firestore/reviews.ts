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
  deleteDoc,
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

    const cleanId = productId ? productId.replace(/^bundle_/, '').toLowerCase() : '';
    const cleanSlug = productSlug ? productSlug.replace(/^bundle_/, '').toLowerCase() : '';
    const targetSlug = (productSlug || productId).toLowerCase();

    // Match orders containing this product or bundle
    const candidateOrders: Order[] = [];
    snap.forEach((d) => {
      const ordData = d.data();
      const items = Array.isArray(ordData.items) ? ordData.items : [];
      const hasProduct = items.some((it: any) => {
        const itemPid = (it.productId || '').toString().toLowerCase();
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
          (cleanId && itemName.includes(cleanId))
        );
      });
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
      where('userId', '==', userId)
    );
    const revSnap = await getDocs(revQuery);

    const existingMatch = revSnap.docs
      .map(mapDocToReview)
      .find((r) => {
        const rPid = (r.productId || '').toLowerCase();
        const rSlug = (r.productSlug || '').toLowerCase();
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
        orderId: completedOrder.id,
        existingReview: existingMatch,
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

  // Validate rating boundary (1 to 10)
  const star = Math.max(1, Math.min(10, Math.round(data.rating)));

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

  // Recalculate average rating for this product or bundle
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
      const bundleDocRef = doc(db, 'bundles', cleanBundleId);
      await updateDoc(bundleDocRef, {
        rating: avg,
        reviewCount: totalCount,
        updatedAt: serverTimestamp(),
      }).catch((e) => console.warn('Could not update bundle average rating:', e));
    } else {
      const prodDocRef = doc(db, PRODUCTS_COLLECTION, data.productId);
      await updateDoc(prodDocRef, {
        rating: avg,
        reviewCount: totalCount,
        updatedAt: serverTimestamp(),
      }).catch((e) => console.warn('Could not update product average rating:', e));
    }
  } catch (err) {
    console.warn('Could not update average rating:', err);
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
 * Check if user is eligible to write an overall store review
 * Rule: Must be logged in AND have at least 1 paid/completed order
 */
export async function checkStoreReviewEligibility(userId?: string | null): Promise<ReviewEligibility> {
  if (!userId) {
    return {
      canReview: false,
      reason: 'not_logged_in',
      message: 'ไม่สามารถรีวิวได้เนื่องจากยังไม่ซื้อสินค้า',
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
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const q = query(ordersCol, where('userId', '==', userId));
    const snap = await getDocs(q);

    const completedOrders: any[] = [];
    snap.forEach((d) => {
      const ord = d.data();
      if (ord.status === 'completed' || ord.status === 'paid') {
        completedOrders.push({ id: d.id, ...ord });
      }
    });

    if (completedOrders.length === 0) {
      return {
        canReview: false,
        reason: 'no_purchase',
        message: 'ไม่สามารถรีวิวได้เนื่องจากยังไม่ซื้อสินค้า',
      };
    }

    const reviewsCol = collection(db, REVIEWS_COLLECTION);
    const revQ = query(
      reviewsCol,
      where('productId', '==', 'store_overall'),
      where('userId', '==', userId)
    );
    const revSnap = await getDocs(revQ);
    if (!revSnap.empty) {
      const existing = mapDocToReview(revSnap.docs[0]);
      return {
        canReview: false,
        reason: 'already_reviewed',
        message: 'คุณได้ส่งรีวิวร้านค้าเรียบร้อยแล้ว ขอบคุณสำหรับคะแนนและความเห็น!',
        orderId: completedOrders[0].id,
        existingReview: existing,
      };
    }

    return {
      canReview: true,
      reason: 'eligible',
      message: 'คุณมีสิทธิ์รีวิวร้านค้าเนื่องจากเป็นลูกค้าที่มียอดสั่งซื้อสำเร็จในระบบแล้ว',
      orderId: completedOrders[0].id,
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
  if (!db) return [];
  try {
    const colRef = collection(db, REVIEWS_COLLECTION);
    const q = query(colRef, where('productId', '==', 'store_overall'));
    const snap = await getDocs(q);
    const reviews = snap.docs.map(mapDocToReview);
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reviews;
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
  if (!db) throw new Error('Firestore is not initialized.');

  const star = Math.max(1, Math.min(10, Math.round(data.rating)));
  const reviewDoc = {
    productId: 'store_overall',
    productSlug: 'store',
    productName: 'J3A STORE (ร้านค้าโดยรวม)',
    orderId: data.orderId,
    userId: data.userId,
    userName: data.userName || 'ลูกค้าผู้ใช้งานจริง',
    userPhoto: data.userPhoto || null,
    rating: star,
    comment: data.comment.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, REVIEWS_COLLECTION);
  const docRef = await addDoc(colRef, reviewDoc);

  return {
    id: docRef.id,
    productId: 'store_overall',
    productSlug: 'store',
    productName: 'J3A STORE (ร้านค้าโดยรวม)',
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
      const raw = Number(d.data().rating) || 10;
      // Convert 10-point rating to 5-star scale
      const r = raw > 5 ? raw / 2 : raw;
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

/**
 * Fetch all customer reviews for Admin moderation
 */
export async function getAllReviews(limitCount = 100): Promise<Review[]> {
  if (!db) return [];

  try {
    const colRef = collection(db, REVIEWS_COLLECTION);
    const snap = await getDocs(colRef);
    const reviews = snap.docs.map(mapDocToReview);

    // Sort newest first
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reviews.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting all reviews:', error);
    return [];
  }
}

/**
 * Delete a review (Admin moderation) and optionally recalculate product rating
 */
export async function deleteReview(reviewId: string, productId?: string): Promise<void> {
  if (!db || !reviewId) return;

  const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await deleteDoc(docRef);

  // If associated with a product, recalculate its average rating
  if (productId && productId !== 'store_overall') {
    try {
      const remainingReviews = await getProductReviews(productId);
      const totalCount = remainingReviews.length;
      const sum = remainingReviews.reduce((acc, curr) => {
        const r = curr.rating > 5 ? curr.rating / 2 : curr.rating;
        return acc + r;
      }, 0);
      const avg = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 5.0;

      const prodDocRef = doc(db, PRODUCTS_COLLECTION, productId);
      await updateDoc(prodDocRef, {
        rating: avg,
        reviewCount: totalCount,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not recalculate product rating after review deletion:', e);
    }
  }
}

