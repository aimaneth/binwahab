"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/types/cart";

interface CartInitializerProps {
  items: CartItem[];
}

export function CartInitializer({ items }: CartInitializerProps) {
  const { items: cartItems, addItem, clearCart } = useCart();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const serverItemsMap = new Map(
      items.map(item => [
        `${item.product.id}-${item.variant?.sku || 'no-variant'}`,
        item
      ])
    );

    const clientItemsMap = new Map(
      cartItems.map(item => [
        `${item.product.id}-${item.variant?.sku || 'no-variant'}`,
        item
      ])
    );

    const needsInitialization = items.length !== cartItems.length ||
      Array.from(serverItemsMap.keys()).some(key => {
        const serverItem = serverItemsMap.get(key);
        const clientItem = clientItemsMap.get(key);
        return !clientItem || clientItem.quantity !== serverItem?.quantity;
      });

    if (needsInitialization) {
      clearCart();
      items.forEach(item => {
        addItem({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            images: [item.product.image || ''],
          },
          quantity: item.quantity,
          variant: item.variant ? {
            sku: item.variant.sku,
            name: item.variant.name,
            price: item.variant.price,
          } : undefined,
        });
      });
    }

    initialized.current = true;
  }, [items]);

  return null;
} 