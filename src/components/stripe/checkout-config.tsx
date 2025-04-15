"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";

interface CartItem {
  id: string;
  product: {
    id: string | number;
    name: string;
    price: number | string;
    image?: string;
    description?: string;
  };
  quantity: number;
  variant?: {
    id: string;
    sku: string;
    name: string;
    price: number | string;
    image?: string;
  };
}

interface CheckoutConfigProps {
  items: CartItem[];
}

export function CheckoutConfig({ items }: CheckoutConfigProps) {
  const [loading, setLoading] = useState(false);

  const getTotal = () => {
    return items.reduce((total, item) => {
      const itemPrice = item.variant?.price || item.product.price;
      const numericPrice = typeof itemPrice === 'string' ? parseFloat(itemPrice) : itemPrice;
      return total + (numericPrice * item.quantity);
    }, 0);
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Checkout failed");
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
      
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error(error instanceof Error ? error.message : "Failed to initiate checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="divide-y">
          {items.map((item) => (
            <div key={`${item.id}-${item.variant?.sku || 'no-variant'}`} className="py-4 first:pt-0 last:pb-0">
              <div className="flex gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
                  {(item.variant?.image || item.product.image) ? (
                    <Image
                      src={item.variant?.image || item.product.image || ''}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-secondary">
                      <span className="text-sm text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <h3 className="font-medium">{item.product.name}</h3>
                  {item.variant && (
                    <p className="text-sm text-muted-foreground">
                      Variant: {item.variant.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-sm">Quantity: {item.quantity}</p>
                    <span className="text-sm text-muted-foreground">×</span>
                    <p className="text-sm">
                      RM {Number(item.variant?.price || item.product.price).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    Subtotal: RM {(item.quantity * Number(item.variant?.price || item.product.price)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>RM {getTotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span className="text-muted-foreground">Calculated at checkout</span>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-semibold">
                RM {getTotal().toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Tax included if applicable
            </p>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={loading || items.length === 0}
            className="w-full mt-4"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Make Payment"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
} 