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
    recentOrders: [],
    recentProducts: [],
  };

  if (!db) return fallbackStats;

  try {
    const productsCol = collection(db, 'products');
    const ordersCol = collection(db, 'orders');
    const usersCol = collection(db, 'users');

    // Attempt fast aggregate counts
    let totalProducts = 0;
    let totalOrders = 0;
    let totalCustomers = 0;

    try {
      const [prodCountSnap, orderCountSnap, userCountSnap] = await Promise.all([
        getCountFromServer(productsCol),
        getCountFromServer(ordersCol),
        getCountFromServer(usersCol),
      ]);
      totalProducts = prodCountSnap.data().count;
      totalOrders = orderCountSnap.data().count;
      totalCustomers = userCountSnap.data().count;
    } catch {
      // Fallback if aggregate count rules or permissions differ
      const [prods, ords, usrs] = await Promise.all([
        getDocs(productsCol),
        getDocs(ordersCol),
        getDocs(usersCol),
      ]);
      totalProducts = prods.size;
      totalOrders = ords.size;
      totalCustomers = usrs.size;
    }

    // Fetch recent orders & compute revenue
    const recentOrders = await getOrders({ limitCount: 10 });
    const totalRevenue = recentOrders.reduce((sum, ord) => {
      if (ord.status === 'paid' || ord.status === 'completed' || ord.status === 'processing') {
        return sum + (ord.total || 0);
      }
      return sum;
    }, 0);

    // Fetch recent products
    const recentProducts = await getProducts({ limitCount: 8, sortBy: 'newest' });

    return {
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      recentOrders,
      recentProducts,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return fallbackStats;
  }
}
