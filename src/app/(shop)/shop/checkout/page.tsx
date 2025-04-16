"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderSummary } from "@/components/shop/order-summary";
import { Steps } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface CheckoutPageProps {}

export default function CheckoutPage({}: CheckoutPageProps) {
  const router = useRouter();
  const { items: cartItems } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Cart Items:', cartItems);
  }, [cartItems]);

  // Transform cart items to order items
  const orderItems = cartItems.map(item => {
    console.log('Processing item:', item);
    const productPrice = typeof item.product.price === 'number' 
      ? item.product.price.toString()
      : item.product.price;
    
    console.log('Product price:', productPrice);

    const transformedItem = {
      id: item.product.id.toString(),
      quantity: item.quantity,
      product: {
        id: item.product.id.toString(),
        name: item.product.name,
        price: productPrice,
        image: item.product.images[0],
        description: ""
      },
      variant: item.variant ? {
        id: item.variant.sku,
        sku: item.variant.sku,
        name: item.variant.name,
        price: typeof item.variant.price === 'number' 
          ? item.variant.price.toString() 
          : item.variant.price,
        image: item.product.images[0]
      } : undefined
    };

    console.log('Transformed item:', transformedItem);
    return transformedItem;
  });

  const steps = [
    { title: "Cart", href: "/shop/cart", status: "complete" as const },
    { title: "Checkout", href: "#", status: "current" as const },
    { title: "Confirmation", href: "#", status: "upcoming" as const },
  ];

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Cart items before checkout:', cartItems);
      console.log('Order items before checkout:', orderItems);

      // Check if cart is empty
      if (cartItems.length === 0) {
        setError("Your cart is empty");
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: orderItems
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate checkout");
      }

      if (data.url) {
        router.push(data.url);
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate checkout");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        {/* Progress Steps */}
        <div className="mb-12">
          <Steps steps={steps} />
        </div>

        <div className="space-y-8">
          {/* Debug Info */}
          <div className="text-xs text-muted-foreground">
            Cart Items: {cartItems.length}
          </div>

          {/* Order Summary */}
          <OrderSummary items={orderItems} />

          {/* Error Message */}
          {error && (
            <div className="p-4 text-sm text-red-500 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={isLoading || cartItems.length === 0}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : cartItems.length === 0 ? (
              "Cart is Empty"
            ) : (
              "Continue to Payment"
            )}
          </Button>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 py-6 border-t">
            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Secure Payment</span>
              <span className="text-xs text-muted-foreground mt-1">SSL Encrypted</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Fast Delivery</span>
              <span className="text-xs text-muted-foreground mt-1">2-5 Business Days</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Easy Returns</span>
              <span className="text-xs text-muted-foreground mt-1">30 Day Policy</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 