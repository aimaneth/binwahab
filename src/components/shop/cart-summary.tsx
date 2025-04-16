"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { CartItem, Product, ProductVariant } from "@prisma/client";
import { Loader2 } from "lucide-react";

interface CartSummaryProps {
  items: (CartItem & {
    product: Omit<Product, 'price'> & { price: number };
    variant?: (Omit<ProductVariant, 'price'> & { price: number }) | null;
  })[];
  shippingState?: string;
}

export function CartSummary({ items, shippingState = "Selangor" }: CartSummaryProps) {
  const [shipping, setShipping] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const calculateShipping = async () => {
      setIsLoading(true);
      try {
        const subtotal = items.reduce(
          (sum, item) => {
            const price = item.variant?.price ?? item.product.price;
            return sum + (Number(price) * item.quantity);
          },
          0
        );
        
        // Calculate shipping cost using the API
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state: shippingState,
            orderValue: subtotal,
            orderWeight: 0, // You can add weight calculation if needed
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate shipping');
        }

        const { cost } = await response.json();
        setShipping(cost);
      } catch (error) {
        console.error("Failed to calculate shipping:", error);
        setShipping(0);
      } finally {
        setIsLoading(false);
      }
    };

    calculateShipping();
  }, [items, shippingState]);

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);

      // Format items for Stripe Checkout
      const checkoutItems = items.map(item => ({
        name: item.variant?.name || item.product.name,
        description: `${item.product.name}${item.variant ? ` - ${item.variant.name}` : ''}`,
        price: Number(item.variant?.price || item.product.price),
        quantity: item.quantity,
        images: item.product.image ? [item.product.image] : []
      }));

      // Create Checkout Session
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: checkoutItems })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      // You might want to add a toast notification here
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const subtotal = items.reduce(
    (sum, item) => {
      const price = item.variant?.price ?? item.product.price;
      return sum + (Number(price) * item.quantity);
    },
    0
  );
  const total = subtotal + shipping;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="font-medium">{formatPrice(shipping)}</span>
          )}
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between text-base font-medium">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Tax included: 0%</p>
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={handleCheckout}
          disabled={isLoading || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            "Proceed to Payment"
          )}
        </Button>
      </div>
    </div>
  );
} 