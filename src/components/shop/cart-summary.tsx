"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { CartItem, Product, ProductVariant } from "@prisma/client";
import { Clock, CreditCard, Loader2, Shield, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");

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
        
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state: shippingState,
            orderValue: subtotal,
            orderWeight: 0,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate shipping');
        }

        const { cost } = await response.json();
        setShipping(cost);

        // Calculate estimated delivery date (3-5 business days)
        const today = new Date();
        const minDelivery = new Date(today);
        minDelivery.setDate(today.getDate() + 3);
        const maxDelivery = new Date(today);
        maxDelivery.setDate(today.getDate() + 5);
        
        const formatDate = (date: Date) => {
          return date.toLocaleDateString('en-MY', { 
            month: 'short', 
            day: 'numeric'
          });
        };

        setEstimatedDelivery(`${formatDate(minDelivery)} - ${formatDate(maxDelivery)}`);
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

      const checkoutItems = items.map(item => ({
        name: item.variant?.name || item.product.name,
        description: `${item.product.name}${item.variant ? ` - ${item.variant.name}` : ''}`,
        price: Number(item.variant?.price || item.product.price),
        quantity: item.quantity,
        images: item.product.image ? [item.product.image] : []
      }));

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: checkoutItems })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Checkout error:", err);
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
    <div className="bg-white rounded-lg shadow divide-y">
      {/* Order Summary Section */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({items.length} items)</span>
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
          <Separator className="my-4" />
          <div className="flex justify-between text-base font-medium">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="text-xs text-gray-500">Tax included: 0%</p>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="p-6">
        <div className="flex items-start gap-3 text-sm mb-4">
          <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Estimated Delivery</p>
            <p className="text-gray-600">{estimatedDelivery}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Order Processing Time</p>
            <p className="text-gray-600">1-2 business days</p>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCard className="h-4 w-4" />
            <span>Secure payment via Stripe</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>Protected by buyer guarantee</span>
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
    </div>
  );
} 