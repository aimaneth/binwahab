import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  product: {
    id: string | number;
    name: string;
    price: number | string;
    images: string[];
  };
  quantity: number;
  variant?: {
    sku: string;
    name: string;
    price: number | string;
  };
}

interface CartStore<T extends CartItem> {
  items: T[];
  addItem: (item: T) => void;
  removeItem: (productId: string | number, variantSku?: string) => void;
  updateQuantity: (productId: string | number, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCart = create(
  persist<CartStore<CartItem>>(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(
          (i) =>
            i.product.id === item.product.id &&
            i.variant?.sku === item.variant?.sku
        );

        if (existingItemIndex > -1) {
          const newItems = [...currentItems];
          newItems[existingItemIndex].quantity += item.quantity;
          set({ items: newItems });
        } else {
          set({ items: [...currentItems, item] });
        }
      },
      removeItem: (productId, variantSku) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.variant?.sku === variantSku
              )
          ),
        }));
      },
      updateQuantity: (productId, quantity, variantSku) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.variant?.sku === variantSku
              ? { ...item, quantity }
              : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const itemPrice = item.variant?.price || item.product.price;
          const numericPrice = typeof itemPrice === 'string' ? parseFloat(itemPrice) : itemPrice;
          return total + (numericPrice * item.quantity);
        }, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
); 