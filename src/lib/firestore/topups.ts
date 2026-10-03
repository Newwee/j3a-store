import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { TopupRequest, CreateTopupInput, TopupStatus } from '@/types/topup';
import { getUserProfile, updateUserCredits } from './users';

const TOPUPS_COLLECTION = 'topups';

function mapDocToTopup(docSnap: { id: string; data: () => Record<string, unknown> }): TopupRequest {
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
    topupNumber: (data.topupNumber as string) || `TOP-${docSnap.id.slice(-6).toUpperCase()}`,
    userId: (data.userId as string) || '',
    userEmail: (data.userEmail as string) || '',
    userName: (data.userName as string) || 'ลูกค้า',
    amount: Number(data.amount) || 0,
    paymentSlipUrl: (data.paymentSlipUrl as string) || '',
    status: (data.status as TopupStatus) || 'pending',
    adminNote: (data.adminNote as string) || undefined,
    createdAt,
    updatedAt,
  };
}

/**
 * Customer submits a top-up request with payment slip
 */
export async function createTopupRequest(input: CreateTopupInput): Promise<TopupRequest> {
  if (!db) throw new Error('Firestore is not initialized.');
  if (input.amount <= 0) throw new Error('ยอดเงินต้องมากกว่า 0 บาท');
  if (!input.paymentSlipUrl) throw new Error('กรุณาแนบรูปภาพสลิปการโอนเงิน');

  const timestamp = Date.now().toString().slice(-6);
  const topupNumber = `TOP-${timestamp}`;

  const topupDoc = {
    topupNumber,
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    amount: Math.round(input.amount),
    paymentSlipUrl: input.paymentSlipUrl,
    status: 'pending' as TopupStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, TOPUPS_COLLECTION);
  const docRef = await addDoc(colRef, topupDoc);

  return {
    id: docRef.id,
    topupNumber,
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    amount: Math.round(input.amount),
    paymentSlipUrl: input.paymentSlipUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fetch top-up requests for a specific user
 */
export async function getUserTopups(userId: string): Promise<TopupRequest[]> {
  if (!db || !userId) return [];

  try {
    const colRef = collection(db, TOPUPS_COLLECTION);
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);

    const items = snap.docs.map(mapDocToTopup);
    // Sort descending by creation date
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (error) {
    console.error('Error fetching user top-ups:', error);
    return [];
  }
}

/**
 * Admin: Fetch all top-up requests
 */
export async function getAllTopups(filterStatus?: TopupStatus | 'all'): Promise<TopupRequest[]> {
  if (!db) return [];

  try {
    const colRef = collection(db, TOPUPS_COLLECTION);
    let q = query(colRef);
    if (filterStatus && filterStatus !== 'all') {
      q = query(colRef, where('status', '==', filterStatus));
    }

    const snap = await getDocs(q);
    const items = snap.docs.map(mapDocToTopup);
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (error) {
    console.error('Error fetching all top-ups:', error);
    return [];
  }
}

/**
 * Admin Action: Approve top-up request and credit amount to User's Wallet balance
 */
export async function approveTopup(topupId: string): Promise<{ success: boolean; newCredits: number }> {
  if (!db) throw new Error('Firestore is not initialized.');

  const topupDocRef = doc(db, TOPUPS_COLLECTION, topupId);
  const topupSnap = await getDoc(topupDocRef);

  if (!topupSnap.exists()) {
    throw new Error('ไม่พบคำขอเติมเงินนี้ในระบบ');
  }

  const topupData = topupSnap.data();
  if (topupData.status === 'approved') {
    throw new Error('คำขอนี้ได้รับการอนุมัติเงินเข้าบัญชีไปแล้ว');
  }

  const userId = topupData.userId as string;
  const amount = Number(topupData.amount) || 0;

  // 1. Fetch user's current credits
  const userProfile = await getUserProfile(userId);
  const currentCredits = userProfile?.credits || 0;
  const newCredits = currentCredits + amount;

  // 2. Credit the money to User's Wallet in Firestore
  await updateUserCredits(userId, newCredits);

  // 3. Mark top-up as approved
  await updateDoc(topupDocRef, {
    status: 'approved',
    updatedAt: serverTimestamp(),
  });

  return { success: true, newCredits };
}

/**
 * Admin Action: Reject top-up request with optional reason
 */
export async function rejectTopup(topupId: string, reason?: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const topupDocRef = doc(db, TOPUPS_COLLECTION, topupId);
  await updateDoc(topupDocRef, {
    status: 'rejected',
    adminNote: reason || 'สลิปไม่ถูกต้อง หรือไม่พบยอดเงินเข้าบัญชี',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Real-time subscription to user's top-up requests
 */
export function subscribeUserTopups(
  userId: string,
  callback: (topups: TopupRequest[]) => void
): () => void {
  if (!db || !userId) return () => {};

  const colRef = collection(db, TOPUPS_COLLECTION);
  const q = query(colRef, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const topups = snapshot.docs.map(mapDocToTopup);
      topups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(topups);
    },
    (err) => {
      console.warn('subscribeUserTopups error:', err);
    }
  );
}
