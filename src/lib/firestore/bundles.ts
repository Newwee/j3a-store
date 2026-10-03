import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { BundlePackage, BundleFormData, BundleStatus } from '@/types/bundle';
import { Product } from '@/types/product';

const BUNDLES_COLLECTION = 'bundles';

function mapDocToBundle(docSnap: { id: string; data: () => Record<string, unknown> }): BundlePackage {
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

  const originalPrice = Number(data.originalPrice) || 0;
  const price = Number(data.price) || 0;
  const savings = Math.max(0, originalPrice - price);
  const discountPercent =
    originalPrice > 0 && price < originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return {
    id: docSnap.id,
    name: (data.name as string) || '',
    slug: (data.slug as string) || '',
    description: (data.description as string) || '',
    image: (data.image as string) || '/logo.png',
    images: Array.isArray(data.images) ? data.images : [],
    items: Array.isArray(data.items) ? (data.items as any) : [],
    originalPrice,
    price,
    savings,
    discountPercent,
    stock: Number(data.stock) || 0,
    status: (data.status as BundleStatus) || 'active',
    featured: Boolean(data.featured),
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt,
    updatedAt,
  };
}

export interface GetBundlesFilter {
  status?: BundleStatus | 'all';
  limitCount?: number;
}

/**
 * Fetch all bundle packages
 */
export async function getBundles(filter: GetBundlesFilter = {}): Promise<BundlePackage[]> {
  if (!db) {
    console.warn('Firestore is not initialized.');
    return [];
  }

  try {
    const colRef = collection(db, BUNDLES_COLLECTION);
    let q = query(colRef);

    if (filter.status && filter.status !== 'all') {
      q = query(q, where('status', '==', filter.status));
    }

    if (filter.limitCount && filter.limitCount > 0) {
      q = query(q, limit(filter.limitCount));
    }

    const snapshot = await getDocs(q);
    const bundles = snapshot.docs.map(mapDocToBundle);

    // Sort by createdAt desc
    bundles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return bundles;
  } catch (error) {
    console.error('Error fetching bundles from Firestore:', error);
    return [];
  }
}

/**
 * Fetch a single bundle by ID
 */
export async function getBundleById(id: string): Promise<BundlePackage | null> {
  if (!db || !id) return null;

  try {
    const docRef = doc(db, BUNDLES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return mapDocToBundle(snap);
  } catch (error) {
    console.error(`Error fetching bundle id=${id}:`, error);
    return null;
  }
}

/**
 * Fetch a single bundle by slug
 */
export async function getBundleBySlug(slug: string): Promise<BundlePackage | null> {
  if (!db || !slug) return null;

  try {
    const colRef = collection(db, BUNDLES_COLLECTION);
    const q = query(colRef, where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return mapDocToBundle(snap.docs[0]);
  } catch (error) {
    console.error(`Error fetching bundle slug=${slug}:`, error);
    return null;
  }
}

/**
 * Create a new bundle package (Admin)
 */
export async function createBundle(data: BundleFormData): Promise<BundlePackage> {
  if (!db) throw new Error('Firestore is not initialized.');

  if (!data.name.trim()) throw new Error('กรุณาระบุชื่อแพ็กเกจ Bundle');
  if (!data.items || data.items.length < 2) {
    throw new Error('แพ็กเกจ Bundle จะต้องประกอบด้วยสินค้าอย่างน้อย 2 รายการ');
  }
  if (data.price <= 0) throw new Error('ราคาบันเดิลต้องมากกว่า 0 บาท');

  const slug =
    data.slug?.trim() ||
    data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    `bundle-${Date.now()}`;

  const originalPrice = data.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const price = Math.round(Number(data.price));
  const savings = Math.max(0, originalPrice - price);
  const discountPercent =
    originalPrice > 0 && price < originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const docPayload = {
    name: data.name.trim(),
    slug,
    description: data.description?.trim() || '',
    image: data.image?.trim() || data.items[0]?.image || '/logo.png',
    images: data.images || [data.image || data.items[0]?.image || '/logo.png'],
    items: data.items,
    originalPrice,
    price,
    savings,
    discountPercent,
    stock: Number(data.stock) || 0,
    status: data.status || 'active',
    featured: Boolean(data.featured),
    tags: data.tags || ['bundle', 'promotion'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, BUNDLES_COLLECTION);
  const docRef = await addDoc(colRef, docPayload);

  return {
    id: docRef.id,
    ...docPayload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update an existing bundle package (Admin)
 */
export async function updateBundle(id: string, data: Partial<BundleFormData>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const docRef = doc(db, BUNDLES_COLLECTION, id);
  const payload: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (data.items && data.items.length >= 2) {
    const originalPrice = data.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    payload.originalPrice = originalPrice;
    if (data.price !== undefined) {
      const price = Math.round(Number(data.price));
      payload.price = price;
      payload.savings = Math.max(0, originalPrice - price);
      payload.discountPercent =
        originalPrice > 0 && price < originalPrice
          ? Math.round(((originalPrice - price) / originalPrice) * 100)
          : 0;
    }
  }

  await updateDoc(docRef, payload);
}

/**
 * Delete a bundle package (Admin)
 */
export async function deleteBundle(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, BUNDLES_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Helper to convert BundlePackage into standard Product format
 * so it can be added directly to the Cart and handled by Checkout seamlessly.
 */
export function bundleToProduct(bundle: BundlePackage): Product {
  const itemNames = bundle.items.map((i) => `• ${i.name} (฿${i.price.toLocaleString()})`).join('\n');
  return {
    id: `bundle_${bundle.id}`,
    name: `[Bundle] ${bundle.name}`,
    slug: bundle.slug || `bundle-${bundle.id}`,
    description: `${bundle.description || 'แพ็กเกจรวมสินค้าราคาพิเศษ'}\n\nสินค้าที่ได้รับในแพ็กเกจ:\n${itemNames}`,
    price: bundle.price,
    comparePrice: bundle.originalPrice,
    image: bundle.image,
    images: bundle.images && bundle.images.length > 0 ? bundle.images : [bundle.image],
    category: 'แพ็กเกจบันเดิล (Bundle)',
    stock: bundle.stock,
    status: bundle.status === 'active' ? 'active' : 'draft',
    featured: Boolean(bundle.featured),
    tags: ['bundle', 'package', 'discount', ...(bundle.tags || [])],
    specs: {
      'ประเภท': 'แพ็กเกจรวมสินค้าสุดคุ้ม (Bundle Package)',
      'จำนวนสินค้าในชุด': `${bundle.items.length} ชิ้น`,
      'ประหยัดได้': `฿${bundle.savings.toLocaleString()} (${bundle.discountPercent}% OFF)`,
    },
    rating: 5.0,
    reviewCount: 0,
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt,
  };
}

/**
 * Real-time subscription to active bundles list
 */
export function subscribeBundles(
  callback: (bundles: BundlePackage[]) => void,
  options?: { status?: BundleStatus }
): () => void {
  if (!db) return () => {};

  const colRef = collection(db, BUNDLES_COLLECTION);
  const constraints: any[] = [];
  if (options?.status) {
    constraints.push(where('status', '==', options.status));
  }

  const q = query(colRef, ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const bundles = snapshot.docs.map(mapDocToBundle);
      callback(bundles);
    },
    (err) => {
      console.warn('subscribeBundles error:', err);
    }
  );
}
