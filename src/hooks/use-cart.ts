import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

// Define CartItem and ShippingAddress types
interface CartItemProduct {
  id: string | number;
  name: string;
  price: number | string;
  images?: string[] | Array<{ url: string }>; // Allow both string[] and {url:string}[]
  image?: string;
  description?: string;
}

interface CartItemVariant {
  id: string | number;
  sku: string;
  name: string;
  price: number | string;
  image?: string;
  options?: Record<string, string>;
}

export interface CartItem {
  id?: string | number; // Cart item's own ID from DB, if applicable
  product: CartItemProduct;
  quantity: number;
  variant?: CartItemVariant;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

// Define the store's state and actions
interface CartStore {
  items: CartItem[];
  isCartSheetOpen: boolean;
  shippingAddress: ShippingAddress | null;
  isPaying: boolean; // For tracking payment process

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string | number, variantId?: string | number) => void;
  updateQuantity: (productId: string | number, variantId: string | number | undefined, quantity: number) => void;
  setItems: (items: CartItem[]) => void;
  clearClientAndServerCart: () => Promise<void>;
  setIsCartSheetOpen: (isOpen: boolean) => void;
  setShippingAddress: (address: ShippingAddress | null) => void;
  setIsPaying: (isPaying: boolean) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      isCartSheetOpen: false,
      shippingAddress: null,
      isPaying: false,

      addItem: (itemToAdd: CartItem) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(
          (i) =>
            i.product.id.toString() === itemToAdd.product.id.toString() &&
            (i.variant?.id?.toString() || null) === (itemToAdd.variant?.id?.toString() || null)
        );

        if (existingItemIndex > -1) {
          const newItems = [...currentItems];
          newItems[existingItemIndex].quantity += itemToAdd.quantity;
          set({ items: newItems });
        } else {
          set({ items: [...currentItems, itemToAdd] });
        }
        toast.success("Item added to cart");
        // Future: Add API call to persist item addition to server if not already handled elsewhere
      },

      setItems: (newItems: CartItem[]) => {
        set({ items: newItems });
        console.log("[useCart] setItems called, client store updated with:", newItems);
      },

      removeItem: (productId: string | number, variantId?: string | number) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id.toString() === productId.toString() &&
                (item.variant?.id?.toString() || null) === (variantId?.toString() || null)
              )
          ),
        }));
        toast.success("Item removed from cart");
        // Future: Add API call to persist item removal to server if not already handled elsewhere
      },

      updateQuantity: (productId: string | number, variantId: string | number | undefined, quantity: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id.toString() === productId.toString() &&
            (item.variant?.id?.toString() || null) === (variantId?.toString() || null)
              ? { ...item, quantity: Math.max(0, quantity) } // Ensure quantity doesn't go below 0
              : item
          ).filter(item => item.quantity > 0), // Optionally remove item if quantity is 0
        }));
        // toast.success("Cart updated"); // Can be noisy, enable if desired
      },

      clearClientAndServerCart: async () => {
        set({ items: [] }); // Clear client state immediately

        try {
          const response = await fetch('/api/cart?clearAll=true', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Failed to clear server-side cart and parse error." }));
            console.error("Failed to clear server-side cart:", errorData);
            toast.error(`Server cart clear failed: ${errorData.message}`);
            // Note: Client cart remains cleared. Decide if it should be reverted.
          } else {
            console.log("Server-side cart cleared successfully.");
            toast.success("Cart cleared successfully");
          }
        } catch (error) {
          console.error("Error clearing server-side cart:", error);
          toast.error("Error clearing cart. Check connection.");
        }
      },

      setIsCartSheetOpen: (isOpen: boolean) => set({ isCartSheetOpen: isOpen }),
      setShippingAddress: (address: ShippingAddress | null) => set({ shippingAddress: address }),
      setIsPaying: (isPaying: boolean) => set({ isPaying }),

      getTotal: () => {
        return get().items.reduce((total, item) => {
          const itemPriceSource = item.variant || item.product;
          const numericPrice = typeof itemPriceSource.price === 'string' 
            ? parseFloat(itemPriceSource.price) 
            : itemPriceSource.price;
          return total + (numericPrice * item.quantity);
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage', // Name for localStorage key
      storage: createJSONStorage(() => localStorage),
      version: 2, // Increment version if state shape changes significantly
       // onRehydrateStorage: (state) => {
       //  console.log('Rehydration finished for cart-storage:', state);
       //  return (state, error) => {
       //    if (error) {
       //      console.error('An error happened during rehydration of cart-storage', error);
       //    } else {
       //      console.log('Rehydration successful for cart-storage');
       //    }
       //  };
       // },
    }
  )
); 