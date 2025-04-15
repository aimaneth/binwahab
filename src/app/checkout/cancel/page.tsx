"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Alert variant="destructive">
        <AlertDescription>
          Your payment was cancelled. Please try again or contact support if you need assistance.
        </AlertDescription>
      </Alert>
      <div className="mt-6 text-center">
        <Button asChild>
          <Link href="/shop">Return to Shop</Link>
        </Button>
      </div>
    </div>
  );
} 