"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShippingZone } from "@prisma/client";
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

const ShippingZoneType = {
  WEST_MALAYSIA: "WEST_MALAYSIA",
  EAST_MALAYSIA: "EAST_MALAYSIA",
} as const;

const shippingZoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum([ShippingZoneType.WEST_MALAYSIA, ShippingZoneType.EAST_MALAYSIA]),
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

  const form = useForm<ShippingZoneFormData>({
    resolver: zodResolver(shippingZoneSchema),
    defaultValues: {
      name: zone?.name || "",
      type: (zone?.type as keyof typeof ShippingZoneType) || ShippingZoneType.WEST_MALAYSIA,
      isActive: zone?.isActive ?? true,
    },
  });

  const isActive = form.watch("isActive");

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g., West Malaysia"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              defaultValue={zone?.type as keyof typeof ShippingZoneType || ShippingZoneType.WEST_MALAYSIA}
              onValueChange={(value) =>
                form.setValue("type", value as keyof typeof ShippingZoneType)
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
            {form.formState.errors.type && (
              <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 