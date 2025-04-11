"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, X } from "lucide-react";
import { ProductVariant } from "@prisma/client";

interface ProductVariantFormProps {
  productId?: string;
  variants: ProductVariant[];
}

interface VariantOption {
  name: string;
  values: string[];
}

export function ProductVariantForm({ productId, variants }: ProductVariantFormProps) {
  const { toast } = useToast();
  const [options, setOptions] = useState<VariantOption[]>([
    { name: "Size", values: [] },
    { name: "Color", values: [] },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addOption = () => {
    setOptions([...options, { name: "", values: [] }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOptionName = (index: number, name: string) => {
    const newOptions = [...options];
    newOptions[index].name = name;
    setOptions(newOptions);
  };

  const updateOptionValues = (index: number, valuesString: string) => {
    const newOptions = [...options];
    newOptions[index].values = valuesString.split(",").map((v) => v.trim());
    setOptions(newOptions);
  };

  const generateVariants = async () => {
    if (!productId) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ options }),
      });

      if (!response.ok) throw new Error("Failed to generate variants");

      toast({
        title: "Success",
        description: "Product variants generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate variants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {options.map((option, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-1 space-y-2">
              <Label>Option Name</Label>
              <Input
                value={option.name}
                onChange={(e) => updateOptionName(index, e.target.value)}
                placeholder="e.g., Size, Color"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Values</Label>
              <Input
                value={option.values.join(", ")}
                onChange={(e) => updateOptionValues(index, e.target.value)}
                placeholder="e.g., Small, Medium, Large"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeOption(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addOption}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Option
      </Button>

      {productId && (
        <Button
          type="button"
          onClick={generateVariants}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Generating..." : "Generate Variants"}
        </Button>
      )}

      {variants.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Existing Variants</h3>
          <div className="divide-y">
            {variants.map((variant) => (
              <div key={variant.id} className="py-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label>SKU</Label>
                    <div>{variant.sku}</div>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <div>${Number(variant.price).toFixed(2)}</div>
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <div>{variant.stock}</div>
                  </div>
                  <div>
                    <Label>Options</Label>
                    <div>
                      {Object.entries(variant.options as Record<string, string>)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 