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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkData, setBulkData] = useState({
    name: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    lowStockThreshold: "",
    isActive: true,
    inventoryTracking: true,
  });

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
      
      // Update the local state with the new variant data
      const updatedVariants = variants.map(v => 
        v.id.toString() === variantId ? { ...v, ...updatedVariant } : v
      );
      onVariantsChange(updatedVariants);

      // Refresh the entire product data to ensure consistency
      const productResponse = await fetch(`/api/admin/products/${productId}`);
      if (productResponse.ok) {
        const productData = await productResponse.json();
        if (productData.variants) {
          onVariantsChange(productData.variants);
        }
      }

      toast({
        title: "Success",
        description: "Variant updated successfully",
      });
    } catch (error) {
      console.error("Error updating variant:", error);
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVariants(new Set(variants.map(v => v.id)));
    } else {
      setSelectedVariants(new Set());
    }
  };

  const handleSelectVariant = (variantId: number, checked: boolean) => {
    const newSelected = new Set(selectedVariants);
    if (checked) {
      newSelected.add(variantId);
    } else {
      newSelected.delete(variantId);
    }
    setSelectedVariants(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (selectedVariants.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one variant",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = {};
      if (bulkData.name) updateData.name = bulkData.name;
      if (bulkData.price) updateData.price = parseFloat(bulkData.price);
      if (bulkData.compareAtPrice) updateData.compareAtPrice = parseFloat(bulkData.compareAtPrice);
      if (bulkData.stock) updateData.stock = parseInt(bulkData.stock);
      if (bulkData.lowStockThreshold) updateData.lowStockThreshold = parseInt(bulkData.lowStockThreshold);
      updateData.isActive = bulkData.isActive;
      updateData.inventoryTracking = bulkData.inventoryTracking;

      const response = await fetch(`/api/admin/products/${productId}/variants/bulk`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantIds: Array.from(selectedVariants),
          data: updateData,
        }),
      });

      if (!response.ok) throw new Error("Failed to update variants");

      // Refresh variants
      const updatedVariantsResponse = await fetch(`/api/admin/products/${productId}/variants`);
      if (!updatedVariantsResponse.ok) throw new Error("Failed to fetch updated variants");
      const updatedVariants = await updatedVariantsResponse.json();
      onVariantsChange(updatedVariants);

      toast({
        title: "Success",
        description: "Variants updated successfully",
      });
      setBulkEditMode(false);
      setSelectedVariants(new Set());
      setBulkData({
        name: "",
        price: "",
        compareAtPrice: "",
        stock: "",
        lowStockThreshold: "",
        isActive: true,
        inventoryTracking: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update variants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVariants.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one variant",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/bulk`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantIds: Array.from(selectedVariants),
        }),
      });

      if (!response.ok) throw new Error("Failed to delete variants");

      // Refresh variants
      const updatedVariantsResponse = await fetch(`/api/admin/products/${productId}/variants`);
      if (!updatedVariantsResponse.ok) throw new Error("Failed to fetch updated variants");
      const updatedVariants = await updatedVariantsResponse.json();
      onVariantsChange(updatedVariants);

      toast({
        title: "Success",
        description: "Variants deleted successfully",
      });
      setSelectedVariants(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete variants",
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
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Existing Variants</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedVariants.size === variants.length}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
              />
              <Label>Select All</Label>
              {selectedVariants.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setBulkEditMode(!bulkEditMode)}
                  >
                    {bulkEditMode ? "Cancel Bulk Edit" : "Bulk Edit"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={isLoading}
                  >
                    {isLoading ? "Deleting..." : "Delete Selected"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {bulkEditMode && selectedVariants.size > 0 && (
            <Card className="p-4">
              <h4 className="font-medium mb-4">Bulk Edit Selected Variants</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={bulkData.name}
                    onChange={(e) => setBulkData({ ...bulkData, name: e.target.value })}
                    placeholder="Leave empty to keep existing"
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkData.price}
                    onChange={(e) => setBulkData({ ...bulkData, price: e.target.value })}
                    placeholder="Leave empty to keep existing"
                  />
                </div>
                <div>
                  <Label>Compare at Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkData.compareAtPrice}
                    onChange={(e) => setBulkData({ ...bulkData, compareAtPrice: e.target.value })}
                    placeholder="Leave empty to keep existing"
                  />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={bulkData.stock}
                    onChange={(e) => setBulkData({ ...bulkData, stock: e.target.value })}
                    placeholder="Leave empty to keep existing"
                  />
                </div>
                <div>
                  <Label>Low Stock Threshold</Label>
                  <Input
                    type="number"
                    value={bulkData.lowStockThreshold}
                    onChange={(e) => setBulkData({ ...bulkData, lowStockThreshold: e.target.value })}
                    placeholder="Leave empty to keep existing"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={bulkData.isActive}
                      onCheckedChange={(checked) => setBulkData({ ...bulkData, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={bulkData.inventoryTracking}
                      onCheckedChange={(checked) => setBulkData({ ...bulkData, inventoryTracking: checked })}
                    />
                    <Label>Inventory Tracking</Label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleBulkUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Selected"}
                </Button>
              </div>
            </Card>
          )}

          <div className="divide-y">
            {variants.map((variant) => (
              <Card key={variant.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Checkbox
                    checked={selectedVariants.has(variant.id)}
                    onCheckedChange={(checked) => handleSelectVariant(variant.id, checked as boolean)}
                  />
                  <span className="font-medium">{variant.name}</span>
                </div>
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