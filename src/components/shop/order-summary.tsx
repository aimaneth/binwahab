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
  const [isCalculating, setIsCalculating] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const shippingCost = 0; // Free shipping for now

  useEffect(() => {
    const calculateTotals = () => {
      setIsCalculating(true);
      const newSubtotal = items.reduce((sum, item) => {
        const price = item.variant?.price || item.product.price;
        const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
        return sum + (numericPrice * item.quantity);
      }, 0);
      
      setSubtotal(newSubtotal);
      setTotal(newSubtotal + shippingCost);
      setIsCalculating(false);
    };

    calculateTotals();
  }, [items, shippingCost]);

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
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 