import { supabase } from '@/lib/supabase/client';
import { Order, CreateOrderInput, OrderStatus } from '@/types/order';
import { generateOrderNumber } from '@/lib/utils/formatters';

function mapRowToOrder(row: any): Order {
  const items = Array.isArray(row.items)
    ? row.items
    : typeof row.items === 'string'
    ? JSON.parse(row.items || '[]')
    : [];

  const customer = typeof row.customer === 'object' && row.customer !== null
    ? row.customer
    : typeof row.customer === 'string'
    ? JSON.parse(row.customer || '{}')
    : {
        name: row.customer_name || '',
        email: row.customer_email || '',
        phone: '',
        address: '',
      };

  return {
    id: row.id,
    orderNumber: row.order_number || (row.id ? row.id.slice(0, 8).toUpperCase() : ''),
    userId: row.user_id || 'guest',
    customer: {
      name: customer.name || row.customer_name || '',
      email: customer.email || row.customer_email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || row.delivery_note || undefined,
    },
    items,
    subtotal: Number(row.subtotal) || Number(row.total) || 0,
    shipping: Number(row.shipping) || 0,
    discount: Number(row.discount) || 0,
    total: Number(row.total) || 0,
    paymentMethod: (row.payment_method as Order['paymentMethod']) || 'promptpay',
    status: (row.status as OrderStatus) || 'pending',
    paymentProofUrl: row.payment_proof_url || undefined,
    transactionRef: row.transaction_ref || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export interface GetOrdersFilter {
  userId?: string;
  status?: OrderStatus | 'all';
  limitCount?: number;
}

/**
 * Create a new order in Supabase
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const orderNumber = generateOrderNumber();
  const id = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const initialStatus: OrderStatus = input.status || 'pending';

  // Ensure valid UUID or null for Postgres user_id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.userId || '');
  const userId = isUuid ? input.userId : null;

  const row = {
    id,
    order_number: orderNumber,
    user_id: userId,
    customer_name: input.customer.name,
    customer_email: input.customer.email,
    customer: input.customer,
    items: input.items,
    subtotal: Number(input.subtotal) || Number(input.total),
    shipping: Number(input.shipping) || 0,
    discount: Number(input.discount) || 0,
    total: Number(input.total) || 0,
    payment_method: input.paymentMethod,
    status: initialStatus,
    payment_proof_url: input.paymentProofUrl || null,
    delivery_note: input.customer.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('orders').insert([row]);
  if (error) {
    throw new Error(`Failed to create order in Supabase: ${error.message}`);
  }

  return mapRowToOrder(row);
}

/**
 * Enrich orders with live catalog download URLs
 */
async function enrichOrdersWithLiveCatalog(orders: Order[]): Promise<Order[]> {
  if (!orders || orders.length === 0) return orders;

  try {
    const { data: prods } = await supabase
      .from('products')
      .select('id, slug, name, download_url, delivery_note');

    if (!prods || prods.length === 0) return orders;

    const map: Record<string, { download_url?: string; delivery_note?: string }> = {};
    for (const p of prods) {
      if (p.id) map[p.id.toLowerCase()] = p;
      if (p.slug) map[p.slug.toLowerCase()] = p;
      if (p.name) map[p.name.toLowerCase()] = p;
    }

    return orders.map((order) => {
      if (!Array.isArray(order.items)) return order;

      const updatedItems = order.items.map((it: any) => {
        const pid = (it.productId || it.id || '').toLowerCase();
        const pslug = (it.slug || '').toLowerCase();
        const pname = (it.name || '').toLowerCase();
        const live = map[pid] || map[pslug] || map[pname];

        let downloadUrl = live?.download_url || it.downloadUrl;
        let deliveryNote = live?.delivery_note || it.deliveryNote;

        if (downloadUrl && downloadUrl.includes('1ozs5fS2Y_cUcKGkuugp-5yuta5VGs385')) {
          downloadUrl = 'https://drive.google.com/file/d/1LN_z1lwA-QZOBgYoWpfWQJRii0CPO4ZT/view?usp=sharing';
        }

        return {
          ...it,
          downloadUrl,
          deliveryNote,
        };
      });

      return {
        ...order,
        items: updatedItems,
      };
    });
  } catch (err) {
    console.warn('Could not enrich orders with live product catalog:', err);
    return orders;
  }
}

/**
 * Get single order by ID (Always resolves latest download link from catalog)
 */
export async function getOrderById(id: string): Promise<Order | null> {
  if (!id) return null;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    const order = mapRowToOrder(data);
    const enriched = await enrichOrdersWithLiveCatalog([order]);
    return enriched[0] || order;
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return null;
  }
}

/**
 * Fetch orders list with optional filters (Always resolves latest download links)
 */
export async function getOrders(filter: GetOrdersFilter = {}): Promise<Order[]> {
  try {
    let query = supabase.from('orders').select('*');

    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }

    if (filter.status && filter.status !== 'all') {
      query = query.eq('status', filter.status);
    }

    if (filter.limitCount && filter.limitCount > 0) {
      query = query.limit(filter.limitCount);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching orders from Supabase:', error.message);
      return [];
    }

    const orders = (data || []).map(mapRowToOrder);
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return await enrichOrdersWithLiveCatalog(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
}

/**
 * Update payment proof slip URL
 */
export async function updatePaymentProof(orderId: string, paymentProofUrl: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      payment_proof_url: paymentProofUrl,
      status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
}
