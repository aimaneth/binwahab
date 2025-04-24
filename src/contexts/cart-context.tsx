"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CartContextType {
  cartIconPosition: { x: number; y: number } | null;
  setCartIconPosition: (position: { x: number; y: number } | null) => void;
  triggerAddToCartAnimation: (sourcePosition: { x: number; y: number }) => void;
  isAnimating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartIconPosition, setCartIconPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAddToCartAnimation = useCallback((sourcePosition: { x: number; y: number }) => {
    if (cartIconPosition) {
      setIsAnimating(true);
      // Animation will be handled by the AddToCartAnimation component
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000); // Slightly longer than the animation duration
    }
  }, [cartIconPosition]);

  return (
    <CartContext.Provider 
      value={{ 
        cartIconPosition, 
        setCartIconPosition, 
        triggerAddToCartAnimation,
        isAnimating 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}