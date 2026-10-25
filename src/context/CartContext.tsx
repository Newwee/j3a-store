'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Product, ProductVariant } from '@/types/product';
import { CartItem, CartContextType } from '@/types/cart';
import { useToast } from './ToastContext';
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/firestore/settings';

const CART_STORAGE_KEY = 'j3a_store_cart_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function getItemIdentifier(item: CartItem): string {
  if (item.selectedVariant) {
    return `${item.product.id}__var_${item.selectedVariant.id}`;
  }
  return item.product.id;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shippingFee, setShippingFee] = useState(DEFAULT_STORE_SETTINGS.shippingFee);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_STORE_SETTINGS.freeShippingThreshold);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Load shipping settings from Firestore (dynamic — admin configurable)
  useEffect(() => {
    getStoreSettings()
      .then((s) => {
        setShippingFee(s.shippingFee);
        setFreeShippingThreshold(s.freeShippingThreshold);
      })
      .catch(() => {
        // fallback to defaults on error (already set in state)
      });
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to localStorage:', e);
      }
    }
  }, [items, isLoaded]);

  const addItem = (product: Product, quantity: number = 1, selectedVariant?: ProductVariant) => {
    if (product.tags?.includes('bundle_item_out_of_stock')) {
      toast('ไม่สามารถสั่งซื้อได้ เนื่องจากมีสินค้าใน Bundle หมด', 'error');
      return;
    }

    const availableStock = selectedVariant ? (selectedVariant.stock ?? 999) : product.stock;

    if (availableStock <= 0 || product.status === 'out_of_stock') {
      toast('ตัวเลือกสินค้านี้หมดชั่วคราว', 'error');
      return;
    }

    const targetKey = selectedVariant
      ? `${product.id}__var_${selectedVariant.id}`
      : product.id;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => getItemIdentifier(item) === targetKey);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, availableStock);
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        const addQty = Math.min(quantity, availableStock);
        return [...prev, { product, quantity: addQty, selectedVariant }];
      }
    });

    const displayName = selectedVariant
      ? `${product.name} (${selectedVariant.name})`
      : product.name;

    toast(`เพิ่ม "${displayName}" ลงในตะกร้าแล้ว`, 'success');
  };

  const removeItem = (targetId: string) => {
    setItems((prev) => {
      const target = prev.find((item) => getItemIdentifier(item) === targetId || item.product.id === targetId);
      if (target) {
        const displayName = target.selectedVariant
          ? `${target.product.name} (${target.selectedVariant.name})`
          : target.product.name;
        toast(`นำ "${displayName}" ออกจากตะกร้าแล้ว`, 'info');
      }
      return prev.filter((item) => getItemIdentifier(item) !== targetId && item.product.id !== targetId);
    });
  };

  const updateQuantity = (targetId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(targetId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (getItemIdentifier(item) === targetId || item.product.id === targetId) {
          const maxStock = item.selectedVariant
            ? (item.selectedVariant.stock ?? 999)
            : (item.product.stock || 999);
          const clampedQty = Math.min(quantity, maxStock);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const { subtotal, shipping, total, totalItems } = useMemo(() => {
    const sub = items.reduce((sum, item) => {
      const price = item.selectedVariant ? item.selectedVariant.price : item.product.price;
      return sum + price * item.quantity;
    }, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    let ship = 0;
    if (sub > 0 && shippingFee > 0) {
      ship = freeShippingThreshold > 0 && sub >= freeShippingThreshold ? 0 : shippingFee;
    }
    const tot = sub + ship;

    return {
      subtotal: sub,
      shipping: ship,
      total: tot,
      totalItems: count,
    };
  }, [items, shippingFee, freeShippingThreshold]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        shipping,
        total,
        totalItems,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
