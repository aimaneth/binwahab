"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Address, PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const checkoutSchema = z.object({
  shippingAddressId: z.string().optional(),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(5, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().min(10, "Phone number is required"),
  paymentMethod: z.nativeEnum(PaymentMethod),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  addresses: Address[];
}

export function CheckoutForm({ addresses }: CheckoutFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [useExistingAddress, setUseExistingAddress] = useState(
    addresses.length > 0
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: PaymentMethod.CREDIT_CARD,
    },
  });

  const selectedAddressId = watch("shippingAddressId");

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const order = await response.json();

      toast.success("Order placed successfully");
      router.push(`/orders/${order.id}`);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Shipping information
        </h2>

        {addresses.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useExistingAddress"
                checked={useExistingAddress}
                onChange={(e) => setUseExistingAddress(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label
                htmlFor="useExistingAddress"
                className="ml-2 text-sm text-gray-700"
              >
                Use existing address
              </label>
            </div>

            {useExistingAddress && (
              <div className="mt-4">
                <select
                  {...register("shippingAddressId")}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select an address</option>
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.street}, {address.city}, {address.state} {address.zipCode}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {(!useExistingAddress || !selectedAddressId) && (
          <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
            <div className="sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                {...register("fullName")}
                className="mt-1"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="addressLine1">Address line 1</Label>
              <Input
                id="addressLine1"
                {...register("addressLine1")}
                className="mt-1"
              />
              {errors.addressLine1 && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.addressLine1.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="addressLine2">Address line 2</Label>
              <Input
                id="addressLine2"
                {...register("addressLine2")}
                className="mt-1"
              />
              {errors.addressLine2 && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.addressLine2.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} className="mt-1" />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register("state")} className="mt-1" />
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.state.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="postalCode">Postal code</Label>
              <Input
                id="postalCode"
                {...register("postalCode")}
                className="mt-1"
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.postalCode.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} className="mt-1" />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.country.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" {...register("phone")} className="mt-1" />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900">Payment method</h2>

        <div className="mt-4">
          <RadioGroup
            defaultValue={PaymentMethod.CREDIT_CARD}
            onValueChange={(value) =>
              register("paymentMethod").onChange({
                target: { value },
              })
            }
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value={PaymentMethod.CREDIT_CARD}
                  id="credit-card"
                />
                <Label htmlFor="credit-card">Credit card</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value={PaymentMethod.PAYPAL}
                  id="paypal"
                />
                <Label htmlFor="paypal">PayPal</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value={PaymentMethod.BANK_TRANSFER}
                  id="bank-transfer"
                />
                <Label htmlFor="bank-transfer">Bank transfer</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="mt-6">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Processing..." : "Place order"}
        </Button>
      </div>
    </form>
  );
} 