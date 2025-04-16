"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OrderSummary } from "@/components/shop/order-summary";
import type { OrderItem } from "@/types/order";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe outside of component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  items: OrderItem[];
}

export function CheckoutForm({ items }: CheckoutFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Format items for Stripe Checkout
      const checkoutItems = items.map(item => ({
        name: item.variant?.name || item.product.name,
        description: `${item.product.name}${item.variant ? ` - ${item.variant.name}` : ''}`,
        price: Number(item.variant?.price || item.product.price),
        quantity: item.quantity,
        images: item.product.image ? [item.product.image] : []
      }));

      console.log('Sending checkout items:', checkoutItems);

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

      // Redirect to the Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to proceed to checkout");
      setIsLoading(false);
    }
  };

  if (!items?.length) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No items in cart</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <OrderSummary items={items} />
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className={`w-full mt-6 py-3 px-4 text-white font-semibold rounded-lg shadow-sm 
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2">Processing...</span>
            </div>
          ) : (
            "Make Payment"
          )}
        </button>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </Card>
    </div>
  );
}

export default CheckoutForm; 