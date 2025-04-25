"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, X } from "lucide-react";
import { ProductVariant } from "@prisma/client";
import { ImageUpload } from "@/components/admin/image-upload";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkVariantActions } from "@/components/admin/bulk-variant-actions";

interface ProductVariantFormProps {
  productId?: string;
  variants: ProductVariant[];
  options: VariantOption[];
  onOptionsChange: (options: VariantOption[]) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
  isGeneratingVariants?: boolean;
  onGenerateVariants?: () => void;
}

interface VariantOption {
  name: string;
  values: string[];
}

interface DimensionsData {
  length: number;
  width: number;
  height: number;
}

interface ImageUploadProps {
  files?: string[];
  onChange: (urls: string[]) => void;
  onRemove: (url: string) => void;
}

export function ProductVariantForm({ 
  productId, 
  variants, 
  options, 
  onOptionsChange, 
  onVariantsChange,
  isGeneratingVariants = false,
  onGenerateVariants
}: ProductVariantFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const addOption = () => {
    onOptionsChange([...options, { name: "", values: [] }]);
  };

  const removeOption = (index: number) => {
    onOptionsChange(options.filter((_, i) => i !== index));
  };

  const updateOptionName = (index: number, name: string) => {
    const newOptions = [...options];
    newOptions[index].name = name;
    onOptionsChange(newOptions);
  };

  const updateOptionValues = (index: number, valuesString: string) => {
    const newOptions = [...options];
    newOptions[index].values = valuesString.split(",").map((v) => v.trim());
    onOptionsChange(newOptions);
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

      const newVariants = await response.json();
      onVariantsChange(newVariants);

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

  const updateVariant = async (variantId: string, data: Partial<Omit<ProductVariant, 'price' | 'compareAtPrice'>> & {
    price?: number;
    compareAtPrice?: number | null;
  }) => {
    if (!productId) return;
    setIsLoading(true);

    try {
      const formattedData = {
        ...data,
        price: data.price !== undefined ? data.price.toString() : undefined,
        compareAtPrice: data.compareAtPrice !== undefined ? data.compareAtPrice?.toString() : undefined,
      };

      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) throw new Error("Failed to update variant");

      const updatedVariant = await response.json();
      onVariantsChange(variants.map(v => v.id.toString() === variantId ? updatedVariant : v));

      toast({
        title: "Success",
        description: "Variant updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update variant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (variantId: string, images: string[]) => {
    await updateVariant(variantId, { images });
  };

  const updateVariantStock = async (variantId: string, newStock: number) => {
    await updateVariant(variantId, { stock: newStock });
  };

  const getDimensions = (dimensions: any): DimensionsData => {
    if (!dimensions) return { length: 0, width: 0, height: 0 };
    return {
      length: dimensions.length || 0,
      width: dimensions.width || 0,
      height: dimensions.height || 0,
    };
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

      <Button
        type="button"
        onClick={onGenerateVariants}
        disabled={isGeneratingVariants}
        className="w-full"
      >
        {isGeneratingVariants ? "Generating..." : "Generate Variants"}
      </Button>

      {variants.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Existing Variants</h3>
          {productId && (
            <BulkVariantActions
              variants={variants}
              productId={productId}
              onUpdate={() => {
                fetch(`/api/admin/products/${productId}/variants`)
                  .then(response => response.json())
                  .then(updatedVariants => onVariantsChange(updatedVariants))
                  .catch(error => {
                    console.error('Failed to fetch updated variants:', error);
                    toast({
                      title: "Error",
                      description: "Failed to refresh variants",
                      variant: "destructive"
                    });
                  });
              }}
            />
          )}
          <div className="divide-y">
            {variants.map((variant) => (
              <Card key={variant.id} className="p-4">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="images">Images</TabsTrigger>
                    <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Name</Label>
                        <Input
                          defaultValue={variant.name}
                          onBlur={(e) => updateVariant(variant.id.toString(), { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>SKU</Label>
                        <Input
                          defaultValue={variant.sku}
                          onBlur={(e) => updateVariant(variant.id.toString(), { sku: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Barcode</Label>
                        <Input
                          defaultValue={variant.barcode || ""}
                          onBlur={(e) => updateVariant(variant.id.toString(), { barcode: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={Number(variant.price)}
                          onBlur={(e) => updateVariant(variant.id.toString(), { price: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Compare at Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={variant.compareAtPrice ? Number(variant.compareAtPrice) : ""}
                          onBlur={(e) => updateVariant(variant.id.toString(), { 
                            compareAtPrice: e.target.value ? parseFloat(e.target.value) : null 
                          })}
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={variant.isActive}
                            onCheckedChange={(checked) => 
                              updateVariant(variant.id.toString(), { isActive: checked })
                            }
                          />
                          <span>{variant.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="inventory">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          min="0"
                          defaultValue={variant.stock}
                          onBlur={(e) => {
                            const newStock = parseInt(e.target.value);
                            if (!isNaN(newStock) && newStock !== variant.stock) {
                              updateVariant(variant.id.toString(), { stock: newStock });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label>Reserved Stock</Label>
                        <div>{variant.reservedStock}</div>
                      </div>
                      <div>
                        <Label>Low Stock Threshold</Label>
                        <Input
                          type="number"
                          min="0"
                          defaultValue={variant.lowStockThreshold ?? ""}
                          onBlur={(e) => updateVariant(variant.id.toString(), { 
                            lowStockThreshold: parseInt(e.target.value) 
                          })}
                        />
                      </div>
                      <div>
                        <Label>Inventory Tracking</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={variant.inventoryTracking}
                            onCheckedChange={(checked) => 
                              updateVariant(variant.id.toString(), { inventoryTracking: checked })
                            }
                          />
                          <span>{variant.inventoryTracking ? "Enabled" : "Disabled"}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="images">
                    <div className="space-y-4">
                      <Label>Images</Label>
                      <ImageUpload
                        images={variant.images}
                        onChange={(urls) => handleImageUpload(variant.id.toString(), urls)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="shipping">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Weight</Label>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={variant.weight || ""}
                          onBlur={(e) => updateVariant(variant.id.toString(), { 
                            weight: e.target.value ? parseFloat(e.target.value) : undefined
                          })}
                        />
                      </div>
                      <div>
                        <Label>Weight Unit</Label>
                        <select
                          className="w-full rounded-md border p-2"
                          defaultValue={variant.weightUnit || "kg"}
                          onChange={(e) => updateVariant(variant.id.toString(), { 
                            weightUnit: e.target.value 
                          })}
                        >
                          <option value="kg">Kilograms (kg)</option>
                          <option value="g">Grams (g)</option>
                          <option value="lb">Pounds (lb)</option>
                          <option value="oz">Ounces (oz)</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Label>Dimensions (cm)</Label>
                        <div className="grid gap-2 grid-cols-3">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Length"
                            defaultValue={getDimensions(variant.dimensions).length}
                            onBlur={(e) => {
                              const dimensions = getDimensions(variant.dimensions);
                              updateVariant(variant.id.toString(), {
                                dimensions: {
                                  ...dimensions,
                                  length: parseFloat(e.target.value) || 0
                                }
                              });
                            }}
                          />
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Width"
                            defaultValue={getDimensions(variant.dimensions).width}
                            onBlur={(e) => {
                              const dimensions = getDimensions(variant.dimensions);
                              updateVariant(variant.id.toString(), {
                                dimensions: {
                                  ...dimensions,
                                  width: parseFloat(e.target.value) || 0
                                }
                              });
                            }}
                          />
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Height"
                            defaultValue={getDimensions(variant.dimensions).height}
                            onBlur={(e) => {
                              const dimensions = getDimensions(variant.dimensions);
                              updateVariant(variant.id.toString(), {
                                dimensions: {
                                  ...dimensions,
                                  height: parseFloat(e.target.value) || 0
                                }
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 