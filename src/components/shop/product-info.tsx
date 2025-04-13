"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Product } from "@/types/product";
import { formatPrice } from "@/utils/format";
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

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Group variants by option type
  const optionTypes = product.variants.length > 0
    ? Object.keys(product.variants[0].options as Record<string, string>)
    : [];
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initialOptions: Record<string, string> = {};
    if (product.variants.length > 0) {
      const firstVariant = product.variants[0];
      Object.entries(firstVariant.options as Record<string, string>).forEach(([key, value]) => {
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

  // Find the variant that matches the selected options
  const findMatchingVariant = () => {
    return product.variants.find((variant) => {
      const variantOptions = variant.options as Record<string, string>;
      return Object.entries(selectedOptions).every(
        ([key, value]) => variantOptions[key] === value
      );
    });
  };

  // Update selected options and find matching variant
  const handleOptionChange = (optionType: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionType]: value };
    setSelectedOptions(newOptions);
    const matchingVariant = product.variants.find((variant) => {
      const variantOptions = variant.options as Record<string, string>;
      return Object.entries(newOptions).every(
        ([key, val]) => variantOptions[key] === val
      );
    });
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
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

    try {
      setIsLoading(true);
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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

  return (
    <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {product.name}
      </h1>

      <div className="mt-3">
        <h2 className="sr-only">Product information</h2>
        <p className="text-3xl tracking-tight text-foreground">
          {formatPrice(selectedVariant?.price ?? product.price)}
        </p>
      </div>

      <div className="mt-6">
        <h3 className="sr-only">Description</h3>
        <div
          className="space-y-6 text-base text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>

      {product.variants.length > 0 && (
        <div className="mt-6 space-y-4">
          {optionTypes.map((optionType) => (
            <div key={optionType} className="flex items-center gap-4">
              <Label className="w-24">{optionType}</Label>
              <Select
                value={selectedOptions[optionType]}
                onValueChange={(value) => handleOptionChange(optionType, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={`Select ${optionType}`} />
                </SelectTrigger>
                <SelectContent>
                  {getOptionsForType(optionType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center">
          <h3 className="text-sm text-muted-foreground">Category</h3>
          <p className="ml-2 text-sm font-medium text-foreground">
            {product.category?.name}
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
            max={selectedVariant?.stock ?? product.stock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20"
          />
        </div>
      </div>

      <div className="mt-8 flex">
        <Button
          onClick={handleAddToCart}
          disabled={isLoading || (selectedVariant ? selectedVariant.stock === 0 : product.stock === 0)}
          className="w-full"
        >
          {isLoading ? "Adding..." : (selectedVariant ? selectedVariant.stock === 0 : product.stock === 0) ? "Out of stock" : "Add to cart"}
        </Button>
      </div>

      {(selectedVariant ? selectedVariant.stock === 0 : product.stock === 0) && (
        <p className="mt-2 text-sm text-red-600">This product is out of stock</p>
      )}
    </div>
  );
} 