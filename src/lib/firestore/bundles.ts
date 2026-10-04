import { supabase } from '@/lib/supabase/client';
import { BundlePackage, BundleFormData, BundleStatus } from '@/types/bundle';
import { Product } from '@/types/product';

function mapRowToBundle(row: any): BundlePackage {
  const rawItems = Array.isArray(row.items)
    ? row.items
    : typeof row.items === 'string'
    ? JSON.parse(row.items || '[]')
    : [];

  const items = rawItems.map((item: any) => {
    if (typeof item === 'string') {
      if (item === 'prod_discord_profile') {
        return { productId: item, name: 'J3A Discord Profile', price: 30, image: '/products/j3a-discord-profile.jpg' };
      }
      if (item === 'prod_discord_manager') {
        return { productId: item, name: 'J3A Discord Manager', price: 50, image: '/products/j3a-discord-manager.jpg' };
      }
      return { productId: item, name: item, price: 0, image: '/logo.png' };
    }
    return {
      productId: item.productId || item.id || '',
      name: item.name || '',
      price: Number(item.price) || 0,
      image: item.image || '/logo.png',
      category: item.category,
      stock: item.stock,
    };
  });

  const images = Array.isArray(row.images)
    ? row.images
    : typeof row.images === 'string'
    ? JSON.parse(row.images || '[]')
    : [row.image || '/logo.png'];

  const tags = Array.isArray(row.tags)
    ? row.tags
    : typeof row.tags === 'string'
    ? JSON.parse(row.tags || '[]')
    : ['bundle', 'promotion'];

  const originalPrice = Number(row.compare_price || row.original_price) || items.reduce((sum: number, it: any) => sum + (Number(it.price) || 0), 0);
  const price = Number(row.price) || 0;
  const savings = Math.max(0, originalPrice - price);
  const discountPercent =
    originalPrice > 0 && price < originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return {
    id: row.id,
    name: row.name || '',
    slug: row.slug || '',
    description: row.description || '',
    image: row.image || '/logo.png',
    images,
    items,
    originalPrice,
    price,
    savings,
    discountPercent,
    stock: Number(row.stock) || 999,
    status: (row.status as BundleStatus) || 'active',
    featured: Boolean(row.featured),
    tags,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
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
  try {
    let query = supabase.from('bundles').select('*');

    if (filter.status && filter.status !== 'all') {
      query = query.eq('status', filter.status);
    }

    if (filter.limitCount && filter.limitCount > 0) {
      query = query.limit(filter.limitCount);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching bundles from Supabase:', error.message);
      return [];
    }

    const bundles = (data || []).map(mapRowToBundle);
    bundles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return bundles;
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return [];
  }
}

/**
 * Fetch a single bundle by ID
 */
export async function getBundleById(id: string): Promise<BundlePackage | null> {
  if (!id) return null;

  try {
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToBundle(data);
  } catch (error) {
    console.error(`Error fetching bundle id=${id}:`, error);
    return null;
  }
}

/**
 * Fetch a single bundle by slug
 */
export async function getBundleBySlug(slug: string): Promise<BundlePackage | null> {
  if (!slug) return null;

  try {
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();

    if (data) return mapRowToBundle(data);

    // Normalized fallback: look up by ID or substring
    const allBundles = await getBundles();
    const normSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = allBundles.find((b) => {
      if (!b) return false;
      if (b.id === slug || b.id.replace(/^bundle_/, '') === slug.replace(/^bundle_/, '')) return true;
      const bNorm = (b.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const bNameNorm = (b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return bNorm === normSlug || bNameNorm.includes(normSlug) || normSlug.includes(bNorm);
    });

    return found || null;
  } catch (error) {
    console.error(`Error fetching bundle slug=${slug}:`, error);
    return null;
  }
}

/**
 * Create a new bundle package (Admin)
 */
export async function createBundle(data: BundleFormData): Promise<BundlePackage> {
  if (!data.name.trim()) throw new Error('กรุณาระบุชื่อแพ็กเกจ Bundle');
  if (!data.items || data.items.length < 2) {
    throw new Error('แพ็กเกจ Bundle จะต้องประกอบด้วยสินค้าอย่างน้อย 2 รายการ');
  }
  if (data.price <= 0) throw new Error('ราคาบันเดิลต้องมากกว่า 0 บาท');

  const id = `bundle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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

  const row = {
    id,
    name: data.name.trim(),
    slug,
    description: data.description?.trim() || '',
    image: data.image?.trim() || data.items[0]?.image || '/logo.png',
    items: data.items,
    compare_price: originalPrice,
    price,
    featured: Boolean(data.featured),
    status: data.status || 'active',
    rating: 5.0,
    review_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('bundles').insert([row]);
  if (error) {
    throw new Error(`Failed to create bundle in Supabase: ${error.message}`);
  }

  return mapRowToBundle(row);
}

/**
 * Update an existing bundle package (Admin)
 */
export async function updateBundle(id: string, data: Partial<BundleFormData>): Promise<void> {
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.slug !== undefined) updates.slug = data.slug.trim();
  if (data.description !== undefined) updates.description = data.description;
  if (data.image !== undefined) updates.image = data.image;
  if (data.items !== undefined) {
    updates.items = data.items;
    const originalPrice = data.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    updates.compare_price = originalPrice;
  }
  if (data.price !== undefined) updates.price = Math.round(Number(data.price));
  if (data.featured !== undefined) updates.featured = Boolean(data.featured);
  if (data.status !== undefined) updates.status = data.status;

  const { error } = await supabase.from('bundles').update(updates).eq('id', id);
  if (error) {
    throw new Error(`Failed to update bundle in Supabase: ${error.message}`);
  }
}

/**
 * Delete a bundle package (Admin)
 */
export async function deleteBundle(id: string): Promise<void> {
  const { error } = await supabase.from('bundles').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete bundle in Supabase: ${error.message}`);
  }
}

/**
 * Helper to convert BundlePackage into standard Product format
 */
export function bundleToProduct(bundle: BundlePackage): Product {
  const itemNames = (bundle.items || [])
    .map((i) => `• ${i?.name || 'สินค้า'} (฿${(i?.price ?? 0).toLocaleString()})`)
    .join('\n');
  return {
    id: bundle.id.startsWith('bundle_') ? bundle.id : `bundle_${bundle.id}`,
    name: bundle.name.startsWith('[Bundle]') ? bundle.name : `[Bundle] ${bundle.name}`,
    slug: bundle.slug || `bundle-${bundle.id}`,
    description: `${bundle.description || 'แพ็กเกจรวมสินค้าราคาพิเศษ'}\n\nสินค้าที่ได้รับในแพ็กเกจ:\n${itemNames}`,
    price: bundle.price ?? 0,
    comparePrice: bundle.originalPrice,
    image: bundle.image || '/logo.png',
    images: bundle.images && bundle.images.length > 0 ? bundle.images : [bundle.image || '/logo.png'],
    category: 'แพ็กเกจบันเดิล (Bundle)',
    stock: bundle.stock ?? 999,
    status: bundle.status === 'active' ? 'active' : 'draft',
    featured: Boolean(bundle.featured),
    tags: ['bundle', 'package', 'discount', ...(bundle.tags || [])],
    specs: {
      'ประเภท': 'แพ็กเกจรวมสินค้าสุดคุ้ม (Bundle Package)',
      'จำนวนสินค้าในชุด': `${bundle.items?.length || 0} ชิ้น`,
      'ประหยัดได้': `฿${(bundle.savings ?? 0).toLocaleString()} (${bundle.discountPercent || 0}% OFF)`,
    },
    rating: (bundle as any).rating || 5.0,
    reviewCount: (bundle as any).reviewCount || 0,
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
  getBundles(options).then(callback).catch(console.error);

  const channelName = `bundles_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bundles' },
      () => {
        getBundles(options).then(callback).catch(console.error);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
