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

  console.log('Product variants:', product.variants);
  console.log('First variant options:', product.variants[0]?.options);

  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Group variants by option type
  const optionTypes = product.variants.length > 0
    ? Object.keys(product.variants[0].options as Record<string, string>)
    : [];
  
  console.log('Option types:', optionTypes);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initialOptions: Record<string, string> = {};
    if (product.variants.length > 0) {
      const firstVariant = product.variants[0];
      const options = firstVariant.options as Record<string, string>;
      Object.entries(options).forEach(([key, value]) => {
        initialOptions[key] = value;
      });
    }
    return initialOptions;
  });

  // Get unique values for each option type
  const getOptionsForType = (optionType: string) => {
    const uniqueValues = new Set<string>();
    product.variants.forEach((variant) => {
      const options = variant.options as Record<string, string>;
      if (options[optionType]) {
        uniqueValues.add(options[optionType]);
      }
    });
    return Array.from(uniqueValues);
  };

  // Check if a variant with specific options is in stock
  const isOptionInStock = (optionType: string, value: string) => {
    return product.variants.some((variant) => {
      const options = variant.options as Record<string, string>;
      const availableStock = variant.stock - variant.reservedStock;
      return options[optionType] === value && availableStock > 0;
    });
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
    return product.variants.find((variant) => {
      const options = variant.options as Record<string, string>;
      return Object.entries(selectedOptions).every(
        ([key, value]) => options[key] === value
      );
    });
  };

  // Update selected options and find matching variant
  const handleOptionChange = (optionType: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionType]: value };
    setSelectedOptions(newOptions);
    const matchingVariant = product.variants.find((variant) => {
      const options = variant.options as Record<string, string>;
      return Object.entries(newOptions).every(
        ([key, val]) => options[key] === val
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

    if (!selectedVariant) {
      toast.error("Please select all options");
      return;
    }

    if (quantity > selectedVariant.stock) {
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
          variantId: selectedVariant.id,
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

  // Helper function to convert string price to number
  const parsePrice = (price: string | number | null | undefined): number => {
    if (typeof price === 'number') return price;
    if (!price) return 0;
    return Number(price);
  };

  return (
    <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {product.name}
      </h1>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h2 className="sr-only">Product information</h2>
          <p className="text-3xl tracking-tight text-foreground">
            {formatPrice(parsePrice(selectedVariant?.price ?? product.price))}
          </p>
          {selectedVariant?.compareAtPrice && (
            <p className="mt-1 text-lg line-through text-muted-foreground">
              {formatPrice(parsePrice(selectedVariant.compareAtPrice))}
            </p>
          )}
        </div>
        <div>
          {selectedVariant && (
            <Badge
              variant={selectedVariant.stock > 0 ? "outline" : "destructive"}
              className="text-sm"
            >
              {selectedVariant.stock > 0 ? "In Stock" : "Out of Stock"}
            </Badge>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      <div className="space-y-6 text-base text-muted-foreground">
        <div dangerouslySetInnerHTML={{ __html: product.description }} />
      </div>

      <Separator className="my-6" />

      {product.variants.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Options</h3>
          {optionTypes.map((optionType) => (
            <div key={optionType} className="flex flex-col gap-2">
              <Label className="capitalize">{optionType}</Label>
              <Select
                value={selectedOptions[optionType]}
                onValueChange={(value) => handleOptionChange(optionType, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${optionType}`} />
                </SelectTrigger>
                <SelectContent>
                  {getOptionsForType(optionType).map((value) => {
                    const inStock = isOptionInStock(optionType, value);
                    return (
                      <SelectItem
                        key={value}
                        value={value}
                        className={!inStock ? "text-muted-foreground" : ""}
                      >
                        {value} {!inStock && "(Out of Stock)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {selectedVariant && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">SKU:</span>
            <span className="font-medium">{selectedVariant.sku}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Stock Level:</span>
            <span className={`font-medium ${getStockLevelClass(selectedVariant.stock, selectedVariant.reservedStock, selectedVariant.lowStockThreshold)}`}>
              {selectedVariant.stock - selectedVariant.reservedStock} units available
            </span>
          </div>
        </div>
      )}

      <Separator className="my-6" />

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="quantity" className="min-w-24">
            Quantity
          </Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={selectedVariant ? selectedVariant.stock - selectedVariant.reservedStock : product.stock - product.reservedStock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-24"
          />
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={
            isLoading ||
            !selectedVariant ||
            selectedVariant.stock - selectedVariant.reservedStock === 0 ||
            quantity > (selectedVariant.stock - selectedVariant.reservedStock)
          }
          className="w-full"
        >
          {isLoading
            ? "Adding..."
            : !selectedVariant
            ? "Select options"
            : selectedVariant.stock - selectedVariant.reservedStock === 0
            ? "Out of stock"
            : "Add to cart"}
        </Button>

        {selectedVariant && 
          selectedVariant.stock - selectedVariant.reservedStock <= (selectedVariant.lowStockThreshold ?? 5) && 
          selectedVariant.stock - selectedVariant.reservedStock > 0 && (
          <p className="text-sm text-amber-500">
            Low stock - only {selectedVariant.stock - selectedVariant.reservedStock} units left
          </p>
        )}
      </div>

      <Separator className="my-6" />

      <div className="flex items-center gap-2">
        <h3 className="text-sm text-muted-foreground">Category:</h3>
        <p className="text-sm font-medium text-foreground">
          {product.category?.name}
        </p>
      </div>
    </div>
  );
} 