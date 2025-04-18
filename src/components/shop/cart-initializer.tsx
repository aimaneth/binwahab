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

  useEffect(() => {
    if (initialized.current) return;

    // Always sync with server state
    clearCart();
    items.forEach(item => {
      addItem({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          images: [
            ...(item.product.images?.map(img => img.url) || []),
            ...(item.product.image ? [item.product.image] : [])
          ],
        },
        quantity: item.quantity,
        variant: item.variant ? {
          sku: item.variant.sku,
          name: item.variant.name,
          price: item.variant.price,
        } : undefined,
      });
    });

    initialized.current = true;
  }, [items, clearCart, addItem]);

  return null;
} 