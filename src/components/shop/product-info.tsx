"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Product, Category } from "@prisma/client";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductInfoProps {
  product: Product & {
    category: Category;
  };
}

export function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      toast.success("Added to cart");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {product.name}
      </h1>

      <div className="mt-3">
        <h2 className="sr-only">Product information</h2>
        <p className="text-3xl tracking-tight text-foreground">
          {formatPrice(product.price)}
        </p>
      </div>

      <div className="mt-6">
        <h3 className="sr-only">Description</h3>
        <div
          className="space-y-6 text-base text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center">
          <h3 className="text-sm text-muted-foreground">Category</h3>
          <p className="ml-2 text-sm font-medium text-foreground">
            {product.category.name}
          </p>
        </div>
      </div>

      <div className="mt-8 flex">
        <div className="flex items-center">
          <label htmlFor="quantity" className="mr-3 text-sm text-muted-foreground">
            Quantity
          </label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20"
          />
        </div>
      </div>

      <div className="mt-8 flex">
        <Button
          onClick={handleAddToCart}
          disabled={isLoading || product.stock === 0}
          className="w-full"
        >
          {isLoading ? "Adding..." : product.stock === 0 ? "Out of stock" : "Add to cart"}
        </Button>
      </div>

      {product.stock === 0 && (
        <p className="mt-2 text-sm text-red-600">This product is out of stock</p>
      )}
    </div>
  );
} 