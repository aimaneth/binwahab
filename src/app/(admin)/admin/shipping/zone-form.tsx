"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShippingZone, ShippingZoneType } from "@prisma/client";
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

const shippingZoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["WEST_MALAYSIA", "EAST_MALAYSIA"]),
  isActive: z.boolean().default(true),
});

type ShippingZoneFormData = z.infer<typeof shippingZoneSchema>;

interface ShippingZoneFormProps {
  zone: ShippingZone | null;
  onSubmit: (data: ShippingZoneFormData) => void;
  onCancel: () => void;
}

export function ShippingZoneForm({
  zone,
  onSubmit,
  onCancel,
}: ShippingZoneFormProps) {
  const [isOpen, setIsOpen] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ShippingZoneFormData>({
    resolver: zodResolver(shippingZoneSchema),
    defaultValues: {
      name: zone?.name || "",
      type: zone?.type || ShippingZoneType.WEST_MALAYSIA,
      isActive: zone?.isActive ?? true,
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
            {zone ? "Edit Shipping Zone" : "Add Shipping Zone"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., West Malaysia"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              defaultValue={zone?.type || ShippingZoneType.WEST_MALAYSIA}
              onValueChange={(value) =>
                setValue("type", value as ShippingZoneType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select zone type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ShippingZoneType.WEST_MALAYSIA}>
                  West Malaysia
                </SelectItem>
                <SelectItem value={ShippingZoneType.EAST_MALAYSIA}>
                  East Malaysia
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
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