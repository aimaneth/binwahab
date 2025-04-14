"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Address } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { PaymentIntent, StripeError } from '@stripe/stripe-js';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Form schemas
const shippingSchema = z.object({
  addressId: z.string().optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

interface CheckoutFormProps {
  addresses: Address[];
  items: Array<{
    id: string;
    quantity: number;
  }>;
}

interface PaymentIntentResponse {
  clientSecret: string;
  error?: StripeError;
}

export function CheckoutForm({ addresses, items }: CheckoutFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Shipping form
  const shippingForm = useForm<z.infer<typeof shippingSchema>>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Malaysia",
      phone: "",
    },
  });

  const onShippingSubmit = async (values: z.infer<typeof shippingSchema>) => {
    try {
      setIsSubmitting(true);
      // Create payment intent with shipping info
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          shippingAddress: {
            name: `${values.firstName} ${values.lastName}`,
            address: {
              line1: values.address,
              city: values.city,
              state: values.state,
              postal_code: values.postalCode,
              country: values.country,
            },
            phone: values.phone,
          },
        }),
      });

      const data = await response.json() as PaymentIntentResponse;

      if (data.error) {
        throw new Error(data.error.message || "Failed to create payment intent");
      }

      setClientSecret(data.clientSecret);
      setStep(2);
    } catch (err) {
      toast.error("Failed to process shipping information. Please try again.");
      console.error("Shipping submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            1
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium">Shipping</p>
            <p className="text-xs text-muted-foreground">Enter your shipping details</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            2
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium">Payment</p>
            <p className="text-xs text-muted-foreground">Complete your purchase</p>
          </div>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...shippingForm}>
              <form onSubmit={shippingForm.handleSubmit(onShippingSubmit)} className="space-y-6">
                {addresses.length > 0 && (
                  <FormField
                    control={shippingForm.control}
                    name="addressId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Saved Addresses</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const address = addresses.find((a) => a.id === value);
                            if (address) {
                              shippingForm.reset({
                                firstName: address.street.split(' ')[0] || '',
                                lastName: address.street.split(' ').slice(1).join(' ').split(',')[0] || '',
                                address: address.street,
                                city: address.city,
                                state: address.state,
                                postalCode: address.zipCode,
                                country: address.country,
                                phone: address.phone,
                              });
                            }
                            field.onChange(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a saved address" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {addresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                {address.street}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={shippingForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={shippingForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={shippingForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={shippingForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={shippingForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={shippingForm.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={shippingForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={shippingForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue to Payment"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && clientSecret && (
        <Elements stripe={stripePromise} options={{ 
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#0F172A',
            },
          },
        }}>
          <StripeCheckoutForm onBack={() => setStep(1)} />
        </Elements>
      )}
    </div>
  );
}

function StripeCheckoutForm({ onBack }: { onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe has not been properly initialized");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/shop/payment-confirmation`,
        },
      });

      if (submitError) {
        setError(submitError.message || "An error occurred during payment.");
        console.error("Payment error:", submitError);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="min-h-[300px]">
            <PaymentElement />
          </div>
          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error}
            </div>
          )}
          <div className="flex flex-col space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isProcessing}
            >
              Back to Shipping
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !stripe || !elements}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                "Pay Now"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 