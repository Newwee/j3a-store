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
 */
export async function getStoreDashboardStats(): Promise<StoreStats> {
  const fallbackStats: StoreStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    averageRating: 5.0,
    totalReviews: 0,
    satisfactionRate: '100%',
    pendingTopupsCount: 0,
    recentOrders: [],
    recentProducts: [],
  };

  if (!db) return fallbackStats;

  try {
    const productsCol = collection(db, 'products');
    const ordersCol = collection(db, 'orders');
    const usersCol = collection(db, 'users');

    // Attempt individual counts so one failure does not affect the others
    let totalProducts = 0;
    let totalOrders = 0;
    let totalCustomers = 0;

    // 1. Registered Customers count (all users signed up)
    try {
      const userCountSnap = await getCountFromServer(usersCol);
      totalCustomers = userCountSnap.data().count;
    } catch {
      try {
        const usrs = await getDocs(usersCol);
        totalCustomers = usrs.size;
      } catch (uErr) {
        console.warn('Could not count users:', uErr);
        totalCustomers = 1;
      }
    }

    // 2. Products count
    try {
      const prodCountSnap = await getCountFromServer(productsCol);
      totalProducts = prodCountSnap.data().count;
    } catch {
      try {
        const prods = await getDocs(productsCol);
        totalProducts = prods.size;
      } catch {}
    }

    // 3. Orders count
    try {
      const orderCountSnap = await getCountFromServer(ordersCol);
      totalOrders = orderCountSnap.data().count;
    } catch {
      try {
        const ords = await getDocs(ordersCol);
        totalOrders = ords.size;
      } catch {}
    }

    // Fetch recent orders & compute revenue from real orders
    const recentOrders = await getOrders({ limitCount: 50 });
    const totalRevenue = recentOrders.reduce((sum, ord) => {
      if (ord.status === 'paid' || ord.status === 'completed' || ord.status === 'processing') {
        return sum + (ord.total || 0);
      }
      return sum;
    }, 0);

    // Fetch pending topups count
    let pendingTopupsCount = 0;
    try {
      const topupsCol = collection(db, 'topups');
      const q = query(topupsCol);
      const topupSnap = await getDocs(q);
      pendingTopupsCount = topupSnap.docs.filter((d) => d.data().status === 'pending').length;
    } catch (err) {
      console.warn('Could not load pending topups:', err);
    }

    // Fetch recent products
    const recentProducts = await getProducts({ limitCount: 8, sortBy: 'newest' });

    // Fetch review statistics
    let averageRating = 5.0;
    let totalReviews = 0;
    let satisfactionRate = '100%';

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
    } catch (err) {
      console.warn('Could not load reviews for stats:', err);
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
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      ...fallbackStats,
      averageRating: 5.0,
      totalReviews: 0,
      satisfactionRate: '100%',
    };
  }
}
