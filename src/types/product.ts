export type ProductStatus = 'active' | 'draft' | 'out_of_stock';
export type PricingType = 'single' | 'multi';

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  stock: number;
  tier?: '3d' | '1w' | '4w' | '6m' | string;
  durationDays?: number;
  badge?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  pricingType?: PricingType;
  variants?: ProductVariant[];
  image: string;
  images: string[];
  category: string;
  stock: number;
  status: ProductStatus;
  featured: boolean;
  tags?: string[];
  specs?: Record<string, string>;
  rating?: number;
  reviewCount?: number;
  showcaseUrl?: string;
  downloadUrl?: string;
  deliveryNote?: string;
  deliveryType?: 'link' | 'key' | 'both';
  createdAt: string;
  updatedAt: string;
}

export type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
