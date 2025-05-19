import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  product: {
    id: string | number;
    name: string;
    price: number | string;
    images: string[];
  };
  quantity: number;
  variant?: {
    id?: string | number;
    sku: string;
    name: string;
    price: number | string;
  };
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string | number, variantId?: string | number) => void;
  updateQuantity: (productId: string | number, quantity: number, variantId?: string | number) => void;
  clearCart: () => Promise<void>;
  getTotal: () => number;
}

export const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(
          (i) =>
            i.product.id.toString() === item.product.id.toString() &&
            ((i.variant?.id || null) === (item.variant?.id || null))
        );

        if (existingItemIndex > -1) {
          const newItems = [...currentItems];
          newItems[existingItemIndex].quantity += item.quantity;
          set({ items: newItems });
        } else {
          set({ items: [...currentItems, item] });
        }
      },
      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id.toString() === productId.toString() &&
                ((item.variant?.id || null)?.toString() === (variantId || null)?.toString())
              )
          ),
        }));
      },
      updateQuantity: (productId, quantity, variantId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id.toString() === productId.toString() &&
            ((item.variant?.id || null)?.toString() === (variantId || null)?.toString())
              ? { ...item, quantity }
              : item
          ),
        }));
      },
      clearCart: async () => {
        try {
          // Clear server-side cart first
          const response = await fetch('/api/cart?clearAll=true', {
            method: 'DELETE',
          });

          if (!response.ok) {
            console.error('Failed to clear server-side cart:', await response.text());
          }

          // Clear client-side cart
          set({ items: [] });

          // Dispatch cart update event
          window.dispatchEvent(new Event('cartUpdate'));
        } catch (error) {
          console.error('Error clearing cart:', error);
          // Still clear client-side cart even if server-side fails
          set({ items: [] });
          window.dispatchEvent(new Event('cartUpdate'));
        }
      },
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
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
); 