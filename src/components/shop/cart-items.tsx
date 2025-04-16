"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CartItem } from "@/types/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface CartItemsProps {
  items: CartItem[];
}

export function CartItems({ items }: CartItemsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const { updateQuantity: updateCartQuantity, removeItem: removeCartItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="col-span-3 text-center py-12 bg-white rounded-lg shadow">
        <div className="flex flex-col items-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-6">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link href="/shop">
            <Button size="lg" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const updateQuantity = async (itemId: string | number, quantity: number) => {
    if (quantity < 1) return;
    setUpdating(itemId.toString());
    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: itemId.toString(), quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update quantity");
      }
      
      // Update client-side cart state
      updateCartQuantity(itemId, quantity);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string | number) => {
    setUpdating(itemId.toString());
    try {
      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove item");
      
      // Update client-side cart state
      removeCartItem(itemId);
      router.refresh();
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Cart Items ({items.length})
        </h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.variant?.sku || ''}`}
              className="flex items-center justify-between py-4 border-b last:border-0"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={item.variant?.image || item.product.image || ''}
                  alt={item.product.name}
                  className="h-16 w-16 object-cover rounded"
                />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {item.product.name}
                  </h3>
                  {item.variant && (
                    <p className="text-sm text-gray-600">
                      SKU: {item.variant.sku}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.variant?.price ?? item.product.price)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    disabled={updating === item.product.id.toString() || item.quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.product.id, parseInt(e.target.value))
                    }
                    className="w-16 text-center"
                    disabled={updating === item.product.id.toString()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={updating === item.product.id.toString()}
                  >
                    +
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.product.id)}
                  disabled={updating === item.product.id.toString()}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 