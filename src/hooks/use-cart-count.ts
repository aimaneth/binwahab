"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// Create a custom event for cart updates
export const cartUpdateEvent = new Event('cartUpdate');

export function useCartCount() {
  const [count, setCount] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!session?.user) {
        setCount(0);
        return;
      }

      try {
        const response = await fetch("/api/cart");
        if (!response.ok) throw new Error("Failed to fetch cart");
        const data = await response.json();
        setCount(data.items?.length || 0);
      } catch (error) {
        console.error("Failed to fetch cart count:", error);
        setCount(0);
      }
    };

    // Fetch initial cart count
    fetchCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdate', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, [session]);

  return count;
} 