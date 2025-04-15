"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { CartItem } from "@/types/cart";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderSummaryProps {
  items: CartItem[];
}

export function OrderSummary({ items }: OrderSummaryProps) {
  const [shipping, setShipping] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateShipping = async () => {
      setIsLoading(true);
      try {
        const subtotal = items.reduce((total, item) => {
          const price = item.variant?.price || item.product.price;
          return total + (Number(price) * item.quantity);
        }, 0);
        
        // Calculate shipping cost using the API
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state: "Selangor",
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
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  // Calculate subtotal
  const subtotal = items.reduce((total, item) => {
    const price = item.variant?.price || item.product.price;
    return total + (Number(price) * item.quantity);
  }, 0);

  // Calculate tax (6%)
  const tax = subtotal * 0.06;

  // Calculate total
  const total = subtotal + shipping + tax;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Order Items */}
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product.name} x {item.quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(Number(item.variant?.price || item.product.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
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
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 