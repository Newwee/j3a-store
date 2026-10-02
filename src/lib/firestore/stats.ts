import { collection, getCountFromServer, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Order } from '@/types/order';
import { Product } from '@/types/product';
import { getProducts } from './products';
import { getOrders } from './orders';

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
 * Designed to gracefully fall back without throwing permission errors to ordinary users
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

  if (!db) return fallbackStats;

  let totalProducts = 0;
  let totalOrders = 0;
  let totalCustomers = 1;
  let totalRevenue = 0;
  let pendingTopupsCount = 0;
  let recentOrders: Order[] = [];
  let recentProducts: Product[] = [];
  let averageRating = 5.0;
  let totalReviews = 0;
  let satisfactionRate = '100%';

  // 1. Products: Fetch publicly active products count & list
  try {
    const products = await getProducts({ status: 'active', limitCount: 8, sortBy: 'newest' });
    recentProducts = products;
    totalProducts = products.length;
  } catch {
    // Non-blocking
  }

  // 2. Members count: Try reading total registered members
  try {
    const usersCol = collection(db, 'users');
    const userCountSnap = await getCountFromServer(usersCol);
    totalCustomers = userCountSnap.data().count;
  } catch {
    try {
      const usersCol = collection(db, 'users');
      const usrs = await getDocs(usersCol);
      if (usrs.size > 0) totalCustomers = usrs.size;
    } catch {
      // Default fallback
      totalCustomers = 1;
    }
  }

  // 3. Admin-only stats: only fetch when isAdmin is true
  if (isAdmin) {
    try {
      const orders = await getOrders({ limitCount: 50 });
      recentOrders = orders;
      totalOrders = orders.length;
      totalRevenue = orders.reduce((sum, ord) => {
        if (ord.status === 'paid' || ord.status === 'completed' || ord.status === 'processing') {
          return sum + (ord.total || 0);
        }
        return sum;
      }, 0);
    } catch {
      // Non-blocking
    }

    try {
      const topupsCol = collection(db, 'topups');
      const topupSnap = await getDocs(query(topupsCol));
      pendingTopupsCount = topupSnap.docs.filter((d) => d.data().status === 'pending').length;
    } catch {
      // Non-blocking
    }
  }

  // 4. Reviews: Try reading public reviews
  try {
    const reviewsCol = collection(db, 'reviews');
    const revSnap = await getDocs(reviewsCol);
    if (!revSnap.empty) {
      totalReviews = revSnap.size;
      let sum = 0;
      let high = 0;
      revSnap.forEach((d) => {
        const r = Number(d.data().rating) || 5;
        sum += r;
        if (r >= 4) high++;
      });
      averageRating = Number((sum / totalReviews).toFixed(1));
      satisfactionRate = Math.round((high / totalReviews) * 100) + '%';
    }
  } catch {
    // Non-blocking
  }

  return {
    totalProducts,
    totalOrders,
    totalCustomers,
    totalRevenue,
    averageRating,
    totalReviews,
    satisfactionRate,
    pendingTopupsCount,
    recentOrders,
    recentProducts,
  };
}
