"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentForm } from "@/components/shop/payment-form";
import { OrderSummary } from "@/components/shop/order-summary";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartItem } from "@/types/cart";
import * as z from "zod";
import { toast } from "sonner";
import { Address } from "@prisma/client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { PaymentIntent, StripeError, StripeElementsOptions } from '@stripe/stripe-js';
import { PaymentOptions } from "@/components/shop/payment-options";

// Import shipping schema
const shippingSchema = z.object({
  addressId: z.string(),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const formatPrice = (amount: string | number) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(numericAmount);
};

const calculateSubtotal = (items: CheckoutFormProps['items']) => {
  return items.reduce((total, item) => {
    const price = typeof item.product.price === 'string' 
      ? parseFloat(item.product.price) 
      : item.product.price;
    return total + (price * item.quantity);
  }, 0);
};

const calculateTotal = (subtotal: number, shippingCost: number = 0) => {
  return subtotal + shippingCost;
};

interface CheckoutFormProps {
  addresses: Address[];
  items: {
    id: string;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: string;
      image: string | null;
    };
  }[];
  orderSummaryItems: CartItem[];
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  shippingCost: number;
  totalAmount: number;
  error?: StripeError;
}

export function CheckoutForm({ addresses, items, orderSummaryItems }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
  });

  const onSubmit = async (data: ShippingFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderSummaryItems,
          addressId: data.addressId,
        }),
      });

      const result = await response.json();
      setClientSecret(result.clientSecret);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
    },
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Shipping Address</h2>
            {addresses.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Please add a shipping address to continue.
                </AlertDescription>
              </Alert>
            ) : (
              <RadioGroup className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={address.id}
                      id={address.id}
                      {...register("addressId")}
                    />
                    <Label htmlFor={address.id} className="leading-relaxed">
                      {address.street}, {address.city}, {address.state}{" "}
                      {address.zipCode}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {errors.addressId && (
              <Alert variant="destructive">
                <AlertDescription>
                  Please select a shipping address.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <Button type="submit" disabled={isLoading || addresses.length === 0}>
            Continue to Payment
          </Button>
        </form>
      </div>
      <div className="space-y-6">
        <OrderSummary items={orderSummaryItems} />
        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <PaymentForm clientSecret={clientSecret} />
          </Elements>
        )}
      </div>
    </div>
  );
} 