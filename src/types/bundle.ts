export interface BundleItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  stock?: number;
  isOutOfStock?: boolean;
}

export type BundleStatus = 'active' | 'draft' | 'out_of_stock';

export interface BundlePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  images?: string[];
  items: BundleItem[];
  originalPrice: number; // ผลรวมราคาสินค้าแต่ละชิ้น
  price: number; // ราคาโปรโมชันของบันเดิล
  savings: number; // originalPrice - price
  discountPercent: number; // เปอร์เซ็นต์ส่วนลด
  stock: number;
  status: BundleStatus;
  featured?: boolean;
  tags?: string[];
  hasOutOfStockItems?: boolean; // มีสินค้าในบันเดิลหมดสต็อก
  outOfStockItemNames?: string[]; // รายชื่อสินค้าในบันเดิลที่หมด
  createdAt: string;
  updatedAt: string;
}

export type BundleFormData = Omit<
  BundlePackage,
  'id' | 'createdAt' | 'updatedAt' | 'originalPrice' | 'savings' | 'discountPercent'
> & {
  originalPrice?: number;
  savings?: number;
  discountPercent?: number;
};
