import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { UserProfile, UserRole, UserTier } from '@/types/user';

const USERS_COLLECTION = 'users';

function mapDocToUserProfile(docSnap: { id: string; data: () => Record<string, unknown> }): UserProfile {
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
    uid: docSnap.id,
    email: (data.email as string) || null,
    displayName: (data.displayName as string) || null,
    photoURL: (data.photoURL as string) || null,
    role: (data.role as UserRole) || 'customer',
    credits: Number(data.credits) || 0,
    tier: (data.tier as UserTier) || 'Bronze',
    phone: (data.phone as string) || undefined,
    createdAt,
    updatedAt,
  };
}

/**
 * Fetch a user profile from Firestore by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db || !uid) return null;

  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    return mapDocToUserProfile(snap);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Create or sync user profile on initial registration or social sign-in
 * Note: Never allows client-supplied role to override existing admin role
 */
export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not initialized.');

  const docRef = doc(db, USERS_COLLECTION, uid);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    // Return existing profile, do not overwrite role
    return mapDocToUserProfile(existing);
  }

  const profileData = {
    uid,
    email: data.email || null,
    displayName: data.displayName || 'Customer',
    photoURL: data.photoURL || null,
    role: 'customer' as UserRole, // ALWAYS default to 'customer'
    credits: 0,
    tier: 'Bronze' as UserTier,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, profileData);

  return {
    ...profileData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update user profile details (only safe fields, never role)
 */
export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; photoURL?: string; phone?: string }
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get all users for Admin Customers page
 */
export async function getAllUsers(limitCount: number = 50): Promise<UserProfile[]> {
  if (!db) return [];

  try {
    const colRef = collection(db, USERS_COLLECTION);
    const q = query(colRef, limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(mapDocToUserProfile);
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

/**
 * Admin action: Update role of a user
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    role,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update user wallet credits
 */
export async function updateUserCredits(uid: string, amount: number): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    credits: amount,
    updatedAt: serverTimestamp(),
  });
}
