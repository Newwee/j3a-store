import { supabase } from '@/lib/supabase/client';
import { Order } from '@/types/order';
import { Product } from '@/types/product';
import { getProducts } from './products';
import { getOrders } from './orders';
import { getStoreReviewStats } from './reviews';

export interface StoreStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  satisfactionRate: string;
  pendingTopupsCount: number;
  recentOrders: Order[];
  recentProducts: Product[];
}

/**
 * Fetch overview statistics for Admin Dashboard and Live Stats widgets
 */
export async function getStoreDashboardStats(isAdmin = false): Promise<StoreStats> {
  const fallbackStats: StoreStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 1,
    totalRevenue: 0,
    averageRating: 5.0,
    totalReviews: 0,
    satisfactionRate: '100%',
    pendingTopupsCount: 0,
    recentOrders: [],
    recentProducts: [],
  };

  try {
    let totalProducts = 0;
    let totalOrders = 0;
    let totalCustomers = 1;
    let totalRevenue = 0;
    let pendingTopupsCount = 0;
    let recentOrders: Order[] = [];
    let recentProducts: Product[] = [];

    // 1. Fetch live consolidated stats from store_stats (maintained by DB trigger)
    try {
      const { data: liveRow } = await supabase
        .from('store_stats')
        .select('*')
        .eq('id', 'live')
        .maybeSingle();

      if (liveRow) {
        totalCustomers = Number(liveRow.members) || 1;
        totalOrders = Number(liveRow.orders) || 0;
        totalProducts = Number(liveRow.products) || 0;
      }
    } catch (e) {
      console.warn('Could not read from store_stats table, falling back to direct queries:', e);
    }

    // 2. Products fallback/recent
    const products = await getProducts({ status: 'active', limitCount: 8, sortBy: 'newest' });
    recentProducts = products;
    if (totalProducts === 0) {
      totalProducts = products.length;
    }

    // 3. Members count fallback
    if (totalCustomers <= 1) {
      try {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        totalCustomers = count !== null && count !== undefined ? Math.max(1, count) : 1;
      } catch {
        totalCustomers = 1;
      }
    }

    // 4. Admin stats (orders list, revenue, pending topups)
    if (isAdmin) {
      try {
        const orders = await getOrders({ limitCount: 50 });
        recentOrders = orders;
        const validOrders = orders.filter((ord) => ord.status !== 'cancelled');
        if (totalOrders === 0) {
          totalOrders = validOrders.length;
        }
        totalRevenue = validOrders.reduce((sum, ord) => {
          if (ord.status === 'paid' || ord.status === 'completed' || ord.status === 'processing') {
            return sum + (ord.total || 0);
          }
          return sum;
        }, 0);
      } catch {}

      try {
        const { count } = await supabase
          .from('topups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        pendingTopupsCount = count || 0;
      } catch {}
    }

    // 4. Reviews
    const reviewStats = await getStoreReviewStats();

    return {
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      averageRating: reviewStats.averageRating,
      totalReviews: reviewStats.totalReviews,
      satisfactionRate: reviewStats.satisfactionRate,
      pendingTopupsCount,
      recentOrders,
      recentProducts,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return fallbackStats;
  }
}
