"use client";

import { Building2, CreditCard } from "lucide-react";
import { StripeLogo, VisaLogo, MastercardLogo, UnionPayLogo, LinkLogo, FPXLogo } from "./payment-logos";

interface PaymentOptionsProps {
  onPaymentMethodChange: (method: string) => void;
  selectedMethod?: string;
}

export function PaymentOptions({
  onPaymentMethodChange,
  selectedMethod = "card",
}: PaymentOptionsProps) {
  return (
    <div className="grid gap-4">
      <div>
        <div className="grid gap-2">
          <label
            className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 hover:bg-accent"
            onClick={() => onPaymentMethodChange("card")}
          >
            <input
              type="radio"
              name="payment-method"
              className="mt-1"
              checked={selectedMethod === "card"}
              onChange={() => onPaymentMethodChange("card")}
            />
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">Card</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pay with your credit or debit card
              </p>
              <div className="flex gap-2 pt-2">
                <VisaLogo />
                <MastercardLogo />
                <UnionPayLogo />
                <LinkLogo />
              </div>
            </div>
          </label>
          <label
            className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 hover:bg-accent"
            onClick={() => onPaymentMethodChange("fpx")}
          >
            <input
              type="radio"
              name="payment-method"
              className="mt-1"
              checked={selectedMethod === "fpx"}
              onChange={() => onPaymentMethodChange("fpx")}
            />
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Online Banking (FPX)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pay directly from your bank account
              </p>
              <div className="flex gap-2 pt-2">
                <FPXLogo />
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
} 