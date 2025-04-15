import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product: {
    id: string | number;
    name: string;
    price: number;
    image?: string;
  };
  variant?: {
    sku: string;
    price: number;
    image?: string;
  };
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => 
          i.product.id === item.product.id && 
          i.variant?.sku === item.variant?.sku
        );

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.product.id === item.product.id && i.variant?.sku === item.variant?.sku
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...currentItems, { ...item, quantity: 1 }] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.product.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        set({
          items: get().items.map((item) =>
            item.product.id === id ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => {
        set({ items: [] });
      },
      get total() {
        return get().items.reduce(
          (total, item) => total + (item.variant?.price || item.product.price) * item.quantity,
          0
        );
      },
    }),
    {
      name: "cart-storage",
    }
  )
); 