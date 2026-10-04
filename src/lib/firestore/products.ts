import { supabase } from '@/lib/supabase/client';
import { Product, ProductFormData, ProductStatus } from '@/types/product';
import { deleteProductImage } from '@/lib/storage/upload';

// Helper to convert Supabase row to Product
function mapRowToProduct(row: any): Product {
  const images = Array.isArray(row.images)
    ? row.images
    : typeof row.images === 'string'
    ? JSON.parse(row.images || '[]')
    : [];

  const tags = Array.isArray(row.tags)
    ? row.tags
    : typeof row.tags === 'string'
    ? JSON.parse(row.tags || '[]')
    : [];

  const specs = typeof row.specs === 'object' && row.specs !== null
    ? row.specs
    : typeof row.specs === 'string'
    ? JSON.parse(row.specs || '{}')
    : {};

  const rawRating = Number(row.rating) || 5.0;
  const rating = rawRating > 5 ? Number((rawRating / 2).toFixed(1)) : rawRating;

  return {
    id: row.id,
    name: row.name || '',
    slug: row.slug || '',
    description: row.description || '',
    price: Number(row.price) || 0,
    comparePrice: row.compare_price !== null && row.compare_price !== undefined ? Number(row.compare_price) : undefined,
    image: row.image || '/logo.png',
    images,
    category: row.category || 'ซอฟต์แวร์ Discord',
    stock: Number(row.stock) || 0,
    status: (row.status as ProductStatus) || 'active',
    featured: Boolean(row.featured),
    tags,
    specs,
    rating,
    reviewCount: Number(row.review_count) || 0,
    showcaseUrl: row.showcase_url || undefined,
    downloadUrl: row.download_url || undefined,
    deliveryNote: row.delivery_note || undefined,
    deliveryType: row.delivery_type || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
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
  try {
    let query = supabase.from('products').select('*');

    if (filter.status && filter.status !== 'all') {
      query = query.eq('status', filter.status);
    }

    if (filter.category && filter.category !== 'all' && filter.category !== 'ทั้งหมด') {
      query = query.eq('category', filter.category);
    }

    if (filter.featured !== undefined) {
      query = query.eq('featured', filter.featured);
    }

    if (filter.limitCount && filter.limitCount > 0) {
      query = query.limit(filter.limitCount);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products from Supabase:', error.message);
      return [];
    }

    let products = (data || []).map(mapRowToProduct);

    // Client-side text search
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
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get single product by Slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!slug) return null;

  try {
    // 1. Try match by slug (active first)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();

    if (data) {
      return mapRowToProduct(data);
    }

    // 2. Try match by ID fallback
    return await getProductById(slug);
  } catch (error) {
    console.error('Error getting product by slug:', error);
    return null;
  }
}

/**
 * Get single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (!id) return null;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToProduct(data);
  } catch (error) {
    console.error('Error getting product by ID:', error);
    return null;
  }
}

/**
 * Create a new product in Supabase
 */
export async function createProduct(formData: ProductFormData): Promise<string> {
  const newId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slug =
    formData.slug?.trim() ||
    formData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    newId;

  const row = {
    id: newId,
    name: formData.name.trim(),
    slug,
    description: formData.description || '',
    price: Number(formData.price) || 0,
    compare_price: formData.comparePrice !== undefined ? Number(formData.comparePrice) : null,
    image: formData.image || '/logo.png',
    images: formData.images || [formData.image || '/logo.png'],
    category: formData.category || 'ซอฟต์แวร์ Discord',
    stock: Number(formData.stock) || 0,
    status: formData.status || 'active',
    featured: Boolean(formData.featured),
    tags: formData.tags || [],
    specs: formData.specs || {},
    showcase_url: formData.showcaseUrl || null,
    download_url: formData.downloadUrl || null,
    delivery_note: formData.deliveryNote || null,
    delivery_type: formData.deliveryType || 'both',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('products').insert([row]);
  if (error) {
    throw new Error(`Failed to create product in Supabase: ${error.message}`);
  }

  return newId;
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, formData: Partial<ProductFormData>): Promise<void> {
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (formData.name !== undefined) updates.name = formData.name.trim();
  if (formData.slug !== undefined) updates.slug = formData.slug.trim();
  if (formData.description !== undefined) updates.description = formData.description;
  if (formData.price !== undefined) updates.price = Number(formData.price);
  if (formData.comparePrice !== undefined) updates.compare_price = formData.comparePrice;
  if (formData.image !== undefined) updates.image = formData.image;
  if (formData.images !== undefined) updates.images = formData.images;
  if (formData.category !== undefined) updates.category = formData.category;
  if (formData.stock !== undefined) updates.stock = Number(formData.stock);
  if (formData.status !== undefined) updates.status = formData.status;
  if (formData.featured !== undefined) updates.featured = Boolean(formData.featured);
  if (formData.tags !== undefined) updates.tags = formData.tags;
  if (formData.specs !== undefined) updates.specs = formData.specs;
  if (formData.showcaseUrl !== undefined) updates.showcase_url = formData.showcaseUrl;
  if (formData.downloadUrl !== undefined) updates.download_url = formData.downloadUrl;
  if (formData.deliveryNote !== undefined) updates.delivery_note = formData.deliveryNote;
  if (formData.deliveryType !== undefined) updates.delivery_type = formData.deliveryType;

  const { error } = await supabase.from('products').update(updates).eq('id', id);
  if (error) {
    throw new Error(`Failed to update product in Supabase: ${error.message}`);
  }
}

/**
 * Delete a product and its associated storage image
 */
export async function deleteProduct(id: string): Promise<void> {
  const product = await getProductById(id);
  if (product) {
    if (product.image) await deleteProductImage(product.image);
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        await deleteProductImage(img);
      }
    }
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete product in Supabase: ${error.message}`);
  }
}

/**
 * Quick toggle status
 */
export async function toggleProductStatus(id: string, newStatus: ProductStatus): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Quick toggle featured status
 */
export async function toggleProductFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ featured, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
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

/**
 * Real-time subscription to products list
 */
export function subscribeProducts(
  callback: (products: Product[]) => void,
  options?: { status?: ProductStatus; category?: string }
): () => void {
  // Initial fetch
  getProducts(options).then(callback);

  const channel = supabase
    .channel('products_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      () => {
        getProducts(options).then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
