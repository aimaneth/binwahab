"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CartItem } from "@/types/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { 
  Bookmark,
  Heart,
  Loader2,
  ShoppingBag, 
  Trash2 
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface CartItemsProps {
  items: CartItem[];
}

export function CartItems({ items }: CartItemsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const { updateQuantity: updateCartQuantity, removeItem: removeCartItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="col-span-3 text-center py-12 bg-card rounded-lg shadow">
        <div className="flex flex-col items-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6">
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
      
      updateCartQuantity(itemId, quantity);
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdate'));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId: string | number, variantId?: string | number) => {
    setUpdating(productId.toString());
    try {
      let url = `/api/cart?productId=${productId}`;
      if (variantId) url += `&variantId=${variantId}`;
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove item");
      removeCartItem(productId, variantId ? variantId.toString() : undefined);
      window.dispatchEvent(new Event('cartUpdate'));
      router.refresh();
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const toggleSaveForLater = (itemId: string | number) => {
    const id = itemId.toString();
    if (savedItems.includes(id)) {
      setSavedItems(savedItems.filter(i => i !== id));
      toast.success("Item removed from saved items");
    } else {
      setSavedItems([...savedItems, id]);
      toast.success("Item saved for later");
    }
  };

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Shopping Cart ({items.length})
          </h2>
          <Link href="/shop" className="text-sm text-primary hover:text-primary/80">
            Continue Shopping
          </Link>
        </div>
        <div className="space-y-6">
          {items.map((item) => {
            const itemId = item.product.id.toString();
            const isSaved = savedItems.includes(itemId);
            const isUpdating = updating === itemId;

            const itemPrice = Number(item.variant?.price ?? item.product.price);
            const itemTotal = itemPrice * item.quantity;

            return (
              <div key={`${item.product.id}-${item.variant?.sku || ''}`}>
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    {(() => {
                      console.log('Cart Item Image Debug:', {
                        productName: item.product.name,
                        variantImage: item.variant?.image,
                        productImages: item.product.images,
                        productImage: item.product.image,
                      });
                      return null;
                    })()}
                    <ImageWithFallback
                      src={
                        item.variant?.image || 
                        (item.product.images && item.product.images.length > 0 
                          ? item.product.images[0].url 
                          : item.product.image) || 
                        '/images/fallback-product.jpg'
                      }
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {item.product.name}
                        </h3>
                        {item.variant && (
                          <div className="mt-1 space-y-1">
                            {item.variant.options && Object.entries(item.variant.options).map(([key, value]) => (
                              <p key={key} className="text-sm text-muted-foreground">
                                {key}: {value}
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {formatPrice(itemTotal)}
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSaveForLater(item.product.id)}
                        >
                          {isSaved ? (
                            <Heart className="h-5 w-5 fill-destructive text-destructive" />
                          ) : (
                            <Heart className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.product.id, item.variant?.id ? item.variant.id.toString() : undefined)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="mt-4 flex items-center">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
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
                          className="w-16 h-8 text-center"
                          disabled={isUpdating}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={isUpdating}
                        >
                          +
                        </Button>
                      </div>
                      <div className="ml-4 text-sm text-gray-500">
                        Total: {formatPrice(itemTotal)}
                      </div>
                    </div>
                  </div>
                </div>
                <Separator className="mt-6" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 