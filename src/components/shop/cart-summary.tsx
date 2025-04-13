"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { CartItem, Product, ProductVariant } from "@prisma/client";
import { Loader2 } from "lucide-react";

interface CartSummaryProps {
  items: (CartItem & {
    product: Product;
    variant?: ProductVariant | null;
  })[];
  shippingState?: string;
}

export function CartSummary({ items, shippingState = "Selangor" }: CartSummaryProps) {
  const router = useRouter();
  const [shipping, setShipping] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateShipping = async () => {
      setIsLoading(true);
      try {
        const subtotal = items.reduce(
          (sum, item) => sum + Number(item.variant?.price ?? item.product.price) * item.quantity,
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

  if (items.length === 0) {
    return null;
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.variant?.price ?? item.product.price) * item.quantity,
    0
  );
  const tax = subtotal * 0.06; // 6% tax
  const total = subtotal + shipping + tax;

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
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (6%)</span>
          <span className="font-medium">{formatPrice(tax)}</span>
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between text-base font-medium">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={() => router.push("/shop/checkout")}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            "Proceed to Checkout"
          )}
        </Button>
      </div>
    </div>
  );
} 