"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    image?: string;
    description?: string;
  };
  variant?: {
    id: string;
    sku: string;
    name: string;
    price: string;
    image?: string;
  };
}

interface OrderSummaryProps {
  items: OrderItem[];
}

export function OrderSummary({ items }: OrderSummaryProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [shipping, setShipping] = useState(0);

  useEffect(() => {
    const calculateTotals = async () => {
      setIsCalculating(true);
      try {
        const newSubtotal = items.reduce((sum, item) => {
          const price = item.variant?.price || item.product.price;
          const numericPrice = parseFloat(price);
          if (isNaN(numericPrice)) {
            console.error('Invalid price:', price);
            return sum;
          }
          return sum + (numericPrice * item.quantity);
        }, 0);

        // Calculate shipping using the API
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state: "Selangor", // Default state
            orderValue: newSubtotal,
            orderWeight: 0,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate shipping');
        }

        const { cost } = await response.json();
        
        setSubtotal(newSubtotal);
        setShipping(cost);
        setTotal(newSubtotal + cost);
      } catch (error) {
        console.error('Error calculating totals:', error);
        setShipping(0);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateTotals();
  }, [items]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCalculating ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {/* Order Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={`${item.id}-${item.variant?.sku || 'no-variant'}`} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    {item.variant && (
                      <p className="text-muted-foreground text-xs">{item.variant.name}</p>
                    )}
                    <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(
                      item.quantity * parseFloat(item.variant?.price || item.product.price)
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-muted-foreground">
                Free shipping on orders over RM300
              </p>
            )}
            <div className="border-t pt-4">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tax included: 0%
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 