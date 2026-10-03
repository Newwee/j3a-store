export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';

export type PaymentMethod = 'promptpay' | 'bank_transfer' | 'credit_card' | 'wallet';

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  downloadUrl?: string;
  deliveryNote?: string;
  deliveryType?: 'link' | 'key' | 'both';
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentProofUrl?: string;
  transactionRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  userId: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status?: OrderStatus;
  paymentProofUrl?: string;
}
