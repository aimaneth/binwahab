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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const shippingRateSchema = z.object({
  zoneId: z.string().min(1, "Zone is required"),
  minWeight: z.number().min(0, "Minimum weight must be 0 or greater"),
  maxWeight: z.number().min(0, "Maximum weight must be 0 or greater"),
  price: z.number().min(0, "Price must be 0 or greater"),
  minOrderValue: z.number().min(0, "Minimum order value must be 0 or greater"),
  maxOrderValue: z.number().min(0, "Maximum order value must be 0 or greater"),
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

  const form = useForm<z.infer<typeof shippingRateSchema>>({
    resolver: zodResolver(shippingRateSchema),
    defaultValues: {
      zoneId: rate?.zoneId.toString() || "",
      minWeight: rate?.minWeight ? Number(rate.minWeight) : 0,
      maxWeight: rate?.maxWeight ? Number(rate.maxWeight) : 0,
      minOrderValue: rate?.minOrderValue ? Number(rate.minOrderValue) : 0,
      maxOrderValue: rate?.maxOrderValue ? Number(rate.maxOrderValue) : 0,
      price: rate?.price ? Number(rate.price) : 0,
      isActive: rate?.isActive ?? true,
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
            {rate ? "Edit Shipping Rate" : "Add Shipping Rate"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="zoneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Zone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (MYR)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minOrderValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Order Value (MYR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxOrderValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Order Value (MYR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        </Form>
      </DialogContent>
    </Dialog>
  );
} 