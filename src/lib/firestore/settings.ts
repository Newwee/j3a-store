import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { StoreSettings } from '@/types/settings';

const SETTINGS_COLLECTION = 'settings';
const STORE_DOC_ID = 'store';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'J3A STORE',
  promptpay: '0812345678',
  lineContact: '@j3astore',
  discordContact: 'https://discord.gg/j3astore',
  announcement: 'ยินดีต้อนรับสู่ J3A STORE ระบบเติมเกมและบริการดิจิทัลอัตโนมัติ 24 ชม.',
};

/**
 * Fetch current store settings from Firestore
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  if (!db) return DEFAULT_STORE_SETTINGS;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, STORE_DOC_ID);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return DEFAULT_STORE_SETTINGS;
    }

    const data = snap.data();
    let updatedAt = undefined;
    if (data.updatedAt instanceof Timestamp) {
      updatedAt = data.updatedAt.toDate().toISOString();
    } else if (typeof data.updatedAt === 'string') {
      updatedAt = data.updatedAt;
    }

    return {
      storeName: data.storeName || DEFAULT_STORE_SETTINGS.storeName,
      promptpay: data.promptpay || DEFAULT_STORE_SETTINGS.promptpay,
      lineContact: data.lineContact || DEFAULT_STORE_SETTINGS.lineContact,
      discordContact: data.discordContact || DEFAULT_STORE_SETTINGS.discordContact,
      announcement: data.announcement || DEFAULT_STORE_SETTINGS.announcement,
      updatedAt,
    };
  } catch (error) {
    console.error('Error fetching store settings:', error);
    return DEFAULT_STORE_SETTINGS;
  }
}

/**
 * Update store settings in Firestore (Admin only)
 */
export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const docRef = doc(db, SETTINGS_COLLECTION, STORE_DOC_ID);
  await setDoc(
    docRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
