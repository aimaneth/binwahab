"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShippingRate, ShippingZone } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const shippingRateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  zoneId: z.string().min(1, "Zone is required"),
  minWeight: z.number().min(0, "Minimum weight must be 0 or greater").nullable(),
  maxWeight: z.number().min(0, "Maximum weight must be 0 or greater").nullable(),
  price: z.number().min(0, "Price must be 0 or greater"),
  minOrderValue: z.number().min(0, "Minimum order value must be 0 or greater").nullable(),
  maxOrderValue: z.number().min(0, "Maximum order value must be 0 or greater").nullable(),
  isActive: z.boolean().default(true),
});

type ShippingRateFormData = z.infer<typeof shippingRateSchema>;

interface ShippingRateFormProps {
  rate: ShippingRate | null;
  zones: ShippingZone[];
  onSubmit: (data: ShippingRateFormData) => void;
  onCancel: () => void;
}

export function ShippingRateForm({
  rate,
  zones,
  onSubmit,
  onCancel,
}: ShippingRateFormProps) {
  const [isOpen, setIsOpen] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ShippingRateFormData>({
    resolver: zodResolver(shippingRateSchema),
    defaultValues: {
      name: rate?.name || "",
      zoneId: rate?.zoneId || "",
      minWeight: rate?.minWeight || 0,
      maxWeight: rate?.maxWeight || 0,
      price: rate?.price || 0,
      minOrderValue: rate?.minOrderValue || 0,
      maxOrderValue: rate?.maxOrderValue || 0,
      isActive: rate?.isActive ?? true,
    },
  });

  const isActive = watch("isActive");

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onCancel, 300); // Wait for animation to complete
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {rate ? "Edit Shipping Rate" : "Add Shipping Rate"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Standard Delivery"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoneId">Shipping Zone</Label>
            <Select
              defaultValue={rate?.zoneId || ""}
              onValueChange={(value) => setValue("zoneId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shipping zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.zoneId && (
              <p className="text-sm text-red-500">{errors.zoneId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minWeight">Minimum Weight (kg)</Label>
              <Input
                id="minWeight"
                type="number"
                step="0.1"
                {...register("minWeight", { valueAsNumber: true })}
              />
              {errors.minWeight && (
                <p className="text-sm text-red-500">
                  {errors.minWeight.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxWeight">Maximum Weight (kg)</Label>
              <Input
                id="maxWeight"
                type="number"
                step="0.1"
                {...register("maxWeight", { valueAsNumber: true })}
              />
              {errors.maxWeight && (
                <p className="text-sm text-red-500">
                  {errors.maxWeight.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (RM)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minOrderValue">Minimum Order Value (RM)</Label>
              <Input
                id="minOrderValue"
                type="number"
                step="0.01"
                {...register("minOrderValue", { valueAsNumber: true })}
              />
              {errors.minOrderValue && (
                <p className="text-sm text-red-500">
                  {errors.minOrderValue.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOrderValue">Maximum Order Value (RM)</Label>
              <Input
                id="maxOrderValue"
                type="number"
                step="0.01"
                {...register("maxOrderValue", { valueAsNumber: true })}
              />
              {errors.maxOrderValue && (
                <p className="text-sm text-red-500">
                  {errors.maxOrderValue.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 