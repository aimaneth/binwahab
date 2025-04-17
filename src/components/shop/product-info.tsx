"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize selectedVariant only if variants exist
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  // Group variants by option type
  const optionTypes = product.variants && product.variants.length > 0
    ? Object.keys(product.variants[0].options)
    : [];

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initialOptions: Record<string, string> = {};
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      Object.entries(firstVariant.options).forEach(([key, value]) => {
        initialOptions[key] = value;
      });
    }
    return initialOptions;
  });

  // Get unique values for each option type
  const getOptionsForType = (optionType: string) => {
    const uniqueValues = new Set<string>();
    if (product.variants) {
      product.variants.forEach((variant) => {
        if (variant.options[optionType]) {
          uniqueValues.add(variant.options[optionType]);
        }
      });
    }
    return Array.from(uniqueValues);
  };

  // Check if a variant with specific options is in stock
  const isOptionInStock = (optionType: string, value: string) => {
    return product.variants?.some((variant) => {
      const availableStock = variant.stock - variant.reservedStock;
      return variant.options[optionType] === value && availableStock > 0;
    }) ?? false;
  };

  // Get stock level class
  const getStockLevelClass = (stock: number, reservedStock: number, threshold: number | null) => {
    const availableStock = stock - reservedStock;
    if (availableStock === 0) return "text-red-500";
    if (threshold && availableStock <= threshold) return "text-amber-500";
    return "text-green-500";
  };

  // Find the variant that matches the selected options
  const findMatchingVariant = () => {
    return product.variants?.find((variant) => {
      return Object.entries(selectedOptions).every(
        ([key, value]) => variant.options[key] === value
      );
    });
  };

  // Update selected options and find matching variant
  const handleOptionChange = (optionType: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionType]: value };
    setSelectedOptions(newOptions);
    const matchingVariant = product.variants?.find((variant) => {
      return Object.entries(newOptions).every(
        ([key, val]) => variant.options[key] === val
      );
    });
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      // Reset quantity if it exceeds new variant's available stock
      const availableStock = matchingVariant.stock - matchingVariant.reservedStock;
      if (quantity > availableStock) {
        setQuantity(Math.max(1, availableStock));
      }
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    // If there are variants, we need a selected variant
    if (product.variants?.length > 0 && !selectedVariant) {
      toast.error("Please select all options");
      return;
    }

    // Check stock based on whether we're using variants or not
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
    if (quantity > currentStock) {
      toast.error("Not enough stock available");
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
          variantId: selectedVariant?.id,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      toast.success("Added to cart");
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdate'));
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert string price to number
  const parsePrice = (price: string | number | null | undefined): number => {
    if (typeof price === 'number') return price;
    if (!price) return 0;
    return Number(price);
  };

  // Get the current price to display
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const compareAtPrice = selectedVariant?.compareAtPrice;
  const inStock = selectedVariant 
    ? selectedVariant.stock > 0 
    : product.stock > 0;

  return (
    <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {product.name}
      </h1>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h2 className="sr-only">Product information</h2>
          <p className="text-3xl tracking-tight text-foreground">
            {formatPrice(parsePrice(currentPrice))}
          </p>
          {compareAtPrice && (
            <p className="mt-1 text-lg line-through text-muted-foreground">
              {formatPrice(parsePrice(compareAtPrice))}
            </p>
          )}
        </div>
        <div>
          <Badge
            variant={inStock ? "outline" : "destructive"}
            className="text-sm"
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="mt-6">
        {optionTypes.map((optionType) => (
          <div key={optionType} className="mb-4">
            <Label className="mb-2 block text-sm font-medium">
              {optionType}
            </Label>
            <Select
              value={selectedOptions[optionType]}
              onValueChange={(value) => handleOptionChange(optionType, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${optionType}`} />
              </SelectTrigger>
              <SelectContent>
                {getOptionsForType(optionType).map((value) => (
                  <SelectItem
                    key={value}
                    value={value}
                    disabled={!isOptionInStock(optionType, value)}
                  >
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="mt-4">
          <Label className="mb-2 block text-sm font-medium">
            Quantity
          </Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24"
          />
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={isLoading || !inStock}
          className="mt-8 w-full"
        >
          {isLoading ? "Adding to cart..." : "Add to cart"}
        </Button>
      </div>

      <Separator className="my-6" />

      <div className="space-y-6 text-base text-muted-foreground">
        <div dangerouslySetInnerHTML={{ __html: product.description }} />
      </div>
    </div>
  );
}