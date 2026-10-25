import { Product, ProductVariant } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedVariant?: ProductVariant) => void;
  removeItem: (itemIdOrProductId: string) => void;
  updateQuantity: (itemIdOrProductId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  total: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}
