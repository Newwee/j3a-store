import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Order, CreateOrderInput, OrderStatus } from '@/types/order';
import { generateOrderNumber } from '@/lib/utils/formatters';

const ORDERS_COLLECTION = 'orders';

function mapDocToOrder(docSnap: { id: string; data: () => Record<string, unknown> }): Order {
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
    orderNumber: (data.orderNumber as string) || docSnap.id.slice(0, 8).toUpperCase(),
    userId: (data.userId as string) || 'guest',
    customer: (data.customer as Order['customer']) || {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    items: Array.isArray(data.items) ? (data.items as Order['items']) : [],
    subtotal: Number(data.subtotal) || 0,
    shipping: Number(data.shipping) || 0,
    discount: Number(data.discount) || 0,
    total: Number(data.total) || 0,
    paymentMethod: (data.paymentMethod as Order['paymentMethod']) || 'promptpay',
    status: (data.status as OrderStatus) || 'pending',
    paymentProofUrl: (data.paymentProofUrl as string) || undefined,
    transactionRef: (data.transactionRef as string) || undefined,
    createdAt,
    updatedAt,
  };
}

export interface GetOrdersFilter {
  userId?: string;
  status?: OrderStatus | 'all';
  limitCount?: number;
}

function removeUndefinedDeep<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedDeep(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    // Preserve Date and Firestore FieldValues/Timestamps
    if (
      obj instanceof Date ||
      (obj as any)._methodName ||
      (obj as any).toMillis
    ) {
      return obj;
    }
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = removeUndefinedDeep(val);
      }
    }
    return clean as T;
  }
  return obj;
}

/**
 * Create a new order in Firestore
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const orderNumber = generateOrderNumber();

  // Recursively strip any undefined fields (including customer.notes, paymentProofUrl, etc.)
  const sanitizedInput = removeUndefinedDeep(input);

  const newDoc = {
    ...sanitizedInput,
    orderNumber,
    status: 'pending' as OrderStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), newDoc);

  return {
    id: docRef.id,
    orderNumber,
    ...input,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get single order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  if (!db || !id) return null;

  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    return mapDocToOrder(snap);
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return null;
  }
}

/**
 * Fetch orders list with optional filters
 */
export async function getOrders(filter: GetOrdersFilter = {}): Promise<Order[]> {
  if (!db) {
    console.warn('Firestore is not initialized.');
    return [];
  }

  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    let q = query(colRef);

    if (filter.userId) {
      q = query(q, where('userId', '==', filter.userId));
    }

    if (filter.status && filter.status !== 'all') {
      q = query(q, where('status', '==', filter.status));
    }

    if (filter.limitCount && filter.limitCount > 0) {
      q = query(q, limit(filter.limitCount));
    }

    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(mapDocToOrder);

    // Sort newest first
    return orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Update order status (pending, paid, processing, completed, cancelled)
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update payment proof slip URL
 */
export async function updatePaymentProof(orderId: string, paymentProofUrl: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    paymentProofUrl,
    status: 'paid',
    updatedAt: serverTimestamp(),
  });
}
