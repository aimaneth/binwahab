"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/types/cart";

interface CartInitializerProps {
  items: CartItem[];
}

export function CartInitializer({ items }: CartInitializerProps) {
  const { clearCart, addItem } = useCart();
  const initialized = useRef(false);

  console.log("[CartInitializer] Component rendered. Initialized.current:", initialized.current, "Received items:", JSON.stringify(items, null, 2));

  useEffect(() => {
    console.log("[CartInitializer] useEffect triggered. Initialized.current:", initialized.current);
    if (initialized.current) {
      console.log("[CartInitializer] Already initialized, skipping effect.");
      return;
    }
    
    console.log("[CartInitializer] Initializing cart state...");
    // Always sync with server state
    (async () => {
      console.log("[CartInitializer] Calling clearCart()...");
      await clearCart();
      console.log("[CartInitializer] clearCart() finished. Now adding items:", JSON.stringify(items, null, 2));
      items.forEach(item => {
        console.log("[CartInitializer] Adding item:", JSON.stringify(item, null, 2));
        addItem({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            images: item.product.images?.map(img => img.url) || [],
          },
          quantity: item.quantity,
          variant: item.variant ? {
            id: item.variant.id,
            sku: item.variant.sku,
            name: item.variant.name,
            price: item.variant.price,
          } : undefined,
        });
      });
      console.log("[CartInitializer] Finished adding items. Setting initialized.current to true.");
      initialized.current = true;
    })();
  }, [items, clearCart, addItem]);

  return null;
} 