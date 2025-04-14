"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StripeLogo, VisaLogo, MastercardLogo, UnionPayLogo, LinkLogo, FPXLogo } from "./payment-logos";
import { cn } from "@/lib/utils";

interface PaymentOptionsProps {
  onPaymentMethodChange: (method: string) => void;
  selectedMethod?: string;
}

export function PaymentOptions({ onPaymentMethodChange, selectedMethod = "card" }: PaymentOptionsProps) {
  const id = useId();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Method</h3>
      <RadioGroup 
        defaultValue={selectedMethod}
        onValueChange={onPaymentMethodChange}
        className="space-y-2"
      >
        {/* Credit/Debit Card Option */}
        <Label
          htmlFor={`${id}-card`}
          className="cursor-pointer rounded-lg border border-input data-[state=checked]:border-2 data-[state=checked]:border-primary hover:bg-accent hover:text-accent-foreground"
          data-state={selectedMethod === "card" ? "checked" : "unchecked"}
        >
          <div className="flex items-start justify-between p-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <StripeLogo />
                <VisaLogo />
                <MastercardLogo />
                <UnionPayLogo />
                <LinkLogo />
              </div>
              <div>
                <div>Credit/Debit Card</div>
                <div className="text-sm text-muted-foreground">Pay securely with your credit or debit card</div>
              </div>
            </div>
            <RadioGroupItem value="card" id={`${id}-card`} />
          </div>
        </Label>

        {/* Bank Transfer (FPX) Option */}
        <Label
          htmlFor={`${id}-fpx`}
          className="cursor-pointer rounded-lg border border-input data-[state=checked]:border-2 data-[state=checked]:border-primary hover:bg-accent hover:text-accent-foreground"
          data-state={selectedMethod === "fpx" ? "checked" : "unchecked"}
        >
          <div className="flex items-start justify-between p-4">
            <div className="space-y-3">
              <FPXLogo />
              <div>
                <div>Bank Transfer (FPX)</div>
                <div className="text-sm text-muted-foreground">Pay directly from your bank account</div>
              </div>
            </div>
            <RadioGroupItem value="fpx" id={`${id}-fpx`} />
          </div>
        </Label>
      </RadioGroup>
    </div>
  );
} 