import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateUserCredits } from './users';

export interface RedeemCode {
  id: string;
  code: string; // เช่น 'J3A-NEWYEAR', 'WELCOME50'
  amount: number; // เครดิตที่ได้รับ เช่น 50 บาท
  maxUses: number; // จำนวนสิทธิ์ทั้งหมด เช่น 100
  usedCount: number; // จำนวนคนที่ใช้ไปแล้ว
  usedByUsers: string[]; // รายชื่อ UID ของคนที่ใช้ไปแล้ว
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  amount?: number;
  totalMembersCount?: number;
  usedCount?: number;
}

const REDEEM_CODES_COLLECTION = 'redeem_codes';

/**
 * Redeem a code for the specified user
 */
export async function redeemCodeForUser(codeStr: string, userId: string): Promise<RedeemResult> {
  if (!db || !userId) {
    return { success: false, message: 'ระบบฐานข้อมูลยังไม่พร้อมใช้งาน' };
  }

  const cleanCode = codeStr.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'กรุณากรอกโค้ดของขวัญ' };
  }

  try {
    if (cleanCode === 'J3AOPENING') {
      await seedOpeningCodeIfNotExists();
    }

    const codeDocRef = doc(db, REDEEM_CODES_COLLECTION, cleanCode);
    const userDocRef = doc(db, 'users', userId);

    return await runTransaction(db, async (transaction) => {
      const codeSnap = await transaction.get(codeDocRef);
      if (!codeSnap.exists()) {
        return { success: false, message: 'ไม่พบโค้ดนี้ในระบบ หรือโค้ดไม่ถูกต้อง' };
      }

      const codeData = codeSnap.data();
      if (!codeData.isActive) {
        return { success: false, message: 'โค้ดนี้หมดอายุหรือปิดการใช้งานแล้ว' };
      }

      const usedByUsers: string[] = Array.isArray(codeData.usedByUsers) ? codeData.usedByUsers : [];
      if (usedByUsers.includes(userId)) {
        return { success: false, message: 'คุณเคยใช้โค้ดนี้ไปแล้ว (จำกัด 1 สิทธิ์ต่อบัญชี)' };
      }

      const maxUses = Number(codeData.maxUses) || 0;
      const currentUsed = Number(codeData.usedCount) || 0;
      if (maxUses > 0 && currentUsed >= maxUses) {
        return { success: false, message: 'สิทธิ์การใช้งานโค้ดนี้เต็มแล้ว' };
      }

      // Check user
      const userSnap = await transaction.get(userDocRef);
      if (!userSnap.exists()) {
        return { success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' };
      }

      const currentCredits = Number(userSnap.data().credits) || 0;
      const rewardAmount = Number(codeData.amount) || 0;
      const newCredits = currentCredits + rewardAmount;
      const newUsedCount = currentUsed + 1;

      // Update code
      transaction.update(codeDocRef, {
        usedCount: newUsedCount,
        usedByUsers: [...usedByUsers, userId],
        updatedAt: serverTimestamp(),
      });

      // Update user credits
      transaction.update(userDocRef, {
        credits: newCredits,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: `แลกโค้ดสำเร็จ! คุณได้รับเครดิต ${rewardAmount} บาท`,
        amount: rewardAmount,
        usedCount: newUsedCount,
      };
    });
  } catch (error: any) {
    console.error('Error redeeming code:', error);
    return { success: false, message: error.message || 'เกิดข้อผิดพลาดในการแลกโค้ด' };
  }
}

/**
 * Get all redeem codes (Admin)
 */
export async function getAllRedeemCodes(): Promise<RedeemCode[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, REDEEM_CODES_COLLECTION);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        code: data.code || d.id,
        amount: Number(data.amount) || 0,
        maxUses: Number(data.maxUses) || 0,
        usedCount: Number(data.usedCount) || 0,
        usedByUsers: Array.isArray(data.usedByUsers) ? data.usedByUsers : [],
        isActive: Boolean(data.isActive),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : '',
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : '',
      };
    });
  } catch (err) {
    console.error('Error getting redeem codes:', err);
    return [];
  }
}

export interface CreateRedeemCodeInput {
  code: string;
  amount: number;
  maxUses?: number;
  isActive?: boolean;
}

/**
 * Create a new redeem code (Admin)
 */
export async function createRedeemCode(input: CreateRedeemCodeInput): Promise<RedeemCode> {
  if (!db) throw new Error('Firestore is not initialized.');

  const cleanCode = input.code.trim().toUpperCase();
  if (!cleanCode) throw new Error('กรุณากรอกรหัสโค้ด');
  if (input.amount <= 0) throw new Error('จำนวนเครดิตต้องมากกว่า 0');

  const docRef = doc(db, REDEEM_CODES_COLLECTION, cleanCode);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    throw new Error(`โค้ด "${cleanCode}" มีอยู่ในระบบแล้ว`);
  }

  const newDoc = {
    code: cleanCode,
    amount: Math.round(input.amount),
    maxUses: Number(input.maxUses) || 0,
    usedCount: 0,
    usedByUsers: [],
    isActive: input.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, newDoc);

  return {
    id: cleanCode,
    code: cleanCode,
    amount: Math.round(input.amount),
    maxUses: Number(input.maxUses) || 0,
    usedCount: 0,
    usedByUsers: [],
    isActive: input.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update an existing redeem code (Admin)
 */
export async function updateRedeemCode(
  codeId: string,
  data: Partial<CreateRedeemCodeInput>
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, REDEEM_CODES_COLLECTION, codeId.toUpperCase());
  
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (data.amount !== undefined) payload.amount = Math.round(data.amount);
  if (data.maxUses !== undefined) payload.maxUses = Number(data.maxUses);
  if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);

  await updateDoc(docRef, payload);
}

/**
 * Delete a redeem code (Admin)
 */
export async function deleteRedeemCode(codeId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, REDEEM_CODES_COLLECTION, codeId.toUpperCase());
  await deleteDoc(docRef);
}

/**
 * Auto-seed opening code 'J3AOPENING' for 20 credits if it does not exist
 */
export async function seedOpeningCodeIfNotExists(): Promise<void> {
  if (!db) return;
  try {
    const code = 'J3AOPENING';
    const docRef = doc(db, REDEEM_CODES_COLLECTION, code);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        code,
        amount: 20,
        maxUses: 0, // 0 = unlimited total uses (1 per user)
        usedCount: 0,
        usedByUsers: [],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Seeded default code J3AOPENING (20 credits)');
    }
  } catch (err) {
    console.error('Error seeding opening code:', err);
  }
}

