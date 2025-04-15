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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ChevronLeft } from "lucide-react";
import { CartItem } from "@/types/cart";
import * as z from "zod";
import { Address } from "@prisma/client";
import { Card } from "@/components/ui/card";
import type { StripeElementsOptions } from '@stripe/stripe-js';

const shippingSchema = z.object({
  addressId: z.string({
    required_error: "Please select a shipping address",
  }),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  addresses: Address[];
  items: CartItem[];
}

type CheckoutStep = "shipping" | "payment";

export function CheckoutForm({ addresses, items }: CheckoutFormProps) {
  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [clientSecret, setClientSecret] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
  });

  const onSubmit = async (data: ShippingFormValues) => {
    setIsLoading(true);
    try {
      const selectedAddress = addresses.find(addr => addr.id === data.addressId);
      if (!selectedAddress) throw new Error("Selected address not found");

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingAddress: selectedAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create payment intent");
      }

      const result = await response.json();
      setClientSecret(result.clientSecret);
      setStep("payment");
    } catch (error) {
      console.error("Error:", error);
      // Show error in UI
      form.setError("root", {
        message: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const options: StripeElementsOptions | undefined = clientSecret ? {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
    },
  } : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${step === "shipping" ? "text-primary" : "text-muted"}`}>
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2">
              1
            </div>
            <span>Shipping</span>
          </div>
          <div className="w-16 h-0.5 bg-border" />
          <div className={`flex items-center ${step === "payment" ? "text-primary" : "text-muted"}`}>
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2">
              2
            </div>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr,380px] gap-8">
        <div>
          {step === "shipping" ? (
            <Card className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Select Shipping Address</h2>
                  
                  {addresses.length === 0 ? (
                    <Alert>
                      <AlertDescription className="flex items-center justify-between">
                        <span>You need to add a shipping address first</span>
                        <Button 
                          variant="outline" 
                          onClick={() => router.push("/profile?add-address=true")}
                        >
                          Add Address
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <RadioGroup 
                      className="space-y-4"
                      value={form.watch("addressId")}
                      onValueChange={(value) => form.setValue("addressId", value)}
                    >
                      {addresses.map((address) => (
                        <div key={address.id} className="flex items-start space-x-3">
                          <RadioGroupItem value={address.id} id={address.id} />
                          <Label htmlFor={address.id} className="leading-relaxed">
                            <div className="font-medium">{address.street}</div>
                            <div className="text-muted-foreground">
                              {address.city}, {address.state} {address.zipCode}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {form.formState.errors.addressId && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {form.formState.errors.addressId.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading || addresses.length === 0}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue to Payment"
                  )}
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="mb-6 flex items-center">
                <Button
                  variant="ghost"
                  onClick={() => setStep("shipping")}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <h2 className="text-xl font-semibold ml-2">Payment Details</h2>
              </div>

              {clientSecret && (
                <Elements options={options} stripe={stripePromise}>
                  <PaymentForm clientSecret={clientSecret} />
                </Elements>
              )}
            </Card>
          )}
        </div>

        {/* Order Summary - Always visible */}
        <div className="md:row-span-2">
          <OrderSummary items={items} />
        </div>
      </div>
    </div>
  );
} 