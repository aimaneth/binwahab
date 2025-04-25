import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ProductVariant } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";

interface BulkVariantActionsProps {
  variants: ProductVariant[];
  productId: string;
  onUpdate: () => void;
}

export function BulkVariantActions({ variants, productId, onUpdate }: BulkVariantActionsProps) {
  const { toast } = useToast();
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [bulkData, setBulkData] = useState({
    name: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    lowStockThreshold: "",
    isActive: true,
    inventoryTracking: true,
  });

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

      toast({
        title: "Success",
        description: "Variants updated successfully",
      });
      onUpdate();
      setSelectedVariants(new Set());
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

      toast({
        title: "Success",
        description: "Variants deleted successfully",
      });
      onUpdate();
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={selectedVariants.size === variants.length}
            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
          />
          <Label>Select All</Label>
        </div>
        <div className="space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={selectedVariants.size === 0}
              >
                Bulk Update
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Update Variants</DialogTitle>
                <DialogDescription>
                  Update multiple variants at once. Leave fields empty to keep existing values.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      type="text"
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
              <DialogFooter>
                <Button
                  onClick={handleBulkUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Selected"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            disabled={selectedVariants.size === 0 || isLoading}
            onClick={handleBulkDelete}
          >
            {isLoading ? "Deleting..." : "Delete Selected"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {variants.map((variant) => (
          <div key={variant.id} className="flex items-center space-x-2 py-2">
            <Checkbox
              checked={selectedVariants.has(variant.id)}
              onCheckedChange={(checked) => handleSelectVariant(variant.id, checked as boolean)}
            />
            <span>{variant.name} - {variant.sku}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 