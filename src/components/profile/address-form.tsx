"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  addressLine1: z.string().min(5, "Address must be at least 5 characters"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

export function AddressForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: "Malaysia", // Default country
      isDefault: false,
    },
  });

  const onSubmit = async (data: AddressFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Address added successfully");
      router.refresh();
      router.push("/shop/checkout"); // Redirect back to checkout
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          {...register("fullName")}
          id="fullName"
          type="text"
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="addressLine1">Street Address</Label>
        <Input
          {...register("addressLine1")}
          id="addressLine1"
          type="text"
          placeholder="123 Main St"
        />
        {errors.addressLine1 && (
          <p className="mt-1 text-sm text-red-600">{errors.addressLine1.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="addressLine2">Apartment, Suite, etc. (optional)</Label>
        <Input
          {...register("addressLine2")}
          id="addressLine2"
          type="text"
          placeholder="Apt 4B"
        />
        {errors.addressLine2 && (
          <p className="mt-1 text-sm text-red-600">{errors.addressLine2.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            {...register("city")}
            id="city"
            type="text"
            placeholder="Kuala Lumpur"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="state">State</Label>
          <Input
            {...register("state")}
            id="state"
            type="text"
            placeholder="Selangor"
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            {...register("postalCode")}
            id="postalCode"
            type="text"
            placeholder="50000"
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            {...register("country")}
            id="country"
            type="text"
            disabled
            value="Malaysia"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          {...register("phoneNumber")}
          id="phoneNumber"
          type="tel"
          placeholder="+60123456789"
        />
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          {...register("isDefault")}
          id="isDefault"
        />
        <Label htmlFor="isDefault">Set as default address</Label>
      </div>

      <div className="flex space-x-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Adding..." : "Add Address"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
} 