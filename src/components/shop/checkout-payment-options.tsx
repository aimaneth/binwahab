import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCardIcon, BuildingIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface PaymentGatewayOption {
  id: "stripe" | "curlec";
  name: string;
  description: string;
  icon: React.ReactNode;
}

const paymentOptions: PaymentGatewayOption[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Pay with credit/debit card or FPX",
    icon: <CreditCardIcon className="h-5 w-5 text-primary" />
  },
  {
    id: "curlec",
    name: "Curlec",
    description: "Pay with FPX (Malaysia)",
    icon: <BuildingIcon className="h-5 w-5 text-primary" />
  }
];

interface CheckoutPaymentOptionsProps {
  items: any[];
  shippingAddressId: string;
  isProcessing: boolean;
  setIsProcessing: (state: boolean) => void;
}

export function CheckoutPaymentOptions({
  items,
  shippingAddressId,
  isProcessing,
  setIsProcessing
}: CheckoutPaymentOptionsProps) {
  const [selectedGateway, setSelectedGateway] = useState<"stripe" | "curlec">("stripe");
  const router = useRouter();

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Create checkout session with selected payment gateway
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items,
          shippingAddressId,
          paymentGateway: selectedGateway
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const data = await response.json();

      if (data.gateway === "stripe" && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.gateway === "curlec" && data.curlecOrderId) {
        // Redirect to Curlec checkout page
        router.push(`/shop/checkout/curlec?order_id=${data.curlecOrderId}&amount=${data.amount}`);
      } else {
        throw new Error("Invalid checkout response");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment initialization failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Payment Method</h3>
        
        <RadioGroup
          value={selectedGateway}
          onValueChange={(value) => setSelectedGateway(value as "stripe" | "curlec")}
          className="gap-4"
        >
          {paymentOptions.map((option) => (
            <div
              key={option.id}
              className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer ${
                selectedGateway === option.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setSelectedGateway(option.id)}
            >
              <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
              <div className="flex items-center gap-3 flex-1">
                {option.icon}
                <div>
                  <Label htmlFor={option.id} className="text-base">
                    {option.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          onClick={() => router.back()}
          variant="outline"
          disabled={isProcessing}
          type="button"
        >
          Back
        </Button>
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          type="button"
          className="min-w-[150px]"
        >
          {isProcessing ? "Processing..." : "Continue to Payment"}
        </Button>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        <p className="text-xs text-muted-foreground text-center">
          Secured by:
        </p>
        <div className="flex items-center gap-3">
          <Image 
            src="/payment-logos/stripe.svg" 
            alt="Stripe" 
            width={50} 
            height={20} 
          />
          <Image 
            src="/payment-logos/fpx.svg" 
            alt="FPX" 
            width={40} 
            height={20} 
          />
        </div>
      </div>
    </div>
  );
} 