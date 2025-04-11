"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { calculateShippingCost, getShippingZoneByState } from "@/lib/shipping";
import { Loader2 } from "lucide-react";
import { CartItem, Product } from "@prisma/client";

interface OrderSummaryProps {
  items: (CartItem & {
    product: Product;
  })[];
  shippingState?: string;
}

export function OrderSummary({ items, shippingState = "Selangor" }: OrderSummaryProps) {
  const [shipping, setShipping] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateShipping = async () => {
      setIsLoading(true);
      try {
        const subtotal = items.reduce(
          (total, item) => total + Number(item.product.price) * item.quantity,
          0
        );
        
        // Get the shipping zone for the state
        const zone = await getShippingZoneByState(shippingState);
        if (!zone) {
          setShipping(0);
          return;
        }
        
        // Calculate shipping cost with the correct parameters
        const shippingCost = await calculateShippingCost({
          zoneId: zone.id,
          orderValue: subtotal,
          orderWeight: 0 // Default to 0 since weight is not available on Product
        });
        
        setShipping(shippingCost);
      } catch (error) {
        console.error("Failed to calculate shipping:", error);
        setShipping(0);
      } finally {
        setIsLoading(false);
      }
    };

    calculateShipping();
  }, [items, shippingState]);

  const subtotal = items.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0
  );
  const tax = subtotal * 0.06; // 6% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="font-medium">{formatPrice(shipping)}</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax (6%)</span>
          <span className="font-medium">{formatPrice(tax)}</span>
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-semibold">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium mb-3">Items in your order</h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-16 h-16 relative">
                <img
                  src={item.product.image || "/placeholder.png"}
                  alt={item.product.name}
                  className="object-cover rounded-md"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">{item.product.name}</h4>
                <p className="text-sm text-gray-500">
                  Qty: {item.quantity}
                </p>
              </div>
              <div className="text-sm font-medium">
                {formatPrice(Number(item.product.price) * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 