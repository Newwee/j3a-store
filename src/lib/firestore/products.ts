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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Product, ProductFormData, ProductStatus } from '@/types/product';
import { deleteProductImage } from '@/lib/storage/upload';

const PRODUCTS_COLLECTION = 'products';

// Helper to convert Firestore doc to Product
function mapDocToProduct(docSnap: { id: string; data: () => Record<string, unknown> }): Product {
  const data = docSnap.data();
  
  // Format createdAt and updatedAt to ISO strings
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
    name: (data.name as string) || '',
    slug: (data.slug as string) || '',
    description: (data.description as string) || '',
    price: Number(data.price) || 0,
    comparePrice: data.comparePrice !== undefined ? Number(data.comparePrice) : undefined,
    image: (data.image as string) || '/logo.png',
    images: Array.isArray(data.images) ? data.images : [],
    category: (data.category as string) || 'ทั่วไป',
    stock: Number(data.stock) || 0,
    status: (data.status as ProductStatus) || 'active',
    featured: Boolean(data.featured),
    tags: Array.isArray(data.tags) ? data.tags : [],
    specs: (data.specs as Record<string, string>) || {},
    rating: data.rating !== undefined ? Number(data.rating) : 5.0,
    reviewCount: data.reviewCount !== undefined ? Number(data.reviewCount) : 0,
    createdAt,
    updatedAt,
  };
}

export interface GetProductsFilter {
  status?: ProductStatus | 'all';
  category?: string;
  featured?: boolean;
  search?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
  limitCount?: number;
}

/**
 * Fetch products list with optional filtering and sorting
 */
export async function getProducts(filter: GetProductsFilter = {}): Promise<Product[]> {
  if (!db) {
    console.warn('Firestore is not initialized.');
    return [];
  }

  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    let q = query(colRef);

    // Apply status filter
    if (filter.status && filter.status !== 'all') {
      q = query(q, where('status', '==', filter.status));
    }

    // Apply category filter
    if (filter.category && filter.category !== 'all' && filter.category !== 'ทั้งหมด') {
      q = query(q, where('category', '==', filter.category));
    }

    // Apply featured filter
    if (filter.featured !== undefined) {
      q = query(q, where('featured', '==', filter.featured));
    }

    // Apply limit if specified
    if (filter.limitCount && filter.limitCount > 0) {
      q = query(q, limit(filter.limitCount));
    }

    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(mapDocToProduct);

    // Client-side text search (Firestore does not support full-text search natively)
    if (filter.search && filter.search.trim().length > 0) {
      const term = filter.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(term)))
      );
    }

    // Sorting
    const sort = filter.sortBy || 'newest';
    products.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === 'price-asc') {
        return a.price - b.price;
      }
      if (sort === 'price-desc') {
        return b.price - a.price;
      }
      if (sort === 'name-asc') {
        return a.name.localeCompare(b.name, 'th');
      }
      return 0;
    });

    return products;
  } catch (error) {
    console.error('Error fetching products from Firestore:', error);
    return [];
  }
}

/**
 * Get single product by Slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!db || !slug) return null;

  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    // First query with active status for public access
    let q = query(colRef, where('slug', '==', slug), where('status', '==', 'active'), limit(1));
    let snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Try query without status filter (for admin preview or draft)
      try {
        const qAll = query(colRef, where('slug', '==', slug), limit(1));
        const allSnap = await getDocs(qAll);
        if (!allSnap.empty) {
          return mapDocToProduct(allSnap.docs[0]);
        }
      } catch {
        // Ignored if permissions restrict non-active
      }

      // Also try fallback by ID if slug not found
      return await getProductById(slug);
    }

    return mapDocToProduct(snapshot.docs[0]);
  } catch (error) {
    console.error('Error getting product by slug:', error);
    return null;
  }
}

/**
 * Get single product by Firestore Document ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (!db || !id) return null;

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return mapDocToProduct(docSnap);
  } catch (error) {
    console.error('Error getting product by ID:', error);
    return null;
  }
}

function removeUndefinedDeep<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((it) => removeUndefinedDeep(it)) as unknown as T;
  if (typeof obj === 'object') {
    if (obj instanceof Date || (obj as any)._methodName || (obj as any).toMillis) return obj;
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) clean[key] = removeUndefinedDeep(val);
    }
    return clean as T;
  }
  return obj;
}

/**
 * Create a new product in Firestore
 */
export async function createProduct(formData: ProductFormData): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const cleanData = removeUndefinedDeep(formData);
  const newDoc = {
    ...cleanData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), newDoc);
  return docRef.id;
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, formData: Partial<ProductFormData>): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const cleanData = removeUndefinedDeep(formData);
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...cleanData,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a product and its associated Firebase Storage image
 */
export async function deleteProduct(id: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  // First fetch the product to clean up images
  const product = await getProductById(id);
  if (product) {
    if (product.image && product.image.includes('firebasestorage')) {
      await deleteProductImage(product.image);
    }
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.includes('firebasestorage')) {
          await deleteProductImage(img);
        }
      }
    }
  }

  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Quick toggle status (active, draft, out_of_stock)
 */
export async function toggleProductStatus(id: string, newStatus: ProductStatus): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Quick toggle featured status
 */
export async function toggleProductFeatured(id: string, featured: boolean): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    featured,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get distinct categories from products
 */
export async function getDistinctCategories(): Promise<string[]> {
  const products = await getProducts({ status: 'active' });
  const set = new Set<string>();
  products.forEach((p) => {
    if (p.category && p.category.trim()) {
      set.add(p.category.trim());
    }
  });
  return Array.from(set);
}
