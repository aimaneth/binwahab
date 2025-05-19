"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/hooks/use-cart";

interface CartInitializerProps {
  items: CartItem[];
}

export function CartInitializer({ items }: CartInitializerProps) {
  const { setItems } = useCart();
  const initialized = useRef(false);

  console.log("[CartInitializer] Component rendered. Initialized.current:", initialized.current, "Received items:", JSON.stringify(items, null, 2));

  useEffect(() => {
    console.log("[CartInitializer] useEffect triggered. Initialized.current:", initialized.current, "Current prop items:", JSON.stringify(items, null, 2));

    if (initialized.current && items.length === 0) {
        console.warn("[CartInitializer] useEffect: Already initialized but received empty items. Proceeding to set client store.");
    } else if (initialized.current) {
        console.log("[CartInitializer] useEffect: Already initialized and items might not be empty. Skipping full re-initialization to prevent potential overwrites if items prop isn't the latest server state.");
        return; 
    }

    console.log("[CartInitializer] Initializing/setting client cart state with items from props...");
    setItems(items);
    console.log("[CartInitializer] Client cart state set. Items:", JSON.stringify(items, null, 2));
    
    if (items.length > 0 || !initialized.current) {
        initialized.current = true;
        console.log("[CartInitializer] Marked as initialized.");
    }

  }, [items, setItems]);

  return null;
} 