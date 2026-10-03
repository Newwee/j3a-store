import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { DeletionRequest, DeletionRequestStatus } from '@/types/user';
import { deleteUserDoc } from '@/lib/firestore/users';

const DELETION_REQUESTS_COLLECTION = 'deletion_requests';

function mapDocToDeletionRequest(docSnap: { id: string; data: () => Record<string, unknown> }): DeletionRequest {
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

  let approvedAt: string | undefined = undefined;
  if (data.approvedAt instanceof Timestamp) {
    approvedAt = data.approvedAt.toDate().toISOString();
  } else if (typeof data.approvedAt === 'string') {
    approvedAt = data.approvedAt;
  }

  let rejectedAt: string | undefined = undefined;
  if (data.rejectedAt instanceof Timestamp) {
    rejectedAt = data.rejectedAt.toDate().toISOString();
  } else if (typeof data.rejectedAt === 'string') {
    rejectedAt = data.rejectedAt;
  }

  return {
    id: docSnap.id,
    userId: (data.userId as string) || docSnap.id,
    email: (data.email as string) || null,
    displayName: (data.displayName as string) || null,
    credits: Number(data.credits) || 0,
    status: (data.status as DeletionRequestStatus) || 'pending',
    userReason: (data.userReason as string) || undefined,
    adminNote: (data.adminNote as string) || undefined,
    createdAt,
    updatedAt,
    approvedAt,
    rejectedAt,
  };
}

/**
 * Submit or update an account deletion request by customer
 */
export async function requestAccountDeletion(params: {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  credits?: number;
  userReason?: string;
}): Promise<DeletionRequest> {
  if (!db) throw new Error('Firestore is not initialized.');
  if (!params.userId) throw new Error('User ID is required.');

  const docRef = doc(db, DELETION_REQUESTS_COLLECTION, params.userId);

  const payload = {
    userId: params.userId,
    email: params.email || null,
    displayName: params.displayName || null,
    credits: Number(params.credits) || 0,
    status: 'pending' as DeletionRequestStatus,
    userReason: params.userReason?.trim() || '',
    updatedAt: serverTimestamp(),
  };

  const existing = await getDoc(docRef);
  if (existing.exists()) {
    await updateDoc(docRef, payload);
  } else {
    await setDoc(docRef, {
      ...payload,
      createdAt: serverTimestamp(),
    });
  }

  return {
    id: params.userId,
    ...payload,
    userReason: params.userReason?.trim() || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get active deletion request for a specific user
 */
export async function getUserDeletionRequest(userId: string): Promise<DeletionRequest | null> {
  if (!db || !userId) return null;

  try {
    const docRef = doc(db, DELETION_REQUESTS_COLLECTION, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return mapDocToDeletionRequest(snap);
  } catch (error) {
    console.error('Error fetching deletion request for user:', error);
    return null;
  }
}

/**
 * Get all deletion requests for Admin Customers page
 */
export async function getAllDeletionRequests(): Promise<DeletionRequest[]> {
  if (!db) return [];

  try {
    const colRef = collection(db, DELETION_REQUESTS_COLLECTION);
    const snap = await getDocs(colRef);
    const requests = snap.docs.map(mapDocToDeletionRequest);
    // Sort newest first
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching all deletion requests:', error);
    return [];
  }
}

/**
 * Admin action: Approve account deletion, permanently deleting the user's data from Firestore
 */
export async function approveAccountDeletion(requestId: string, userId: string, adminNote?: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  // 1. Delete user document from users collection
  try {
    await deleteUserDoc(userId);
  } catch (err: any) {
    console.warn(`Could not delete user doc for uid ${userId}:`, err);
  }

  // 2. Mark deletion request as approved
  const docRef = doc(db, DELETION_REQUESTS_COLLECTION, requestId);
  await updateDoc(docRef, {
    status: 'approved',
    adminNote: adminNote?.trim() || 'อนุมัติการลบบัญชีและข้อมูลผู้ใช้เรียบร้อยแล้ว',
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Admin action: Reject account deletion request
 */
export async function rejectAccountDeletion(requestId: string, adminNote?: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const docRef = doc(db, DELETION_REQUESTS_COLLECTION, requestId);
  await updateDoc(docRef, {
    status: 'rejected',
    adminNote: adminNote?.trim() || 'คำขอลบบัญชีถูกปฏิเสธโดยผู้ดูแลระบบ',
    rejectedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * User action: Cancel own pending deletion request
 */
export async function cancelAccountDeletion(userId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const docRef = doc(db, DELETION_REQUESTS_COLLECTION, userId);
  await updateDoc(docRef, {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Real-time subscription to user's deletion request
 */
export function subscribeUserDeletionRequest(
  userId: string,
  callback: (request: DeletionRequest | null) => void
): () => void {
  if (!db || !userId) return () => {};

  const docRef = doc(db, DELETION_REQUESTS_COLLECTION, userId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(mapDocToDeletionRequest(snap));
    },
    (err) => {
      console.warn('subscribeUserDeletionRequest error:', err);
    }
  );
}
